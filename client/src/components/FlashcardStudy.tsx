import { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, ChevronLeft, ChevronRight, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react';
import { generateFlashcards } from '../api';
import { Flashcard } from '../types';
import './FlashcardStudy.css';

interface Props {
  classId: number;
  selectedNoteId?: number;
  onClose: () => void;
}

const pendingRequests = new Map<string, Promise<Flashcard[]>>();

interface GenerationRequest {
  id: number;
  focus: string;
  numCards: number;
  excludeFronts: string[];
}

export default function FlashcardStudy({ classId, selectedNoteId, onClose }: Props) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focus, setFocus] = useState('');
  const [numCards, setNumCards] = useState(5);
  const [generationRequest, setGenerationRequest] = useState<GenerationRequest | null>(null);

  useEffect(() => {
    if (!generationRequest) return;
    const config = generationRequest;
    let active = true;

    async function loadCards() {
      setLoading(true);
      setError('');
      setCards([]);
      setCurrentIndex(0);
      setFlipped(false);

      try {
        const requestKey = `${classId}:${selectedNoteId ?? 'all'}:${config.id}`;
        let pendingRequest = pendingRequests.get(requestKey);

        if (!pendingRequest) {
          pendingRequest = generateFlashcards({
            classId,
            noteId: selectedNoteId,
            numCards: config.numCards,
            focus: config.focus || undefined,
            excludeFronts: config.excludeFronts,
          })
            .then((response) => response.data.cards)
            .finally(() => pendingRequests.delete(requestKey));
          pendingRequests.set(requestKey, pendingRequest);
        }

        const generatedCards = await pendingRequest;
        if (active) setCards(generatedCards);
      } catch (requestError) {
        if (!active) return;
        const message = axios.isAxiosError(requestError) ? requestError.response?.data?.error : undefined;
        setError(message || 'Could not generate flashcards from these sources.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCards();
    return () => { active = false; };
  }, [classId, selectedNoteId, generationRequest]);

  const currentCard = cards[currentIndex];

  const moveTo = (nextIndex: number) => {
    setCurrentIndex(nextIndex);
    setFlipped(false);
  };

  const startGeneration = (excludeCurrentCards: boolean) => {
    setGenerationRequest((previous) => ({
      id: (previous?.id ?? 0) + 1,
      focus: focus.trim(),
      numCards,
      excludeFronts: excludeCurrentCards ? cards.map((card) => card.front) : [],
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    startGeneration(false);
  };

  return (
    <section className="flashcard-study" aria-labelledby="flashcard-study-title">
      <header className="flashcard-study-header">
        <button type="button" className="flashcard-study-back" onClick={onClose}>
          <ArrowLeft size={18} />
          Back to chat
        </button>
        <div>
          <p>AI study tool</p>
          <h2 id="flashcard-study-title">Flash Cards</h2>
        </div>
        <button type="button" className="flashcard-study-regenerate" onClick={() => startGeneration(true)} disabled={loading || cards.length === 0}>
          <RefreshCw size={17} />
          Regenerate
        </button>
      </header>

      <div className="flashcard-study-body">
        <form className="flashcard-config" onSubmit={handleSubmit}>
          <label className="flashcard-config-focus">
            <span>Tell the AI what to focus on</span>
            <input
              type="text"
              value={focus}
              maxLength={500}
              onChange={(event) => setFocus(event.target.value)}
              placeholder="Example: continuity, definitions, and common mistakes"
              disabled={loading}
            />
          </label>
          <label className="flashcard-config-count">
            <span>Cards</span>
            <input
              type="number"
              min={1}
              max={20}
              value={numCards}
              onChange={(event) => setNumCards(Math.min(20, Math.max(1, Number(event.target.value))))}
              disabled={loading}
            />
          </label>
          <button type="submit" disabled={loading}>
            <Sparkles size={17} />
            {cards.length ? 'Generate new set' : 'Generate cards'}
          </button>
        </form>

        {!generationRequest && (
          <div className="flashcard-study-state">
            <h3>Build a study set</h3>
            <p>Choose how many cards you want and tell the AI which ideas matter most.</p>
          </div>
        )}

        {loading && (
          <div className="flashcard-study-state" role="status">
            <LoaderCircle className="flashcard-study-spinner" size={28} />
            <h3>Creating your cards</h3>
            <p>Reading your source and finding the most useful concepts…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flashcard-study-state" role="alert">
            <h3>Flashcards could not be created</h3>
            <p>{error}</p>
            <button type="button" onClick={() => setGenerationRequest((previous) => previous ? { ...previous, id: previous.id + 1 } : null)}>Try again</button>
          </div>
        )}

        {!loading && !error && currentCard && (
          <>
            <div className="flashcard-study-progress">
              <span>Card {currentIndex + 1} of {cards.length}</span>
              <div className="flashcard-study-progress-track" aria-hidden="true">
                <span style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
              </div>
            </div>

            <button
              type="button"
              className={`flashcard${flipped ? ' flipped' : ''}`}
              aria-pressed={flipped}
              onClick={() => setFlipped((value) => !value)}
            >
              <span className="flashcard-side-label">{flipped ? 'Answer' : 'Question'}</span>
              <span className="flashcard-content">{flipped ? currentCard.back : currentCard.front}</span>
              <span className="flashcard-hint">Click or press Space to {flipped ? 'see the question' : 'reveal the answer'}</span>
            </button>

            <nav className="flashcard-study-navigation" aria-label="Flashcard navigation">
              <button type="button" onClick={() => moveTo(currentIndex - 1)} disabled={currentIndex === 0}>
                <ChevronLeft size={20} />
                Previous
              </button>
              <button type="button" onClick={() => moveTo(currentIndex + 1)} disabled={currentIndex === cards.length - 1}>
                Next
                <ChevronRight size={20} />
              </button>
            </nav>
          </>
        )}
      </div>
    </section>
  );
}
