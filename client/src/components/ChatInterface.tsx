import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ChatMessage } from '../types';
import { sendChatMessage, generateQuiz } from '../api';
import './ChatInterface.css';

interface Props {
  classId: number;
  selectedNoteId?: number;
}

export default function ChatInterface({ classId, selectedNoteId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    // Show the user's message right away instead of waiting on the response.
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
      // Drop a message in the thread too, not just the error banner, so the
      // failure is visible in context.
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

  const handleClear = () => {
    if (confirm('Clear chat history?')) {
      setMessages([]);
      setError('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div>
          <h3>AI Assistant</h3>
          <p>Ask questions about your notes</p>
        </div>
        <div className="chat-actions">
          <button
            className="btn-secondary"
            onClick={handleQuizRequest}
            disabled={sending}
          >
            Quiz Me
          </button>
          <button
            className="btn-secondary"
            onClick={handleClear}
            disabled={messages.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">Start</div>
            <h3>Start a Conversation</h3>
            <p>Ask me to explain concepts, summarize notes, or quiz you</p>
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
                <div className="message-avatar">
                  {msg.role === 'user' ? 'You' : 'AI'}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}

            {sending && (
              <div className="message message-ai">
                <div className="message-avatar">AI</div>
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
          placeholder="Ask about your notes..."
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
