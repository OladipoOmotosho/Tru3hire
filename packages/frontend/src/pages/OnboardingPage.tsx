import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SkillTag } from "@/components/jobs/SkillTag";
import { useUser } from "@clerk/clerk-react";
import { Upload, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getApiUrl } from "@/lib/api-url";

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

interface ParsedResumeData {
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  location: string | null;
  skills: string[];
  experience: { title: string; company: string }[];
  education: { degree: string; institution: string }[];
  years_of_experience: number | null;
  raw_text?: string; // For TrueScore resume matching
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [experience, setExperience] = useState("");
  const [jobTitles, setJobTitles] = useState("");
  const [industries, setIndustries] = useState("");
  const [locations, setLocations] = useState("");
  const [workArrangement, setWorkArrangement] = useState("any");
  const [employmentType, setEmploymentType] = useState("any");
  const [salaryMin, setSalaryMin] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (3MB max)
    const MAX_SIZE_BYTES = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setParseError("File too large. Please upload a file smaller than 3MB.");
      return;
    }

    setResumeFile(file);
    setIsParsing(true);
    setParseError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const API_URL = await getApiUrl();
      const response = await fetch(`${API_URL}/api/resume/parse`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to parse resume");
      }

      const result = await response.json();
      const data = result.data as ParsedResumeData;

      // Store parsed data
      setParsedData(data);

      // Prefill fields
      setSkills(data.skills || []);
      if (data.years_of_experience) {
        setExperience(`${data.years_of_experience} years`);
      }
      if (data.location) {
        setLocations(data.location);
      }
      // Prefill job titles from experience
      if (data.experience?.length > 0) {
        const titles = data.experience.map((exp) => exp.title).filter(Boolean);
        if (titles.length > 0) {
          setJobTitles(titles.join(", "));
        }
      }
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : "Failed to parse resume",
      );
      // Fallback to empty skills
      setSkills([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleComplete = async () => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      toast.error("You must be signed in to complete onboarding");
      navigate("/sign-in");
      return;
    }

    setIsSubmitting(true);

    // Save onboarding completion to Clerk's user metadata
    try {
      // 1) Save minimal onboarding state first (most important)
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          onboardingComplete: true,
          hasCompletedOnboarding: true, // Backwards compatibility for older checks
          onboardingData: {
            skills,
            experience,
            jobTitles,
            industries,
            locations,
            workArrangement,
            employmentType,
            salaryMin,
          },
          // Job preferences for TrueScore matching
          jobPreferences: {
            job_type: workArrangement,
            employment_type: employmentType,
          },
        },
      });

      // 2) Save parsed resume separately to reduce chance of whole update failing
      if (parsedData) {
        try {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              parsedResume: {
                name: parsedData.name,
                email: parsedData.email,
                phone: parsedData.phone,
                linkedin: parsedData.linkedin,
                location: parsedData.location,
                experience: parsedData.experience,
                education: parsedData.education,
                years_of_experience: parsedData.years_of_experience,
                raw_text: parsedData.raw_text?.slice(0, 3000), // safer budget for Clerk metadata limits
                uploadedAt: new Date().toISOString(),
                fileName: resumeFile?.name,
                skills: parsedData.skills,
              },
            },
          });
        } catch (resumeErr) {
          console.warn(
            "Resume metadata save failed after onboarding success:",
            resumeErr,
          );
          toast.warning(
            "Onboarding completed, but resume details were not fully saved. You can re-upload in Profile.",
          );
        }
      }

      toast.success("Onboarding complete. TrueScore is now unlocked.");
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to update user profile:", err);
      toast.error("Failed to save onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return resumeFile !== null;
      case 3:
        return skills.length > 0;
      case 4:
        return jobTitles.trim() !== "";
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background py-[100px] px-4">
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Step {currentStep} of {totalSteps}
            </span>
            <span>
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        <Card className="p-8">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-info-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-info-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-light">
                Welcome to TrueHire!
              </h1>
              <p className="text-lg text-gray-600 max-w-xl mx-auto">
                Let's personalize your job search experience. We'll help you
                find jobs that truly match your skills and preferences.
              </p>
              <div className="bg-info-50 border border-info-200 rounded-lg p-4 text-left">
                <p className="text-sm text-info-900">
                  <strong>What to expect:</strong>
                </p>
                <ul className="list-disc list-inside text-sm text-info-800 mt-2 space-y-1">
                  <li>
                    Upload your resume (we'll extract your skills automatically)
                  </li>
                  <li>Confirm and edit your skills and experience</li>
                  <li>Set your job preferences</li>
                  <li>Start getting personalized TrueScore recommendations</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Resume Upload */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-light mb-2">
                  Upload Your Resume
                </h2>
                <p className="text-gray-600">
                  We'll automatically extract your skills and experience to
                  personalize your job recommendations.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop your resume here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports PDF, DOC, DOCX (max 3MB)
                </p>
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <Button asChild>
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </div>

              {/* Loading State */}
              {isParsing && (
                <div className="flex items-center gap-3 p-4 bg-info-50 border border-info-200 rounded-lg">
                  <Loader2 className="w-5 h-5 text-info-600 animate-spin" />
                  <div>
                    <p className="font-medium text-info-900">
                      Analyzing your resume...
                    </p>
                    <p className="text-sm text-info-700">
                      Extracting skills and experience
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {parseError && !isParsing && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive">{parseError}</p>
                  <p className="text-sm text-destructive-foreground mt-1">
                    You can still continue and add skills manually.
                  </p>
                </div>
              )}

              {/* Success State */}
              {resumeFile && !isParsing && !parseError && (
                <div className="flex items-center gap-3 p-4 bg-background border border-foreground rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-success-600" />
                  <div className="grow">
                    <p className="font-medium text-foreground">
                      {resumeFile.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(resumeFile.size / 1024).toFixed(0)} KB
                      {skills.length > 0 &&
                        ` • ${skills.length} skills extracted`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm Skills */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-light mb-2">
                  Confirm Your Skills
                </h2>
                <p className="text-gray-600">
                  We've extracted these skills from your resume. Add or remove
                  as needed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Skills
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((skill) => (
                    <SkillTag
                      key={skill}
                      skill={skill}
                      removable
                      onRemove={() => handleRemoveSkill(skill)}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                    placeholder="Add a new skill..."
                    className="grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
                  />
                  <Button onClick={handleAddSkill}>Add</Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience (Optional)
                </label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g., 5 years"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
                />
              </div>
            </div>
          )}

          {/* Step 4: Job Preferences */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-light mb-2">
                  Job Preferences
                </h2>
                <p className="text-gray-600">
                  Tell us what you're looking for to get the best TrueScore
                  matches.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desired Job Titles <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={jobTitles}
                  onChange={(e) => setJobTitles(e.target.value)}
                  placeholder="e.g., Senior Software Engineer, Tech Lead"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Industries
                </label>
                <input
                  type="text"
                  value={industries}
                  onChange={(e) => setIndustries(e.target.value)}
                  placeholder="e.g., Technology, Finance, Healthcare"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desired Locations
                </label>
                <input
                  type="text"
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                  placeholder="e.g., San Francisco, Remote, New York"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Arrangement
                </label>
                <select
                  value={workArrangement}
                  onChange={(e) => setWorkArrangement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500 bg-background"
                >
                  <option value="any">Any</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500 bg-background"
                >
                  <option value="any">Any</option>
                  <option value="full-time">Full-time</option>
                  <option value="contract">Contract</option>
                  <option value="part-time">Part-time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Salary (Optional)
                </label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="e.g., 100000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
                />
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-success-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-light">
                You're All Set!
              </h1>
              <p className="text-lg text-gray-600 max-w-xl mx-auto">
                Your profile is ready. We'll now show you personalized job
                recommendations with TrueScore ratings based on your skills and
                preferences.
              </p>
              <div className="bg-info-50 border border-info-200 rounded-lg p-4 text-left">
                <p className="text-sm text-info-900 font-medium mb-2">
                  What happens next:
                </p>
                <ul className="list-disc list-inside text-sm text-info-800 space-y-1">
                  <li>Browse jobs with personalized TrueScore ratings</li>
                  <li>See which skills you're missing for top opportunities</li>
                  <li>Track your applications in the pipeline manager</li>
                  <li>Get insights about companies and hiring trends</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            {currentStep < 5 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isSubmitting || !isLoaded}
              >
                {(isSubmitting || !isLoaded) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Go to Dashboard
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
