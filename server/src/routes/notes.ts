import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';
import { uploadImage } from '../services/storage.js';
import { extractTextFromFile } from '../services/textExtractor.js';
import { isHeic, heicToJpeg } from '../services/imageConverter.js';

const router = Router();

/**
 * MULTER CONFIGURATION
 * Handles file uploads with validation
 */
const upload = multer({
  storage: multer.memoryStorage(),  // Store files in memory (RAM) as Buffer
  limits: {
    fileSize: 20 * 1024 * 1024,    // 20MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/webp',
      'image/heic',                    // iPhone photos (converted to JPEG on upload)
      'image/heif',

      // Documents
      'application/pdf',              // PDF files
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

      // PowerPoint
      'application/vnd.ms-powerpoint',  // .ppt (old PowerPoint)
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

      // Text
      'text/plain',                    // .txt
    ];

    // isHeic also catches HEIC photos sent as application/octet-stream
    if (allowedTypes.includes(file.mimetype) || isHeic(file)) {
      cb(null, true);  // Accept file
    } else {
      cb(new Error('File type not supported. Allowed: images, PDFs, PowerPoint, Word docs, text files'));
    }
  },
});

/**
 * ROUTE: Upload a note
 * POST /api/notes
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { classId } = req.body;
    const file = req.file;

    if (!classId || !file) {
      return res.status(400).json({ 
        error: 'Missing required fields: classId and image' 
      });
    }

    console.log(`Creating note for class ${classId}`);

    // Convert HEIC/HEIF (iPhone photos) to JPEG — OpenAI and browsers can't read HEIC
    if (isHeic(file)) {
      console.log('Converting HEIC -> JPEG...');
      file.buffer = await heicToJpeg(file.buffer);
      file.mimetype = 'image/jpeg';
      file.originalname = file.originalname.replace(/\.hei[cf]$/i, '') + '.jpg';
    }

    const imageUrl = await uploadImage(file, parseInt(classId));

    // Extract text for documents
    let extractedText: string | null = null;
    const documentTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (documentTypes.includes(file.mimetype)) {
      console.log(`Extracting text from ${file.mimetype}...`);
      extractedText = await extractTextFromFile(imageUrl, file.mimetype);
      console.log(`Extracted ${extractedText?.length ?? 0} characters`);
    }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        class_id: parseInt(classId),
        image_url: imageUrl,
        file_type: file.mimetype,
        filename: file.originalname,
        extracted_text: extractedText,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Note created:', data.id);
    res.json(data);
  } catch (error: any) {
    console.error('Error creating note:', error.message);
    res.status(500).json({ 
      error: `Failed to create note: ${error.message}` 
    });
  }
});

/**
 * ROUTE: Get all notes for a class
 * GET /api/notes/class/:classId
 */
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

/**
 * ROUTE: Get single note
 * GET /api/notes/:id
 */
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

/**
 * ROUTE: Delete a note
 * DELETE /api/notes/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get note to find image URL
    const { data: note, error: fetchError } = await supabase
      .from('notes')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete from database
    const { error: deleteError } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    console.log('Note deleted');
    res.json({ message: 'Note deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting note:', error.message);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;