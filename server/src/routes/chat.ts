import { Router } from 'express';

import { askAboutNotes, generateQuiz } from '../services/openai.js';

const router = Router();

// Ask AI about your notes
router.post('/', async (req, res) => {
  try {
    const { message, classId, noteId } = req.body;

    // Validate inputs
    if (!message || !classId) {
      return res.status(400).json({
        error: 'Missing required fields: message and classId',
      });
    }

    console.log(`Chat request: "${message}" for class ${classId}`);

    // Get AI response
    const reply = await askAboutNotes(message, classId, noteId);

    res.json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error.message);
    res.status(500).json({
      error: `Chat failed: ${error.message}`,
    });
  }
});

// Generate quiz questions
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

export default router;