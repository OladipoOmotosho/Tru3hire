interface PreferencesStepProps {
  jobTitles: string;
  industries: string;
  locations: string;
  workArrangement: string;
  employmentType: string;
  salaryMin: string;
  onJobTitlesChange: (v: string) => void;
  onIndustriesChange: (v: string) => void;
  onLocationsChange: (v: string) => void;
  onWorkArrangementChange: (v: string) => void;
  onEmploymentTypeChange: (v: string) => void;
  onSalaryMinChange: (v: string) => void;
}

const INPUT_CLASS =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500";
const SELECT_CLASS = `${INPUT_CLASS} bg-background`;

export function PreferencesStep({
  jobTitles,
  industries,
  locations,
  workArrangement,
  employmentType,
  salaryMin,
  onJobTitlesChange,
  onIndustriesChange,
  onLocationsChange,
  onWorkArrangementChange,
  onEmploymentTypeChange,
  onSalaryMinChange,
}: PreferencesStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-light mb-2">
          Job Preferences
        </h2>
        <p className="text-gray-600">
          Tell us what you're looking for to get the best TrueScore matches.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Desired Job Titles <span className="text-destructive">*</span>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Industries
        </label>
        <input
          type="text"
          value={industries}
          onChange={(e) => onIndustriesChange(e.target.value)}
          placeholder="e.g., Technology, Finance, Healthcare"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Desired Locations
        </label>
        <input
          type="text"
          value={locations}
          onChange={(e) => onLocationsChange(e.target.value)}
          placeholder="e.g., San Francisco, Remote, New York"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Work Arrangement
        </label>
        <select
          value={workArrangement}
          onChange={(e) => onWorkArrangementChange(e.target.value)}
          className={SELECT_CLASS}
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
          onChange={(e) => onEmploymentTypeChange(e.target.value)}
          className={SELECT_CLASS}
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
          onChange={(e) => onSalaryMinChange(e.target.value)}
          placeholder="e.g., 100000"
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
}
