import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppLayout } from './components/common/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { BriefingPage } from './pages/BriefingPage';
import { RosterPage } from './pages/RosterPage';
import { SectionPage } from './pages/SectionPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { ReferralPage } from './pages/ReferralPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { CommandCenterPage } from './pages/CommandCenterPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AttendancePage } from './pages/AttendancePage';
import { BehavioralPage } from './pages/BehavioralPage';
import { ParentCommsPage } from './pages/ParentCommsPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<CommandCenterPage />} />
            <Route path="/briefing" element={<BriefingPage />} />
            <Route path="/roster" element={<RosterPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/behavioral" element={<BehavioralPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/communications" element={<ParentCommsPage />} />
            <Route path="/sections/:sectionId" element={<SectionPage />} />
            <Route path="/students/:studentId" element={<StudentProfilePage />} />
            <Route path="/referrals/new/:studentId" element={<ReferralPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
