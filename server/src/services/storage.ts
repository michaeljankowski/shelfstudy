import { supabase, STORAGE_BUCKET } from '../config/supabase.js';

export async function uploadSource(
  file: Express.Multer.File,
  classId: number
): Promise<string> {
  try {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    const filePath = `${classId}/${filename}`;

    console.log(`Uploading source: ${filePath}`);

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

    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    console.log('Source uploaded:', data.publicUrl);

    return data.publicUrl;
  } catch (error: any) {
    console.error('Storage service error:', error.message);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

export const uploadImage = uploadSource;

function sourcePathFromUrl(imageUrl: string): string {
  const urlParts = imageUrl.split(`${STORAGE_BUCKET}/`);
  if (urlParts.length < 2 || !urlParts[1]) throw new Error('Invalid source URL');
  return decodeURIComponent(urlParts[1]);
}

export async function downloadSource(sourceUrl: string): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(sourcePathFromUrl(sourceUrl));

  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    const filePath = sourcePathFromUrl(imageUrl);

    console.log(`Deleting image: ${filePath}`);

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
