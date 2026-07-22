import axios from 'axios';
import { Class, Folder, Note } from './types';

const API_BASE = '/api'; // Proxied to localhost:3000

// Classes
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

// Folders
export const getFolders = () =>
  axios.get<Folder[]>(`${API_BASE}/folders`);

export const createFolder = (name: string, icon?: string | null) =>
  axios.post<Folder>(`${API_BASE}/folders`, { name, icon: icon ?? null });

export const updateFolder = (id: number, updates: { name?: string; icon?: string | null }) =>
  axios.put<Folder>(`${API_BASE}/folders/${id}`, updates);

export const deleteFolder = (id: number) =>
  axios.delete(`${API_BASE}/folders/${id}`);

// Notes
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

// Chat
export const sendChatMessage = (classId: number, message: string, noteId?: number) =>
  axios.post<{ reply: string }>(`${API_BASE}/chat`, {
    message,
    classId,
    noteId,
  });

export const generateQuiz = (classId: number, numQuestions: number = 5) =>
  axios.post<{ questions: string[] }>(`${API_BASE}/chat/quiz`, {
    classId,
    numQuestions,
  });