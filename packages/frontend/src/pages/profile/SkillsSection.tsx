import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkillTag } from "@/components/jobs/SkillTag";

interface SkillsSectionProps {
  skills: string[];
  newSkill: string;
  onNewSkillChange: (v: string) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skill: string) => void;
}

export function SkillsSection({
  skills,
  newSkill,
  onNewSkillChange,
  onAddSkill,
  onRemoveSkill,
}: SkillsSectionProps) {
  return (
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
                onRemove={() => onRemoveSkill(skill)}
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
          onChange={(e) => onNewSkillChange(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && onAddSkill()}
          placeholder="Add a new skill..."
          className="grow px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button onClick={onAddSkill}>Add</Button>
      </div>
    </Card>
  );
}
