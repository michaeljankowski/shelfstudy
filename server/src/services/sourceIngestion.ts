import { SourceFormat } from '../config/sourceFormats.js';
import { heicToJpeg } from './imageConverter.js';
import { extractTextFromBuffer } from './textExtractor.js';
import { normalizeExtractedText } from './sourceText.js';

export interface PreparedSource {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  extractedText: string | null;
}

// Images stay as images for the model; document text is extracted here.
export async function prepareSource(
  file: Express.Multer.File,
  format: SourceFormat,
): Promise<PreparedSource> {
  if (format.needsImageConversion) {
    return {
      buffer: await heicToJpeg(file.buffer),
      filename: file.originalname.replace(/\.hei[cf]$/i, '') + '.jpg',
      mimeType: 'image/jpeg',
      extractedText: null,
    };
  }

  if (!format.canExtractText) {
    return {
      buffer: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      extractedText: null,
    };
  }

  const rawText = await extractTextFromBuffer(file.buffer, file.mimetype);

  return {
    buffer: file.buffer,
    filename: file.originalname,
    mimeType: file.mimetype,
    extractedText: normalizeExtractedText(rawText),
  };
}
