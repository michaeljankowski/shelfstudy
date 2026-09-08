import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { BookmarkPlus, Copy, ThumbsDown, ThumbsUp } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendChatMessage, generateQuiz, uploadNote } from '../api';
import './ChatInterface.css';

interface Props {
  classId: number;
  selectedNoteId?: number;
  command: 'connect' | 'quiz' | 'summarize' | 'explain' | null;
  onCommandHandled: () => void;
  onNoteSaved: () => void;
  notice: string | null;
}

export default function ChatInterface({ classId, selectedNoteId, command, onCommandHandled, onNoteSaved, notice }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);
    setError('');

    try {
      const response = await sendChatMessage(classId, input, selectedNoteId);
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || 'Failed to get AI response');
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleQuizRequest = async () => {
    setSending(true);
    setError('');

    const userMessage: ChatMessage = {
      role: 'user',
      content: 'Generate quiz questions for me',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await generateQuiz(classId);
      const quizMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.questions.join('\n\n'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, quizMessage]);
    } catch {
      setError('Failed to generate quiz');
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Could not generate quiz. Make sure you have notes uploaded.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleExplainRequest = async () => {
    const prompt = selectedNoteId
      ? 'Explain the main concepts in my notes to a beginner student in the class you are in, using examples and analogies where helpful.'
      : 'Explain the main concepts in my uploaded sources in an organized way listing sources(e.g. IMG_1234 explains ....), using examples and analogies where helpful.';
    await sendPrompt(prompt);
  };

  const handleSummarizeRequest = async () => {
    const prompt = selectedNoteId
      ? 'Summarize only the selected source as concise study bullets. Include its key facts, definitions, conclusions, and any important formulas that are actually present. Preserve the source terminology and do not add outside information.'
      : 'Summarize the most important material across my class sources as concise study bullets grouped by topic. Prioritize repeated concepts, headings, key definitions, important formulas, and conclusions. Name the supporting source files for each topic and do not add outside information.';
    await sendPrompt(prompt);
  };

  const handleConnectConceptsRequest = async () => {
    const prompt = selectedNoteId
      ? 'Connect the important concepts in the selected source. Start with the main idea, then list the strongest relationships as “concept A → relationship → concept B.” Use only prerequisite, part-of, cause-and-effect, comparison, or application relationships that the source supports. Give a one-sentence explanation and supporting wording from the source for every connection. Do not add outside information or invent connections.'
      : 'Connect the important concepts across my relevant class sources. Start with the main idea, then list the strongest relationships as “concept A → relationship → concept B.” Use only prerequisite, part-of, cause-and-effect, comparison, or application relationships that the sources support. Give a one-sentence explanation, supporting wording, and the source filename for every connection. Do not add outside information or invent connections.';
    await sendPrompt(prompt);
  };

  const sendPrompt = async (prompt: string) => {
    if (sending) return;
    setSending(true);
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: prompt, timestamp: new Date() }]);
    try {
      const response = await sendChatMessage(classId, prompt, selectedNoteId);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.data.reply, timestamp: new Date() }]);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || 'Failed to get AI response');
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() }]);
    } finally { setSending(false); }
  };

  useEffect(() => {
    if (!command) return;
    if (command === 'quiz') handleQuizRequest();
    if (command === 'summarize') handleSummarizeRequest();
    if (command === 'explain') handleExplainRequest();
    if (command === 'connect') handleConnectConceptsRequest();
    onCommandHandled();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command]);

  const saveToNotes = async (content: string, index: number) => {
    if (savedMessage !== null) return;
    setSavedMessage(index);
    try {
      const text = `ShelfStudy assistant response\n\n${content}`;
      const file = new File([text], `assistant-response-${new Date().toISOString().slice(0, 10)}.txt`, { type: 'text/plain' });
      await uploadNote(classId, file);
      onNoteSaved();
    } catch {
      setError('Could not save this response to Recent Sources.');
    } finally { setSavedMessage(null); }
  };

  const handleClear = () => {
    if (confirm('Clear chat history?')) {
      setMessages([]);
      setError('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header"><div><h3>Study companion</h3><p>Ask questions grounded in your uploaded sources.</p></div><button className="chat-clear" onClick={handleClear} disabled={messages.length === 0}>Clear chat</button></div>

      {notice && <div className="workspace-coming-soon" role="status"><strong>{notice}</strong><span>This workspace is ready for it, but the feature is still coming soon.</span></div>}

      {error && <div className="error">{error}</div>}

      <div className="chat-messages">
        {messages.length === 0 ? (
            <div className="empty-state chat-empty-state">
            <h3>Ready when you are</h3>
            <p>Ask about your sources, create a summary, or take a practice quiz.</p>
            <div className="example-prompts">
              <button onClick={() => setInput('Explain the main concepts in my notes')}>
                "Explain the main concepts"
              </button>
              <button onClick={() => setInput('What are the key points I should remember?')}>
                "What are the key points?"
              </button>
              <button onClick={() => setInput('Summarize my notes')}>
                "Summarize my notes"
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`message ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}
              >
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  {msg.role === 'assistant' && <div className="message-tools"><button type="button" aria-label="Save response to notes" title="Save to Notes" onClick={() => saveToNotes(msg.content, idx)} disabled={savedMessage === idx}>{savedMessage === idx ? 'Saving…' : <BookmarkPlus size={16} />}</button><button type="button" aria-label="Copy response" onClick={() => navigator.clipboard?.writeText(msg.content)}><Copy size={16} /></button><button type="button" aria-label="Helpful response" title="Feedback is coming soon"><ThumbsUp size={16} /></button><button type="button" aria-label="Not helpful" title="Feedback is coming soon"><ThumbsDown size={16} /></button></div>}
                </div>
              </div>
            ))}

            {sending && (
              <div className="message message-ai">
                <div className="message-content">
                  <div className="message-text typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Start typing…"
          disabled={sending}
          className="chat-input"
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!input.trim() || sending}
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
