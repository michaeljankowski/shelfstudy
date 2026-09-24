import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticatedUserId } from '../middleware/auth.js';
import { askAboutNotes, generateFlashcards, generateQuiz } from '../services/openai.js';

const router = Router();
const MAX_CHAT_HISTORY_MESSAGES = 12;
const MAX_CHAT_MESSAGE_LENGTH = 4_000;
const MAX_STUDY_PLAN_LENGTH = 16_000;
const MAX_STUDY_INSTRUCTIONS_LENGTH = 1_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type StudyPlan = { outline: string; instructions: string; guideNoteId?: number; guideName?: string };

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isStudyPlan(value: unknown): value is StudyPlan {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const plan = value as Record<string, unknown>;
  return typeof plan.outline === 'string' && plan.outline.trim().length > 0
    && plan.outline.length <= MAX_STUDY_PLAN_LENGTH
    && typeof plan.instructions === 'string' && plan.instructions.length <= MAX_STUDY_INSTRUCTIONS_LENGTH
    && (plan.guideNoteId === undefined || isPositiveInteger(plan.guideNoteId))
    && (plan.guideName === undefined || (typeof plan.guideName === 'string' && plan.guideName.length <= 255));
}

async function ownedClassExists(classId: number, ownerId: string) {
  const { data } = await supabase.from('classes').select('id').eq('id', classId).eq('owner_id', ownerId).maybeSingle();
  return Boolean(data);
}

router.get('/sessions', async (req, res) => {
  const ownerId = authenticatedUserId(req);
  const classId = Number(req.query.classId);
  if (!isPositiveInteger(classId)) return res.status(400).json({ error: 'classId must be a positive integer' });
  const { data, error } = await supabase.from('chat_sessions').select('*')
    .eq('owner_id', ownerId).eq('class_id', classId).neq('status', 'archived')
    .order('updated_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Could not load conversations' });
  res.json(data);
});

router.post('/sessions', async (req, res) => {
  const ownerId = authenticatedUserId(req);
  const classId = Number(req.body.classId);
  const kind = req.body.kind;
  const studyPlan = req.body.studyPlan;
  if (!isPositiveInteger(classId) || (kind !== 'general' && kind !== 'study_plan')) {
    return res.status(400).json({ error: 'A valid classId and conversation kind are required' });
  }
  if (kind === 'study_plan' && !isStudyPlan(studyPlan)) return res.status(400).json({ error: 'A valid study plan is required' });
  if (!(await ownedClassExists(classId, ownerId))) return res.status(404).json({ error: 'Class not found' });
  if (kind === 'study_plan' && studyPlan.guideNoteId !== undefined) {
    const { data: guide } = await supabase.from('notes').select('id').eq('id', studyPlan.guideNoteId)
      .eq('class_id', classId).eq('owner_id', ownerId).maybeSingle();
    if (!guide) return res.status(404).json({ error: 'Study guide source not found' });
  }
  const { data, error } = await supabase.from('chat_sessions').insert({
    owner_id: ownerId, class_id: classId, kind, study_plan: kind === 'study_plan' ? studyPlan : null,
    title: typeof req.body.title === 'string' ? req.body.title.slice(0, 120) : null,
  }).select().single();
  if (error) return res.status(500).json({ error: 'Could not create conversation' });
  res.status(201).json(data);
});

router.get('/sessions/:id/messages', async (req, res) => {
  const ownerId = authenticatedUserId(req);
  if (!UUID.test(req.params.id)) return res.status(400).json({ error: 'Invalid session ID' });
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  let query = supabase.from('chat_messages').select('*').eq('session_id', req.params.id)
    .eq('owner_id', ownerId).eq('status', 'complete').order('id', { ascending: false }).limit(limit);
  const before = Number(req.query.before);
  if (Number.isSafeInteger(before) && before > 0) query = query.lt('id', before);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'Could not load messages' });
  res.json((data ?? []).reverse());
});

router.patch('/sessions/:id', async (req, res) => {
  const ownerId = authenticatedUserId(req);
  const status = req.body.status;
  const studyPlan = req.body.studyPlan;
  if (!UUID.test(req.params.id) || (status !== undefined && !['active', 'paused', 'archived'].includes(status)) || (studyPlan !== undefined && !isStudyPlan(studyPlan))) {
    return res.status(400).json({ error: 'A valid session update is required' });
  }
  if (status === undefined && studyPlan === undefined) return res.status(400).json({ error: 'A session update is required' });

  const { data: existing } = await supabase.from('chat_sessions').select('class_id,kind,status')
    .eq('id', req.params.id).eq('owner_id', ownerId).maybeSingle();
  if (!existing) return res.status(404).json({ error: 'Conversation not found' });
  if (studyPlan !== undefined && existing.kind !== 'study_plan') {
    return res.status(400).json({ error: 'Only Study Guide sessions can store a plan' });
  }
  if (studyPlan?.guideNoteId !== undefined) {
    const { data: guide } = await supabase.from('notes').select('id').eq('id', studyPlan.guideNoteId)
      .eq('class_id', existing.class_id).eq('owner_id', ownerId).maybeSingle();
    if (!guide) return res.status(404).json({ error: 'Study guide source not found' });
  }

  const update = {
    ...(status === undefined ? {} : { status, archived_at: status === 'archived' ? new Date().toISOString() : null }),
    ...(studyPlan === undefined ? {} : { study_plan: studyPlan }),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('chat_sessions').update(update)
    .eq('id', req.params.id).eq('owner_id', ownerId).select().maybeSingle();
  if (error) return res.status(500).json({ error: 'Could not update conversation' });
  if (!data) return res.status(404).json({ error: 'Conversation not found' });
  res.json(data);
});

router.post('/', async (req, res) => {
  const ownerId = authenticatedUserId(req);
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  const sessionId = req.body.sessionId;
  const clientMessageId = req.body.clientMessageId || randomUUID();
  const noteId = req.body.noteId === undefined ? undefined : Number(req.body.noteId);
  if (!message || message.length > MAX_CHAT_MESSAGE_LENGTH || !UUID.test(sessionId) || !UUID.test(clientMessageId)) {
    return res.status(400).json({ error: 'message, sessionId, and clientMessageId are required' });
  }
  if (noteId !== undefined && !isPositiveInteger(noteId)) return res.status(400).json({ error: 'noteId must be a positive integer' });

  const { data: session } = await supabase.from('chat_sessions').select('*')
    .eq('id', sessionId).eq('owner_id', ownerId).maybeSingle();
  if (!session || session.status !== 'active') return res.status(404).json({ error: 'Active conversation not found' });
  if (noteId !== undefined) {
    const { data: note } = await supabase.from('notes').select('id').eq('id', noteId)
      .eq('class_id', session.class_id).eq('owner_id', ownerId).maybeSingle();
    if (!note) return res.status(404).json({ error: 'Selected source not found' });
  }

  const { data: existingUser } = await supabase.from('chat_messages').select('id,status')
    .eq('session_id', sessionId).eq('client_message_id', clientMessageId).maybeSingle();
  if (existingUser) {
    const { data: existingReply } = await supabase.from('chat_messages').select('*')
      .eq('reply_to_message_id', existingUser.id).eq('owner_id', ownerId).maybeSingle();
    if (existingReply) return res.json({ reply: existingReply.content, message: existingReply, sessionId });
    return res.status(409).json({ error: existingUser.status === 'failed' ? 'Previous attempt failed; send a new message ID' : 'Message is still processing' });
  }

  const { data: userMessage, error: insertError } = await supabase.from('chat_messages').insert({
    session_id: sessionId, owner_id: ownerId, client_message_id: clientMessageId,
    role: 'user', content: message, selected_note_id: noteId, status: 'pending',
  }).select().single();
  if (insertError || !userMessage) return res.status(500).json({ error: 'Could not save message' });

  const startedAt = Date.now();
  try {
    const { data: recent } = await supabase.from('chat_messages').select('role,content')
      .eq('session_id', sessionId).eq('owner_id', ownerId).eq('status', 'complete')
      .lt('id', userMessage.id).order('id', { ascending: false }).limit(MAX_CHAT_HISTORY_MESSAGES);
    const history = (recent ?? []).reverse() as Array<{ role: 'user' | 'assistant'; content: string }>;
    const studyPlan = session.kind === 'study_plan' && isStudyPlan(session.study_plan) ? session.study_plan : undefined;
    const reply = await askAboutNotes(message, session.class_id, ownerId, { noteId, studyPlan, history });
    const { data: assistantMessage, error } = await supabase.from('chat_messages').insert({
      session_id: sessionId, owner_id: ownerId, reply_to_message_id: userMessage.id,
      role: 'assistant', content: reply, status: 'complete', model: 'gpt-4o-mini',
      prompt_version: 'chat-v1', latency_ms: Date.now() - startedAt,
    }).select().single();
    if (error) throw error;
    await Promise.all([
      supabase.from('chat_messages').update({ status: 'complete' }).eq('id', userMessage.id).eq('owner_id', ownerId),
      supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId).eq('owner_id', ownerId),
    ]);
    res.json({ reply, message: assistantMessage, sessionId });
  } catch (error) {
    await supabase.from('chat_messages').update({ status: 'failed' }).eq('id', userMessage.id).eq('owner_id', ownerId);
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat failed' });
  }
});

router.post('/plan-suggestion', async (req, res) => {
  const ownerId = authenticatedUserId(req);
  const classId = Number(req.body.classId);
  const prompt = typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '';
  const noteId = req.body.noteId === undefined ? undefined : Number(req.body.noteId);
  if (!isPositiveInteger(classId) || !prompt || prompt.length > MAX_CHAT_MESSAGE_LENGTH) {
    return res.status(400).json({ error: 'A valid class and prompt are required' });
  }
  if (!(await ownedClassExists(classId, ownerId))) return res.status(404).json({ error: 'Class not found' });
  const reply = await askAboutNotes(prompt, classId, ownerId, { noteId });
  res.json({ reply });
});

router.post('/quiz', async (req, res) => {
  const ownerId = authenticatedUserId(req);
  const classId = Number(req.body.classId);
  const numQuestions = req.body.numQuestions === undefined ? 5 : Number(req.body.numQuestions);
  if (!isPositiveInteger(classId)) return res.status(400).json({ error: 'classId must be a positive integer' });
  res.json({ questions: await generateQuiz(classId, ownerId, numQuestions) });
});

router.post('/flashcards', async (req, res) => {
  try {
    const ownerId = authenticatedUserId(req);
    const classId = Number(req.body.classId);
    const numCards = req.body.numCards === undefined ? 5 : Number(req.body.numCards);
    const noteId = req.body.noteId === undefined ? undefined : Number(req.body.noteId);
    const focus = req.body.focus === undefined ? undefined : String(req.body.focus).trim();
    const excludeFronts = req.body.excludeFronts === undefined ? [] : req.body.excludeFronts;
    if (!isPositiveInteger(classId) || !Number.isSafeInteger(numCards) || numCards < 1 || numCards > 20) return res.status(400).json({ error: 'Invalid flashcard request' });
    if (noteId !== undefined && !isPositiveInteger(noteId)) return res.status(400).json({ error: 'noteId must be a positive integer' });
    if (focus !== undefined && focus.length > 500) return res.status(400).json({ error: 'focus must be 500 characters or fewer' });
    if (!Array.isArray(excludeFronts) || excludeFronts.length > 20 || excludeFronts.some((front) => typeof front !== 'string' || front.length > 300)) return res.status(400).json({ error: 'Invalid exclusions' });
    const cards = await generateFlashcards(classId, ownerId, { numCards, noteId, focus, excludeFronts });
    res.json({ cards });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

export default router;
