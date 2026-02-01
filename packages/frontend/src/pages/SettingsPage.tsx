import { useState, useEffect } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { useUser } from "@clerk/clerk-react";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { uploadResume } from "@/lib/api";

import { UserSettings } from "@/types/settings";
import { Loader2, Download } from "lucide-react";
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

// function loadSettings(userId?: string): UserSettings {
//   try {
//     const key = getSettingsKey(userId);
//     const stored = localStorage.getItem(key);
//     if (stored) {
//       return { ...defaultSettings, ...JSON.parse(stored) };
//     }
//   } catch (error) {
//     // Silently handle errors
//   }
//   return defaultSettings;
// }

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
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (!user || isDeletingAccount) return;
    setIsDeletingAccount(true);
    try {
      await user.delete();
    } catch (error) {
      console.error("Delete account failed", error);
      setIsDeletingAccount(false);
    }
  };

  const handleExportData = () => {
    if (!user) return;

    const data = [
      ["settings", JSON.stringify(settings)],
      ["job_preferences", JSON.stringify(user.unsafeMetadata?.jobPreferences)],
      ["parsed_resume", JSON.stringify(user.unsafeMetadata?.parsedResume)],
      ["user_id", user.id],
      ["email", user.primaryEmailAddress?.emailAddress],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      data.map((row) => row.map(escapeCsv).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "truehire_user_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageWrapper>
      <div className="space-y-8 max-w-4xl mx-auto py-8">
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

        {/* Data Export */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">My Data</h3>
              <p className="text-sm text-muted-foreground max-w-xl">
                Download a copy of your personal data, including settings,
                preferences, and resume metadata.
              </p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Account Management */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all of your content. This action
            cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteAccountModal(true)}
            disabled={isDeletingAccount}
          >
            {isDeletingAccount ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Account"
            )}
          </Button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteResumeModal}
        onCancel={() => setShowDeleteResumeModal(false)}
        onConfirm={handleDeleteResume}
        title="Delete Resume"
        message="Are you sure you want to delete your resume? This action cannot be undone."
        confirmText="Delete Resume"
        variant="danger"
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
        isLoading={isDeletingAccount}
      />
    </PageWrapper>
  );
}
