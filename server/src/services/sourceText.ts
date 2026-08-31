const MAX_EXTRACTED_CHARACTERS = 250_000;

export function normalizeExtractedText(rawText: string): string {
  let normalizedText = rawText;

  normalizedText = normalizedText.replace(/\r\n?/g, '\n');
  normalizedText = normalizedText.replace(/\0/g, '');
  normalizedText = normalizedText.replace(/[ \t]+/g, ' ');
  normalizedText = normalizedText.trim();
  if (normalizedText.length === 0) {
    throw new Error('Extracted text is empty after normalization. Check the source file for content.');
  }
  if (normalizedText.length > MAX_EXTRACTED_CHARACTERS) {
    // Keep a usable section instead of rejecting the whole file.
    normalizedText = normalizedText.slice(0, MAX_EXTRACTED_CHARACTERS);
  }
  return normalizedText;
}
