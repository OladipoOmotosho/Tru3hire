import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, ComingSoon } from "@/components/EmptyState";
import { Search, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";

export function JobSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search API call
  };

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Find Jobs</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <div className="grow relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Job title, keywords, or company..."
                className="w-full pl-10 pr-4 py-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <input
              type="text"
              placeholder="Location"
              className="w-64 px-4 py-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" className="px-8">
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Coming Soon Message */}
      <Card className="p-8">
        <ComingSoon
          title="Job Search Coming Soon"
          description="We're building a smart job search powered by TrueScore rankings. For now, you can analyze individual job postings."
        />
        <div className="text-center mt-6">
          <Button onClick={() => navigate("/analyze")}>
            <Briefcase className="w-4 h-4 mr-2" />
            Analyze a Job Posting
          </Button>
        </div>
      </Card>
    </PageWrapper>
  );
}
