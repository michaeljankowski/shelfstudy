import OpenAI from 'openai';
import { supabase } from '../config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY in .env');
}

const DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

export async function askAboutNotes(
  message: string,
  classId: number,
  noteId?: number
): Promise<string> {
  try {
    let query = supabase.from('notes').select('*').eq('class_id', classId);
    if (noteId) query = query.eq('id', noteId);

    const { data: notes, error } = await query;
    if (error) throw error;

    if (!notes || notes.length === 0) {
      return "I don't see any notes uploaded for this class yet. Please upload some notes first!";
    }

    const note = notes[0];
    const isDocument = DOCUMENT_TYPES.includes(note.file_type);

    let userContent: any[];

    if (isDocument) {
      if (!note.extracted_text) {
        return "I couldn't read any text from this document. Try re-uploading it, or upload an image of the notes instead.";
      }
      userContent = [
        { type: 'text', text: message },
        { type: 'text', text: `Here are the notes:\n\n${note.extracted_text}` }
      ];
    } else {
      userContent = [
        { type: 'text', text: message },
        { type: 'image_url', image_url: { url: note.image_url } }
      ];
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful study assistant. Analyze the uploaded notes and answer questions about them clearly and concisely.',
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || 'No response generated';
  } catch (error: any) {
    console.error('❌ OpenAI error:', error);
    if (error.status === 401) return 'Invalid OpenAI API key. Please check your .env file.';
    if (error.status === 429) return 'Rate limit reached. Please try again in a moment.';
    if (error.status === 400) return 'Bad request to OpenAI. The file might be too large or corrupted.';
    return `AI service error: ${error.message}`;
  }
}

export async function generateQuiz(
  classId: number,
  numQuestions: number = 5
): Promise<string[]> {
  try {
    const { data: notes, error } = await supabase
      .from('notes').select('*').eq('class_id', classId);

    if (error) throw error;
    if (!notes || notes.length === 0) return ['No notes found for this class.'];

    const note = notes[0];
    const isDocument = DOCUMENT_TYPES.includes(note.file_type);

    let userContent: any[];

    if (isDocument) {
      if (!note.extracted_text) {
        return ["I couldn't read any text from this document. Try re-uploading it, or upload an image of the notes instead."];
      }
      userContent = [
        { type: 'text', text: 'Create quiz questions from these notes:' },
        { type: 'text', text: `Here are the notes:\n\n${note.extracted_text}` }
      ];
    } else {
      userContent = [
        { type: 'text', text: 'Create quiz questions from these notes:' },
        { type: 'image_url', image_url: { url: note.image_url } }
      ];
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Generate exactly ${numQuestions} multiple-choice quiz questions. Format each with 4 options (A, B, C, D) and indicate the correct answer.`,
        },
        { role: 'user', content: userContent },
      ],
      max_tokens: 1000,
    });

    return [response.choices[0]?.message?.content || 'Could not generate quiz'];
  } catch (error: any) {
    console.error('❌ Quiz generation error:', error.message);
    return [`Failed to generate quiz: ${error.message}`];
  }
}