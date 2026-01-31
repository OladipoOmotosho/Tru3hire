import { useState, useEffect, useRef } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { useUser, useClerk } from "@clerk/clerk-react";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { uploadResume } from "@/lib/api";

interface UserSettings {
  emailDigest: string;
  newJobAlerts: boolean;
  applicationReminders: boolean;
  skillGapUpdates: boolean;
  profileVisibility: boolean;
  shareAnalytics: boolean;
  darkMode: boolean;
}
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

export function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
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

  // Load settings on mount
  useEffect(() => {
    if (user?.id) {
      const loaded = loadSettings(user.id);
      const currentlyDark = document.documentElement.classList.contains("dark");
      setSettings({
        ...loaded,
        darkMode: loaded.darkMode ?? currentlyDark,
      });
    }
  }, [user?.id]);

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.darkMode]);

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings, user?.id);
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

      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => signOut()}>
          Sign Out
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
    </PageWrapper>
  );
}
