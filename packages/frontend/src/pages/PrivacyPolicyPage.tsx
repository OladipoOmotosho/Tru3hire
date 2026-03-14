import React from "react";
import {
  Shield,
  Eye,
  Database,
  UserCheck,
  Clock,
  Globe,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { PageWrapper } from "@/components/PageWrapper";

/**
 * Parse minimal markdown (bold + links) into React elements.
 * Internal links render as React Router <Link>, external links open in new tab.
 */
function parseMarkdownInline(text: string): React.ReactNode[] {
  const regex = /\*\*(.*?)\*\*|\[(.*?)\]\((.*?)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(
        <strong key={match.index} className="text-foreground">
          {match[1]}
        </strong>,
      );
    } else if (match[2] !== undefined && match[3] !== undefined) {
      const linkText = match[2];
      const href = match[3];
      if (href.startsWith("/")) {
        parts.push(
          <Link key={match.index} to={href} className="text-primary hover:underline">
            {linkText}
          </Link>,
        );
      } else {
        parts.push(
          <a
            key={match.index}
            href={href}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkText}
          </a>,
        );
      }
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export function PrivacyPolicyPage() {
  const lastUpdated = "March 1, 2026";

  return (
    <PageWrapper maxWidth="4xl">
      <div className="py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full text-xs font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            Privacy Policy
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Your Privacy Matters
          </h1>
          <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <div className="space-y-8">
          {/* Intro */}
          <Card className="p-6 md:p-8">
            <p className="text-muted-foreground leading-relaxed">
              TrueHire ("we", "our", or "us") is committed to protecting the
              privacy of our users. This Privacy Policy explains how we collect,
              use, and safeguard your information when you use our AI-powered
              job safety platform. We are especially mindful that many of our
              users are newcomers to Canada who may be in vulnerable situations.
            </p>
          </Card>

          {/* Sections */}
          {[
            {
              icon: Database,
              title: "Information We Collect",
              content: [
                "**Account Information**: When you sign up via Clerk (our authentication provider), we receive your name, email address, and profile picture from your Google or email login.",
                "**Resume Data**: If you upload a resume, we parse it to extract your skills, experience, and education. This data is stored in your Clerk user metadata and is only used to provide personalized job matching.",
                "**Job Analysis Data**: When you analyze a job posting, we store the analysis results (TrueScore, risk level) in your history. The job posting text itself is processed but not permanently stored.",
                "**Usage Data**: We collect basic usage analytics such as pages visited and features used to improve our platform.",
              ],
            },
            {
              icon: Eye,
              title: "How We Use Your Information",
              content: [
                "**Job Safety Analysis**: To analyze job postings and calculate TrueScore ratings across our 5 dimensions (Authenticity, Hiring Activity, Resume Match, Recency, Company Reputation).",
                "**Personalized Matching**: To compare your resume skills against job requirements and identify skill gaps.",
                "**Analysis History**: To maintain your history of analyzed jobs so you can review past results.",
                "**Platform Improvement**: To improve our AI models and detection algorithms. We may use anonymized, aggregated data for this purpose.",
              ],
            },
            {
              icon: UserCheck,
              title: "Data Sharing & Third Parties",
              content: [
                "**We do not sell your personal data.** Period.",
                "**Clerk**: Handles authentication and securely stores your account credentials. See [Clerk's Privacy Policy](https://clerk.com/privacy).",
                "**Adzuna**: We use the Adzuna Jobs API to fetch job listings. Your personal data is never sent to Adzuna.",
                "**Hosting Providers**: Our frontend is hosted on Netlify and our backend on Render. These providers may collect standard server logs (IP addresses, request timestamps).",
              ],
            },
            {
              icon: Shield,
              title: "Data Security",
              content: [
                "All data transmitted between your browser and our servers is encrypted via HTTPS/TLS.",
                "Authentication tokens are managed by Clerk using industry-standard security practices.",
                "Resume data is stored in your user metadata and is only accessible to you when authenticated.",
                "We do not store passwords — authentication is handled entirely by Clerk's secure infrastructure.",
              ],
            },
            {
              icon: Clock,
              title: "Data Retention",
              content: [
                "Your analysis history is retained as long as your account is active.",
                "You can delete your account at any time through your profile settings, which will remove all associated data.",
                "Anonymized, aggregated analytics data may be retained indefinitely to improve our platform.",
              ],
            },
            {
              icon: Globe,
              title: "Your Rights",
              content: [
                "**Access**: You can view all your stored data through your dashboard and profile.",
                "**Correction**: You can update your profile and resume data at any time.",
                "**Deletion**: You can request deletion of your account and all associated data.",
                "**Portability**: You can export your analysis history from the platform.",
                "If you are a resident of Canada, you have additional rights under PIPEDA (Personal Information Protection and Electronic Documents Act).",
              ],
            },
            {
              icon: Mail,
              title: "Contact Us",
              content: [
                "If you have questions about this Privacy Policy or your data, please reach out via our [Contact page](/contact).",
                "We aim to respond to all privacy-related inquiries within 5 business days.",
              ],
            },
          ].map((section) => (
            <Card key={section.title} className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, i) => (
                  <li
                    key={i}
                    className="text-muted-foreground text-sm leading-relaxed pl-4 border-l-2 border-border"
                  >
                    {parseMarkdownInline(item)}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
