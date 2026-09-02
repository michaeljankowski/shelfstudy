import {
  extensionOf,
  MAX_SOURCE_BYTES,
  SOURCE_FORMATS,
  SourceFormat,
} from '../config/sourceFormats.js';

export type SourceValidationResult =
  | { ok: true; format: SourceFormat }
  | { ok: false; status: 400 | 413 | 415; message: string };

// Both values come from the upload, so neither one is enough by itself.
export function validateUploadedSource(
  file: Pick<Express.Multer.File, 'originalname' | 'mimetype' | 'size'>,
): SourceValidationResult {
  const extension = extensionOf(file.originalname);

  if (file.size === 0) {
    return {
      ok: false,
      status: 400,
      message: 'File is empty.',
    };
  }

  if (file.size > MAX_SOURCE_BYTES) {
    return {
      ok: false,
      status: 413,
      message: 'File exceeds the maximum allowed size.',
    };
  }

  const format = SOURCE_FORMATS.find((candidate) => {
    const extensionMatches = candidate.extensions.includes(extension);

    const mimeTypeMatches =
      candidate.mimeTypes.includes(file.mimetype) ||
      (candidate.needsImageConversion === true &&
        file.mimetype === 'application/octet-stream');

    return extensionMatches && mimeTypeMatches;
  });

  if (!format) {
    return {
      ok: false,
      status: 415,
      message: 'Unsupported or mismatched file format.',
    };
  }

  return {
    ok: true,
    format,
  };
}
