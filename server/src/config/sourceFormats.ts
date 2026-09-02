export type SourceKind = 'image' | 'pdf' | 'word' | 'slides' | 'text';

export interface SourceFormat {
  kind: SourceKind;
  extensions: readonly string[];
  mimeTypes: readonly string[];
  canExtractText: boolean;
  needsImageConversion?: boolean;
}

export const SOURCE_FORMATS: readonly SourceFormat[] = [
  {
    kind: 'image',
    extensions: ['jpg', 'jpeg', 'png', 'webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    canExtractText: false,
  },
  {
    kind: 'image',
    extensions: ['heic', 'heif'],
    mimeTypes: ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'],
    canExtractText: false,
    needsImageConversion: true,
  },
  {
    kind: 'pdf',
    extensions: ['pdf'],
    mimeTypes: ['application/pdf'],
    canExtractText: true,
  },
  {
    kind: 'word',
    extensions: ['docx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    canExtractText: true,
  },
  {
    kind: 'slides',
    extensions: ['ppt', 'pptx'],
    mimeTypes: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    canExtractText: true,
  },
  {
    kind: 'text',
    extensions: ['txt'],
    mimeTypes: ['text/plain'],
    canExtractText: true,
  },
  {
    kind: 'text',
    extensions: ['html'],
    mimeTypes: ['text/html'],
    canExtractText: true,
  },
] as const;

export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export function extensionOf(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot + 1).toLowerCase();
}
