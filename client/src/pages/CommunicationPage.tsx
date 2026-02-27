import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { PositiveContactSuggestion, ParentContactRecord } from '../types';

export function CommunicationPage() {
  const [tab, setTab] = useState<'suggestions' | 'history'>('suggestions');
  const [suggestions, setSuggestions] = useState<PositiveContactSuggestion[]>([]);
  const [contacts, setContacts] = useState<ParentContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'suggestions') {
      setLoading(true);
      setError(null);
      api.get<PositiveContactSuggestion[]>('/communication/positive-suggestions')
        .then(setSuggestions)
        .catch((err) => {
          setError('Failed to load suggestions. Please try again.');
          console.error('Error loading suggestions:', err);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      setError(null);
      api.get<ParentContactRecord[]>('/communication/contacts')
        .then(setContacts)
        .catch((err) => {
          setError('Failed to load contact history. Please try again.');
          console.error('Error loading contacts:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [tab]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communication Suite</h1>
        <p className="text-sm text-gray-500">
          Parent-teacher communication that's effortless and data-informed
        </p>
      </div>

      <div className="border-b border-atlas-border">
        <nav className="flex gap-4">
          {([
            ['suggestions', 'Positive Contact Suggestions'],
            ['history', 'Contact History'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-atlas-primary text-atlas-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'suggestions' && (
        <div className="space-y-4">
          {error && (
            <div className="card p-4 bg-red-50 border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No suggestions this week. Check back Monday!</p>
            </div>
          ) : (
            <>
              <div className="card p-4 bg-green-50 border-green-200">
                <p className="text-sm text-green-800">
                  These students had a great week! Send a quick positive email to their parents.
                  Research shows positive parent contact improves student outcomes significantly.
                </p>
              </div>
              {suggestions.map((suggestion) => (
                <div key={suggestion.studentId} className="card">
                  <div className="card-header flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-medium text-green-700">
                        {suggestion.firstName[0]}{suggestion.lastName[0]}
                      </div>
                      <div>
                        <Link
                          to={`/students/${suggestion.studentId}`}
                          className="text-sm font-medium text-gray-900 hover:underline"
                        >
                          {suggestion.firstName} {suggestion.lastName}
                        </Link>
                        <p className="text-xs text-green-600">{suggestion.reason}</p>
                      </div>
                    </div>
                    {suggestion.guardianEmail && (
                      <span className="text-xs text-gray-500">
                        To: {suggestion.guardianName}
                      </span>
                    )}
                  </div>
                  <div className="card-body">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 rounded-lg p-3">
                      {suggestion.draftMessage}
                    </pre>
                    <div className="flex gap-2 mt-3">
                      <button
                        className="btn-primary text-sm"
                        onClick={() => {
                          if (suggestion.guardianEmail) {
                            window.open(
                              `mailto:${suggestion.guardianEmail}?subject=Great Week for ${suggestion.firstName}&body=${encodeURIComponent(suggestion.draftMessage)}`,
                              '_blank'
                            );
                          }
                        }}
                      >
                        Send Email
                      </button>
                      <Link
                        to={`/students/${suggestion.studentId}`}
                        className="btn-secondary text-sm"
                      >
                        View Student
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {error && (
            <div className="card p-4 bg-red-50 border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No parent contacts logged yet.</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <div key={contact.id} className="card p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${contact.sentiment === 'POSITIVE' ? 'green' : contact.sentiment === 'CONCERN' ? 'amber' : 'gray'}`}>
                      {contact.method}
                    </span>
                    <Link
                      to={`/students/${contact.studentId}`}
                      className="text-sm font-medium text-gray-900 hover:underline"
                    >
                      {contact.studentName}
                    </Link>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700">{contact.subject}</p>
                <p className="text-sm text-gray-500 mt-1">{contact.notes}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
