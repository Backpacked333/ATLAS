import { useState } from 'react';
import { api } from '../../services/api';

interface Props {
  studentId?: string;
  studentName?: string;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'What strategies might help this student?',
  'Draft a parent email about missing work',
  'Generate a report card comment',
  'What\'s this student\'s grade trend?',
];

/**
 * AI Assistant Panel
 * FERPA-constrained: can only access data the teacher is authorized to see.
 * Response target: <8s for simple queries, <15s for generated content.
 */
export function AIAssistantPanel({ studentId, studentName, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  async function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await api.post<{ response: string; conversationId: string }>('/ai/chat', {
        message: text.trim(),
        studentId,
        conversationId,
      });

      setConversationId(result.conversationId);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="card flex flex-col h-[500px]">
      <div className="card-header flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">AI Assistant</h3>
          {studentName && (
            <p className="text-xs text-gray-500">Context: {studentName}</p>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          &times;
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center py-4">
              Ask me about student performance, strategies, or help drafting communications.
            </p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="block w-full text-left text-sm px-3 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-atlas-primary text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-atlas-border p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="input flex-1"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary px-4"
          >
            Send
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-1">
          AI assistant operates under FERPA constraints. It can only access your students' data.
        </p>
      </div>
    </div>
  );
}
