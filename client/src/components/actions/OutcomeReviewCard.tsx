import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ActionItemView, OutcomeStatus } from '../../types';

interface Props {
  item: ActionItemView;
  onReviewed: (item: ActionItemView) => void;
}

const TRIGGER_LABELS: Record<string, string> = {
  ABSENT: 'Absence',
  GRADE_ALERT: 'Grade Drop',
  MISSING_WORK: 'Missing Work',
  INTERVENTION: 'Intervention',
  ACCOMMODATION: 'Accommodation',
  NEW_STUDENT: 'New Student',
  RELATIONSHIP: 'Relationship',
};

const OUTCOME_OPTIONS: { value: OutcomeStatus; label: string; color: string }[] = [
  { value: 'IMPROVED', label: 'Improved', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'NO_CHANGE', label: 'No Change', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { value: 'WORSENED', label: 'Worsened', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'NOT_APPLICABLE', label: 'N/A', color: 'bg-gray-50 text-gray-500 border-gray-200' },
];

export function OutcomeReviewCard({ item, onReviewed }: Props) {
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOutcome || selectedOutcome === 'PENDING') return;
    setSaving(true);
    setError('');
    try {
      const updated = await api.put<ActionItemView>(`/action-items/${item.id}/review`, {
        outcomeStatus: selectedOutcome,
        outcomeNotes: notes,
      });
      onReviewed(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit review. Please try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  const daysSinceAction = item.completedAt
    ? Math.floor((Date.now() - new Date(item.completedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="card border-l-4 border-l-amber-400">
      <div className="card-body">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-amber text-xs">{TRIGGER_LABELS[item.triggerType] || item.triggerType}</span>
              <span className="text-xs text-gray-400">{daysSinceAction} days ago</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{item.title}</p>
            <Link to={`/students/${item.studentId}`} className="text-xs text-atlas-primary hover:underline">
              {item.firstName} {item.lastName}
            </Link>
          </div>
        </div>

        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <span className="font-medium">Action taken:</span> {item.actionTaken}
          {item.completionNotes && <span className="block mt-1 text-gray-500">"{item.completionNotes}"</span>}
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-700">Did this help?</p>
          <div className="flex gap-2 flex-wrap">
            {OUTCOME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedOutcome(opt.value)}
                className={`text-xs px-3 py-1.5 rounded border transition-all ${
                  selectedOutcome === opt.value
                    ? `${opt.color} ring-2 ring-offset-1 ring-blue-400`
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="What happened? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1.5"
          />
          <button
            type="submit"
            disabled={saving || !selectedOutcome}
            className="text-xs bg-amber-500 text-white px-4 py-1.5 rounded hover:bg-amber-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
