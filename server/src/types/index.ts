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
  
  export interface ChatRequest {
    message: string;
    classId: number;
    noteId?: number;
  }
  
  export interface ChatResponse {
    reply: string;
  }
  
  export interface QuizQuestion {
    question: string;
    options?: string[];
    answer?: string;
  }

  export interface Flashcard {
    front: string;
    back: string;
  }
