const MAX_EXTRACTED_CHARACTERS = 250_000;

/**
 * LEARNING TODO 2
 *
 * Clean up text extracted from PDF, Word, PowerPoint, and TXT files.
 *
 * Use TypeScript string methods and regular expressions:
 * 1. Use replace() with regex to change Windows/Mac line endings to "\n".
 * 2. Use replace() to remove null ("\0") characters.
 * 3. Use replace() to turn repeated spaces and tabs into one space. Keep
 *    newlines so paragraph breaks are not lost.
 * 4. Use trim() to remove whitespace from the start and end.
 * 5. If the cleaned string is empty, throw an Error with a safe message.
 * 6. If it is longer than MAX_EXTRACTED_CHARACTERS, either throw an Error or
 *    shorten it with slice(). Add a comment explaining your choice.
 *
 * Return the cleaned string when it is valid.
 */
export function normalizeExtractedText(rawText: string): string {
  let normalizedText = rawText;

  // Convert old line endings
  normalizedText = normalizedText.replace(/\r\n?/g, '\n');
  normalizedText = normalizedText.replace(/\0/g, ''); // Remove null characters
  normalizedText = normalizedText.replace(/[ \t]+/g, ' '); // Replace repeated spaces and tabs with a single space
  normalizedText = normalizedText.trim();
  if (normalizedText.length === 0) {
    throw new Error('Extracted text is empty after normalization. Check the source file for content.');
  }
  if (normalizedText.length > MAX_EXTRACTED_CHARACTERS) {
    // I chose to shorten the text with slice() to avoid losing potentially valuable content in a bug.
    normalizedText = normalizedText.slice(0, MAX_EXTRACTED_CHARACTERS);
  }
  return normalizedText;
}
