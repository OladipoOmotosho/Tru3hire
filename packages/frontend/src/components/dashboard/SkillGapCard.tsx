import { BookOpen, Plus, Ban, Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SkillGap } from "@/lib/api";
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import { ignoreSkillGap } from "@/lib/api";
import { Link } from "react-router-dom";

interface SkillGapCardProps {
  skillGaps: SkillGap[];
  hasAnalyzedJobs: boolean;
  onRefresh?: () => void;
}

export function SkillGapCard({
  skillGaps,
  hasAnalyzedJobs,
  onRefresh,
}: SkillGapCardProps) {
  const { user } = useUser();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Maximum count to normalize progress bars
  const maxCount =
    skillGaps.length > 0 ? Math.max(...skillGaps.map((s) => s.count)) : 10;

  const handleAddSkill = async (skill: string) => {
    if (!user) return;
    setLoadingAction(`add-${skill}`);

    try {
      // 1. Get current skills
      const savedResume = user.unsafeMetadata?.parsedResume as any;
      const onboardingData = user.unsafeMetadata?.onboardingData as any;
      const currentSkills: string[] =
        onboardingData?.skills || savedResume?.skills || [];

      // 2. Add new skill if not exists
      if (!currentSkills.includes(skill)) {
        const updatedSkills = [...currentSkills, skill];

        // 3. Update Clerk metadata
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            onboardingData: {
              ...(onboardingData || {}),
              skills: updatedSkills,
            },
          },
        });

        toast.success(`added ${skill} to your profile`);
        // Trigger generic refresh if provided, or we could optimistically update local state
        // For now, simpler to just toast
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add skill");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleIgnore = async (skill: string) => {
    if (!user) return;
    setLoadingAction(`ignore-${skill}`);
    try {
      await ignoreSkillGap(user.id, skill);
      toast.success(`Ignored ${skill}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to ignore skill");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Skill Gaps</h2>
      </div>

      {hasAnalyzedJobs ? (
        skillGaps.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <p className="text-xs text-muted-foreground">
                Most requested missing skills:
              </p>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Top 5
              </span>
            </div>

            {skillGaps.map((gap) => (
              <div key={gap.skill} className="space-y-1.5 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/history?search=${encodeURIComponent(gap.skill)}`}
                      className="text-sm font-medium text-foreground hover:underline hover:text-primary transition-colors"
                    >
                      {gap.skill}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      ({gap.count} job{gap.count === 1 ? "" : "s"})
                    </span>
                  </div>
                  {/* Actions (visible on hover or always on mobile? Let's make them always visible but subtle) */}
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleAddSkill(gap.skill)}
                            disabled={loadingAction === `add-${gap.skill}`}
                          >
                            {loadingAction === `add-${gap.skill}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>I have this skill (Add to Profile)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleIgnore(gap.skill)}
                            disabled={loadingAction === `ignore-${gap.skill}`}
                          >
                            {loadingAction === `ignore-${gap.skill}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Ban className="w-3 h-3" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ignore this skill</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <Progress
                  value={(gap.count / maxCount) * 100}
                  className="h-1.5 bg-muted"
                  // We can style the indicator color via class if we had an Indicator component exposed,
                  // but shadcn Progress usually just uses primary color.
                  // Let's rely on default primary color.
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-foreground">All Clear!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No skill gaps detected in your recent jobs.
            </p>
          </div>
        )
      ) : (
        <div className="py-8 text-center bg-muted/20 rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            Analyze jobs to see skill gap insights
          </p>
        </div>
      )}
    </Card>
  );
}
