import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LayoutWrapper } from "./components/LayoutWrapper";
import { HomePage } from "./pages/HomePage";
import { AnalyzePage } from "./pages/AnalyzePage";
import { ResultsPage } from "./pages/ResultsPage";
import { AboutPage } from "./pages/AboutPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { JobSearchPage } from "./pages/JobSearchPage";
import { JobDetailsPage } from "./pages/JobDetailsPage";
import { CompanyInsightsPage } from "./pages/CompanyInsightsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SkillGapAnalysisPage } from "./pages/SkillGapAnalysisPage";
import { ApplicationTrackerPage } from "./pages/ApplicationTrackerPage";
import { SavedJobsPage } from "./pages/SavedJobsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";

export default function App() {
  return (
    <BrowserRouter>
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/about" element={<AboutPage />} />
          
          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Main App Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/jobs" element={<JobSearchPage />} />
          <Route path="/jobs/:id" element={<JobDetailsPage />} />
          <Route path="/company/:id" element={<CompanyInsightsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/skills" element={<SkillGapAnalysisPage />} />
          <Route path="/applications" element={<ApplicationTrackerPage />} />
          <Route path="/saved" element={<SavedJobsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/insights" element={<AnalyticsPage />} />
          
          <Route path="/preview_page.html" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LayoutWrapper>
    </BrowserRouter>
  );
}
