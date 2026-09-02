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
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }

  export interface Flashcard {
    front: string;
    back: string;
  }

  export interface OfficePreview {
    kind: 'slides' | 'document';
    html: string;
  }
