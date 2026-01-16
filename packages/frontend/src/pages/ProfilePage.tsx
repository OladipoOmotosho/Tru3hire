import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkillTag } from "@/components/jobs/SkillTag";
import {
  Upload,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  ExternalLink,
  X,
  FileText,
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { useUser } from "@clerk/clerk-react";
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
    onConfirm?: () => void
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
        "danger"
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      const data = await uploadResumeWithProgress(file, setUploadProgress);

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
            (exp) => `${exp.title?.toLowerCase()}|${exp.company?.toLowerCase()}`
          )
        );
        const newExperiences = data.experience.filter(
          (exp: ParsedWorkExperience) =>
            !existingKeys.has(
              `${exp.title?.toLowerCase()}|${exp.company?.toLowerCase()}`
            )
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
            "info"
          );
        }
      }
    } catch {
      showModal(
        "Upload Failed",
        "Failed to parse resume. Please try again.",
        "danger"
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
        "info"
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
        "success"
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
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State/Country"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </Card>

        {/* Resume Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-foreground">Resume</h2>
            {uploadSuccess && (
              <span className="text-green-600 text-sm font-medium">
                ✨ Profile pre-filled from resume!
              </span>
            )}
          </div>

          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.doc"
              onChange={handleFileUpload}
            />

            {isUploading ? (
              <div className="flex flex-col items-center w-full max-w-xs mx-auto">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                <p className="text-muted-foreground mb-3">
                  {uploadProgress < 100
                    ? "Uploading..."
                    : "Analyzing resume..."}
                </p>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-200 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {uploadProgress}%
                </p>
              </div>
            ) : currentResumeFileName && !uploadSuccess ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">
                      {currentResumeFileName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Current resume
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Click to replace (max {MAX_RESUME_SIZE_MB}MB)
                </p>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Replace Resume
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  Click to upload your resume
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports PDF, DOC, DOCX (max {MAX_RESUME_SIZE_MB}MB)
                </p>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resume
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Skills Section */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Skills</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <SkillTag
                    key={skill}
                    skill={skill}
                    removable
                    onRemove={() => handleRemoveSkill(skill)}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No skills added yet
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
              placeholder="Add a new skill..."
              className="grow px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={handleAddSkill}>Add</Button>
          </div>
        </Card>

        {/* Experience Timeline */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">
              Work Experience
            </h2>
            <Button variant="outline" size="sm" onClick={handleOpenAddModal}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-4">
            {workExperience.length > 0 ? (
              workExperience.map((exp, index) => (
                <div
                  key={index}
                  className="border-l-2 border-primary pl-4 pb-4 relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {exp.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {exp.company}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {exp.start_date || "Unknown"} –{" "}
                        {exp.is_current ? "Present" : exp.end_date || "Unknown"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(index)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteExperience(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground italic text-center py-4">
                No work experience added. Upload a resume or add manually!
              </p>
            )}
          </div>
        </Card>

        {/* Job Preferences */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Job Preferences
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Desired Job Titles
              </label>
              <input
                type="text"
                value={jobTitles}
                onChange={(e) => setJobTitles(e.target.value)}
                placeholder="e.g., Senior Software Engineer, Tech Lead"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Industries
              </label>
              <input
                type="text"
                value={industries}
                onChange={(e) => setIndustries(e.target.value)}
                placeholder="e.g., Technology, Finance"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Minimum Salary
                </label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="100000"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Work Arrangement
                </label>
                <select
                  value={workArrangement}
                  onChange={(e) => setWorkArrangement(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="any">Any</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

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
