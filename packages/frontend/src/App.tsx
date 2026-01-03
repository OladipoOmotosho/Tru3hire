import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LayoutWrapper } from "./components/LayoutWrapper";
import { ScrollToTop } from "./components/ScrollToTop";

// Pages
import { HomePage } from "./pages/HomePage";
import { AnalyzePage } from "./pages/AnalyzePage";
import { ResultsPage } from "./pages/ResultsPage";
import { AboutPage } from "./pages/AboutPage";
import { SignInPage } from "./pages/SignInPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { JobSearchPage } from "./pages/JobSearchPage";
import { JobsPage } from "./pages/JobsPage";
import { JobDetailsPage } from "./pages/JobDetailsPage";
import { CompanyInsightsPage } from "./pages/CompanyInsightsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SkillGapAnalysisPage } from "./pages/SkillGapAnalysisPage";
import { ApplicationTrackerPage } from "./pages/ApplicationTrackerPage";
import { SavedJobsPage } from "./pages/SavedJobsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SignUpPage } from "./pages/SignUpPage";
import { SafetyTipsPage } from "./pages/SafetyTipsPage";
import { ReportScamPage } from "./pages/ReportScamPage";

/**
 * App - Main application component
 *
 * Note: ClerkProvider wraps this component in main.tsx
 * This keeps the routing logic clean and separate from auth setup.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <LayoutWrapper>
        <Routes>
          {/* ============================================================ */}
          {/* PUBLIC ROUTES - No authentication required */}
          {/* ============================================================ */}
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/detector" element={<AnalyzePage />} />
          <Route path="/check-job" element={<AnalyzePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/safety-tips" element={<SafetyTipsPage />} />
          <Route path="/report-scam" element={<ReportScamPage />} />

          {/* ============================================================ */}
          {/* AUTHENTICATION ROUTES - Clerk handles these */}
          {/* ============================================================ */}
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />

          {/* Legacy routes - redirect to new Clerk routes */}
          <Route path="/login" element={<Navigate to="/sign-in" replace />} />
          <Route path="/signup" element={<Navigate to="/sign-up" replace />} />

          {/* ============================================================ */}
          {/* ONBOARDING ROUTE - Requires auth, but not onboarding completion */}
          {/* ============================================================ */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireOnboarding={false}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* ============================================================ */}
          {/* PROTECTED ROUTES - Require authentication */}
          {/* ============================================================ */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <JobSearchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id"
            element={
              <ProtectedRoute>
                <JobDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/:id"
            element={
              <ProtectedRoute>
                <CompanyInsightsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <ProtectedRoute>
                <SkillGapAnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <ApplicationTrackerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedJobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* ============================================================ */}
          {/* FALLBACK ROUTES */}
          {/* ============================================================ */}
          <Route
            path="/preview_page.html"
            element={<Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LayoutWrapper>
    </BrowserRouter>
  );
}
