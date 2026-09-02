import { ChangeEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, FileText, Image as ImageIcon, Link2, LoaderCircle, Plus, StickyNote, Upload, X } from 'lucide-react';
import { getOfficePreview, uploadNote } from '../api';
import { SOURCE_INPUT_ACCEPT, validateSourceForSelection } from '../config/sourceFormats';
import { Note, OfficePreview } from '../types';
import RichNoteEditor from './RichNoteEditor';
import './SourceTree.css';

type Category = 'documents' | 'photos' | 'links' | 'notes';

interface Props {
  classId: number;
  notes: Note[];
  loading: boolean;
  loadError: string;
  selectedNoteId?: number;
  activeCategory?: Category;
  onBack: () => void;
  onNoteUploaded: () => void;
  onNoteClick: (note: Note) => void;
}

const GROUPS: { key: Category; label: string; icon: ReactNode }[] = [
  { key: 'documents', label: 'Uploads & Documents', icon: <FileText size={16} /> },
  { key: 'photos', label: 'Photos', icon: <ImageIcon size={16} /> },
  { key: 'links', label: 'Links', icon: <Link2 size={16} /> },
  { key: 'notes', label: 'In-app Notes', icon: <StickyNote size={16} /> },
];

const DOCUMENT_PAGE_CHARACTERS = 3_000;

function officePageHtml(head: string, body: string, kind: OfficePreview['kind'], pageNumber: number) {
  const wrapper = kind === 'slides'
    ? `<div class="presentation-container"><article>${body}</article></div>`
    : `<div class="container"><article><section class="page" data-page-num="${pageNumber}">${body}</section></article></div>`;

  return `<!doctype html><html><head>${head}<style>
    html,body{width:100%;min-height:100%;margin:0;background:#e9e1d2}
    body{padding:20px!important}
    .presentation-container,.container{width:100%!important;max-width:1100px!important;margin:0 auto!important;padding:0!important;background:transparent!important;box-shadow:none!important}
    .slide,.page{width:100%!important;min-height:calc(100vh - 40px)!important;margin:0!important;border-radius:8px!important;box-shadow:none!important;overflow:auto!important}
    @media(max-width:700px){body{padding:8px!important}.slide,.page{min-height:calc(100vh - 16px)!important;padding:28px 24px!important}}
  </style></head><body>${wrapper}</body></html>`;
}

function buildOfficePages(preview: OfficePreview): string[] {
  const parsed = new DOMParser().parseFromString(preview.html, 'text/html');
  parsed.querySelectorAll('script').forEach((script) => script.remove());
  const head = parsed.head.innerHTML;

  if (preview.kind === 'slides') {
    const slides = Array.from(parsed.body.querySelectorAll('section.slide'));
    return slides.map((slide, index) => officePageHtml(head, slide.outerHTML, preview.kind, index + 1));
  }

  const article = parsed.body.querySelector('article');
  const blocks = Array.from(article?.children ?? parsed.body.children);
  const pages: string[][] = [[]];
  let currentCharacters = 0;

  for (const block of blocks) {
    const characters = block.textContent?.trim().length ?? 0;
    const isPageBreak = block.classList.contains('page-break');
    if ((isPageBreak || currentCharacters + characters > DOCUMENT_PAGE_CHARACTERS) && pages[pages.length - 1].length) {
      pages.push([]);
      currentCharacters = 0;
    }
    if (!isPageBreak) {
      pages[pages.length - 1].push(block.outerHTML);
      currentCharacters += characters;
    }
  }

  return pages
    .filter((page) => page.length > 0)
    .map((page, index) => officePageHtml(head, page.join(''), preview.kind, index + 1));
}

function SourcePreview({ note, onClose }: { note: Note; onClose: () => void }) {
  const filename = note.filename ?? 'Untitled';
  const isImage = note.file_type?.startsWith('image/');
  const isPdf = note.file_type === 'application/pdf';
  const isHtml = note.file_type === 'text/html';
  const isOffice = note.file_type === 'application/vnd.ms-powerpoint'
    || note.file_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    || note.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [htmlError, setHtmlError] = useState(false);
  const [officePreview, setOfficePreview] = useState<OfficePreview | null>(null);
  const [officeError, setOfficeError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const officePages = useMemo(() => officePreview ? buildOfficePages(officePreview) : [], [officePreview]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    if (!isHtml) return;
    const controller = new AbortController();
    fetch(note.image_url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Could not load note');
        return response.text();
      })
      .then(setHtmlContent)
      .catch((error) => {
        if (error instanceof Error && error.name !== 'AbortError') setHtmlError(true);
      });
    return () => controller.abort();
  }, [isHtml, note.image_url]);

  useEffect(() => {
    if (!isOffice) return;
    let active = true;
    getOfficePreview(note.id)
      .then((response) => { if (active) setOfficePreview(response.data); })
      .catch(() => { if (active) setOfficeError(true); });
    return () => { active = false; };
  }, [isOffice, note.id]);

  const pageLabel = officePreview?.kind === 'slides' ? 'Slide' : 'Page';

  return (
    <div className="source-preview-backdrop" onClick={onClose}>
      <section className="source-preview" role="dialog" aria-modal="true" aria-labelledby="source-preview-title" onClick={(event) => event.stopPropagation()}>
        <header className="source-preview-header">
          <div>
            <span>Source preview</span>
            <h2 id="source-preview-title">{filename}</h2>
          </div>
          <div className="source-preview-actions">
            <a href={note.image_url} target="_blank" rel="noreferrer" aria-label={`Open ${filename} in a new tab`} title="Open in a new tab"><ExternalLink size={19} /></a>
            <button type="button" onClick={onClose} aria-label="Close preview"><X size={22} /></button>
          </div>
        </header>
        <div className="source-preview-content">
          {isImage ? (
            <img src={note.image_url} alt={filename} />
          ) : isPdf ? (
            <iframe src={note.image_url} title={filename} />
          ) : isHtml && htmlContent ? (
            <iframe srcDoc={htmlContent} title={filename} sandbox="" />
          ) : isHtml && !htmlError ? (
            <div className="source-preview-unavailable"><LoaderCircle size={28} className="source-tree-spin" /><p>Loading note…</p></div>
          ) : isOffice && officePages.length > 0 ? (
            <iframe srcDoc={officePages[currentPage]} title={`${filename}, ${pageLabel} ${currentPage + 1}`} sandbox="" />
          ) : isOffice && !officeError ? (
            <div className="source-preview-unavailable"><LoaderCircle size={28} className="source-tree-spin" /><p>Building preview…</p></div>
          ) : note.extracted_text ? (
            <pre>{note.extracted_text}</pre>
          ) : (
            <div className="source-preview-unavailable">
              <FileText size={42} />
              <p>A browser preview is not available for this file.</p>
              <a href={note.image_url} target="_blank" rel="noreferrer">Open the original file</a>
            </div>
          )}
        </div>
        {isOffice && officePages.length > 0 && (
          <nav className="source-preview-navigation" aria-label={`${pageLabel} navigation`}>
            <button type="button" onClick={() => setCurrentPage((page) => page - 1)} disabled={currentPage === 0}><ChevronLeft size={19} />Previous</button>
            <span>{pageLabel} {currentPage + 1} of {officePages.length}</span>
            <button type="button" onClick={() => setCurrentPage((page) => page + 1)} disabled={currentPage === officePages.length - 1}>Next<ChevronRight size={19} /></button>
          </nav>
        )}
      </section>
    </div>
  );
}

export default function SourceTree({ classId, notes, loading, loadError, selectedNoteId, activeCategory, onBack, onNoteUploaded, onNoteClick }: Props) {
  const [openCategory, setOpenCategory] = useState<Category | null>(activeCategory ?? 'documents');
  const [uploading, setUploading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
  }, []);

  const selectNote = (note: Note) => {
    const isCurrentlySelected = selectedNoteId === note.id;
    onNoteClick(note);
    setSuccess(isCurrentlySelected
      ? `${note.filename ?? 'Untitled'} was unselected. Your next question will search all class sources.`
      : `${note.filename ?? 'Untitled'} is selected for your next question.`);
  };

  const handleNoteClick = (note: Note) => {
    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    selectTimerRef.current = setTimeout(() => selectNote(note), 220);
  };

  const handleNoteDoubleClick = (note: Note) => {
    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    setPreviewNote(note);
  };

  const documents = notes.filter((note) => !note.file_type?.startsWith('image/') && note.file_type !== 'text/html');
  const photos = notes.filter((note) => note.file_type?.startsWith('image/'));
  const inAppNotes = notes.filter((note) => note.file_type === 'text/html');
  const itemsFor = (key: Category) => key === 'documents' ? documents : key === 'photos' ? photos : key === 'notes' ? inAppNotes : [];

  const uploadFile = async (file: File) => {
    const validationError = validateSourceForSelection(file);
    if (validationError) { setError(validationError); return; }
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

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (uploading) return;

    const file = event.dataTransfer.files[0];
    if (file) void uploadFile(file);
  };

  return (
    <>
      <section className="source-tree" aria-label="All sources">
        <div className="source-tree-title-row"><button type="button" className="source-tree-back" onClick={onBack}><ArrowLeft size={17} />All Sources</button><div className="source-tree-actions"><button type="button" className="source-tree-action" onClick={() => fileInputRef.current?.click()} disabled={uploading} aria-label="Upload source">{uploading ? <LoaderCircle size={18} className="source-tree-spin" /> : <Upload size={18} />}</button><button type="button" className="source-tree-action" onClick={() => { setError(''); setSuccess(''); setShowEditor(true); }} aria-label="Create note"><Plus size={20} /></button></div></div>
        <input ref={fileInputRef} className="source-tree-file-input" type="file" accept={SOURCE_INPUT_ACCEPT} onChange={handleFileChange} disabled={uploading} />
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
              {group.key === 'documents' && (
                <div
                  className={`source-tree-dropzone${dragActive ? ' drag-active' : ''}${uploading ? ' uploading' : ''}`}
                  role="button"
                  tabIndex={uploading ? -1 : 0}
                  aria-label="Upload a document"
                  aria-disabled={uploading}
                  onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
                  onKeyDown={(event) => {
                    if (!uploading && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragEnter={(event) => { event.preventDefault(); if (!uploading) setDragActive(true); }}
                  onDragOver={(event) => { event.preventDefault(); }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false);
                  }}
                  onDrop={handleDrop}
                >
                  {uploading ? <LoaderCircle size={22} className="source-tree-spin" /> : <Upload size={22} />}
                  <span>{uploading ? 'Uploading…' : 'Drop a file here or click to browse'}</span>
                  {!uploading && <small>PDF, Word, PowerPoint, TXT, or image · 20MB max</small>}
                </div>
              )}
              {group.key === 'links' ? <p className="source-tree-empty">Links are coming soon. Add a file or create a note for now.</p> : loading ? <p className="source-tree-empty source-tree-loading" role="status"><LoaderCircle size={15} className="source-tree-spin" />Loading sources…</p> : items.length === 0 ? <p className="source-tree-empty">No {group.label.toLowerCase()} yet.</p> : items.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className={`source-tree-item${selectedNoteId === note.id ? ' selected' : ''}`}
                  aria-pressed={selectedNoteId === note.id}
                  onClick={() => handleNoteClick(note)}
                  onDoubleClick={() => handleNoteDoubleClick(note)}
                >
                  <span className="source-tree-item-name">{note.filename ?? 'Untitled'}</span>
                  <span className="source-tree-item-date">{new Date(note.created_at).toLocaleDateString()}</span>
                </button>
              ))}
            </div>}
          </div>;
        })}
      </section>
      {previewNote && <SourcePreview note={previewNote} onClose={() => setPreviewNote(null)} />}
      {showEditor && (
        <RichNoteEditor
          classId={classId}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            setShowEditor(false);
            setOpenCategory('notes');
            setSuccess('Note was saved to In-app Notes.');
            onNoteUploaded();
          }}
        />
      )}
    </>
  );
}
