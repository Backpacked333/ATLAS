// ─── Module 7: Parent Communication Portal ───────────────────────────
// Functional Themes: core functionality, integration, operations, security, scalability, reliability
// Cross-references: Data Integration Framework, API Gateway System,
//                   Multi-Tenancy Framework, Special Education Compliance Engine

export interface SendMessageInput {
  recipientId: string;
  recipientType: 'TEACHER' | 'GUARDIAN';
  studentId?: string;
  subject: string;
  body: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  channel?: 'IN_APP' | 'EMAIL' | 'SMS';
  threadId?: string;
}

export interface MessageRecord {
  id: string;
  threadId: string | null;
  senderId: string;
  senderType: string;
  senderName: string;
  recipientId: string;
  recipientType: string;
  recipientName: string;
  studentId: string | null;
  studentName: string | null;
  subject: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  priority: string;
  channel: string;
  createdAt: string;
}

export interface MessageThread {
  threadId: string;
  subject: string;
  participants: { id: string; name: string; type: string }[];
  studentId: string | null;
  studentName: string | null;
  messageCount: number;
  lastMessageAt: string;
  hasUnread: boolean;
  messages: MessageRecord[];
}

export interface MessageSearchParams {
  userId: string;
  userType: 'TEACHER' | 'GUARDIAN';
  unreadOnly?: boolean;
  studentId?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export interface CommunicationDashboard {
  unreadCount: number;
  recentThreads: {
    threadId: string;
    subject: string;
    lastMessage: string;
    lastMessageAt: string;
    participantName: string;
    studentName: string | null;
    hasUnread: boolean;
  }[];
  recentContacts: {
    id: string;
    studentId: string;
    studentName: string;
    method: string;
    subject: string;
    date: string;
  }[];
  stats: {
    totalMessagesSent: number;
    totalMessagesReceived: number;
    averageResponseTime: number | null;
    parentContactsThisMonth: number;
  };
}

export interface CreateParentContactInput {
  studentId: string;
  guardianId?: string;
  method: 'EMAIL' | 'PHONE' | 'IN_PERSON' | 'OTHER';
  subject: string;
  notes: string;
}
