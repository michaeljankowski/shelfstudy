import { Router } from 'express';

import { askAboutNotes, generateFlashcards, generateQuiz } from '../services/openai.js';

const router = Router();
const MAX_CHAT_HISTORY_MESSAGES = 12;
const MAX_CHAT_MESSAGE_LENGTH = 4_000;
const MAX_STUDY_PLAN_LENGTH = 16_000;
const MAX_STUDY_INSTRUCTIONS_LENGTH = 1_000;

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isStudyPlan(value: unknown): value is {
  outline: string;
  instructions: string;
  guideNoteId?: number;
  guideName?: string;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const plan = value as Record<string, unknown>;

  return typeof plan.outline === 'string'
    && plan.outline.trim().length > 0
    && plan.outline.length <= MAX_STUDY_PLAN_LENGTH
    && typeof plan.instructions === 'string'
    && plan.instructions.length <= MAX_STUDY_INSTRUCTIONS_LENGTH
    && (plan.guideNoteId === undefined || isPositiveInteger(plan.guideNoteId))
    && (plan.guideName === undefined || (typeof plan.guideName === 'string' && plan.guideName.length <= 255));
}

function isChatHistory(value: unknown): value is Array<{ role: 'user' | 'assistant'; content: string }> {
  return Array.isArray(value)
    && value.length <= MAX_CHAT_HISTORY_MESSAGES
    && value.every((item) => (
      item
      && typeof item === 'object'
      && (item as Record<string, unknown>).role !== undefined
      && ((item as Record<string, unknown>).role === 'user' || (item as Record<string, unknown>).role === 'assistant')
      && typeof (item as Record<string, unknown>).content === 'string'
      && ((item as Record<string, unknown>).content as string).length <= MAX_CHAT_MESSAGE_LENGTH
    ));
}

router.post('/', async (req, res) => {
  try {
    const { message, studyPlan, history = [] } = req.body;
    const classId = Number(req.body.classId);
    const noteId = req.body.noteId === undefined ? undefined : Number(req.body.noteId);

    if (typeof message !== 'string' || !message.trim() || !isPositiveInteger(classId)) {
      return res.status(400).json({
        error: 'message and classId are required',
      });
    }
    if (noteId !== undefined && !isPositiveInteger(noteId)) {
      return res.status(400).json({ error: 'noteId must be a positive integer' });
    }
    if (studyPlan !== undefined && !isStudyPlan(studyPlan)) {
      return res.status(400).json({ error: 'Study plan is invalid or too long' });
    }
    if (!isChatHistory(history)) {
      return res.status(400).json({ error: 'Chat history is invalid or too long' });
    }

    console.log(`Chat request: "${message}" for class ${classId}`);

    const reply = await askAboutNotes(message.trim(), classId, {
      noteId,
      studyPlan,
      history,
    });

    res.json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error.message);
    res.status(500).json({
      error: `Chat failed: ${error.message}`,
    });
  }
});

router.post('/quiz', async (req, res) => {
  try {
    const { classId, numQuestions = 5 } = req.body;

    if (!classId) {
      return res.status(400).json({
        error: 'Missing required field: classId',
      });
    }

    console.log(`Quiz request for class ${classId}`);

    const questions = await generateQuiz(classId, numQuestions);

    res.json({ questions });
  } catch (error: any) {
    console.error(' Quiz error:', error.message);
    res.status(500).json({
      error: `Quiz generation failed: ${error.message}`,
    });
  }
});

router.post('/flashcards', async (req, res) => {
  try {
    const classId = Number(req.body.classId);
    const numCards = req.body.numCards === undefined ? 5 : Number(req.body.numCards);
    const noteId = req.body.noteId === undefined ? undefined : Number(req.body.noteId);
    const focus = req.body.focus === undefined ? undefined : String(req.body.focus).trim();
    const excludeFronts = req.body.excludeFronts === undefined ? [] : req.body.excludeFronts;

    if (!Number.isSafeInteger(classId) || classId <= 0) {
      return res.status(400).json({ error: 'classId must be a positive integer' });
    }
    if (!Number.isSafeInteger(numCards) || numCards < 1 || numCards > 20) {
      return res.status(400).json({ error: 'numCards must be an integer from 1 to 20' });
    }
    if (noteId !== undefined && (!Number.isSafeInteger(noteId) || noteId <= 0)) {
      return res.status(400).json({ error: 'noteId must be a positive integer' });
    }
    if (focus !== undefined && focus.length > 500) {
      return res.status(400).json({ error: 'focus must be 500 characters or fewer' });
    }
    if (!Array.isArray(excludeFronts) || excludeFronts.length > 20 || excludeFronts.some((front) => typeof front !== 'string' || front.length > 300)) {
      return res.status(400).json({ error: 'excludeFronts must contain 20 short strings or fewer' });
    }

    const cards = await generateFlashcards(classId, { numCards, noteId, focus, excludeFronts });
    res.json({ cards });
  } catch (error: any) {
    console.error('Flashcard generation error:', error.message);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

export default router;
