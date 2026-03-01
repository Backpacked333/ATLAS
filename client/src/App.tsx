import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DistrictAuthProvider } from './contexts/DistrictAuthContext';
import { AppLayout } from './components/common/AppLayout';
import { CommandLayout } from './components/command/CommandLayout';
import { LoginPage } from './pages/LoginPage';
import { BriefingPage } from './pages/BriefingPage';
import { RosterPage } from './pages/RosterPage';
import { SectionPage } from './pages/SectionPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { ReferralPage } from './pages/ReferralPage';
import { NotificationsPage } from './pages/NotificationsPage';

// AtlasED Command (District-level) pages
import { CommandLoginPage } from './pages/command/CommandLoginPage';
import { ScoreboardPage } from './pages/command/ScoreboardPage';
import { SchoolDeepDivePage } from './pages/command/SchoolDeepDivePage';
import { EquityDashboardPage } from './pages/command/EquityDashboardPage';
import { ResourceAllocationPage } from './pages/command/ResourceAllocationPage';
import { ReportsPage } from './pages/command/ReportsPage';
import { DistrictAIPage } from './pages/command/DistrictAIPage';

export default function App() {
  return (
    <Routes>
      {/* AtlasED Classroom (Teacher-level) routes */}
      <Route path="/login" element={<AuthProvider><LoginPage /></AuthProvider>} />
      <Route element={<AuthProvider><AppLayout /></AuthProvider>}>
        <Route path="/" element={<Navigate to="/briefing" replace />} />
        <Route path="/briefing" element={<BriefingPage />} />
        <Route path="/roster" element={<RosterPage />} />
        <Route path="/sections/:sectionId" element={<SectionPage />} />
        <Route path="/students/:studentId" element={<StudentProfilePage />} />
        <Route path="/referrals/new/:studentId" element={<ReferralPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* AtlasED Command (District-level) routes */}
      <Route path="/command/login" element={<DistrictAuthProvider><CommandLoginPage /></DistrictAuthProvider>} />
      <Route element={<DistrictAuthProvider><CommandLayout /></DistrictAuthProvider>}>
        <Route path="/command" element={<Navigate to="/command/scoreboard" replace />} />
        <Route path="/command/scoreboard" element={<ScoreboardPage />} />
        <Route path="/command/schools/:schoolId" element={<SchoolDeepDivePage />} />
        <Route path="/command/equity" element={<EquityDashboardPage />} />
        <Route path="/command/resources" element={<ResourceAllocationPage />} />
        <Route path="/command/reports" element={<ReportsPage />} />
        <Route path="/command/ai" element={<DistrictAIPage />} />
      </Route>
    </Routes>
  );
}
