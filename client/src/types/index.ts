export interface Class {
    id: number;
    name: string;
    folder_id: number | null;
    created_at: string;
  }

  export interface Folder {
    id: number;
    name: string;
    icon: string | null;
    created_at: string;
  }
  
  export interface Note {
    id: number;
    class_id: number;
    image_url: string;
    file_type?: string;
    filename?: string;
    extracted_text?: string | null;
    created_at: string;
  }
  
  export interface ChatMessage {
    id?: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }

  export interface ChatSession {
    id: string;
    class_id: number;
    kind: 'general' | 'study_plan';
    title: string | null;
    study_plan: StudyPlanContext | null;
    status: 'active' | 'paused' | 'archived';
    created_at: string;
    updated_at: string;
  }

  export interface StoredChatMessage {
    id: number;
    session_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }

  export interface StudyPlanContext {
    instructions: string;
    outline: string;
    guideNoteId?: number;
    guideName?: string;
  }

  export interface Flashcard {
    front: string;
    back: string;
  }

  export interface OfficePreview {
    kind: 'slides' | 'document';
    html: string;
  }
