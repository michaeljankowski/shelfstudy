import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';
import { MAX_SOURCE_BYTES } from '../config/sourceFormats.js';
import { createOfficePreview } from '../services/officePreview.js';
import { prepareSource } from '../services/sourceIngestion.js';
import { validateUploadedSource } from '../services/sourceValidation.js';
import { deleteImage, downloadSource, uploadSource } from '../services/storage.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_SOURCE_BYTES,
  },
});

const configuredUploadLimit = Number(process.env.MAX_CONCURRENT_UPLOADS ?? 3);
const maxConcurrentUploads = Number.isSafeInteger(configuredUploadLimit) && configuredUploadLimit > 0
  ? configuredUploadLimit
  : 3;
let activeUploads = 0;

function admitUpload(_req: Request, res: Response, next: NextFunction) {
  if (activeUploads >= maxConcurrentUploads) {
    res.set('Retry-After', '5');
    return res.status(503).json({ error: 'The upload service is busy. Try again in a few seconds.' });
  }

  activeUploads += 1;
  let released = false;
  const releaseSlot = () => {
    if (released) return;
    released = true;
    activeUploads -= 1;
  };
  res.once('finish', releaseSlot);
  res.once('close', releaseSlot);
  next();
}

function receiveSource(req: Request, res: Response, next: NextFunction) {
  upload.single('image')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Files must be smaller than 20MB.' });
    }
    if (error) return res.status(400).json({ error: 'The upload could not be read.' });
    next();
  });
}

router.post('/', admitUpload, receiveSource, async (req, res) => {
  try {
    const { classId } = req.body;
    const file = req.file;

    if (!classId || !file) {
      return res.status(400).json({ 
        error: 'Missing required fields: classId and image' 
      });
    }

    const numericClassId = Number(classId);
    if (!Number.isSafeInteger(numericClassId) || numericClassId <= 0) {
      return res.status(400).json({ error: 'classId must be a positive integer' });
    }

    const validation = validateUploadedSource(file);
    if (!validation.ok) {
      return res.status(validation.status).json({ error: validation.message });
    }

    console.log(`Preparing source for class ${numericClassId}`);
    const prepared = await prepareSource(file, validation.format);
    const storedFile: Express.Multer.File = {
      ...file,
      buffer: prepared.buffer,
      originalname: prepared.filename,
      mimetype: prepared.mimeType,
      size: prepared.buffer.byteLength,
    };
    const sourceUrl = await uploadSource(storedFile, numericClassId);

    const { data, error } = await supabase
      .from('notes')
      .insert({
        class_id: numericClassId,
        image_url: sourceUrl,
        file_type: prepared.mimeType,
        filename: prepared.filename,
        extracted_text: prepared.extractedText,
      })
      .select()
      .single();

    if (error) {
      // The file should not stay behind if its note was never saved.
      await deleteImage(sourceUrl).catch((cleanupError) => {
        console.error('Could not clean up failed source upload:', cleanupError);
      });
      throw error;
    }

    console.log('Note created:', data.id);
    res.json(data);
  } catch (error: any) {
    console.error('Error creating note:', error.message);
    res.status(500).json({ 
      error: `Failed to create note: ${error.message}` 
    });
  }
});

router.get('/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;

    console.log(`Fetching notes for class ${classId}`);

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`Found ${data.length} notes`);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching notes:', error.message);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.get('/:id/preview', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Note id must be a positive integer' });
    }

    const { data: note, error } = await supabase
      .from('notes')
      .select('image_url, file_type')
      .eq('id', id)
      .single();

    if (error || !note) return res.status(404).json({ error: 'Note not found' });

    const isOfficeFile = note.file_type === 'application/vnd.ms-powerpoint'
      || note.file_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      || note.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!isOfficeFile) {
      return res.status(415).json({ error: 'This source does not need an Office preview' });
    }

    const buffer = await downloadSource(note.image_url);
    res.json(await createOfficePreview(buffer, note.file_type));
  } catch (error: any) {
    console.error('Error generating source preview:', error.message);
    res.status(500).json({ error: 'Could not generate this source preview' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching note:', error.message);
    res.status(404).json({ error: 'Note not found' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: note, error: fetchError } = await supabase
      .from('notes')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { error: deleteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await deleteImage(note.image_url);

    console.log('Note deleted');
    res.json({ message: 'Note deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting note:', error.message);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
