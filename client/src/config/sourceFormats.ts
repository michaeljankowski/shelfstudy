export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export const SOURCE_INPUT_ACCEPT = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
  '.pdf',
  '.docx',
  '.ppt',
  '.pptx',
  '.txt',
].join(',');

const ALLOWED_EXTENSIONS = new Set(
  SOURCE_INPUT_ACCEPT.split(',').map((extension) => extension.slice(1)),
);

export function validateSourceForSelection(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return 'Choose a JPG, PNG, WebP, HEIC, PDF, DOCX, PPT/PPTX, or TXT file.';
  }

  if (file.size === 0) {
    return 'The selected file is empty.';
  }

  if (file.size > MAX_SOURCE_BYTES) {
    return 'Files must be smaller than 20MB.';
  }

  return null;
}

