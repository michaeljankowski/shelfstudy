import { ChangeEvent, ReactNode, useRef, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, ChevronDown, ChevronRight, FileText, Image as ImageIcon, Link2, LoaderCircle, Plus, StickyNote, Upload } from 'lucide-react';
import { uploadNote } from '../api';
import { Note } from '../types';
import RichNoteEditor from './RichNoteEditor';
import './SourceTree.css';

type Category = 'documents' | 'photos' | 'links' | 'notes';

interface Props {
  classId: number;
  notes: Note[];
  loading: boolean;
  loadError: string;
  activeCategory?: Category;
  onBack: () => void;
  onNoteUploaded: () => void;
  onNoteClick: (note: Note) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/heic', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain'];
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const GROUPS: { key: Category; label: string; icon: ReactNode }[] = [
  { key: 'documents', label: 'Uploads & Documents', icon: <FileText size={16} /> },
  { key: 'photos', label: 'Photos', icon: <ImageIcon size={16} /> },
  { key: 'links', label: 'Links', icon: <Link2 size={16} /> },
  { key: 'notes', label: 'In-app Notes', icon: <StickyNote size={16} /> },
];

export default function SourceTree({ classId, notes, loading, loadError, activeCategory, onBack, onNoteUploaded, onNoteClick }: Props) {
  const [openCategory, setOpenCategory] = useState<Category | null>(activeCategory ?? 'documents');
  const [uploading, setUploading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documents = notes.filter((note) => !note.file_type?.startsWith('image') && note.file_type !== 'text/plain');
  const photos = notes.filter((note) => note.file_type?.startsWith('image'));
  const inAppNotes = notes.filter((note) => note.file_type === 'text/plain' || note.file_type === 'text/html');
  const itemsFor = (key: Category) => key === 'documents' ? documents : key === 'photos' ? photos : key === 'notes' ? inAppNotes : [];

  const uploadFile = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtension = ['jpg', 'jpeg', 'png', 'gif', 'heic', 'webp', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'].includes(extension ?? '');
    if (!ALLOWED_TYPES.includes(file.type) && !allowedExtension) { setError('Choose an image, PDF, PowerPoint, Word document, or text file.'); return; }
    if (file.size > MAX_FILE_SIZE) { setError('Files must be smaller than 20MB.'); return; }
    setUploading(true); setError(''); setSuccess('');
    try {
      await uploadNote(classId, file);
      onNoteUploaded();
      setSuccess(`${file.name} was added to your sources.`);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || 'Could not upload this source. Please try again.');
    } finally { setUploading(false); }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void uploadFile(file);
    event.target.value = '';
  };

  return (
    <>
      <section className="source-tree" aria-label="All sources">
        <div className="source-tree-title-row"><button type="button" className="source-tree-back" onClick={onBack}><ArrowLeft size={17} />All Sources</button><div className="source-tree-actions"><button type="button" className="source-tree-action" onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-label="Upload source">{uploading ? <LoaderCircle size={18} className="source-tree-spin" /> : <Upload size={18} />}</button><button type="button" className="source-tree-action" onClick={() => { setError(''); setSuccess(''); setShowEditor(true); }} aria-label="Create note"><Plus size={20} /></button></div></div>
        <input ref={fileInputRef} className="source-tree-file-input" type="file" accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={handleFileChange} disabled={uploading} />
        {(error || loadError) && <p className="source-tree-feedback error" role="alert">{error || loadError}</p>}
        {success && <p className="source-tree-feedback success" role="status">{success}</p>}
        <p className="source-tree-intro">Your class sources, grouped by type.</p>
        {GROUPS.map((group) => {
          const items = itemsFor(group.key); const isOpen = openCategory === group.key;
          return <div key={group.key} className="source-tree-group">
            <button type="button" className="source-tree-group-header" onClick={() => setOpenCategory(isOpen ? null : group.key)} aria-expanded={isOpen}>
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}{group.icon}<span>{group.label}</span>{group.key !== 'links' && <span className="source-tree-count">{items.length}</span>}
            </button>
            {isOpen && <div className="source-tree-items">
              {group.key === 'links' ? <p className="source-tree-empty">Links are coming soon. Add a file or create a note for now.</p> : loading ? <p className="source-tree-empty source-tree-loading" role="status"><LoaderCircle size={15} className="source-tree-spin" />Loading sources…</p> : items.length === 0 ? <p className="source-tree-empty">No {group.label.toLowerCase()} yet.</p> : items.map((note) => <button key={note.id} type="button" className="source-tree-item" onClick={() => { onNoteClick(note); setSuccess(`${note.filename ?? 'Untitled'} is selected for your next question.`); }}><span className="source-tree-item-name">{note.filename ?? 'Untitled'}</span><span className="source-tree-item-date">{new Date(note.created_at).toLocaleDateString()}</span></button>)}
            </div>}
          </div>;
        })}
      </section>
      {showEditor && (
        <RichNoteEditor
          classId={classId}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            setShowEditor(false);
            setOpenCategory('notes');
            setSuccess('Your formatted note was saved to In-app Notes.');
            onNoteUploaded();
          }}
        />
      )}
    </>
  );
}
