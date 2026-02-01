import { useState, useEffect, useRef } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { useUser, useClerk } from "@clerk/clerk-react";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { uploadResume } from "@/lib/api";

import { UserSettings } from "@/types/settings";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Modular Components
import { ResumeSection } from "@/components/settings/ResumeSection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { NotificationSection } from "@/components/settings/NotificationSection";

// Settings storage key - scoped per user
function getSettingsKey(userId?: string): string {
  return userId ? `truehire_settings_${userId}` : "truehire_settings_guest";
}

const defaultSettings: UserSettings = {
  emailDigest: "daily",
  newJobAlerts: true,
  applicationReminders: true,
  skillGapUpdates: true,
  profileVisibility: true,
  shareAnalytics: true,
  privacyMode: false,
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
    // Silently handle errors
  }
  return defaultSettings;
}

function saveSettings(settings: UserSettings, userId?: string): void {
  try {
    const key = getSettingsKey(userId);
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (error) {
    // Silently handle errors
  }
}

/** Escape a value for CSV: quotes → double quotes, wrap in quotes */
function escapeCsv(value: unknown): string {
  const s = String(value ?? "");
  return '"' + s.replace(/"/g, '""') + '"';
}

export function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  // Lazy initialize state to respect current theme immediately
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Check if we're in browser environment
    if (typeof document !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      return { ...defaultSettings, darkMode: isDark };
    }
    return defaultSettings;
  });

  const [showDeleteResumeModal, setShowDeleteResumeModal] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  // Job preferences from Clerk metadata
  const savedJobPrefs =
    (user?.unsafeMetadata?.jobPreferences as {
      job_type?: string;
      employment_type?: string;
    }) || {};
  const [jobType, setJobType] = useState(savedJobPrefs.job_type || "any");
  const [employmentType, setEmploymentType] = useState(
    savedJobPrefs.employment_type || "any",
  );
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Load settings on mount (sync with localStorage and Remote)
  useEffect(() => {
    if (user) {
      const key = getSettingsKey(user.id);
      const stored = localStorage.getItem(key);
      const currentlyDark = document.documentElement.classList.contains("dark");

      let localParsed: Partial<UserSettings> = {};
      if (stored) {
        try {
          localParsed = JSON.parse(stored);
        } catch (e) {
          // ignore
        }
      }

      const remoteSettings =
        (user.unsafeMetadata?.settings as Partial<UserSettings>) || {};

      // Priority: Remote > Local > Default
      // We merge remote into local to ensure we have the latest from other devices
      const mergedSettings: UserSettings = {
        ...defaultSettings,
        ...localParsed,
        ...remoteSettings,
        // Ensure darkMode adheres to current system state if not explicitly set
        darkMode:
          remoteSettings.darkMode ?? localParsed.darkMode ?? currentlyDark,
      };

      setSettings(mergedSettings);

      // Update local storage to match the authoritative remote state
      localStorage.setItem(key, JSON.stringify(mergedSettings));
    }
  }, [user]);

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Save locally immediately
    saveSettings(newSettings, user?.id);

    // Sync to remote
    if (user) {
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            settings: newSettings,
          },
        });
      } catch (err) {
        console.error("Failed to sync settings to cloud", err);
      }
    }
  };

  const handleResumeUpload = async (file: File) => {
    if (!user) return;
    setIsUploadingResume(true);
    try {
      const data = await uploadResume(file);
      if (data) {
        // Optimistically update user metadata
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            parsedResume: {
              raw_text: data.raw_text,
              fileName: file.name,
              uploadedAt: new Date().toISOString(),
              skills: data.skills,
            },
          },
        });
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!user) return;
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          parsedResume: null,
        },
      });
      setShowDeleteResumeModal(false);
    } catch (error) {
      console.error("Delete resume failed", error);
    }
  };

  const handleSavePreferences = async () => {
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
      console.error("Failed to save preferences", error);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

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

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await user.delete();
    } catch (error) {
      console.error("Delete account failed", error);
    }
  };

  const handleExportData = async () => {
    if (!user?.id) return;
    try {
      const { getUserApplications } = await import("@/lib/api");
      const response = await getUserApplications(user.id);

      if (response?.applications) {
        const headers = [
          "Job Title",
          "Company",
          "Date Applied",
          "Status",
          "TrueScore",
        ];
        const csvRows = [headers.map(escapeCsv).join(",")];

        response.applications.forEach((app) => {
          const dateStr = app.applied_at
            ? new Date(app.applied_at).toLocaleDateString()
            : "";
          csvRows.push(
            [
              escapeCsv(app.job_title),
              escapeCsv(app.company_name),
              escapeCsv(dateStr),
              escapeCsv(app.outcome ?? "Pending"),
              escapeCsv(app.true_score_at_apply),
            ].join(","),
          );
        });

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "truehire_applications.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  return (
    <PageWrapper withNavbarOffset={true} withPadding={true} maxWidth="4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and profile
        </p>
      </div>

      <ResumeSection
        hasSavedResume={hasSavedResume}
        savedResume={savedResume}
        isUploading={isUploadingResume}
        onUpload={handleResumeUpload}
        onDelete={() => setShowDeleteResumeModal(true)}
      />

      <PreferencesSection
        jobType={jobType}
        employmentType={employmentType}
        isSaving={isSavingPrefs}
        onJobTypeChange={setJobType}
        onEmploymentTypeChange={setEmploymentType}
        onSave={handleSavePreferences}
      />

      <NotificationSection settings={settings} onUpdate={updateSetting} />

      <div className="bg-muted/50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Data Management</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-base font-medium">Privacy Mode</label>
              <p className="text-sm text-muted-foreground">
                Blur sensitive values (like salary) on dashboard
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.privacyMode}
              onChange={(e) => updateSetting("privacyMode", e.target.checked)}
              className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div>
              <label className="text-base font-medium">Export Data</label>
              <p className="text-sm text-muted-foreground">
                Download your application history
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Simple alert for now as specific export logic wasn't fully defined in task but is persistent request
                // Implementation plan mentioned "Export Application Data"
                handleExportData();
              }}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <Button variant="outline" onClick={() => signOut()}>
          Sign Out
        </Button>
        <Button
          variant="ghost"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
          onClick={() => setShowDeleteAccountModal(true)}
        >
          Delete Account
        </Button>
      </div>

      <ConfirmationModal
        isOpen={showDeleteResumeModal}
        onCancel={() => setShowDeleteResumeModal(false)}
        onConfirm={handleDeleteResume}
        title="Delete Resume?"
        message="Are you sure you want to delete your resume? This will remove personalized Match Scores and skills gap analysis."
        confirmText="Delete"
        variant="danger"
        cancelText="Cancel"
      />

      <ConfirmationModal
        isOpen={showDeleteAccountModal}
        onCancel={() => setShowDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        message="Are you sure you want to delete your account? This action is permanent and cannot be undone. All your data will be lost."
        confirmText="Delete My Account"
        variant="danger"
        cancelText="Cancel"
      />
    </PageWrapper>
  );
}
