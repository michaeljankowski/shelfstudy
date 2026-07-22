import convert from 'heic-convert';

// Mimetypes phones and browsers use for HEIC/HEIF images
const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

/**
 * True if the file is a HEIC/HEIF image. Detected by mimetype OR file
 * extension, since some browsers send HEIC photos as application/octet-stream.
 */
export function isHeic(file: { mimetype: string; originalname: string }): boolean {
  return HEIC_MIME_TYPES.has(file.mimetype) || /\.hei[cf]$/i.test(file.originalname);
}

/**
 * Convert a HEIC/HEIF buffer to JPEG. OpenAI's vision API and browser <img>
 * tags can't read HEIC, so phone photos must be converted before storage.
 */
export async function heicToJpeg(buffer: Buffer): Promise<Buffer> {
  const output = await convert({ buffer, format: 'JPEG', quality: 0.9 });
  return Buffer.from(output);
}
