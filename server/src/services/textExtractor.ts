import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { parseOffice } from 'officeparser';

// Read the upload once instead of downloading it again from storage.
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    switch (mimeType) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        const docResult = await mammoth.extractRawText({ buffer });
        return docResult.value;
      }

      case 'text/plain':
        return buffer.toString('utf-8');

      case 'text/html':
        return buffer
          .toString('utf-8')
          .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<(?:br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&quot;/gi, '"')
          .replace(/&#39;|&apos;/gi, "'");

      case 'application/pdf': {
        const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
        try {
          const pdfData = await pdfParser.getText();
          return pdfData.text;
        } finally {
          await pdfParser.destroy();
        }
      }

      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      case 'application/vnd.ms-powerpoint': {
        const office = await parseOffice(buffer);
        return office.toText();
      }

      default:
        throw new Error(`No text extractor is registered for ${mimeType}`);
    }
  } catch (error: any) {
    console.error('Text extraction error:', error.message);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}
