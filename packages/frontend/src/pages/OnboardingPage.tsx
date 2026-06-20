import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getApiUrl } from "@/lib/api-url";
import { WelcomeStep } from "./onboarding/steps/WelcomeStep";
import { ResumeStep } from "./onboarding/steps/ResumeStep";
import { SkillsStep } from "./onboarding/steps/SkillsStep";
import { PreferencesStep } from "./onboarding/steps/PreferencesStep";
import { CompleteStep } from "./onboarding/steps/CompleteStep";

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
          {currentStep === 1 && <WelcomeStep />}

          {currentStep === 2 && (
            <ResumeStep
              isParsing={isParsing}
              parseError={parseError}
              resumeFile={resumeFile}
              skillsCount={skills.length}
              onResumeUpload={handleResumeUpload}
            />
          )}

          {currentStep === 3 && (
            <SkillsStep
              skills={skills}
              newSkill={newSkill}
              experience={experience}
              onNewSkillChange={setNewSkill}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
              onExperienceChange={setExperience}
            />
          )}

          {currentStep === 4 && (
            <PreferencesStep
              jobTitles={jobTitles}
              industries={industries}
              locations={locations}
              workArrangement={workArrangement}
              employmentType={employmentType}
              salaryMin={salaryMin}
              onJobTitlesChange={setJobTitles}
              onIndustriesChange={setIndustries}
              onLocationsChange={setLocations}
              onWorkArrangementChange={setWorkArrangement}
              onEmploymentTypeChange={setEmploymentType}
              onSalaryMinChange={setSalaryMin}
            />
          )}

          {currentStep === 5 && <CompleteStep />}

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
