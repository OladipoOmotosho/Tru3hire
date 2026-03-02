import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { PageWrapper } from "../components/PageWrapper";
import { submitScamReport } from "../lib/api";
import {
  Shield,
  AlertTriangle,
  Send,
  CheckCircle,
  Link as LinkIcon,
  FileText,
  MessageSquare,
  Mail,
  Info,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface FormData {
  jobUrl: string;
  jobText: string;
  reason: string;
  email: string;
}

interface FormErrors {
  jobText?: string;
  reason?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ReportScamPage() {
  const [formData, setFormData] = useState<FormData>({
    jobUrl: "",
    jobText: "",
    reason: "",
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { getToken } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.jobText.trim()) {
      newErrors.jobText = "Please paste the job posting text";
    } else if (formData.jobText.trim().length < 50) {
      newErrors.jobText =
        "Please provide more details (at least 50 characters)";
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Please explain why you think this is a scam";
    } else if (formData.reason.trim().length < 20) {
      newErrors.reason = "Please provide more details (at least 20 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      await submitScamReport(
        {
          job_url: formData.jobUrl || undefined,
          job_text: formData.jobText,
          reason: formData.reason,
          email: formData.email || undefined,
        },
        token || undefined,
      );

      setIsSubmitted(true);
    } catch (err) {
      const apiError = err as { message: string };
      alert(apiError.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-success-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
          <p className="text-muted-foreground mb-6">
            Your report has been submitted successfully. We appreciate your help
            in keeping the community safe from employment scams.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Our team will review this submission and use it to improve our
            detection algorithms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/analyze">
              <Button>Analyze Another Job</Button>
            </Link>
            <Link to="/">
              <Button variant="outline">Return Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <PageWrapper withNavbarOffset={false} withPadding={false} maxWidth="full">
      {/* Hero Section - Clean Design with Illustration */}
      <div className="relative overflow-hidden pt-24 pb-12 bg-linear-to-b from-amber-50 to-background dark:from-slate-900 dark:to-background">
        {/* Subtle decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200/30 dark:bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-red-200/20 dark:bg-red-500/10 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 px-4 py-2 rounded-full mb-6">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Help Protect Others
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  Report a{" "}
                  <span className="text-warning-600 dark:text-warning-400">
                    Scam
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Found a suspicious job posting? Report it to help us protect
                  job seekers and improve our detection algorithms.
                </p>
              </div>

              {/* Illustration */}
              <div className="hidden lg:flex justify-center">
                <div className="relative">
                  {/* Large Alert Icon as Hero Illustration */}
                  <div className="w-72 h-72 bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-3xl flex items-center justify-center shadow-xl">
                    <AlertTriangle
                      className="w-36 h-36 text-warning-500"
                      strokeWidth={1}
                    />
                  </div>
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="w-7 h-7 text-red-500" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-14 h-14 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-7 h-7 text-success-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Info Banner */}
          <Card className="p-4 mb-8 bg-info-500/10 border-info-500/20">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-info-500 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">
                  What happens to your report?
                </p>
                <p>
                  Your submission helps train our AI to better detect scams. We
                  review all reports and may add confirmed scams to our database
                  to warn others.
                </p>
              </div>
            </div>
          </Card>

          {/* Form */}
          <Card className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job URL Field */}
              <div>
                <label
                  htmlFor="jobUrl"
                  className="block text-sm font-medium mb-2"
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-muted-foreground" />
                    Job Posting URL
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </div>
                </label>
                <input
                  type="url"
                  id="jobUrl"
                  name="jobUrl"
                  value={formData.jobUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/job-posting"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-info-500/50 focus:border-info-500 transition-colors"
                />
              </div>

              {/* Job Text Field */}
              <div>
                <label
                  htmlFor="jobText"
                  className="block text-sm font-medium mb-2"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Job Posting Text
                    <span className="text-destructive">*</span>
                  </div>
                </label>
                <textarea
                  id="jobText"
                  name="jobText"
                  value={formData.jobText}
                  onChange={handleChange}
                  placeholder="Paste the full job posting text here..."
                  rows={6}
                  className={`w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-info-500/50 focus:border-info-500 transition-colors resize-none ${
                    errors.jobText ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.jobText && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.jobText}
                  </p>
                )}
              </div>

              {/* Reason Field */}
              <div>
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium mb-2"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    Why do you think this is a scam?
                    <span className="text-red-500">*</span>
                  </div>
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Describe any red flags you noticed..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-info-500/50 focus:border-info-500 transition-colors resize-none ${
                    errors.reason ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.reason && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.reason}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Your Email
                    <span className="text-muted-foreground font-normal">
                      (optional, for follow-up)
                    </span>
                  </div>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-info-500/50 focus:border-info-500 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p className="mb-4">
              Not sure if it's a scam?{" "}
              <Link
                to="/analyze"
                className="text-info-600 dark:text-info-400 hover:underline"
              >
                Use our analyzer tool
              </Link>{" "}
              to check the job posting.
            </p>
            <p>
              Learn more about spotting scams on our{" "}
              <Link
                to="/safety-tips"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Safety Tips page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
