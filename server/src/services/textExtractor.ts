import mammoth from 'mammoth';
import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import { parseOffice } from 'officeparser';

export async function extractTextFromFile(
  fileUrl: string,
  mimeType: string
): Promise<string> {
  try {
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
    });
    const buffer = Buffer.from(response.data);

    switch (mimeType) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docResult = await mammoth.extractRawText({ buffer });
        return docResult.value;

      case 'text/plain':
        return buffer.toString('utf-8');

      case 'application/pdf':
        const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
        const pdfData = await pdfParser.getText();
        return pdfData.text;

      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      case 'application/vnd.ms-powerpoint':
        const office = await parseOffice(buffer);
        return office.toText();

      default:
        return '';
    }
  } catch (error: any) {
    console.error('Text extraction error:', error.message);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}