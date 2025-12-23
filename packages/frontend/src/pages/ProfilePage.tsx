import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkillTag } from "@/components/jobs/SkillTag";
import { Upload, FileText, X } from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";

export function ProfilePage() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [location, setLocation] = useState("San Francisco, CA");
  const [skills, setSkills] = useState([
    "React",
    "TypeScript",
    "Node.js",
    "Python",
  ]);
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleSave = () => {
    // TODO: Implement API call to save profile
    alert("Profile saved successfully!");
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
          <h2 className="text-xl font-bold text-gray-light mb-4">Resume</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Drop your resume here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports PDF, DOC, DOCX (max 5MB)
            </p>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </Button>
          </div>

          {/* Current Resume */}
          <div className="mt-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-light">
                    John_Doe_Resume.pdf
                  </p>
                  <p className="text-sm text-gray-500">
                    Uploaded 2 days ago • 245 KB
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  View
                </Button>
                <Button variant="ghost" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
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
              {skills.map((skill) => (
                <SkillTag
                  key={skill}
                  skill={skill}
                  removable
                  onRemove={() => handleRemoveSkill(skill)}
                />
              ))}
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
            <div className="border-l-2 border-blue-500 pl-4 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-light">
                    Senior Software Engineer
                  </h3>
                  <p className="text-sm text-gray-600">TechCorp Inc.</p>
                  <p className="text-sm text-gray-500">2021 - Present</p>
                </div>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Led development of microservices architecture, managed team of 5
                engineers.
              </p>
            </div>

            <div className="border-l-2 border-gray-300 pl-4 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-light">
                    Software Engineer
                  </h3>
                  <p className="text-sm text-gray-600">StartupXYZ</p>
                  <p className="text-sm text-gray-500">2018 - 2021</p>
                </div>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Developed full-stack features using React and Node.js.
              </p>
            </div>
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
                  placeholder="100000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Arrangement
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
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
