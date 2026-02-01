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
        {/* Modern "Spotlight + Radar" Background (Inspired by OnAssemble & Marathon) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Deep dark base */}
          <div className="absolute inset-0 bg-background" />

          {/* Central Spotlight / Aurora Glow */}
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-[120px] opacity-80 mix-blend-screen" />
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-500/20 dark:bg-purple-600/10 rounded-full blur-[100px] opacity-60 mix-blend-screen" />

          {/* Radial Radar Circles (Subtle concentric rings) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] opacity-[0.03] dark:opacity-[0.05] border border-foreground rounded-full" />
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-[0.04] dark:opacity-[0.06] border border-foreground rounded-full" />
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-[0.05] dark:opacity-[0.07] border border-foreground rounded-full" />

          {/* Grid Pattern Overlay (Dovetail style) */}
          <div
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Floating Abstract Elements (Assemble style) */}
          <div className="absolute top-32 left-[10%] w-16 h-16 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl border border-blue-500/20 rotate-12 animate-float opacity-60 backdrop-blur-sm" />
          <div className="absolute top-40 right-[15%] w-12 h-12 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full border border-purple-500/20 animate-pulse-slow opacity-60 backdrop-blur-sm" />
          <div className="absolute bottom-20 left-[20%] w-8 h-8 bg-emerald-500/10 rounded-lg rotate-45 animate-float opacity-40 delay-700" />
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
                  name: "Hiring Activity",
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

      <div className="container mx-auto px-4 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto space-y-24">
          {/* TrueScore Section - Glassmorphic Upgrade */}
          <section className="pt-16">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Introducing TrueScore™
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A comprehensive 0-100 rating that combines multiple signals to
                give you the complete picture of any job posting.
              </p>
            </div>

            {/* TrueScore Visual */}
            <div className="relative group perspective-1000">
              {/* Aurora Glow behind card */}
              <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl opacity-50 -z-10 group-hover:opacity-75 transition-opacity duration-700" />

              <Card className="relative p-8 md:p-12 overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-2xl transition-all duration-500 group-hover:scale-[1.01] group-hover:border-white/20">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  {/* Score Display */}
                  <div className="text-center md:text-left relative">
                    <div className="inline-flex items-center justify-center w-48 h-48 rounded-full bg-linear-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30 mb-8 relative z-10">
                      <div className="text-center">
                        <span className="text-6xl font-bold text-white tracking-tighter">
                          85
                        </span>
                        <div className="h-px w-12 bg-white/30 mx-auto my-2" />
                        <p className="text-white/90 text-sm font-medium tracking-widest uppercase">
                          TrueScore
                        </p>
                      </div>
                    </div>
                    {/* Decorative ring */}
                    <div className="absolute top-0 left-1/2 md:left-24 -translate-x-1/2 w-48 h-48 rounded-full border border-white/20 animate-pulse-slow my-6" />

                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      One Score. Complete Confidence.
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Stop guessing whether a job is legitimate. TrueScore
                      combines AI analysis across 4 key dimensions to give you
                      instant clarity.
                    </p>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-6">
                    {[
                      {
                        name: "Authenticity",
                        value: 92,
                        color: "bg-green-500",
                        textColor: "text-green-500",
                        icon: Shield,
                      },
                      {
                        name: "Hiring Activity",
                        value: 78,
                        color: "bg-blue-500",
                        textColor: "text-blue-500",
                        icon: Target,
                      },
                      {
                        name: "Resume Match",
                        value: 85,
                        color: "bg-purple-500",
                        textColor: "text-purple-500",
                        icon: FileText,
                      },
                      {
                        name: "Company Reputation",
                        value: 82,
                        color: "bg-amber-500",
                        textColor: "text-amber-500",
                        icon: Building2,
                      },
                    ].map((metric, i) => (
                      <div key={metric.name} className="group/item">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <metric.icon
                              className={`w-5 h-5 ${metric.textColor}`}
                            />
                            <span className="font-medium text-foreground text-sm tracking-wide">
                              {metric.name}
                            </span>
                          </div>
                          <span className="font-mono text-sm font-bold text-foreground">
                            {metric.value}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
                          <div
                            className={`h-full ${metric.color} rounded-full transition-all duration-1000 ease-out group-hover/item:brightness-110`}
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* What We Analyze - Interactive Bento Grid */}
          <section>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                What TrueHire Analyzes
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Our AI system examines every aspect of a job posting to protect
                you as well as to help you find the right opportunities.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: "Scam Detection",
                  description:
                    "Identifies red flags like payment requests, unrealistic salaries, and suspicious contact info.",
                  gradient: "from-red-500/20 to-orange-500/20",
                  iconColor: "text-red-500",
                },
                {
                  icon: Scale,
                  title: "Bias Analysis",
                  description:
                    "Detects gendered language, age discrimination signals, and exclusionary requirements.",
                  gradient: "from-pink-500/20 to-rose-500/20",
                  iconColor: "text-pink-500",
                },
                {
                  icon: FileText,
                  title: "Resume Matching",
                  description:
                    "Compares your skills to job requirements and shows your match percentage.",
                  gradient: "from-purple-500/20 to-indigo-500/20",
                  iconColor: "text-purple-500",
                },
                {
                  icon: Target,
                  title: "Hiring Activity",
                  description:
                    "Real market data showing company hiring activity from job boards like Adzuna.",
                  gradient: "from-blue-500/20 to-cyan-500/20",
                  iconColor: "text-blue-500",
                },
                {
                  icon: Building2,
                  title: "Company Reputation",
                  description:
                    "Checks company legitimacy indicators like professional email domains and details.",
                  gradient: "from-amber-500/20 to-yellow-500/20",
                  iconColor: "text-amber-500",
                },
                {
                  icon: Brain,
                  title: "AI Insights",
                  description:
                    "Get smart recommendations tailored to each opportunity you analyze.",
                  gradient: "from-emerald-500/20 to-green-500/20",
                  iconColor: "text-emerald-500",
                },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className="group relative p-8 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
                >
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${feature.gradient} rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  <div
                    className={`w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3 relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed relative z-10">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Stats Section - Mesh Gradient Upgrade */}
          <section>
            <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-white text-center shadow-2xl">
              {/* Mesh Background */}
              <div className="absolute inset-0 bg-background">
                <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-blue-600/40 via-purple-600/40 to-emerald-600/40 opacity-80" />
                <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow" />
                <div
                  className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow"
                  style={{ animationDelay: "1s" }}
                />
              </div>

              <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-10">
                {[
                  { value: "4", label: "Analysis Dimensions" },
                  { value: "99%", label: "PDF Accuracy" },
                  { value: "50+", label: "Scam Patterns" },
                  { value: "Free", label: "Forever" },
                ].map((stat) => (
                  <div key={stat.label} className="space-y-2">
                    <p className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight bg-linear-to-b from-white to-white/70 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p className="text-white/60 font-medium uppercase tracking-widest text-xs">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How It Works - Clean Minimalist */}
          <section>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                How It Works
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Get your TrueScore in three simple steps.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-px bg-linear-to-r from-transparent via-border to-transparent border-t border-dashed border-border" />

              {[
                {
                  step: "01",
                  title: "Paste or Upload",
                  desc: "Copy-paste a job description or upload your resume for matching analysis.",
                  icon: FileText,
                },
                {
                  step: "02",
                  title: "AI Analysis",
                  desc: "Our AI instantly analyzes the posting across all 4 TrueScore dimensions.",
                  icon: Brain,
                },
                {
                  step: "03",
                  title: "Get Insights",
                  desc: "Receive your TrueScore and detailed breakdown immediately.",
                  icon: BarChart3,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="group text-center relative bg-card/30 p-8 rounded-2xl border border-transparent hover:border-border/50 transition-all duration-300"
                >
                  <div className="w-20 h-20 bg-background border border-border rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg z-10 relative group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-8 h-8 text-primary opacity-80 group-hover:opacity-100" />
                    <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full text-xs font-bold flex items-center justify-center border-4 border-background">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Mission Statement - Split Layout */}
          <section>
            <div className="grid md:grid-cols-2 gap-12 items-center bg-card/20 border border-border rounded-3xl p-8 md:p-12 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-px h-full bg-linear-to-b from-transparent via-border to-transparent hidden md:block opacity-50" />

              <div className="space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                  <Heart className="w-3 h-3" /> Our Mission
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
                  Making job hunting <span className="text-primary">safe</span>{" "}
                  and <span className="text-blue-500">fair</span> for everyone.
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  TrueHire was built to protect job seekers from scams, help
                  identify biased postings, and give you the confidence to apply
                  for opportunities that are right for you.
                </p>
                <Link to="/sign-up">
                  <Button size="lg" className="rounded-full px-8">
                    Join the Movement <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>

              <div className="relative h-64 md:h-full min-h-[300px] flex items-center justify-center">
                {/* Abstract Visual */}
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse-slow" />
                  <Shield className="w-full h-full text-primary opacity-20 absolute top-0 left-0 animate-float" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle className="w-24 h-24 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                  </div>
                </div>
              </div>
            </div>
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
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 rounded-full px-8 py-6 text-lg"
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
