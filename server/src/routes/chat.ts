import { Router } from 'express';

import { askAboutNotes, generateFlashcards, generateQuiz } from '../services/openai.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { message, classId, noteId } = req.body;

    if (!message || !classId) {
      return res.status(400).json({
        error: 'Missing required fields: message and classId',
      });
    }

    console.log(`Chat request: "${message}" for class ${classId}`);

    const reply = await askAboutNotes(message, classId, noteId);

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
