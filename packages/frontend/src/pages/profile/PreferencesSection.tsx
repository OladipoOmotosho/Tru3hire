import { Card } from "@/components/ui/card";

interface PreferencesSectionProps {
  jobTitles: string;
  industries: string;
  salaryMin: string;
  workArrangement: string;
  onJobTitlesChange: (v: string) => void;
  onIndustriesChange: (v: string) => void;
  onSalaryMinChange: (v: string) => void;
  onWorkArrangementChange: (v: string) => void;
}

const INPUT_CLASS =
  "w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

export function PreferencesSection({
  jobTitles,
  industries,
  salaryMin,
  workArrangement,
  onJobTitlesChange,
  onIndustriesChange,
  onSalaryMinChange,
  onWorkArrangementChange,
}: PreferencesSectionProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Job Preferences</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Desired Job Titles
          </label>
          <input
            type="text"
            value={jobTitles}
            onChange={(e) => onJobTitlesChange(e.target.value)}
            placeholder="e.g., Senior Software Engineer, Tech Lead"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Industries
          </label>
          <input
            type="text"
            value={industries}
            onChange={(e) => onIndustriesChange(e.target.value)}
            placeholder="e.g., Technology, Finance"
            className={INPUT_CLASS}
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
              onChange={(e) => onSalaryMinChange(e.target.value)}
              placeholder="100000"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Work Arrangement
            </label>
            <select
              value={workArrangement}
              onChange={(e) => onWorkArrangementChange(e.target.value)}
              className={INPUT_CLASS}
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
  );
}
