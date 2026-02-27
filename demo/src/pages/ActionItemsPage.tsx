import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ActionItemDashboard, ActionItemView } from '../types';
import { OutcomeReviewCard } from '../components/actions/OutcomeReviewCard';

const TRIGGER_LABELS: Record<string, string> = {
  ABSENT: 'Absence',
  GRADE_ALERT: 'Grade Drop',
  MISSING_WORK: 'Missing Work',
  INTERVENTION: 'Intervention',
  ACCOMMODATION: 'Accommodation',
  NEW_STUDENT: 'New Student',
  RELATIONSHIP: 'Relationship',
};

const TRIGGER_COLORS: Record<string, string> = {
  ABSENT: 'badge-red',
  GRADE_ALERT: 'badge-amber',
  MISSING_WORK: 'badge-amber',
  INTERVENTION: 'badge-blue',
  ACCOMMODATION: 'badge-purple',
  NEW_STUDENT: 'badge-blue',
  RELATIONSHIP: 'badge-gray',
};

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  IMPROVED: { label: 'Improved', color: 'text-green-700 bg-green-50' },
  NO_CHANGE: { label: 'No Change', color: 'text-gray-700 bg-gray-50' },
  WORSENED: { label: 'Worsened', color: 'text-red-700 bg-red-50' },
  NOT_APPLICABLE: { label: 'N/A', color: 'text-gray-500 bg-gray-50' },
};

type TabId = 'open' | 'review' | 'outcomes';

export function ActionItemsPage() {
  const [dashboard, setDashboard] = useState<ActionItemDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('open');

  useEffect(() => {
    api.get<ActionItemDashboard>('/action-items')
      .then(setDashboard)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleDismiss(itemId: string) {
    api.put(`/action-items/${itemId}/dismiss`).then(() => {
      setDashboard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pendingActions: prev.pendingActions.filter((a) => a.id !== itemId),
          stats: { ...prev.stats, totalOpen: prev.stats.totalOpen - 1 },
        };
      });
    });
  }

  function handleReviewed(updated: ActionItemView) {
    setDashboard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pendingReviews: prev.pendingReviews.filter((r) => r.id !== updated.id),
        recentOutcomes: [updated, ...prev.recentOutcomes],
        stats: {
          ...prev.stats,
          pendingReviewCount: prev.stats.pendingReviewCount - 1,
          improvedRate: updated.outcomeStatus === 'IMPROVED'
            ? prev.stats.improvedRate // Rough approx, good enough for real-time
            : prev.stats.improvedRate,
        },
      };
    });
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Action Items</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="card-body">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-atlas-danger">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary mt-4">Retry</button>
      </div>
    );
  }

  if (!dashboard) return null;

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'open', label: 'Open Actions', count: dashboard.stats.totalOpen },
    { id: 'review', label: 'Pending Review', count: dashboard.stats.pendingReviewCount },
    { id: 'outcomes', label: 'Recent Outcomes', count: dashboard.recentOutcomes.length },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Action Items</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open Actions" value={dashboard.stats.totalOpen} color="text-blue-600" />
        <StatCard label="Completed This Week" value={dashboard.stats.completedThisWeek} color="text-green-600" />
        <StatCard label="Pending Reviews" value={dashboard.stats.pendingReviewCount} color="text-amber-600" />
        <StatCard
          label="Improvement Rate"
          value={`${Math.round(dashboard.stats.improvedRate * 100)}%`}
          color="text-green-600"
        />
      </div>

      {/* Review alert banner */}
      {dashboard.stats.pendingReviewCount > 0 && activeTab !== 'review' && (
        <div
          className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => setActiveTab('review')}
        >
          <div>
            <p className="text-sm font-medium text-amber-800">
              {dashboard.stats.pendingReviewCount} action{dashboard.stats.pendingReviewCount !== 1 ? 's' : ''} ready for follow-up review
            </p>
            <p className="text-xs text-amber-600">Check if your actions made a difference</p>
          </div>
          <span className="text-amber-500 text-lg">&#8594;</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-atlas-primary text-atlas-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'open' && (
        <div className="space-y-3">
          {dashboard.pendingActions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-sm mt-1">No open action items. New ones will appear from your Morning Briefing.</p>
            </div>
          ) : (
            dashboard.pendingActions.map((item) => (
              <PendingActionCard key={item.id} item={item} onDismiss={() => handleDismiss(item.id)} />
            ))
          )}
        </div>
      )}

      {activeTab === 'review' && (
        <div className="space-y-3">
          {dashboard.pendingReviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No reviews pending</p>
              <p className="text-sm mt-1">Completed actions will show up here after their follow-up period.</p>
            </div>
          ) : (
            dashboard.pendingReviews.map((item) => (
              <OutcomeReviewCard key={item.id} item={item} onReviewed={handleReviewed} />
            ))
          )}
        </div>
      )}

      {activeTab === 'outcomes' && (
        <div className="space-y-3">
          {dashboard.recentOutcomes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No outcomes yet</p>
              <p className="text-sm mt-1">As you complete and review actions, outcomes will appear here.</p>
            </div>
          ) : (
            dashboard.recentOutcomes.map((item) => (
              <OutcomeCard key={item.id} item={item} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="card">
      <div className="card-body text-center">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function PendingActionCard({ item, onDismiss }: { item: ActionItemView; onDismiss: () => void }) {
  const [completing, setCompleting] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!actionTaken) return;
    setSaving(true);
    try {
      await api.put(`/action-items/${item.id}/complete`, {
        actionTaken,
        completionNotes: notes,
      });
      setDone(true);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="card border-l-4 border-l-green-400">
        <div className="card-body flex items-center gap-2 text-green-700">
          <span>&#10003;</span>
          <span className="text-sm font-medium">Action logged for {item.firstName} {item.lastName}</span>
          <span className="text-xs text-gray-400 ml-auto">Review in {item.reviewAfterDays} days</span>
        </div>
      </div>
    );
  }

  const age = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className={`card border-l-4 ${age >= 3 ? 'border-l-red-400' : age >= 1 ? 'border-l-amber-400' : 'border-l-blue-400'}`}>
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge ${TRIGGER_COLORS[item.triggerType] || 'badge-gray'} text-xs`}>
                {TRIGGER_LABELS[item.triggerType] || item.triggerType}
              </span>
              {age >= 3 && <span className="text-xs text-red-500 font-medium">{age}d old</span>}
              {age >= 1 && age < 3 && <span className="text-xs text-amber-500">{age}d ago</span>}
            </div>
            <p className="text-sm font-medium text-gray-900">{item.title}</p>
            <Link to={`/students/${item.studentId}`} className="text-xs text-atlas-primary hover:underline">
              {item.firstName} {item.lastName}
            </Link>
          </div>
          <button
            onClick={onDismiss}
            className="text-xs text-gray-400 hover:text-gray-600 ml-2"
            title="Dismiss"
          >
            &#10005;
          </button>
        </div>

        {!completing ? (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setCompleting(true)}
              className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700"
            >
              Log Action Taken
            </button>
          </div>
        ) : (
          <form onSubmit={handleComplete} className="mt-3 p-3 bg-blue-50 rounded space-y-2">
            <p className="text-xs font-medium text-blue-800">What did you do?</p>
            <input
              type="text"
              placeholder="Describe the action (e.g., 'Called home, spoke with mom')"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full text-sm border border-blue-200 rounded px-3 py-2"
              required
              autoFocus
            />
            <input
              type="text"
              placeholder="Additional notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs border border-blue-200 rounded px-3 py-1.5"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !actionTaken}
                className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setCompleting(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function OutcomeCard({ item }: { item: ActionItemView }) {
  const outcome = OUTCOME_LABELS[item.outcomeStatus] || { label: item.outcomeStatus, color: 'text-gray-700 bg-gray-50' };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge ${TRIGGER_COLORS[item.triggerType] || 'badge-gray'} text-xs`}>
                {TRIGGER_LABELS[item.triggerType] || item.triggerType}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${outcome.color}`}>
                {outcome.label}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">{item.title}</p>
            <Link to={`/students/${item.studentId}`} className="text-xs text-atlas-primary hover:underline">
              {item.firstName} {item.lastName}
            </Link>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-gray-50 rounded">
            <span className="font-medium text-gray-600">Action:</span>
            <p className="text-gray-800 mt-0.5">{item.actionTaken}</p>
            {item.completionNotes && <p className="text-gray-500 mt-0.5">"{item.completionNotes}"</p>}
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <span className="font-medium text-gray-600">Outcome:</span>
            <p className="text-gray-800 mt-0.5">{outcome.label}</p>
            {item.outcomeNotes && <p className="text-gray-500 mt-0.5">"{item.outcomeNotes}"</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
