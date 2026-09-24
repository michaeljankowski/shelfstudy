import axios from 'axios';
import { ChatSession, Class, Flashcard, Folder, Note, OfficePreview, StoredChatMessage, StudyPlanContext } from './types';
import { supabase } from './config/supabase';

const API_BASE = '/api';

axios.interceptors.request.use(async (config) => {
  if (!config.url?.startsWith(API_BASE)) return config;
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) config.headers.Authorization = `Bearer ${data.session.access_token}`;
  return config;
});

export const getClasses = () =>
  axios.get<Class[]>(`${API_BASE}/classes`);

export const createClass = (name: string, folderId?: number | null) =>
  axios.post<Class>(`${API_BASE}/classes`, { name, folder_id: folderId ?? null });

export const updateClass = (id: number, updates: { name?: string; folderId?: number | null }) =>
  axios.put<Class>(`${API_BASE}/classes/${id}`, {
    name: updates.name,
    folder_id: updates.folderId,
  });

export const deleteClass = (id: number) =>
  axios.delete(`${API_BASE}/classes/${id}`);

export const getClass = (id: number) =>
  axios.get<Class>(`${API_BASE}/classes/${id}`);

export const getFolders = () =>
  axios.get<Folder[]>(`${API_BASE}/folders`);

export const getFolder = (id: number) =>
  axios.get<Folder>(`${API_BASE}/folders/${id}`);

export const createFolder = (name: string, icon: string) =>
  axios.post<Folder>(`${API_BASE}/folders`, { name, icon });

export const updateFolder = (id: number, updates: { name?: string; icon?: string | null }) =>
  axios.put<Folder>(`${API_BASE}/folders/${id}`, updates);

export const deleteFolder = (id: number) =>
  axios.delete(`${API_BASE}/folders/${id}`);

export const getNotesByClass = (classId: number) =>
  axios.get<Note[]>(`${API_BASE}/notes/class/${classId}`);

export const uploadNote = (classId: number, file: File) => {
  const formData = new FormData();
  formData.append('classId', classId.toString());
  formData.append('image', file);
  
  return axios.post<Note>(`${API_BASE}/notes`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteNote = (noteId: number) =>
  axios.delete(`${API_BASE}/notes/${noteId}`);

export const getOfficePreview = (noteId: number) =>
  axios.get<OfficePreview>(`${API_BASE}/notes/${noteId}/preview`);

export const sendChatMessage = (
  sessionId: string,
  message: string,
  clientMessageId: string,
  noteId?: number,
) =>
  axios.post<{ reply: string; sessionId: string; message: StoredChatMessage }>(`${API_BASE}/chat`, {
    message,
    sessionId,
    clientMessageId,
    noteId,
  });

export const getChatSessions = (classId: number) =>
  axios.get<ChatSession[]>(`${API_BASE}/chat/sessions`, { params: { classId } });

export const createChatSession = (classId: number, kind: ChatSession['kind'], studyPlan?: StudyPlanContext) =>
  axios.post<ChatSession>(`${API_BASE}/chat/sessions`, { classId, kind, studyPlan });

export const getChatMessages = (sessionId: string) =>
  axios.get<StoredChatMessage[]>(`${API_BASE}/chat/sessions/${sessionId}/messages`);

export const updateChatSession = (sessionId: string, status: ChatSession['status']) =>
  axios.patch<ChatSession>(`${API_BASE}/chat/sessions/${sessionId}`, { status });

export const updateStudyPlan = (sessionId: string, studyPlan: StudyPlanContext) =>
  axios.patch<ChatSession>(`${API_BASE}/chat/sessions/${sessionId}`, { studyPlan });

export const generateStudyPlanSuggestion = (classId: number, prompt: string, noteId?: number) =>
  axios.post<{ reply: string }>(`${API_BASE}/chat/plan-suggestion`, { classId, prompt, noteId });

export const generateQuiz = (classId: number, numQuestions: number = 5) =>
  axios.post<{ questions: string[] }>(`${API_BASE}/chat/quiz`, {
    classId,
    numQuestions,
  });

export const generateFlashcards = ({ classId, numCards, noteId, focus, excludeFronts }: {
  classId: number;
  numCards: number;
  noteId?: number;
  focus?: string;
  excludeFronts?: string[];
}) =>
  axios.post<{ cards: Flashcard[] }>(`${API_BASE}/chat/flashcards`, {
    classId,
    numCards,
    noteId,
    focus,
    excludeFronts,
  });
