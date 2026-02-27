import { useState } from 'react';
import { api } from '../../services/api';
import { ActionTrigger, ActionItemView } from '../../types';

interface ActionSuggestion {
  studentId: string;
  triggerType: ActionTrigger;
  triggerRef?: string;
  title: string;
  suggestedAction: string;
  actionOptions: { value: string; label: string }[];
}

interface Props {
  suggestion: ActionSuggestion;
  onCreated?: (item: ActionItemView) => void;
}

/**
 * Inline action button that appears on briefing cards.
 * 1-click to create the action item, then a quick form to log what was done.
 */
export function ActionButton({ suggestion, onCreated }: Props) {
  const [state, setState] = useState<'idle' | 'created' | 'completing' | 'done'>('idle');
  const [actionItem, setActionItem] = useState<ActionItemView | null>(null);
  const [actionTaken, setActionTaken] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    setError(null);
    try {
      const item = await api.post<ActionItemView>('/action-items', {
        studentId: suggestion.studentId,
        triggerType: suggestion.triggerType,
        triggerRef: suggestion.triggerRef,
        title: suggestion.title,
        suggestedAction: suggestion.suggestedAction,
      });
      setActionItem(item);
      setState('created');
      onCreated?.(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create action item. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!actionItem || !actionTaken) return;
    setSaving(true);
    setError(null);
    try {
      await api.put(`/action-items/${actionItem.id}/complete`, {
        actionTaken,
        completionNotes: notes,
      });
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete action item. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (state === 'done') {
    return (
      <div className="mt-2 px-2 py-1.5 bg-green-50 rounded text-xs text-green-700 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <span>&#10003;</span> Action logged — follow-up review in 3 days
      </div>
    );
  }

  if (state === 'created' || state === 'completing') {
    return (
      <form onSubmit={handleComplete} onClick={(e) => e.stopPropagation()} className="mt-2 p-2 bg-blue-50 rounded space-y-2">
        {error && (
          <div className="px-2 py-1.5 bg-red-50 rounded text-xs text-red-700 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </div>
        )}
        <p className="text-xs font-medium text-blue-800">{suggestion.suggestedAction}</p>
        <select
          value={actionTaken}
          onChange={(e) => setActionTaken(e.target.value)}
          className="w-full text-xs border border-blue-200 rounded px-2 py-1 bg-white"
          required
        >
          <option value="">What did you do?</option>
          {suggestion.actionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Quick note (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full text-xs border border-blue-200 rounded px-2 py-1"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || !actionTaken}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Log Action'}
          </button>
          <button
            type="button"
            onClick={() => setState('idle')}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      {error && (
        <div className="mt-2 px-2 py-1.5 bg-red-50 rounded text-xs text-red-700 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}
      <button
        onClick={handleCreate}
        disabled={saving}
        className="mt-2 w-full text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded px-2 py-1.5 text-left transition-colors flex items-center gap-1"
      >
        <span>&#9654;</span>
        <span>{saving ? 'Creating...' : suggestion.suggestedAction}</span>
      </button>
    </div>
  );
}
