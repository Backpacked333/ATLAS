import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './components/common/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { BriefingPage } from './pages/BriefingPage';
import { RosterPage } from './pages/RosterPage';
import { SectionPage } from './pages/SectionPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { ReferralPage } from './pages/ReferralPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { CasesPage } from './pages/CasesPage';
import { TasksPage } from './pages/TasksPage';
import { CompliancePage } from './pages/CompliancePage';
import { AlertsPage } from './pages/AlertsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { AccessControlPage } from './pages/AccessControlPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { ReportsPage } from './pages/ReportsPage';
import { MobileSettingsPage } from './pages/MobileSettingsPage';
import { ApiGatewayPage } from './pages/ApiGatewayPage';
import { DatabaseAdminPage } from './pages/DatabaseAdminPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/briefing" replace />} />
          <Route path="/briefing" element={<BriefingPage />} />
          <Route path="/roster" element={<RosterPage />} />
          <Route path="/sections/:sectionId" element={<SectionPage />} />
          <Route path="/students/:studentId" element={<StudentProfilePage />} />
          <Route path="/referrals/new/:studentId" element={<ReferralPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/access-control" element={<AccessControlPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/mobile-settings" element={<MobileSettingsPage />} />
          <Route path="/api-gateway" element={<ApiGatewayPage />} />
          <Route path="/database" element={<DatabaseAdminPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
