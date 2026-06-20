import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, X } from "lucide-react";
import { BasicInfoSection } from "./profile/BasicInfoSection";
import { ResumeSection } from "./profile/ResumeSection";
import { SkillsSection } from "./profile/SkillsSection";
import { WorkExperienceSection } from "./profile/WorkExperienceSection";
import { PreferencesSection } from "./profile/PreferencesSection";
import { PageWrapper } from "@/components/PageWrapper";
import { useUser, useAuth } from "@clerk/clerk-react";
import { uploadResumeWithProgress, ParsedWorkExperience } from "@/lib/api";

// Resume file constraints
const MAX_RESUME_SIZE_MB = 3;
const MAX_RESUME_SIZE_BYTES = MAX_RESUME_SIZE_MB * 1024 * 1024;
import {
  WorkExperienceModal,
  WorkExperience,
} from "@/components/WorkExperienceModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";

// Empty work experience template
const emptyExperience: WorkExperience = {
  title: "",
  company: "",
  start_date: null,
  end_date: null,
  description: "",
  is_current: false,
};

export function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [jobTitles, setJobTitles] = useState("");
  const [industries, setIndustries] = useState("");
  const [workArrangement, setWorkArrangement] = useState("any");
  const [salaryMin, setSalaryMin] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [currentResumeFileName, setCurrentResumeFileName] = useState<
    string | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // LinkedIn confirmation modal state
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [pendingLinkedIn, setPendingLinkedIn] = useState("");

  // Work Experience Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingExp, setEditingExp] = useState<WorkExperience>(emptyExperience);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // Generic modal states for alerts
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "confirm" | "danger" | "info" | "success";
    onConfirm?: () => void;
  }>({ isOpen: false, title: "", message: "", variant: "info" });

  const showModal = (
    title: string,
    message: string,
    variant: "info" | "success" | "danger" = "info",
    onConfirm?: () => void,
  ) => {
    setModal({ isOpen: true, title, message, variant, onConfirm });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Mark form as dirty when data changes (after initial load)
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (initialLoadDone.current) {
      setHasUnsavedChanges(true);
    }
  }, [
    skills,
    workExperience,
    jobTitles,
    industries,
    workArrangement,
    salaryMin,
    location,
    linkedIn,
  ]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Load user data from Clerk metadata on mount
  useEffect(() => {
    if (isLoaded && user) {
      setName(user.fullName || user.firstName || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");

      const metadata = user.unsafeMetadata as Record<string, unknown>;
      const onboardingData = metadata?.onboardingData as
        | Record<string, unknown>
        | undefined;
      const parsedResume = metadata?.parsedResume as
        | Record<string, unknown>
        | undefined;

      if (onboardingData) {
        setSkills((onboardingData.skills as string[]) || []);
        setJobTitles((onboardingData.jobTitles as string) || "");
        setIndustries((onboardingData.industries as string) || "");
        setWorkArrangement((onboardingData.workArrangement as string) || "any");
        setSalaryMin((onboardingData.salaryMin as string) || "");
        if (onboardingData.locations) {
          setLocation(onboardingData.locations as string);
        }
      }

      if (parsedResume) {
        if (parsedResume.phone) setPhone(parsedResume.phone as string);
        if (parsedResume.linkedin) setLinkedIn(parsedResume.linkedin as string);
        if (parsedResume.location && !location)
          setLocation(parsedResume.location as string);
        if (parsedResume.experience) {
          setWorkExperience(parsedResume.experience as WorkExperience[]);
        }
        if (parsedResume.fileName) {
          setCurrentResumeFileName(parsedResume.fileName as string);
        }
      }

      // Mark initial load as done so future changes are tracked
      setTimeout(() => {
        initialLoadDone.current = true;
      }, 100);
    }
  }, [isLoaded, user]);

  const handleAddSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (3MB max)
    if (file.size > MAX_RESUME_SIZE_BYTES) {
      showModal(
        "File Too Large",
        `Please upload a file smaller than ${MAX_RESUME_SIZE_MB}MB.`,
        "danger",
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      const token = await getToken();
      const data = await uploadResumeWithProgress(
        file,
        setUploadProgress,
        token || undefined,
      );

      // Location: only update if currently empty
      if (data.location && !location) {
        setLocation(data.location);
      }

      // Skills: MERGE - add new skills, keep existing, deduplicate
      const mergedSkills =
        data.skills && data.skills.length > 0
          ? Array.from(new Set([...skills, ...data.skills]))
          : skills;
      if (data.skills && data.skills.length > 0) {
        setSkills(mergedSkills);
      }

      // Work Experience: MERGE - compute merged value BEFORE saving to avoid stale state
      let mergedExperience = workExperience;
      if (data.experience && data.experience.length > 0) {
        const existingKeys = new Set(
          workExperience.map(
            (exp) =>
              `${exp.title?.toLowerCase()}|${exp.company?.toLowerCase()}`,
          ),
        );
        const newExperiences = data.experience.filter(
          (exp: ParsedWorkExperience) =>
            !existingKeys.has(
              `${exp.title?.toLowerCase()}|${exp.company?.toLowerCase()}`,
            ),
        );
        mergedExperience = [...workExperience, ...newExperiences];
        setWorkExperience(mergedExperience);
      }

      // LinkedIn: Show confirmation modal if different
      if (data.linkedin && data.linkedin !== linkedIn) {
        setPendingLinkedIn(data.linkedin);
        setShowLinkedInModal(true);
      }

      setUploadSuccess(true);
      setCurrentResumeFileName(file.name);

      // Save merged data to Clerk metadata - separate try/catch to isolate errors
      // Truncate raw_text to 5000 chars to avoid Clerk's 8KB metadata limit
      if (user) {
        try {
          const truncatedRawText = data.raw_text?.slice(0, 5000) || "";
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              parsedResume: {
                ...((user.unsafeMetadata?.parsedResume as Record<
                  string,
                  unknown
                >) || {}),
                skills: mergedSkills,
                experience: mergedExperience,
                linkedin: linkedIn || data.linkedin,
                location: location || data.location,
                raw_text: truncatedRawText,
                uploadedAt: new Date().toISOString(),
                fileName: file.name,
              },
            },
          });
        } catch {
          showModal(
            "Partial Success",
            "Resume parsed successfully but failed to save to your profile. Please try clicking 'Save Changes' to retry.",
            "info",
          );
        }
      }
    } catch {
      showModal(
        "Upload Failed",
        "Failed to parse resume. Please try again.",
        "danger",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle LinkedIn update confirmation
  const handleLinkedInConfirm = () => {
    setLinkedIn(pendingLinkedIn);
    setShowLinkedInModal(false);
    setPendingLinkedIn("");
  };

  const handleLinkedInCancel = () => {
    setShowLinkedInModal(false);
    setPendingLinkedIn("");
  };

  // Work Experience CRUD handlers
  const handleOpenAddModal = () => {
    setEditingIndex(null);
    setEditingExp(emptyExperience);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (index: number) => {
    setEditingIndex(index);
    setEditingExp({ ...workExperience[index] });
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingIndex(null);
    setEditingExp(emptyExperience);
  };

  const handleSaveExperience = () => {
    if (!editingExp.title.trim() || !editingExp.company.trim()) {
      showModal(
        "Missing Information",
        "Please fill in at least the job title and company name.",
        "info",
      );
      return;
    }

    if (editingIndex !== null) {
      const updated = [...workExperience];
      updated[editingIndex] = editingExp;
      setWorkExperience(updated);
    } else {
      setWorkExperience([...workExperience, editingExp]);
    }
    handleCloseModal();
  };

  const handleDeleteExperience = (index: number) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      setWorkExperience(workExperience.filter((_, i) => i !== deleteIndex));
    }
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const handleSave = async () => {
    if (user) {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          onboardingData: {
            ...((user.unsafeMetadata?.onboardingData as Record<
              string,
              unknown
            >) || {}),
            skills,
            jobTitles,
            industries,
            locations: location,
            workArrangement,
            salaryMin,
          },
          parsedResume: {
            ...((user.unsafeMetadata?.parsedResume as Record<
              string,
              unknown
            >) || {}),
            phone,
            location,
            linkedin: linkedIn,
            experience: workExperience,
          },
        },
      });
      setHasUnsavedChanges(false);
      showModal(
        "Saved!",
        "Your profile has been saved successfully.",
        "success",
      );
    }
  };

  return (
    <PageWrapper maxWidth="4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="space-y-6">
        <BasicInfoSection
          name={name}
          email={email}
          phone={phone}
          location={location}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPhoneChange={setPhone}
          onLocationChange={setLocation}
        />

        <ResumeSection
          uploadSuccess={uploadSuccess}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          currentResumeFileName={currentResumeFileName}
          fileInputRef={fileInputRef}
          onFileChange={handleFileUpload}
          maxSizeMB={MAX_RESUME_SIZE_MB}
        />

        <SkillsSection
          skills={skills}
          newSkill={newSkill}
          onNewSkillChange={setNewSkill}
          onAddSkill={handleAddSkill}
          onRemoveSkill={handleRemoveSkill}
        />

        <WorkExperienceSection
          experiences={workExperience}
          onAdd={handleOpenAddModal}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteExperience}
        />

        <PreferencesSection
          jobTitles={jobTitles}
          industries={industries}
          salaryMin={salaryMin}
          workArrangement={workArrangement}
          onJobTitlesChange={setJobTitles}
          onIndustriesChange={setIndustries}
          onSalaryMinChange={setSalaryMin}
          onWorkArrangementChange={setWorkArrangement}
        />

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      {/* Edit Experience Modal */}
      <WorkExperienceModal
        isOpen={isEditModalOpen}
        experience={editingExp}
        isEditing={editingIndex !== null}
        onClose={handleCloseModal}
        onSave={handleSaveExperience}
        onChange={setEditingExp}
      />

      {/* LinkedIn Update Confirmation Modal */}
      {showLinkedInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-blue-500" />
                LinkedIn Found in Resume
              </h3>
              <button
                onClick={handleLinkedInCancel}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              We found a LinkedIn URL in your resume. Would you like to update
              your profile?
            </p>

            <div className="bg-muted/50 rounded-lg p-3 mb-6">
              <p className="text-xs text-muted-foreground mb-1">
                New LinkedIn:
              </p>
              <a
                href={pendingLinkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {pendingLinkedIn}
              </a>
            </div>

            {linkedIn && (
              <div className="bg-muted/30 rounded-lg p-3 mb-6">
                <p className="text-xs text-muted-foreground mb-1">
                  Current LinkedIn:
                </p>
                <span className="text-sm text-foreground break-all">
                  {linkedIn}
                </span>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleLinkedInCancel}>
                Keep Current
              </Button>
              <Button onClick={handleLinkedInConfirm}>Update LinkedIn</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Experience?"
        message="Are you sure you want to delete this work experience? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Generic Modal for alerts */}
      <ConfirmationModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        confirmText="OK"
        showCancel={false}
        onConfirm={modal.onConfirm || closeModal}
        onCancel={closeModal}
      />
    </PageWrapper>
  );
}
