import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { BookmarkPlus, Copy, ThumbsDown, ThumbsUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { ChatMessage } from '../types';
import { sendChatMessage, generateQuiz, uploadNote } from '../api';
import 'katex/dist/katex.min.css';
import './ChatInterface.css';

interface Props {
  classId: number;
  selectedNoteId?: number;
  command: 'definitions' | 'formulas' | 'quiz' | 'summarize' | null;
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

  const handleSummarizeRequest = async () => {
    const prompt = 'Summarize my notes into the most important ideas, organized as concise study bullets.';
    await sendPrompt(prompt);
  };

  const handleExtractDefinitionsRequest = async () => {
    const prompt = selectedNoteId
      ? 'Extract only the important terms and definitions from the selected source. Return concise Markdown bullets in the format **Term** — definition. Include only definitions or explanations supported by the source. Do not add outside knowledge, invent definitions, or include terms that the source does not explain.'
      : 'Extract the important terms and definitions from my relevant class sources. Return concise Markdown bullets in the format **Term** — definition. Include the supporting source filename after each definition. Combine duplicate definitions only when the sources agree. Do not add outside knowledge or invent definitions.';
    await sendPrompt(prompt, 'Extract definitions from my study sources.');
  };

  const handleExtractFormulasRequest = async () => {
    const prompt = selectedNoteId
      ? 'Extract only the formulas, equations, identities, and calculation rules explicitly present in the selected source. For each item, give a short label, put the expression on its own line using $$...$$ LaTeX delimiters, and explain the variables only when the source explains them. Use $...$ for inline math. Do not use \\( ... \\) or \\[ ... \\], do not derive new formulas, and do not add outside information.'
      : 'Extract the formulas, equations, identities, and calculation rules from my relevant class sources. For each item, give a short label, put the expression on its own line using $$...$$ LaTeX delimiters, explain the variables only when the sources explain them, and name the supporting source file. Use $...$ for inline math. Do not use \\( ... \\) or \\[ ... \\], do not derive new formulas, and do not add outside information.';
    await sendPrompt(prompt, 'Extract formulas from my study sources.');
  };

  const sendPrompt = async (prompt: string, displayMessage = prompt) => {
    if (sending) return;
    setSending(true);
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: displayMessage, timestamp: new Date() }]);
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
    if (command === 'definitions') handleExtractDefinitionsRequest();
    if (command === 'formulas') handleExtractFormulasRequest();
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
                  <div className="message-text">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { throwOnError: false }]]}>
                        {normalizeMathDelimiters(msg.content)}
                      </ReactMarkdown>
                    ) : msg.content}
                  </div>
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

function normalizeMathDelimiters(content: string) {
  return content
    .replace(/\\\\\[([\s\S]*?)\\\\\]/g, (_, expression: string) => `$$\n${expression.trim()}\n$$`)
    .replace(/\\\\\(([\s\S]*?)\\\\\)/g, (_, expression: string) => `$${expression.trim()}$`);
}
