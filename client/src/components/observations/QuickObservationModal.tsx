import { useState } from 'react';
import { api } from '../../services/api';
import { ObservationCategory, ObservationSeverity, CreateObservationInput } from '../../types';

interface Props {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES: { value: ObservationCategory; label: string }[] = [
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
  { value: 'SOCIAL_EMOTIONAL', label: 'Social-Emotional' },
  { value: 'ATTENDANCE', label: 'Attendance' },
  { value: 'OTHER', label: 'Other' },
];

const SEVERITIES: { value: ObservationSeverity; label: string; color: string }[] = [
  { value: 'POSITIVE', label: 'Positive', color: 'green' },
  { value: 'CONCERN', label: 'Concern', color: 'amber' },
  { value: 'URGENT', label: 'Urgent', color: 'red' },
];

/**
 * Quick Observation Form
 * Target: complete in under 20 seconds.
 * - Select category (large touch targets for iPad)
 * - Select severity
 * - Type free-text note
 * - One-tap save with optimistic UI
 */
export function QuickObservationModal({ studentId, studentName, onClose, onSaved }: Props) {
  const [category, setCategory] = useState<ObservationCategory>('ACADEMIC');
  const [severity, setSeverity] = useState<ObservationSeverity>('CONCERN');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!content.trim()) return;

    setSaving(true);
    setError('');

    try {
      const input: CreateObservationInput = {
        studentId,
        category,
        severity,
        content: content.trim(),
      };

      await api.post('/observations', input);
      setSaved(true);
      setTimeout(() => onSaved(), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Quick Observation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          Observation for <strong>{studentName}</strong>
        </p>

        {/* Category - large touch targets */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  category === cat.value
                    ? 'border-atlas-primary bg-blue-50 text-atlas-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Severity - large touch targets */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Severity</label>
          <div className="flex gap-2">
            {SEVERITIES.map((sev) => (
              <button
                key={sev.value}
                type="button"
                onClick={() => setSeverity(sev.value)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  severity === sev.value
                    ? sev.color === 'green'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : sev.color === 'amber'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you observe?"
            className="input min-h-[80px] resize-none"
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        {/* Save button - prominent */}
        <button
          onClick={handleSave}
          disabled={saving || saved || !content.trim()}
          className={`w-full py-3 text-base rounded-md font-medium transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : 'btn-primary'
          }`}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          ) : saving ? 'Saving...' : 'Save Observation'}
        </button>

        {severity === 'URGENT' && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Urgent observations automatically notify the student's counselor.
          </p>
        )}
      </div>
    </div>
  );
}
