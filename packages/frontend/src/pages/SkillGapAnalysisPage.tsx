import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/EmptyState";
import { FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";

export function SkillGapAnalysisPage() {
  const navigate = useNavigate();

  // TODO: Check if user has uploaded resume
  const hasResume = false;

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Skill Gap Analysis
        </h1>
        <p className="text-muted-foreground">
          Identify skills to learn and get personalized course recommendations
        </p>
      </div>

      {!hasResume ? (
        <Card className="p-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Upload Your Resume First
            </h2>
            <p className="text-muted-foreground mb-6">
              To analyze skill gaps, we need to know your current skills. Upload
              your resume and we'll extract your skills automatically.
            </p>
            <Button onClick={() => navigate("/profile")}>
              Go to Profile
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      ) : (
        <ComingSoon
          title="Skill Gap Analysis Coming Soon"
          description="We're building smart skill gap detection based on job market demand. Check back soon!"
        />
      )}
    </PageWrapper>
  );
}
