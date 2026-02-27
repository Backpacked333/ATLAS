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
import { CommunicationPage } from './pages/CommunicationPage';
import { InsightsPage } from './pages/InsightsPage';
import { ActionItemsPage } from './pages/ActionItemsPage';

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
          <Route path="/communication" element={<CommunicationPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/actions" element={<ActionItemsPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
