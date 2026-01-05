import { Card } from "../components/ui/card";
import {
  Shield,
  Brain,
  Users,
  Target,
  CheckCircle,
  TrendingUp,
  FileText,
  Scale,
  Building2,
  Sparkles,
  ArrowRight,
  Zap,
  BarChart3,
  Heart,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { PageWrapper } from "../components/PageWrapper";

export function AboutPage() {
  return (
    <PageWrapper withNavbarOffset={false} withPadding={false} maxWidth="full">
      {/* Hero Section with Gradient Mesh + Bento Grid */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Gradient Mesh Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-blue-50/80 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
          {/* Mesh gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/30 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-400/25 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-pink-400/20 rounded-full blur-[60px]" />
          <div className="absolute top-1/3 right-1/3 w-[200px] h-[200px] bg-cyan-400/20 rounded-full blur-[50px]" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="relative container mx-auto px-4">
          {/* Text Content */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-primary px-4 py-2 rounded-full mb-6 shadow-sm border border-primary/10">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Analysis</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight tracking-tight">
              Make Every Job Application
              <span className="block bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Safer & Smarter
              </span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Get instant TrueScore™ analysis across 4 key dimensions. Detect
              scams, evaluate companies, and apply with confidence.
            </p>
          </div>

          {/* Bento Grid - TrueScore Preview */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              {/* Main TrueScore - spans 2 cols on mobile, 1 on desktop */}
              <div className="col-span-2 md:col-span-1 md:row-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 dark:border-slate-700/50 shadow-lg shadow-blue-500/5 flex flex-col items-center justify-center">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-linear-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25 mb-3">
                  <span className="text-3xl md:text-4xl font-bold text-white">
                    85
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  TrueScore™
                </p>
                <p className="text-xs text-muted-foreground">Overall Rating</p>
              </div>

              {/* Metric Cards */}
              {[
                {
                  name: "Authenticity",
                  value: 92,
                  icon: Shield,
                  color: "from-green-500 to-emerald-500",
                  iconColor: "text-green-600",
                },
                {
                  name: "Hiring Likelihood",
                  value: 78,
                  icon: Target,
                  color: "from-blue-500 to-cyan-500",
                  iconColor: "text-blue-600",
                },
                {
                  name: "Resume Match",
                  value: 85,
                  icon: FileText,
                  color: "from-purple-500 to-pink-500",
                  iconColor: "text-purple-600",
                },
                {
                  name: "Reputation",
                  value: 82,
                  icon: Building2,
                  color: "from-amber-500 to-orange-500",
                  iconColor: "text-amber-600",
                },
              ].map((metric) => (
                <div
                  key={metric.name}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 dark:border-slate-700/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <metric.icon
                      className={`w-4 h-4 ${metric.iconColor} dark:opacity-90`}
                    />
                    <span className="text-xs font-medium text-muted-foreground truncate">
                      {metric.name}
                    </span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-foreground">
                      {metric.value}
                    </span>
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-linear-to-r ${metric.color} rounded-full`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link to="/analyze">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25 border-0"
              >
                <Zap className="w-5 h-5 mr-2" />
                Analyze a Job Now
              </Button>
            </Link>
            <Link to="/safety-tips">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
              >
                Learn Safety Tips
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* TrueScore Section */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Introducing TrueScore™
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A comprehensive 0-100 rating that combines multiple signals to
                give you the complete picture of any job posting.
              </p>
            </div>

            {/* TrueScore Visual */}
            <Card className="p-8 md:p-12 mb-12 bg-linear-to-br from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/50">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                {/* Score Display */}
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-linear-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/25 mb-6">
                    <div className="text-center">
                      <span className="text-5xl font-bold text-white">85</span>
                      <p className="text-white/90 text-sm font-medium">
                        TrueScore
                      </p>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    One Score. Complete Confidence.
                  </h3>
                  <p className="text-muted-foreground">
                    Stop guessing whether a job is legitimate. TrueScore
                    combines AI analysis across 4 key dimensions to give you
                    instant clarity.
                  </p>
                </div>

                {/* Breakdown */}
                <div className="space-y-4">
                  {[
                    {
                      name: "Authenticity",
                      value: 92,
                      color: "bg-green-500",
                      icon: Shield,
                    },
                    {
                      name: "Hiring Likelihood",
                      value: 78,
                      color: "bg-blue-500",
                      icon: Target,
                    },
                    {
                      name: "Resume Match",
                      value: 85,
                      color: "bg-purple-500",
                      icon: FileText,
                    },
                    {
                      name: "Company Reputation",
                      value: 82,
                      color: "bg-amber-500",
                      icon: Building2,
                    },
                  ].map((metric) => (
                    <div key={metric.name} className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 ${metric.color}/10 rounded-lg flex items-center justify-center`}
                      >
                        <metric.icon
                          className={`w-5 h-5 ${metric.color.replace(
                            "bg-",
                            "text-"
                          )}`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-foreground">
                            {metric.name}
                          </span>
                          <span className="text-muted-foreground">
                            {metric.value}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${metric.color} rounded-full transition-all duration-1000`}
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>

          {/* What We Analyze */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                What TrueHire Analyzes
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Our AI system examines every aspect of a job posting to protect
                you as well as to help you find the right opportunities.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature Cards */}
              {[
                {
                  icon: Shield,
                  title: "Scam Detection",
                  description:
                    "Identifies red flags like payment requests, unrealistic salaries, and suspicious contact info.",
                  color: "text-red-500",
                  bgColor: "bg-red-500/10",
                },
                {
                  icon: Scale,
                  title: "Bias Analysis",
                  description:
                    "Detects gendered language, age discrimination signals, and exclusionary requirements.",
                  color: "text-pink-500",
                  bgColor: "bg-pink-500/10",
                },
                {
                  icon: FileText,
                  title: "Resume Matching",
                  description:
                    "Compares your skills to job requirements and shows your match percentage.",
                  color: "text-purple-500",
                  bgColor: "bg-purple-500/10",
                },
                {
                  icon: Target,
                  title: "Hiring Likelihood",
                  description:
                    "Evaluates how likely the company is actively hiring based on job quality signals.",
                  color: "text-blue-500",
                  bgColor: "bg-blue-500/10",
                },
                {
                  icon: Building2,
                  title: "Company Reputation",
                  description:
                    "Checks company legitimacy indicators like professional email domains and details.",
                  color: "text-amber-500",
                  bgColor: "bg-amber-500/10",
                },
                {
                  icon: Brain,
                  title: "AI Insights",
                  description:
                    "Get smart recommendations tailored to each opportunity you analyze.",
                  color: "text-green-500",
                  bgColor: "bg-green-500/10",
                },
              ].map((feature) => (
                <Card
                  key={feature.title}
                  className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-16">
            <Card className="p-8 md:p-12 bg-linear-to-r from-blue-600 to-purple-600 text-white">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { value: "4", label: "Analysis Dimensions" },
                  { value: "99%", label: "PDF Parsing Accuracy" },
                  { value: "50+", label: "Scam Patterns Detected" },
                  { value: "Free", label: "Always Free to Use" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-4xl md:text-5xl font-bold mb-2">
                      {stat.value}
                    </p>
                    <p className="text-white/80 text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* How It Works */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                How It Works
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Get your TrueScore in three simple steps.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Paste or Upload",
                  description:
                    "Copy-paste a job description or upload your resume for matching analysis.",
                  icon: FileText,
                },
                {
                  step: "2",
                  title: "AI Analysis",
                  description:
                    "Our AI instantly analyzes the posting across all 4 TrueScore dimensions.",
                  icon: Brain,
                },
                {
                  step: "3",
                  title: "Get Insights",
                  description:
                    "Receive your TrueScore, detailed breakdown, and personalized recommendations.",
                  icon: BarChart3,
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                    <item.icon className="w-8 h-8 text-primary" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Mission Statement */}
          <section className="py-16">
            <Card className="p-8 md:p-12 text-center bg-muted/30">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                Our Mission
              </h2>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
                We believe everyone deserves to job hunt safely and fairly.
                TrueHire was built to protect job seekers from scams, help
                identify biased postings, and give you the confidence to apply
                for opportunities that are right for you.
              </p>
            </Card>
          </section>

          {/* CTA Section */}
          <section className="py-16 text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Ready to Analyze Your Next Opportunity?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Gain immediate clarity with TrueScore analysis and proceed with
              confidence.
            </p>
            <Link to="/analyze">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Free Analysis
              </Button>
            </Link>
          </section>
        </div>
      </div>
    </PageWrapper>
  );
}
