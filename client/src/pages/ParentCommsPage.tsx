import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface ContactRecord {
  id: string;
  studentId: string;
  studentName: string;
  guardianName: string;
  guardianEmail: string | null;
  guardianPhone: string | null;
  type: string;
  subject: string;
  content: string;
  date: string;
  status: 'sent' | 'pending' | 'failed';
}

interface GuardianDirectory {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  relation: string;
  studentName: string;
  studentId: string;
}

const EMAIL_TEMPLATES = [
  { name: 'Grade Concern', subject: 'Update on Academic Progress', icon: '📊' },
  { name: 'Attendance Alert', subject: 'Attendance Notification', icon: '📋' },
  { name: 'Positive Update', subject: 'Great News About Your Student', icon: '⭐' },
  { name: 'Meeting Request', subject: 'Request for Parent-Teacher Conference', icon: '📅' },
  { name: 'Intervention Update', subject: 'Intervention Progress Report', icon: '📈' },
  { name: 'Missing Work', subject: 'Missing Assignment Notification', icon: '📝' },
];

export function ParentCommsPage() {
  useTheme(); // ensure dark mode context
  const [activeTab, setActiveTab] = useState<'log' | 'compose' | 'directory'>('log');
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [guardians, setGuardians] = useState<GuardianDirectory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Compose state
  const [composeRecipient, setComposeRecipient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<ContactRecord[]>('/dashboard/contacts').catch(() => {
        // Mock data
        return [
          { id: '1', studentId: 's1', studentName: 'Marcus Williams', guardianName: 'Patricia Williams', guardianEmail: 'patricia.w@email.com', guardianPhone: '(555) 234-5678', type: 'EMAIL', subject: 'Grade Concern - Algebra I', content: 'Dear Mrs. Williams, I wanted to reach out about Marcus\'s recent grade decline...', date: new Date(Date.now() - 86400000).toISOString(), status: 'sent' as const },
          { id: '2', studentId: 's2', studentName: 'Sofia Hernandez', guardianName: 'Maria Hernandez', guardianEmail: 'maria.h@email.com', guardianPhone: '(555) 345-6789', type: 'PHONE', subject: 'Attendance Discussion', content: 'Phone call regarding Sofia\'s recent absences on Monday mornings.', date: new Date(Date.now() - 259200000).toISOString(), status: 'sent' as const },
          { id: '3', studentId: 's3', studentName: 'James Washington', guardianName: 'Robert Washington', guardianEmail: 'r.washington@email.com', guardianPhone: '(555) 456-7890', type: 'EMAIL', subject: 'Intervention Progress Update', content: 'Mr. Washington, I wanted to update you on James\'s progress with the daily check-in intervention...', date: new Date(Date.now() - 432000000).toISOString(), status: 'sent' as const },
          { id: '4', studentId: 's4', studentName: 'Aiden Johnson', guardianName: 'Lisa Johnson', guardianEmail: 'lisa.j@email.com', guardianPhone: '(555) 567-8901', type: 'EMAIL', subject: 'Positive Update - Math Class', content: 'Dear Ms. Johnson, I\'m thrilled to share that Aiden has shown remarkable improvement...', date: new Date(Date.now() - 604800000).toISOString(), status: 'sent' as const },
        ] as ContactRecord[];
      }),
      api.get<GuardianDirectory[]>('/dashboard/guardians').catch(() => {
        return [
          { id: 'g1', firstName: 'Patricia', lastName: 'Williams', email: 'patricia.w@email.com', phone: '(555) 234-5678', relation: 'Mother', studentName: 'Marcus Williams', studentId: 's1' },
          { id: 'g2', firstName: 'Maria', lastName: 'Hernandez', email: 'maria.h@email.com', phone: '(555) 345-6789', relation: 'Mother', studentName: 'Sofia Hernandez', studentId: 's2' },
          { id: 'g3', firstName: 'Robert', lastName: 'Washington', email: 'r.washington@email.com', phone: '(555) 456-7890', relation: 'Father', studentName: 'James Washington', studentId: 's3' },
          { id: 'g4', firstName: 'Lisa', lastName: 'Johnson', email: 'lisa.j@email.com', phone: '(555) 567-8901', relation: 'Mother', studentName: 'Aiden Johnson', studentId: 's4' },
          { id: 'g5', firstName: 'Chen', lastName: 'Wei', email: 'chen.wei@email.com', phone: '(555) 678-9012', relation: 'Father', studentName: 'Emma Chen', studentId: 's5' },
          { id: 'g6', firstName: 'Angela', lastName: 'Brooks', email: 'a.brooks@email.com', phone: '(555) 789-0123', relation: 'Mother', studentName: 'Tyler Brooks', studentId: 's6' },
        ] as GuardianDirectory[];
      }),
    ]).then(([c, g]) => {
      setContacts(c);
      setGuardians(g);
    }).finally(() => setLoading(false));
  }, []);

  const filteredGuardians = guardians.filter(g =>
    searchQuery === '' ||
    `${g.firstName} ${g.lastName} ${g.studentName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const applyTemplate = (template: typeof EMAIL_TEMPLATES[number]) => {
    setComposeSubject(template.subject);
    setActiveTab('compose');
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-10 w-48" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Parent Communication</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted mt-0.5">
            Contact log, email composer, and guardian directory
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-surface rounded-lg p-1 w-fit">
        {([['log', 'Contact Log'], ['compose', 'Compose'], ['directory', 'Guardian Directory']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === key
                ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-dark-muted hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contact Log Tab */}
      {activeTab === 'log' && (
        <div className="space-y-3">
          {/* Quick Templates */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Templates</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {EMAIL_TEMPLATES.map(t => (
                  <button
                    key={t.name}
                    onClick={() => applyTemplate(t)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-hover transition-all text-center group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">{t.icon}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-dark-text">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Records */}
          {contacts.map(c => (
            <div key={c.id} className="card">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      c.type === 'EMAIL' ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-emerald-100 dark:bg-emerald-500/20'
                    }`}>
                      {c.type === 'EMAIL' ? '✉️' : '📞'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Link to={`/students/${c.studentId}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-atlas-primary transition-colors">
                          {c.studentName}
                        </Link>
                        <span className="text-xs text-gray-400 dark:text-dark-muted">→</span>
                        <span className="text-sm text-gray-600 dark:text-dark-text/80">{c.guardianName}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 dark:text-dark-text mb-1">{c.subject}</p>
                      <p className="text-xs text-gray-500 dark:text-dark-muted line-clamp-2">{c.content}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 dark:text-dark-muted">
                      {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="mt-1">
                      <span className={`badge text-[10px] ${c.status === 'sent' ? 'badge-green' : c.status === 'pending' ? 'badge-amber' : 'badge-red'}`}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">New Message</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">To</label>
              <input
                type="text"
                value={composeRecipient}
                onChange={e => setComposeRecipient(e.target.value)}
                placeholder="Search guardian by name or student..."
                className="input mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">Subject</label>
              <input
                type="text"
                value={composeSubject}
                onChange={e => setComposeSubject(e.target.value)}
                placeholder="Email subject..."
                className="input mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">Message</label>
              <textarea
                value={composeBody}
                onChange={e => setComposeBody(e.target.value)}
                placeholder="Type your message here... You can use AI-generated templates as a starting point."
                className="input mt-1 min-h-[200px] resize-y"
                rows={8}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button className="btn-ghost text-xs">
                🤖 Generate with AI
              </button>
              <div className="flex items-center gap-2">
                <button className="btn-secondary text-xs">Save Draft</button>
                <button className="btn-primary text-xs">Send Message</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search guardians or students..."
            className="input max-w-sm"
          />
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Guardian</th>
                  <th>Relation</th>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuardians.map(g => (
                  <tr key={g.id}>
                    <td className="text-sm font-medium text-gray-900 dark:text-white">{g.firstName} {g.lastName}</td>
                    <td className="text-sm text-gray-600 dark:text-dark-muted">{g.relation}</td>
                    <td>
                      <Link to={`/students/${g.studentId}`} className="text-sm text-atlas-primary dark:text-blue-400 hover:underline">
                        {g.studentName}
                      </Link>
                    </td>
                    <td className="text-sm text-gray-600 dark:text-dark-muted">{g.email || '-'}</td>
                    <td className="text-sm text-gray-600 dark:text-dark-muted">{g.phone || '-'}</td>
                    <td>
                      <button
                        onClick={() => { setComposeRecipient(`${g.firstName} ${g.lastName}`); setActiveTab('compose'); }}
                        className="btn-ghost text-xs py-1 px-2"
                      >
                        ✉️ Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
