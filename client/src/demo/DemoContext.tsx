import React, { createContext, useContext, useState, useCallback } from 'react';

export type DemoScenario = 'morning' | 'midday' | 'end_of_day';

interface DemoState {
  isDemoMode: boolean;
  scenario: DemoScenario;
  // Track interactive state changes within the demo
  completedInterventions: Set<string>;
  readNotifications: Set<string>;
  observations: Array<{
    id: string;
    studentId: string;
    category: string;
    severity: string;
    content: string;
    createdAt: string;
    isEditable: boolean;
  }>;
  submittedReferrals: Set<string>;
}

interface DemoContextType extends DemoState {
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  setScenario: (scenario: DemoScenario) => void;
  markInterventionComplete: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addObservation: (obs: DemoState['observations'][0]) => void;
  submitReferral: (studentId: string) => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [scenario, setScenario] = useState<DemoScenario>('morning');
  const [completedInterventions, setCompletedInterventions] = useState<Set<string>>(new Set());
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [observations, setObservations] = useState<DemoState['observations']>([]);
  const [submittedReferrals, setSubmittedReferrals] = useState<Set<string>>(new Set());

  const enterDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setScenario('morning');
    setCompletedInterventions(new Set());
    setReadNotifications(new Set());
    setObservations([]);
    setSubmittedReferrals(new Set());
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
  }, []);

  const markInterventionComplete = useCallback((id: string) => {
    setCompletedInterventions((prev) => new Set([...prev, id]));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setReadNotifications((prev) => new Set([...prev, id]));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setReadNotifications(new Set(['__ALL__']));
  }, []);

  const addObservation = useCallback((obs: DemoState['observations'][0]) => {
    setObservations((prev) => [obs, ...prev]);
  }, []);

  const submitReferral = useCallback((studentId: string) => {
    setSubmittedReferrals((prev) => new Set([...prev, studentId]));
  }, []);

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        scenario,
        completedInterventions,
        readNotifications,
        observations,
        submittedReferrals,
        enterDemoMode,
        exitDemoMode,
        setScenario,
        markInterventionComplete,
        markNotificationRead,
        markAllNotificationsRead,
        addObservation,
        submitReferral,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoContextType {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within DemoProvider');
  return context;
}

export const SCENARIO_LABELS: Record<DemoScenario, { label: string; description: string }> = {
  morning: { label: 'Morning Briefing', description: 'Start of day — review alerts and plan' },
  midday: { label: 'During Class', description: 'Mid-day — active teaching and observations' },
  end_of_day: { label: 'End of Day', description: 'Review, follow-ups, and planning' },
};
