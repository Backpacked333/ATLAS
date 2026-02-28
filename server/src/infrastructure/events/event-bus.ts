import { EventEmitter } from 'events';

// ─── Event Types ──────────────────────────────────────────────────────

export interface SystemEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  source: string;
}

export interface StudentEvent extends SystemEvent {
  type:
    | 'student.created'
    | 'student.updated'
    | 'student.enrolled'
    | 'student.transferred'
    | 'student.risk_tier_changed';
  payload: { studentId: string; schoolId: string; [key: string]: unknown };
}

export interface AttendanceEvent extends SystemEvent {
  type: 'attendance.recorded' | 'attendance.pattern_detected' | 'attendance.chronic_absent';
  payload: { studentId: string; date: string; [key: string]: unknown };
}

export interface GradeEvent extends SystemEvent {
  type: 'grade.recorded' | 'grade.dropped' | 'grade.missing_threshold';
  payload: { studentId: string; sectionId: string; [key: string]: unknown };
}

export interface BehavioralEvent extends SystemEvent {
  type: 'behavioral.incident_created' | 'behavioral.incident_resolved' | 'behavioral.escalated';
  payload: { studentId: string; incidentId: string; [key: string]: unknown };
}

export interface ComplianceEvent extends SystemEvent {
  type: 'compliance.deadline_approaching' | 'compliance.deadline_overdue' | 'compliance.completed';
  payload: { studentId: string; deadlineId: string; [key: string]: unknown };
}

export interface ScheduleEvent extends SystemEvent {
  type: 'schedule.absence_reported' | 'schedule.conflict_detected' | 'schedule.substitute_assigned';
  payload: { staffMemberId: string; [key: string]: unknown };
}

export interface CommunicationEvent extends SystemEvent {
  type: 'communication.message_sent' | 'communication.message_read';
  payload: { messageId: string; [key: string]: unknown };
}

export type ATLASEvent =
  | StudentEvent
  | AttendanceEvent
  | GradeEvent
  | BehavioralEvent
  | ComplianceEvent
  | ScheduleEvent
  | CommunicationEvent;

// ─── Event Bus ────────────────────────────────────────────────────────

class ATLASEventBus extends EventEmitter {
  private static instance: ATLASEventBus;

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  static getInstance(): ATLASEventBus {
    if (!ATLASEventBus.instance) {
      ATLASEventBus.instance = new ATLASEventBus();
    }
    return ATLASEventBus.instance;
  }

  /**
   * Publish an event to the bus.
   */
  publish(event: ATLASEvent): void {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp ?? new Date(),
    };

    // Emit both the specific event type and a wildcard
    this.emit(enrichedEvent.type, enrichedEvent);
    this.emit('*', enrichedEvent);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[EventBus] ${enrichedEvent.type}`, enrichedEvent.payload);
    }
  }

  /**
   * Subscribe to a specific event type.
   */
  subscribe(eventType: string, handler: (event: ATLASEvent) => void): void {
    this.on(eventType, handler);
  }

  /**
   * Subscribe to all events.
   */
  subscribeAll(handler: (event: ATLASEvent) => void): void {
    this.on('*', handler);
  }
}

export const eventBus = ATLASEventBus.getInstance();
