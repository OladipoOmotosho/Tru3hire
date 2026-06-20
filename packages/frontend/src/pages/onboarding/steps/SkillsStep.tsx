import { Button } from "@/components/ui/button";
import { SkillTag } from "@/components/jobs/SkillTag";

interface SkillsStepProps {
  skills: string[];
  newSkill: string;
  experience: string;
  onNewSkillChange: (v: string) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skill: string) => void;
  onExperienceChange: (v: string) => void;
}

const INPUT_CLASS =
  "px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500";

export function SkillsStep({
  skills,
  newSkill,
  experience,
  onNewSkillChange,
  onAddSkill,
  onRemoveSkill,
  onExperienceChange,
}: SkillsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-light mb-2">
          Confirm Your Skills
        </h2>
        <p className="text-gray-600">
          We've extracted these skills from your resume. Add or remove as needed.
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
              onRemove={() => onRemoveSkill(skill)}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => onNewSkillChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddSkill()}
            placeholder="Add a new skill..."
            className={`grow ${INPUT_CLASS}`}
          />
          <Button onClick={onAddSkill}>Add</Button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Years of Experience (Optional)
        </label>
        <input
          type="text"
          value={experience}
          onChange={(e) => onExperienceChange(e.target.value)}
          placeholder="e.g., 5 years"
          className={`w-full ${INPUT_CLASS}`}
        />
      </div>
    </div>
  );
}
