import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/EmptyState";
import { Building2, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";

export function CompanyInsightsPage() {
  const navigate = useNavigate();
  const { companyId } = useParams();

  return (
    <PageWrapper>
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Company Insights
        </h1>
        <p className="text-muted-foreground">
          Detailed company analysis and reputation data
        </p>
      </div>

      <Card className="p-8">
        <ComingSoon
          title="Company Insights Coming Soon"
          description="We're integrating with Glassdoor and other data sources to provide comprehensive company reviews, salary data, and hiring patterns."
        />
      </Card>
    </PageWrapper>
  );
}
