import convert from 'heic-convert';

const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

// Some browsers send HEIC files as generic binary data.
export function isHeic(file: { mimetype: string; originalname: string }): boolean {
  return HEIC_MIME_TYPES.has(file.mimetype) || /\.hei[cf]$/i.test(file.originalname);
}

export async function heicToJpeg(buffer: Buffer): Promise<Buffer> {
  const output = await convert({ buffer, format: 'JPEG', quality: 0.9 });
  return Buffer.from(output);
}
