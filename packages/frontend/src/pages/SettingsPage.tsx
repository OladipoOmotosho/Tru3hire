import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Moon,
  Sun,
  Shield,
  Download,
  Trash2,
  Bell,
  ChevronRight,
  Loader2,
  FileText,
  Upload,
  Briefcase,
  Lock,
  Link as LinkIcon,
  CreditCard,
  Check,
  ExternalLink,
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { useUser, useClerk } from "@clerk/clerk-react";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { uploadResume } from "@/lib/api";

// Settings storage key - scoped per user
function getSettingsKey(userId?: string): string {
  return userId ? `truehire_settings_${userId}` : "truehire_settings_guest";
}

// Saved jobs storage key - scoped per user
function getSavedJobsKey(userId?: string): string {
  return userId ? `truehire_saved_jobs_${userId}` : "truehire_saved_jobs_guest";
}

interface UserSettings {
  emailDigest: string;
  newJobAlerts: boolean;
  applicationReminders: boolean;
  skillGapUpdates: boolean;
  profileVisibility: boolean;
  shareAnalytics: boolean;
  darkMode: boolean;
}

const defaultSettings: UserSettings = {
  emailDigest: "daily",
  newJobAlerts: true,
  applicationReminders: true,
  skillGapUpdates: true,
  profileVisibility: true,
  shareAnalytics: true,
  darkMode: false,
};

function loadSettings(userId?: string): UserSettings {
  try {
    const key = getSettingsKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
  return defaultSettings;
}

function saveSettings(settings: UserSettings, userId?: string): void {
  try {
    const key = getSettingsKey(userId);
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

export function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();

  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Resume management state
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [showDeleteResumeModal, setShowDeleteResumeModal] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Get saved resume from Clerk metadata
  const savedResume =
    (user?.unsafeMetadata?.parsedResume as {
      raw_text?: string;
      fileName?: string;
      uploadedAt?: string;
      skills?: string[];
    }) || null;
  const hasSavedResume = !!(
    savedResume?.raw_text && savedResume.raw_text.length > 50
  );

  // Job preferences from Clerk metadata
  const savedJobPrefs =
    (user?.unsafeMetadata?.jobPreferences as {
      job_type?: string;
      employment_type?: string;
    }) || {};
  const [jobType, setJobType] = useState(savedJobPrefs.job_type || "any");
  const [employmentType, setEmploymentType] = useState(
    savedJobPrefs.employment_type || "any"
  );
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Load settings on mount when user is available
  // Also detect current theme state
  useEffect(() => {
    if (user?.id) {
      const loaded = loadSettings(user.id);
      // If no saved setting, detect current theme from DOM
      const currentlyDark = document.documentElement.classList.contains("dark");
      setSettings({
        ...loaded,
        // Use saved preference if available, otherwise detect from DOM
        darkMode: loaded.darkMode ?? currentlyDark,
      });
    } else {
      // For guests, just detect from DOM
      const currentlyDark = document.documentElement.classList.contains("dark");
      setSettings((prev) => ({ ...prev, darkMode: currentlyDark }));
    }
  }, [user?.id]);

  // Apply dark mode - use a ref to track if this is user-initiated
  const userToggledDarkMode = useRef(false);
  useEffect(() => {
    // Only apply if user explicitly toggled (not on initial load)
    if (userToggledDarkMode.current) {
      if (settings.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [settings.darkMode]);

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    // Mark as user-initiated if toggling dark mode
    if (key === "darkMode") {
      userToggledDarkMode.current = true;
    }
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      saveSettings(settings, user?.id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Collect all user data
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          name: user?.fullName,
          email: user?.primaryEmailAddress?.emailAddress,
        },
        settings: settings,
        savedJobs: JSON.parse(
          localStorage.getItem(getSavedJobsKey(user?.id)) || "[]"
        ),
        metadata: user?.unsafeMetadata || {},
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `truehire-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  // Delete account modal
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const handleDeleteAccount = async () => {
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteAccountModal(false);
    // Clear local data for this user
    localStorage.removeItem(getSettingsKey(user?.id));
    localStorage.removeItem(getSavedJobsKey(user?.id));
    // Sign out
    await signOut();
  };

  // Resume handlers
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingResume(true);
    try {
      const data = await uploadResume(file);

      // Save to Clerk metadata
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          parsedResume: {
            ...((user.unsafeMetadata?.parsedResume as Record<
              string,
              unknown
            >) || {}),
            raw_text: data.raw_text,
            skills: data.skills,
            fileName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Resume upload failed:", error);
    } finally {
      setIsUploadingResume(false);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = "";
      }
    }
  };

  const handleDeleteResume = async () => {
    if (!user) return;

    // Remove parsedResume from metadata
    const { parsedResume, ...restMetadata } = (user.unsafeMetadata ||
      {}) as Record<string, unknown>;
    await user.update({
      unsafeMetadata: restMetadata,
    });
    setShowDeleteResumeModal(false);
  };

  const handleSaveJobPreferences = async () => {
    if (!user) return;
    setIsSavingPrefs(true);
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          jobPreferences: {
            job_type: jobType,
            employment_type: employmentType,
          },
        },
      });
    } catch (error) {
      console.error("Failed to save job preferences:", error);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const userEmail = user?.primaryEmailAddress?.emailAddress || "Not set";

  return (
    <PageWrapper maxWidth="4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Account Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Email Address</p>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openUserProfile()}
              >
                Manage
              </Button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Password</p>
                <p className="text-sm text-muted-foreground">••••••••</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openUserProfile()}
              >
                Change
              </Button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-muted-foreground">
                  Managed via Clerk
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openUserProfile()}
              >
                Configure
              </Button>
            </div>
          </div>
        </Card>

        {/* Resume Management */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Saved Resume</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Your saved resume is used to calculate personalized job match
            scores.
          </p>

          {hasSavedResume ? (
            <div className="space-y-4">
              {/* Current Resume Info */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {savedResume?.fileName || "Resume"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {savedResume?.uploadedAt
                        ? `Uploaded ${new Date(
                            savedResume.uploadedAt
                          ).toLocaleDateString()}`
                        : "Resume saved"}
                      {savedResume?.skills?.length
                        ? ` • ${savedResume.skills.length} skills detected`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={isUploadingResume}
                  >
                    {isUploadingResume ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-1" />
                    )}
                    Update
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteResumeModal(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={resumeInputRef}
                onChange={handleResumeUpload}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No resume saved yet</p>
              <input
                type="file"
                ref={resumeInputRef}
                onChange={handleResumeUpload}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />
              <Button
                onClick={() => resumeInputRef.current?.click()}
                disabled={isUploadingResume}
              >
                {isUploadingResume ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload Resume
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, DOC, DOCX • Max 5MB
              </p>
            </div>
          )}
        </Card>

        {/* Job Preferences */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Job Preferences
            </h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Your preferences help calculate better TrueScore matches for job
            postings.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Preferred Work Arrangement
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="any">Any</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Preferred Employment Type
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="any">Any</option>
                <option value="full-time">Full-time</option>
                <option value="contract">Contract</option>
                <option value="part-time">Part-time</option>
              </select>
            </div>

            <Button
              onClick={handleSaveJobPreferences}
              disabled={isSavingPrefs}
              className="w-full"
            >
              {isSavingPrefs ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Preferences
            </Button>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            {settings.darkMode ? (
              <Moon className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground" />
            )}
            <h2 className="text-xl font-bold text-foreground">Appearance</h2>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-foreground">Dark Mode</p>
              <p className="text-sm text-muted-foreground">
                Use dark theme for the interface
              </p>
            </div>
            <button
              onClick={() => updateSetting("darkMode", !settings.darkMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.darkMode ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-background rounded-full transition-transform ${
                  settings.darkMode ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Digest Frequency
              </label>
              <select
                value={settings.emailDigest}
                onChange={(e) => updateSetting("emailDigest", e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="realtime">Real-time</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-foreground">
                    New High-Score Jobs
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when jobs with TrueScore {">"} 80 match your
                    profile
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.newJobAlerts}
                  onChange={(e) =>
                    updateSetting("newJobAlerts", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-foreground">
                    Application Reminders
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Remind me to follow up on applications
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.applicationReminders}
                  onChange={(e) =>
                    updateSetting("applicationReminders", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-foreground">
                    Skill Gap Updates
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Weekly recommendations for skills to learn
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.skillGapUpdates}
                  onChange={(e) =>
                    updateSetting("skillGapUpdates", e.target.checked)
                  }
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </label>
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Privacy</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-foreground">
                  Profile Visibility
                </p>
                <p className="text-sm text-muted-foreground">
                  Allow recruiters to find your profile
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.profileVisibility}
                onChange={(e) =>
                  updateSetting("profileVisibility", e.target.checked)
                }
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-foreground">Analytics</p>
                <p className="text-sm text-muted-foreground">
                  Help improve TrueHire by sharing anonymous usage data
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.shareAnalytics}
                onChange={(e) =>
                  updateSetting("shareAnalytics", e.target.checked)
                }
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>
          </div>
        </Card>

        {/* Integrations */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <LinkIcon className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Integrations</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                  in
                </div>
                <div>
                  <p className="font-medium text-foreground">LinkedIn</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded flex items-center justify-center text-white font-bold">
                  ID
                </div>
                <div>
                  <p className="font-medium text-foreground">Indeed</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </Card>

        {/* Subscription */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Subscription</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Current Plan</p>
                <p className="text-sm text-muted-foreground">Free Plan</p>
              </div>
              <Button disabled>Upgrade to Pro (Coming Soon)</Button>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>Pro Benefits:</strong> Unlimited job searches, advanced
                analytics, priority support, and more.
              </p>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-300 dark:border-red-800">
          <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-red-200 dark:border-red-800">
              <div>
                <p className="font-medium text-foreground">Export Data</p>
                <p className="text-sm text-muted-foreground">
                  Download all your data in JSON format
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3 items-center">
          {saveSuccess && (
            <span className="text-green-600 flex items-center gap-1 text-sm">
              <Check className="w-4 h-4" />
              Settings saved!
            </span>
          )}
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteAccountModal}
        title="Sign Out & Clear Data"
        message="This will clear your local saved jobs and settings from this browser, then sign you out. Your account will remain active and you can sign back in anytime."
        variant="danger"
        confirmText="Sign Out & Clear"
        cancelText="Cancel"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteAccountModal(false)}
      />

      {/* Delete Resume Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteResumeModal}
        title="Delete Saved Resume?"
        message="This will remove your saved resume. Job match scores will no longer be personalized until you upload a new resume."
        variant="danger"
        confirmText="Delete Resume"
        cancelText="Cancel"
        onConfirm={handleDeleteResume}
        onCancel={() => setShowDeleteResumeModal(false)}
      />
    </PageWrapper>
  );
}
