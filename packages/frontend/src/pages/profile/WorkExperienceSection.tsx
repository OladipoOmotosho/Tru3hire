import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { WorkExperience } from "@/components/WorkExperienceModal";

interface WorkExperienceSectionProps {
  experiences: WorkExperience[];
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export function WorkExperienceSection({
  experiences,
  onAdd,
  onEdit,
  onDelete,
}: WorkExperienceSectionProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Work Experience</h2>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-4">
        {experiences.length > 0 ? (
          experiences.map((exp, index) => (
            <div
              key={index}
              className="border-l-2 border-primary pl-4 pb-4 relative"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{exp.title}</h3>
                  <p className="text-sm text-muted-foreground">{exp.company}</p>
                  <p className="text-sm text-muted-foreground">
                    {exp.start_date || "Unknown"} –{" "}
                    {exp.is_current ? "Present" : exp.end_date || "Unknown"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(index)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => onDelete(index)}
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
  );
}
