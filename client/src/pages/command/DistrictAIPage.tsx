import { useState } from 'react';
import { api } from '../../services/api';
import { DistrictAIResponse } from '../../types/command';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function DistrictAIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const result = await api.post<DistrictAIResponse>('/command/ai/chat', {
        message: userMessage,
        conversationId,
      });
      setConversationId(result.conversationId);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Failed to get response'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQueries = [
    'Compare attendance rates across all elementary schools',
    'Which schools have the highest discipline disproportionality?',
    'Draft a board presentation on MTSS effectiveness this year',
    'Project graduation rates based on current chronic absence trends',
    'What would happen if we added a counselor at our highest-need school?',
    'Summarize equity metrics across all schools for the board',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">District AI Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cross-school analysis, strategic insights, and board communication drafting
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow p-4 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">&#x1F4CA;</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">District Intelligence at Your Fingertips</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Ask questions about any school, compare metrics across the district, model scenarios, or draft board communications.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
              {suggestedQueries.map((query) => (
                <button
                  key={query}
                  onClick={() => {
                    setInput(query);
                  }}
                  className="text-left text-xs px-3 py-2 bg-gray-50 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border border-gray-200"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about district data, compare schools, model scenarios..."
          rows={2}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 self-end"
        >
          Send
        </button>
      </div>
    </div>
  );
}
