import { parseOffice } from 'officeparser';

const PRESENTATION_TYPES = new Set([
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

export async function createOfficePreview(buffer: Buffer, mimeType: string) {
  const document = await parseOffice(buffer, { extractAttachments: true });
  const result = await document.to('html');

  if (typeof result.value !== 'string') {
    throw new Error('The Office preview could not be generated.');
  }

  return {
    kind: PRESENTATION_TYPES.has(mimeType) ? 'slides' as const : 'document' as const,
    html: result.value,
  };
}
