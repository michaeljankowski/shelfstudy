import { supabase, STORAGE_BUCKET } from '../config/supabase.js';

export async function uploadImage(
  file: Express.Multer.File,
  classId: number
): Promise<string> {
  try {
    // Create unique filename: classId/timestamp-originalname
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    const filePath = `${classId}/${filename}`;

    console.log(`Uploading image: ${filePath}`);

    // Upload to Supabase Storage
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

    // Get public URL
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    console.log('Image uploaded:', data.publicUrl);

    return data.publicUrl;
  } catch (error: any) {
    console.error('Storage service error:', error.message);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split(`${STORAGE_BUCKET}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid image URL');
    }

    const filePath = urlParts[1];

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