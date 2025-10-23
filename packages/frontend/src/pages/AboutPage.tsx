import { Card } from "../components/ui/card";
import {
  Shield,
  Brain,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Lock,
  Eye,
  FileText,
  Code,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Custom Gradient */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 bg-background" />
        </div>
        {/* <div className="absolute inset-0 bg-hero-bg">
          <div className="absolute inset-0 bg-linear-to-br from-hero-gradient-from via-hero-gradient-via to-hero-gradient-to" />
        </div> */}

        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 mt-10">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">About SafeHire</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold mb-6 text-foreground">
              Protecting Newcomers from Job Scams
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Every year, thousands of newcomers to Canada fall victim to
              fraudulent job postings. SafeHire uses AI to help identify and
              avoid these scams.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 mt-10">
        <div className="max-w-5xl mx-auto">
          {/* Mission */}
          <Card className="p-8 md:p-12 mb-12 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border-primary/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">
                Our Mission
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                To empower newcomers with the tools and knowledge to identify
                fake job offers, build confidence during their job search, and
                learn to recognize warning signs of employment scams.
              </p>
            </div>
          </Card>

          {/* The Problem */}
          <div className="mb-16">
            <h2 className="text-3xl font-semibold mb-8 text-center text-foreground">
              The Problem We're Solving
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-lg transition-all duration-300 border-destructive/20">
                <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <h4 className="text-lg font-medium mb-2 text-foreground">
                  Financial Loss
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Scammers exploit newcomers' urgency to find work, leading to
                  loss of money through fake fees and deposits.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all duration-300 border-accent/50">
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-accent-foreground" />
                </div>
                <h4 className="text-lg font-medium mb-2 text-foreground">
                  Identity Theft
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Fake job postings often request sensitive personal information
                  that can be used for identity theft.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-all duration-300 border-primary/20">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-medium mb-2 text-foreground">
                  Slower Integration
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Employment scams delay newcomers' ability to find legitimate
                  work and integrate into the workforce.
                </p>
              </Card>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-16">
            <h2 className="text-3xl font-semibold mb-8 text-center text-foreground">
              How SafeHire Works
            </h2>
            <Card className="p-8 md:p-10 bg-card border-border">
              <div className="space-y-8">
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-medium mb-2 text-foreground">
                      AI Pattern Recognition
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Our AI model is trained on thousands of legitimate and
                      fraudulent job postings to recognize text patterns, tone,
                      and language commonly used in scams.
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-medium mb-2 text-foreground">
                      Rule-Based Detection
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We check for obvious red flags such as personal emails,
                      payment requests, unrealistic promises, and suspicious
                      contact information.
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 bg-green-500/10 dark:bg-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-medium mb-2 text-foreground">
                      Trust Score & Explanation
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      You receive a clear Trust Score (0-100) along with
                      detailed explanations of any warning signs, helping you
                      make informed decisions.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* What We Check */}
          <div className="mb-16">
            <h2 className="text-3xl font-semibold mb-8 text-center text-foreground">
              What We Analyze
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 md:p-8 bg-destructive/5 border-destructive/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <h4 className="text-lg font-semibold text-destructive">
                    Red Flags We Detect
                  </h4>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Personal email addresses (not company domains)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Requests for upfront payments or fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Unrealistic salary promises</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Excessive urgency or pressure tactics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Requests for sensitive personal information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Vague or missing company details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>"Too good to be true" job offers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <span>Guaranteed income claims</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 md:p-8 bg-green-500/5 dark:bg-green-500/10 border-green-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-500/10 dark:bg-green-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-green-600 dark:text-green-400">
                    Trust Indicators
                  </h4>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">
                      ✓
                    </span>
                    <span>Company email domain addresses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">
                      ✓
                    </span>
                    <span>Detailed job responsibilities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">
                      ✓
                    </span>
                    <span>Realistic salary ranges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">
                      ✓
                    </span>
                    <span>Clear company information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">
                      ✓
                    </span>
                    <span>Professional language and formatting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">
                      ✓
                    </span>
                    <span>Transparent application process</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">
                      ✓
                    </span>
                    <span>Verifiable company details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">
                      ✓
                    </span>
                    <span>Standard hiring practices</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          {/* Privacy & Ethics */}
          <Card className="p-8 md:p-10 mb-12 bg-muted/30 border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">
                Privacy & Ethics
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      We do not store personal data
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your job posting submissions are analyzed in real-time and
                      are not stored in our systems.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      Text-only analysis
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Our AI only analyzes text patterns, not user identities or
                      personal information.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <Eye className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      Advisory results
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Our results are recommendations based on pattern analysis,
                      not definitive judgments. Always conduct your own
                      research.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Code className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      Transparency
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We believe in open, ethical AI. Our detection methods are
                      documented and our code is available for review.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center py-12">
            <h3 className="text-2xl font-semibold mb-4 text-foreground">
              Ready to Check a Job Posting?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Get instant analysis and protect yourself from employment scams.
            </p>
            <Link to="/analyze">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                Analyze Job Posting
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
