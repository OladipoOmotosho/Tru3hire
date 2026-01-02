import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ParsedWorkExperience } from "@/lib/api";

export interface WorkExperience extends ParsedWorkExperience {}

export interface WorkExperienceModalProps {
  isOpen: boolean;
  experience: WorkExperience;
  isEditing: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (exp: WorkExperience) => void;
}

export function WorkExperienceModal({
  isOpen,
  experience,
  isEditing,
  onClose,
  onSave,
  onChange,
}: WorkExperienceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">
              {isEditing ? "Edit Experience" : "Add Experience"}
            </h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Job Title *
              </label>
              <input
                type="text"
                value={experience.title}
                onChange={(e) =>
                  onChange({ ...experience, title: e.target.value })
                }
                placeholder="e.g., Software Engineer"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Company *
              </label>
              <input
                type="text"
                value={experience.company}
                onChange={(e) =>
                  onChange({ ...experience, company: e.target.value })
                }
                placeholder="e.g., Google"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Start Date
                </label>
                <input
                  type="text"
                  value={experience.start_date || ""}
                  onChange={(e) =>
                    onChange({
                      ...experience,
                      start_date: e.target.value || null,
                    })
                  }
                  placeholder="e.g., Jan 2020"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  End Date
                </label>
                <input
                  type="text"
                  value={experience.end_date || ""}
                  onChange={(e) =>
                    onChange({
                      ...experience,
                      end_date: e.target.value || null,
                    })
                  }
                  placeholder="e.g., Dec 2023"
                  disabled={experience.is_current}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={experience.is_current}
                onChange={(e) =>
                  onChange({
                    ...experience,
                    is_current: e.target.checked,
                    end_date: e.target.checked ? null : experience.end_date,
                  })
                }
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">
                I currently work here
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                value={experience.description}
                onChange={(e) =>
                  onChange({
                    ...experience,
                    description: e.target.value,
                  })
                }
                placeholder="Describe your responsibilities and achievements..."
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSave}>
              {isEditing ? "Save Changes" : "Add Experience"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
