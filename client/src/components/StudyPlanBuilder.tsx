import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FileText, LoaderCircle, Pencil, Sparkles, Upload, X } from 'lucide-react';
import { generateStudyPlanSuggestion, uploadNote } from '../api';
import { SOURCE_INPUT_ACCEPT, validateSourceForSelection } from '../config/sourceFormats';
import type { Note, StudyPlanContext } from '../types';
import './StudyPlanBuilder.css';

export type StudyPlanDraft = StudyPlanContext;

interface BuilderProps {
  classId: number;
  className: string;
  notes: Note[];
  initialDraft?: StudyPlanDraft | null;
  onClose: () => void;
  onNoteUploaded: () => void;
  onStartPlan: (draft: StudyPlanDraft) => void;
  onSavePlan?: (draft: StudyPlanDraft) => void;
}

function starterOutline(className: string) {
  return `# ${className} Study Plan

## Session 1 — Core concepts
- Add the concepts you want to understand
- Add the notes or examples you want to review

## Session 2 — Guided practice
- Add practice questions or worked examples
- Record anything that still feels unclear

## Session 3 — Self-check
- Test yourself without looking at the notes
- Return to concepts that need another pass`;
}

export default function StudyPlanBuilder({
  classId,
  className,
  notes,
  initialDraft,
  onClose,
  onNoteUploaded,
  onStartPlan,
  onSavePlan,
}: BuilderProps) {
  const instructionsRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [instructions, setInstructions] = useState(initialDraft?.instructions ?? '');
  const [outline, setOutline] = useState(initialDraft?.outline ?? '');
  const [guideNoteId, setGuideNoteId] = useState<number | undefined>(initialDraft?.guideNoteId);
  const [guideName, setGuideName] = useState(initialDraft?.guideName);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    instructionsRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const selectGuide = (value: string) => {
    if (!value) {
      setGuideNoteId(undefined);
      setGuideName(undefined);
      return;
    }

    const noteId = Number(value);
    const note = notes.find((item) => item.id === noteId);
    setGuideNoteId(noteId);
    setGuideName(note?.filename ?? 'Selected source');
  };

  const uploadGuide = async (file: File) => {
    const validationError = validateSourceForSelection(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError('');
    try {
      const response = await uploadNote(classId, file);
      setGuideNoteId(response.data.id);
      setGuideName(response.data.filename ?? file.name);
      onNoteUploaded();
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || 'Could not upload this study guide.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const generateSuggestion = async () => {
    if (outline.trim() && !window.confirm('Replace your current outline with a new AI suggestion?')) return;

    const instructionText = instructions.trim()
      ? `The student added these optional instructions: ${instructions.trim()}`
      : 'The student did not provide extra instructions. Infer the most useful progression from the supplied class material.';
    const sourceText = guideNoteId
      ? 'Use the selected study guide as the source of truth for what the plan should cover.'
      : 'Use the most relevant notes from this class to decide what the plan should cover.';
    const prompt = `Create an editable, source-grounded study plan for ${className}. ${sourceText} ${instructionText}

Return Markdown only. Begin with a clear title, then organize the plan into numbered study sessions. Each session needs a descriptive heading and a short checklist of concrete learning objectives or practice activities. Do not assign dates, durations, or daily schedules. Do not add topics that are unsupported by the supplied material. If the sources are too limited to build a useful plan, say what is missing.`;

    setGenerating(true);
    setError('');
    try {
      const response = await generateStudyPlanSuggestion(classId, prompt, guideNoteId);
      setOutline(response.data.reply.trim());
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || 'Could not generate a suggested outline.');
    } finally {
      setGenerating(false);
    }
  };

  const savePlan = () => {
    if (!outline.trim()) {
      setError('Write an outline or generate a suggestion before starting the plan.');
      return;
    }

    const draft = {
      instructions: instructions.trim(),
      outline: outline.trim(),
      guideNoteId,
      guideName,
    };
    if (onSavePlan) onSavePlan(draft);
    else onStartPlan(draft);
  };

  return (
    <div className="study-plan-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !generating && !uploading) onClose();
    }}>
      <section
        className="study-plan-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-plan-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !generating && !uploading) onClose();
        }}
      >
        <header className="study-plan-header">
          <div>
            <p>Class study plan</p>
            <h2 id="study-plan-title">Build a plan for {className}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={generating || uploading} aria-label="Close study plan builder">
            <X size={22} />
          </button>
        </header>

        <div className="study-plan-body">
          <section className="study-plan-source-card" aria-labelledby="study-plan-guide-heading">
            <div>
              <span className="study-plan-step">1</span>
              <div>
                <h3 id="study-plan-guide-heading">Add a study guide <span>Optional</span></h3>
                <p>Choose an existing source or upload a guide. Without one, ShelfStudy searches this class’s notes.</p>
              </div>
            </div>

            <div className="study-plan-guide-controls">
              <label htmlFor="study-plan-guide">Existing class source</label>
              <select id="study-plan-guide" value={guideNoteId ?? ''} onChange={(event) => selectGuide(event.target.value)} disabled={uploading || generating}>
                <option value="">Use class notes</option>
                {notes.map((note) => (
                  <option key={note.id} value={note.id}>{note.filename ?? `Source ${note.id}`}</option>
                ))}
              </select>

              <span aria-hidden="true">or</span>

              <input
                ref={fileInputRef}
                className="study-plan-file-input"
                id="study-plan-guide-upload"
                type="file"
                accept={SOURCE_INPUT_ACCEPT}
                aria-hidden="true"
                tabIndex={-1}
                disabled={uploading || generating}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadGuide(file);
                }}
              />
              <button type="button" className="study-plan-upload-button" onClick={() => fileInputRef.current?.click()} disabled={uploading || generating}>
                {uploading ? <LoaderCircle className="study-plan-spinner" size={18} /> : <Upload size={18} />}
                {uploading ? 'Uploading…' : 'Upload study guide'}
              </button>
            </div>

            {guideName && <p className="study-plan-selected-guide"><FileText size={16} /> Using {guideName}</p>}
          </section>

          <section className="study-plan-field-group" aria-labelledby="study-plan-instructions-heading">
            <div className="study-plan-field-heading">
              <span className="study-plan-step">2</span>
              <div>
                <label id="study-plan-instructions-heading" htmlFor="study-plan-instructions">Add instructions <span>Optional</span></label>
                <p>Tell ShelfStudy what the exam covers, which concepts matter, or what you want to focus on.</p>
              </div>
            </div>
            <input
              ref={instructionsRef}
              id="study-plan-instructions"
              type="text"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Example: Focus on trig limits, tangent lines, and common mistakes"
              disabled={generating}
            />
          </section>

          <section className="study-plan-field-group study-plan-outline-group" aria-labelledby="study-plan-outline-heading">
            <div className="study-plan-field-heading">
              <span className="study-plan-step">3</span>
              <div>
                <label id="study-plan-outline-heading" htmlFor="study-plan-outline">Shape your study outline</label>
                <p>Write your own plan, start from a template, or generate a recommendation and edit it freely.</p>
              </div>
            </div>

            <div className="study-plan-outline-actions">
              <button type="button" onClick={() => {
                if (!outline.trim() || window.confirm('Replace your current outline with the starter template?')) {
                  setOutline(starterOutline(className));
                }
              }} disabled={generating}>
                <Pencil size={17} /> Use starter template
              </button>
              <button type="button" className="study-plan-generate-button" onClick={() => void generateSuggestion()} disabled={generating || uploading || notes.length === 0}>
                {generating ? <LoaderCircle className="study-plan-spinner" size={18} /> : <Sparkles size={18} />}
                {generating ? 'Generating…' : 'Generate suggested outline'}
              </button>
            </div>

            {notes.length === 0 && <p className="study-plan-inline-note">Upload at least one class source before generating a recommendation. You can still write your own outline.</p>}

            <textarea
              id="study-plan-outline"
              value={outline}
              onChange={(event) => setOutline(event.target.value)}
              placeholder={`# ${className} Study Plan\n\n## Session 1 — Start with...`}
              aria-describedby={error ? 'study-plan-error' : undefined}
              disabled={generating}
            />
          </section>

          {error && <p id="study-plan-error" className="study-plan-error" role="alert">{error}</p>}
        </div>

        <footer className="study-plan-footer">
          <p>Your outline remains editable after you start the plan.</p>
          <div>
            <button type="button" className="study-plan-cancel" onClick={onClose} disabled={generating || uploading}>Cancel</button>
            <button type="button" className="study-plan-start" onClick={savePlan} disabled={generating || uploading || !outline.trim()}>{onSavePlan ? 'Save plan' : 'Save & start plan'}</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
