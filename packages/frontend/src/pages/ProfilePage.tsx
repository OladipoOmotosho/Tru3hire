import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkillTag } from "@/components/jobs/SkillTag";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { useUser } from "@clerk/clerk-react";
import { uploadResume, ParsedWorkExperience } from "@/lib/api";

interface WorkExperience extends ParsedWorkExperience {}

export function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [jobTitles, setJobTitles] = useState("");
  const [industries, setIndustries] = useState("");
  const [workArrangement, setWorkArrangement] = useState("any");
  const [salaryMin, setSalaryMin] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user data from Clerk metadata on mount
  useEffect(() => {
    if (isLoaded && user) {
      // Get name and email from Clerk user
      setName(user.fullName || user.firstName || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");

      // Get data from onboarding
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
        if (parsedResume.location && !location)
          setLocation(parsedResume.location as string);
        if (parsedResume.experience) {
          setWorkExperience(parsedResume.experience as WorkExperience[]);
        }
      }
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

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const data = await uploadResume(file);

      // Prefill fields with parsed data
      if (data.name) setName(data.name);
      if (data.email) setEmail(data.email);
      if (data.phone) setPhone(data.phone);
      if (data.location) setLocation(data.location);

      // Merge new skills with existing ones
      if (data.skills && data.skills.length > 0) {
        setSkills((prev) => Array.from(new Set([...prev, ...data.skills])));
      }

      // Set work experience if valid
      if (data.experience && data.experience.length > 0) {
        // Map to ensure all required fields are present if needed, though interface matches
        setWorkExperience(data.experience);
      }

      setUploadSuccess(true);

      // Auto-save parsed resume data to metadata
      if (user) {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            parsedResume: {
              ...data,
              uploadedAt: new Date().toISOString(),
              fileName: file.name,
            },
          },
        });
      }
    } catch (error) {
      console.error("Resume upload failed:", error);
      alert("Failed to parse resume. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
          },
        },
      });
      alert("Profile saved successfully!");
    }
  };

  return (
    <PageWrapper maxWidth="4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-light mb-2">My Profile</h1>
        <p className="text-gray-600">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-light mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State/Country"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Resume Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-light">Resume</h2>
            {uploadSuccess && (
              <span className="text-green-600 text-sm font-medium">
                ✨ Profile pre-filled from resume!
              </span>
            )}
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
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
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600">Analyzing resume...</p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Click to upload your resume
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports PDF, DOC, DOCX (max 5MB)
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

          {/* Current Resume Display (if applicable) */}
          <div className="mt-4">
            {/* We could list previously uploaded resume here if we stored it, currently we just parse */}
          </div>
        </Card>

        {/* Skills Section */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-light mb-4">Skills</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <p className="text-sm text-gray-400 italic">
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
              className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleAddSkill}>Add</Button>
          </div>
        </Card>

        {/* Experience Timeline */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-light mb-4">
            Work Experience
          </h2>

          <div className="space-y-4">
            {workExperience.length > 0 ? (
              workExperience.map((exp, index) => (
                <div
                  key={index}
                  className="border-l-2 border-blue-500 pl-4 pb-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-light">
                        {exp.title}
                      </h3>
                      <p className="text-sm text-gray-600">{exp.company}</p>
                      <p className="text-sm text-gray-500">
                        {exp.start_date || "Unknown"} -{" "}
                        {exp.is_current ? "Present" : exp.end_date || "Unknown"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                  {exp.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic text-center py-4">
                No work experience added. Upload a resume to auto-fill!
              </p>
            )}
          </div>

          <Button variant="outline" className="w-full mt-4">
            + Add Experience
          </Button>
        </Card>

        {/* Job Preferences */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-light mb-4">
            Job Preferences
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desired Job Titles
              </label>
              <input
                type="text"
                value={jobTitles}
                onChange={(e) => setJobTitles(e.target.value)}
                placeholder="e.g., Senior Software Engineer, Tech Lead"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industries
              </label>
              <input
                type="text"
                value={industries}
                onChange={(e) => setIndustries(e.target.value)}
                placeholder="e.g., Technology, Finance"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Salary
                </label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="100000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Arrangement
                </label>
                <select
                  value={workArrangement}
                  onChange={(e) => setWorkArrangement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Account Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-light mb-4">
            Account Settings
          </h2>

          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Email Notifications
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700"
            >
              Delete Account
            </Button>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </PageWrapper>
  );
}
