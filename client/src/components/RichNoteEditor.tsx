import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  LoaderCircle,
  Redo2,
  Save,
  Underline,
  Undo2,
  X,
} from 'lucide-react';
import { uploadNote } from '../api';
import './RichNoteEditor.css';

interface Props {
  classId: number;
  onClose: () => void;
  onSaved: () => void;
}

function safeFilename(value: string) {
  return value
    .trim()
    .split('')
    .filter((character) => character.charCodeAt(0) > 31)
    .join('')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80) || 'Untitled note';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeEditorHtml(value: string) {
  const documentNode = new DOMParser().parseFromString(value, 'text/html');
  documentNode.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach((node) => node.remove());
  documentNode.querySelectorAll('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      if (attribute.name.startsWith('on')) element.removeAttribute(attribute.name);
      if (
        (attribute.name === 'href' || attribute.name === 'src')
        && attribute.value.trim().toLowerCase().startsWith('javascript:')
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  return documentNode.body.innerHTML;
}

export default function RichNoteEditor({ classId, onClose, onSaved }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [title, setTitle] = useState('');
  const [hasContent, setHasContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const rememberSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) selectionRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    editorRef.current?.focus();
    if (!selectionRef.current) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(selectionRef.current);
  };

  const updateContentState = () => {
    setHasContent(Boolean(editorRef.current?.innerText.trim()));
    rememberSelection();
  };

  const runCommand = (command: string, value?: string) => {
    restoreSelection();
    document.execCommand(command, false, value);
    updateContentState();
  };

  const saveNote = async () => {
    const editor = editorRef.current;
    if (!editor?.innerText.trim()) {
      setError('Write something in your note before saving.');
      editor?.focus();
      return;
    }

    setSaving(true);
    setError('');
    try {
      const noteTitle = safeFilename(title);
      const content = sanitizeEditorHtml(editor.innerHTML);
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(noteTitle)}</title></head><body>${content}</body></html>`;
      const file = new File([html], `${noteTitle}.html`, { type: 'text/html' });
      await uploadNote(classId, file);
      onSaved();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || 'Could not save your note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toolbarButton = (
    label: string,
    command: string,
    icon: React.ReactNode,
  ) => (
    <button
      type="button"
      className="rich-note-tool-button"
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => runCommand(command)}
      disabled={saving}
    >
      {icon}
    </button>
  );

  return (
    <div className="rich-note-overlay" role="presentation">
      <section
        className="rich-note-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rich-note-editor-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !saving) onClose();
          if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            void saveNote();
          }
        }}
      >
        <header className="rich-note-header">
          <div>
            <p>In-app note</p>
            <input
              id="rich-note-editor-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Untitled note"
              aria-label="Note title"
              disabled={saving}
            />
          </div>
          <button type="button" className="rich-note-close" onClick={onClose} disabled={saving} aria-label="Close note editor">
            <X size={22} />
          </button>
        </header>

        <div className="rich-note-toolbar" role="toolbar" aria-label="Note formatting">
          <select
            aria-label="Font"
            defaultValue="Source Serif 4"
            onFocus={rememberSelection}
            onChange={(event) => runCommand('fontName', event.target.value)}
            disabled={saving}
          >
            <option value="Source Serif 4">Source Serif</option>
            <option value="Playfair Display">Playfair Display</option>
            <option value="Georgia">Georgia</option>
            <option value="Arial">Arial</option>
            <option value="Courier New">Courier New</option>
          </select>
          <select
            aria-label="Font size"
            defaultValue="3"
            onFocus={rememberSelection}
            onChange={(event) => runCommand('fontSize', event.target.value)}
            disabled={saving}
          >
            <option value="2">Small</option>
            <option value="3">Normal</option>
            <option value="4">Large</option>
            <option value="5">Heading</option>
          </select>
          <span className="rich-note-tool-divider" aria-hidden="true" />
          {toolbarButton('Bold', 'bold', <Bold size={18} />)}
          {toolbarButton('Italic', 'italic', <Italic size={18} />)}
          {toolbarButton('Underline', 'underline', <Underline size={18} />)}
          <span className="rich-note-tool-divider" aria-hidden="true" />
          {toolbarButton('Align left', 'justifyLeft', <AlignLeft size={18} />)}
          {toolbarButton('Align center', 'justifyCenter', <AlignCenter size={18} />)}
          {toolbarButton('Align right', 'justifyRight', <AlignRight size={18} />)}
          <span className="rich-note-tool-divider" aria-hidden="true" />
          {toolbarButton('Bulleted list', 'insertUnorderedList', <List size={18} />)}
          {toolbarButton('Numbered list', 'insertOrderedList', <ListOrdered size={18} />)}
          <span className="rich-note-tool-divider" aria-hidden="true" />
          {toolbarButton('Undo', 'undo', <Undo2 size={18} />)}
          {toolbarButton('Redo', 'redo', <Redo2 size={18} />)}
        </div>

        <div className="rich-note-canvas">
          <div
            ref={editorRef}
            className="rich-note-page"
            contentEditable={!saving}
            role="textbox"
            aria-multiline="true"
            aria-label="Note content"
            data-placeholder="Start writing…"
            onInput={updateContentState}
            onKeyUp={rememberSelection}
            onMouseUp={rememberSelection}
            onBlur={rememberSelection}
            suppressContentEditableWarning
            autoFocus
          />
        </div>

        <footer className="rich-note-footer">
          <div aria-live="polite">
            {error && <p className="rich-note-error" role="alert">{error}</p>}
            {!error && <p>Formatting is saved with this note. Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+S to save.</p>}
          </div>
          <div>
            <button type="button" className="rich-note-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="button" className="rich-note-save" onClick={() => void saveNote()} disabled={!hasContent || saving}>
              {saving ? <><LoaderCircle size={17} className="rich-note-spin" />Saving…</> : <><Save size={17} />Save note</>}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
