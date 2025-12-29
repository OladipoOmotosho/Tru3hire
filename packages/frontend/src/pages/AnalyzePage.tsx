import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { JobInputForm } from "../components/JobInputForm";
import {
  Shield,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Zap,
  Lock,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { analyzeJob, AnalysisResponse } from "../lib/api";
import { PageWrapper } from "../components/PageWrapper";

// Import illustrations - User can pick from 3 styles
import JobHuntAmico from "../assets/svg/Job hunt-amico.svg";
import JobHuntBro from "../assets/svg/Job hunt-bro.svg";
import JobHuntCuate from "../assets/svg/Job hunt-cuate.svg";

// ============================================================================
// CHANGE THIS TO SWITCH ILLUSTRATION STYLE
// Options: "amico" | "bro" | "cuate"
// ============================================================================
const ILLUSTRATION_STYLE: "amico" | "bro" | "cuate" = "amico";

const ILLUSTRATIONS = {
  amico: JobHuntAmico,
  bro: JobHuntBro,
  cuate: JobHuntCuate,
};

export function AnalyzePage() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CurrentIllustration = ILLUSTRATIONS[ILLUSTRATION_STYLE];

  const handleAnalyze = async (text: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result: AnalysisResponse = await analyzeJob({
        jobText: text,
      });

      navigate("/results", {
        state: {
          jobText: text,
          apiResult: result,
        },
      });
    } catch (err) {
      const apiError = err as { message: string };
      setError(
        apiError.message || "Failed to analyze job posting. Please try again."
      );
      setIsAnalyzing(false);
    }
  };

  return (
    <PageWrapper withNavbarOffset={true} withPadding={false} maxWidth="full">
      {/* Hero Section with Subtle Background */}
      <div className="relative min-h-screen">
        {/* Subtle gradient background - not too heavy */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-slate-900/50 dark:via-background" />

        {/* Decorative circles - subtle flair */}
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl" />

        <div className="relative px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {/* ============================================================ */}
            {/* HERO - Illustration & Headline */}
            {/* ============================================================ */}
            <div className="text-center mb-8">
              {/* Illustration */}
              <div className="mb-6">
                <img
                  src={CurrentIllustration}
                  alt="Job Search Illustration"
                  className="w-64 h-64 mx-auto drop-shadow-lg"
                />
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4 animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">
                  AI-Powered Protection
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Is This Job <span className="text-primary">Real</span> or{" "}
                <span className="text-red-500">Fake</span>?
              </h1>

              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Paste any job description and our AI will detect scams, red
                flags, and give you a safety score in seconds.
              </p>
            </div>

            {/* ============================================================ */}
            {/* TRUST BADGES */}
            {/* ============================================================ */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-muted-foreground">ML-Powered</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-muted-foreground">Private & Secure</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-muted-foreground">Instant Results</span>
              </div>
            </div>

            {/* ============================================================ */}
            {/* MAIN FORM CARD */}
            {/* ============================================================ */}
            <Card className="p-6 md:p-8 shadow-xl border-2 border-border/50 bg-card/95 backdrop-blur-sm">
              {/* Form Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Paste Job Description
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    We'll analyze it for red flags and scam patterns
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              )}

              {/* Job Input Form */}
              <JobInputForm onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
            </Card>

            {/* ============================================================ */}
            {/* SIGN UP CTA */}
            {/* ============================================================ */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Want full TrueScore, skill matching, and job tracking?
              </p>
              <div className="flex gap-3 justify-center">
                <Link to="/sign-up">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Create Free Account
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="ghost" size="sm">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            {/* Footer Trust Text */}
            <p className="text-center text-xs text-muted-foreground mt-8">
              🔒 All analysis happens in real-time • No data stored • 100%
              confidential
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
