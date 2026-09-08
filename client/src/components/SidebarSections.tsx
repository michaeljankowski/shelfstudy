import { ChevronRight, Plus, BrainCircuit, FileText, Image as ImageIcon, MessageCircle, FileText as SummaryIcon, Layers3, Highlighter, BookOpenCheck, Calculator, ListTree, ListTodo, ClipboardList, Timer, CalendarDays, BellRing } from 'lucide-react';
import { Note } from '../types';
import './SidebarSections.css';

type Category = 'documents' | 'photos' | 'links' | 'notes';

interface Props {
  notes: Note[];
  onOpenSourceTree: (category?: Category) => void;
  onChat: () => void;
  onQuiz: () => void;
  onSummarize: () => void;
  onExtractDefinitions: () => void;
  onExtractFormulas: () => void;
  onFlashcards: () => void;
  onComingSoon: (tool: string) => void;
}

const AI_TOOLS = [{ label: 'Explain this', icon: MessageCircle }, { label: 'Summarize', icon: SummaryIcon }, { label: 'Study Guide', icon: BookOpenCheck }, { label: 'Flash Cards', icon: Layers3 }, { label: 'Quiz Me', icon: BrainCircuit }, { label: 'Identify Weak Areas', icon: BrainCircuit }];
const NOTE_TOOLS = [{ label: 'Save to Notes', icon: BellRing }, { label: 'Highlight Important', icon: Highlighter }, { label: 'Extract Definitions', icon: BookOpenCheck }, { label: 'Extract Formulas', icon: Calculator }, { label: 'Create Outline', icon: ListTree }];
const PRODUCTIVITY = [{ label: 'To-Do List', icon: ListTodo }, { label: 'Assignments', icon: ClipboardList }, { label: 'Study Timer', icon: Timer }, { label: 'Calendar', icon: CalendarDays }];
const AVAILABLE_NOTE_TOOLS = new Set(['Extract Definitions', 'Extract Formulas']);

export default function SidebarSections({ notes, onOpenSourceTree, onChat, onQuiz, onSummarize, onExtractDefinitions, onExtractFormulas, onFlashcards, onComingSoon }: Props) {
  const recent = notes.slice(0, 4);

  const handleNoteTool = (item: string) => {
    if (item === 'Extract Definitions') return onExtractDefinitions();
    if (item === 'Extract Formulas') return onExtractFormulas();
    return onComingSoon(item);
  };

  return (
    <div className="sidebar-sections">
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <h4>Recent Sources</h4>
          <button
            type="button"
            className="sidebar-section-add"
            onClick={() => onOpenSourceTree('documents')}
            aria-label="Add source"
          >
            <Plus size={16} />
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="sidebar-section-empty">No sources yet.</p>
        ) : (
          <ul className="sidebar-recent-list">
            {recent.map((note) => (
              <li key={note.id}>
                {note.file_type?.startsWith('image') ? <ImageIcon size={14} /> : <FileText size={14} />}
                <span>{note.filename ?? 'Untitled'}</span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="sidebar-section-viewall" onClick={() => onOpenSourceTree()}>
          View all sources
          <ChevronRight size={14} />
        </button>
      </div>

      <ToolGroup title="AI Tools" items={AI_TOOLS} onAction={(item) => item === 'Explain this' ? onChat() : item === 'Quiz Me' ? onQuiz() : item === 'Summarize' ? onSummarize() : item === 'Flash Cards' ? onFlashcards() : onComingSoon(item)} />
      <ToolGroup title="Note Tools" items={NOTE_TOOLS} onAction={handleNoteTool} availableItems={AVAILABLE_NOTE_TOOLS} />
      <ToolGroup title="Productivity" items={PRODUCTIVITY} onAction={onComingSoon} />
    </div>
  );
}

function ToolGroup({ title, items, onAction, availableItems }: { title: string; items: { label: string; icon: typeof BrainCircuit }[]; onAction: (item: string) => void; availableItems?: Set<string> }) {
  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header">
        <h4>{title}</h4>
      </div>
      <ul className="sidebar-inert-list">
        {items.map(({ label, icon: Icon }) => (
          <li key={label}>
            <button type="button" onClick={() => onAction(label)} title={availableItems?.has(label) || label === 'Explain this' || label === 'Quiz Me' || label === 'Summarize' || label === 'Flash Cards' ? undefined : `${label} is coming soon`}>
              <Icon size={16} />
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
