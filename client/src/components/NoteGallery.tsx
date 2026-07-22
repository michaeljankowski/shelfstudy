import { useState, useEffect } from 'react';
import { Note } from '../types';
import { getNotesByClass, deleteNote } from '../api';
import './NoteComponents.css';

interface Props {
  classId: number;
  onNoteClick: (note: Note) => void;
  refreshTrigger: number;
}

export default function NoteGallery({ classId, onNoteClick, refreshTrigger }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [classId, refreshTrigger]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getNotesByClass(classId);
      setNotes(response.data);
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // card itself is also clickable, don't trigger onNoteClick

    if (!confirm('Delete this note?')) return;

    try {
      await deleteNote(noteId);
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch {
      setError('Failed to delete note');
    }
  };

  if (loading) {
    return <div className="loading">Loading notes...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (notes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <h3>No Notes Yet</h3>
        <p>Upload your first note to get started</p>
      </div>
    );
  }

  return (
    <div className="note-gallery">
      {notes.map((note) => (
        <div
          key={note.id}
          className="note-card"
          onClick={() => onNoteClick(note)}
        >
          <div className="note-image-wrapper">
            <img
              src={note.image_url}
              alt="Note"
              className="note-image"
            />
          </div>
          <div className="note-info">
            <div className="note-date">
              {new Date(note.created_at).toLocaleDateString()}
            </div>
            <button
              className="note-delete"
              onClick={(e) => handleDelete(note.id, e)}
              title="Delete note"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}