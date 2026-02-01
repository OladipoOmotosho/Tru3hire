import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Briefcase, Loader2, Save } from "lucide-react";

interface PreferencesSectionProps {
  jobType: string;
  employmentType: string;
  isSaving: boolean;
  onJobTypeChange: (value: string) => void;
  onEmploymentTypeChange: (value: string) => void;
  onSave: () => void;
}

export function PreferencesSection({
  jobType,
  employmentType,
  isSaving,
  onJobTypeChange,
  onEmploymentTypeChange,
  onSave,
}: PreferencesSectionProps) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Briefcase className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Job Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Customize your default search criteria
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-lg">
        <div>
          <label
            htmlFor="job-role-select"
            className="text-sm font-medium mb-1.5 block"
          >
            Desired Job Role
          </label>
          <select
            id="job-role-select"
            value={jobType}
            onChange={(e) => onJobTypeChange(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="any">Any Role</option>
            <option value="software_engineer">Software Engineer</option>
            <option value="frontend_developer">Frontend Developer</option>
            <option value="backend_developer">Backend Developer</option>
            <option value="fullstack_developer">Full Stack Developer</option>
            <option value="data_scientist">Data Scientist</option>
            <option value="product_manager">Product Manager</option>
            <option value="designer">Designer</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Employment Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "any", label: "Any Type" },
              { id: "full-time", label: "Full-time" },
              { id: "contract", label: "Contract" },
              { id: "internship", label: "Internship" },
            ].map((type) => (
              <div
                key={type.id}
                onClick={() => onEmploymentTypeChange(type.id)}
                role="button"
                tabIndex={0}
                aria-pressed={employmentType === type.id}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onEmploymentTypeChange(type.id);
                  }
                }}
                className={`
                  cursor-pointer rounded-lg border p-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  ${
                    employmentType === type.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-muted/50"
                  }
                `}
              >
                {type.label}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
