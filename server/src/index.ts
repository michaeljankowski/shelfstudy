import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import classesRouter from './routes/classes.js';
import notesRouter from './routes/notes.js';
import chatRouter from './routes/chat.js';
import foldersRouter from './routes/folders.js';
import { requireAuth } from './middleware/auth.js';
import { aiRateLimit, apiRateLimit, uploadRateLimit } from './middleware/rateLimits.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',').map((origin) => origin.trim()) ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'Note-taking API is running' });
});

app.use('/api', requireAuth, apiRateLimit);
app.use('/api/classes', classesRouter);
app.use('/api/notes', uploadRateLimit, notesRouter);
app.use('/api/chat', aiRateLimit, chatRouter);
app.use('/api/folders', foldersRouter);


app.listen(PORT, () => {
  console.log(`\n Server running on http://localhost:${PORT}`);
  console.log(` API endpoints available at http://localhost:${PORT}/api`);
});
