import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { uploadNote } from '../api';
import { SOURCE_INPUT_ACCEPT, validateSourceForSelection } from '../config/sourceFormats';
import './NoteComponents.css';

interface Props {
  classId: number;
  onNoteUploaded: () => void;
}

export default function NoteUpload({ classId, onNoteUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const validationError = validateSourceForSelection(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setUploading(true);
      setError('');
      await uploadNote(classId, file);
      onNoteUploaded();

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || 'Failed to upload note');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
          e.preventDefault();
        }
      }
    }
  };

  // Paste listener has to live on window, not the upload zone, since the
  // user might paste without focusing it first.
  useEffect(() => {
    window.addEventListener('paste', handlePaste as EventListener);
    return () => {
      window.removeEventListener('paste', handlePaste as EventListener);
    };
  }, [classId]);

  return (
    <div className="note-upload-container">
      {error && <div className="error">{error}</div>}

      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SOURCE_INPUT_ACCEPT}
          onChange={handleFileInput}
          style={{ display: 'none' }}
          disabled={uploading}
        />

        {uploading ? (
          <>
            <div className="upload-icon">Uploading</div>
            <div className="upload-text">Uploading...</div>
          </>
        ) : (
          <>
            <div className="upload-icon">Upload</div>
            <div className="upload-text">
              <strong>Click to upload</strong> or drag and drop
            </div>
            <div className="upload-hint">
              JPG, PNG, WebP, HEIC, PDF, DOCX, slides, or TXT up to 20MB
            </div>
          </>
        )}
      </div>
    </div>
  );
}
