import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import classesRouter from './routes/classes.js';
import notesRouter from './routes/notes.js';
import chatRouter from './routes/chat.js';
import foldersRouter from './routes/folders.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Note-taking API is running' });
});

app.use('/api/classes', classesRouter);
app.use('/api/notes', notesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/folders', foldersRouter);


app.listen(PORT, () => {
  console.log(`\n Server running on http://localhost:${PORT}`);
  console.log(` API endpoints available at http://localhost:${PORT}/api`);
});
