import { supabase, STORAGE_BUCKET } from '../config/supabase.js';

// How long a signed link works, in seconds. Anyone with the link can open the
// file until it expires, so keep it short.
export const BROWSER_URL_TTL_SECONDS = 300;
export const MODEL_FETCH_URL_TTL_SECONDS = 300;

// Clean up the file name so it is safe to use in a storage path.
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/-+\./g, '.')
    .replace(/^[.-]+|[.-]+$/g, '');
  if (!cleaned) return 'file';
  if (cleaned.length <= 100) return cleaned;
  const dot = cleaned.lastIndexOf('.');
  const extension = dot > 0 && cleaned.length - dot <= 10 ? cleaned.slice(dot) : '';
  return cleaned.slice(0, 100 - extension.length) + extension;
}

// Returns the file path in the bucket. This is what we save in the notes table.
export async function uploadSource(
  file: Express.Multer.File,
  classId: number,
  ownerId: string,
): Promise<string> {
  try {
    const filename = `${Date.now()}-${sanitizeFilename(file.originalname)}`;
    const filePath = `${ownerId}/${classId}/${filename}`;


    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError.message);
      throw uploadError;
    }

    console.log('Source uploaded');

    return filePath;
  } catch (error: any) {
    console.error('Storage service error:', error.message);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

export const uploadImage = uploadSource;

// Old notes saved a full public URL. New notes save just the path.
// This handles both.
export function objectPathFromStored(stored: string): string {
  if (!/^https?:\/\//i.test(stored)) return stored;
  const urlParts = stored.split(`${STORAGE_BUCKET}/`);
  if (urlParts.length < 2 || !urlParts[1]) throw new Error('Invalid source URL');
  return decodeURIComponent(urlParts[1].split('?')[0]);
}

// Check the user owns the file before calling this. Don't log the link.
export async function signSourceUrl(stored: string, expiresInSeconds: number): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(objectPathFromStored(stored), expiresInSeconds);

  if (error || !data?.signedUrl) throw new Error('Could not sign source URL');
  return data.signedUrl;
}

export async function downloadSource(stored: string): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(objectPathFromStored(stored));

  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteImage(stored: string): Promise<void> {
  try {
    const filePath = objectPathFromStored(stored);


    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error.message);
      throw error;
    }

    console.log('Image deleted');
  } catch (error: any) {
    console.error('Failed to delete image:', error.message);
    throw error;
  }
}
