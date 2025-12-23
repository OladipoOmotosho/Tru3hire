/**
 * Scam Detection Utility
 *
 * Centralized job posting analysis logic for detecting potential employment scams.
 * This module provides the core analysis engine used by both the ResultsPage and
 * JobAnalyzer components.
 */

// ============================================================================
// Types
// ============================================================================

export interface RedFlag {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

export interface AnalysisResult {
  trustScore: number;
  riskLevel: "safe" | "suspicious" | "high-risk";
  redFlags: RedFlag[];
  summary: string;
}

// ============================================================================
// Detection Patterns
// ============================================================================

const DETECTION_PATTERNS = {
  personalEmail: {
    pattern: /@(gmail|yahoo|hotmail|outlook|aol|live|icloud|protonmail)\.com/gi,
    flag: {
      id: "personal-email",
      title: "Personal Email Address",
      description:
        "Legitimate companies typically use company domain emails (e.g., @company.com), not personal email services.",
      severity: "high" as const,
    },
    penalty: 25,
  },
  paymentRequest: {
    pattern:
      /\b(pay.*fee|payment.*required|deposit.*required|processing.*fee|application.*fee|training.*fee|pay.*upfront|send.*money|western union|money.*gram|wire.*transfer|registration.*fee)\b/gi,
    flag: {
      id: "payment-request",
      title: "Payment or Fee Request",
      description:
        "Legitimate employers never ask for money upfront. This is a major red flag for employment scams.",
      severity: "high" as const,
    },
    penalty: 30,
  },
  urgencyTactics: {
    pattern:
      /\b(urgent|immediately|asap|act now|limited time|hurry|apply today only|first.*hired|act fast|don't wait|instant hire)\b/gi,
    minMatches: 3,
    flag: {
      id: "urgency-tactics",
      title: "Excessive Urgency Language",
      description:
        "Scammers often create false urgency to pressure you into quick decisions without proper research.",
      severity: "medium" as const,
    },
    penalty: 15,
  },
  tooGoodToBeTrue: {
    pattern:
      /\b(no.*experience|anyone can|easy money|work from home|make.*(\$|money).*home)\b/gi,
    flag: {
      id: "too-good-to-be-true",
      title: '"Too Good to Be True" Promises',
      description:
        "Job offers requiring no experience with promises of high pay are often fraudulent.",
      severity: "high" as const,
    },
    penalty: 20,
  },
  personalInfoRequest: {
    pattern:
      /\b(social security|sin number|credit card|bank account|passport|driver.*license|full.*address|date.*birth)\b/gi,
    flag: {
      id: "personal-info",
      title: "Requests Sensitive Personal Information",
      description:
        "Asking for SIN, credit card, or bank details in a job posting is highly suspicious. Never share this before being hired.",
      severity: "high" as const,
    },
    penalty: 25,
  },
  guaranteedIncome: {
    pattern:
      /\b(guaranteed.*income|guaranteed.*success|definitely.*earn|promise.*\$|100%.*success)\b/gi,
    flag: {
      id: "guaranteed-income",
      title: "Guaranteed Income Claims",
      description:
        "No legitimate employer can guarantee specific income amounts, especially for commission-based or entry-level roles.",
      severity: "medium" as const,
    },
    penalty: 15,
  },
} as const;

const SALARY_PATTERN =
  /\$\s*(\d+(?:,\d+)?)\s*(?:per|\/)\s*(?:hour|hr|week|wk)/gi;
const COMPANY_NAME_PATTERN = /\b(company|corporation|corp|inc|ltd|llc)\b/gi;

// ============================================================================
// Risk Level Summaries
// ============================================================================

const RISK_SUMMARIES = {
  safe: "This job posting appears relatively safe based on our analysis. However, always research the employer independently and trust your instincts.",
  suspicious:
    "This job posting has several suspicious elements. Proceed with extreme caution and verify the employer's legitimacy before sharing any personal information.",
  "high-risk":
    "This job posting shows multiple red flags commonly associated with employment scams. We strongly recommend avoiding this opportunity.",
} as const;

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyzes a job posting text for potential scam indicators.
 *
 * @param text - The job posting text to analyze
 * @returns AnalysisResult containing trust score, risk level, red flags, and summary
 */
export function analyzeJobPosting(text: string): AnalysisResult {
  const redFlags: RedFlag[] = [];
  let score = 100;

  // Check for personal email domains
  if (DETECTION_PATTERNS.personalEmail.pattern.test(text)) {
    redFlags.push(DETECTION_PATTERNS.personalEmail.flag);
    score -= DETECTION_PATTERNS.personalEmail.penalty;
  }

  // Check for payment requests
  if (DETECTION_PATTERNS.paymentRequest.pattern.test(text)) {
    redFlags.push(DETECTION_PATTERNS.paymentRequest.flag);
    score -= DETECTION_PATTERNS.paymentRequest.penalty;
  }

  // Check for unrealistic salary
  const salaryMatches = text.matchAll(SALARY_PATTERN);
  for (const match of salaryMatches) {
    const amount = parseInt(match[1].replace(/,/g, ""));
    if (match[0].toLowerCase().includes("hour") && amount > 100) {
      redFlags.push({
        id: "unrealistic-salary",
        title: "Unrealistic Salary Promise",
        description:
          "The promised hourly rate seems unusually high for entry-level positions. Verify this carefully.",
        severity: "medium",
      });
      score -= 15;
      break; // Only count once
    }
  }

  // Check for urgency tactics
  const urgencyMatches = text.match(DETECTION_PATTERNS.urgencyTactics.pattern);
  if (
    urgencyMatches &&
    urgencyMatches.length >= DETECTION_PATTERNS.urgencyTactics.minMatches
  ) {
    redFlags.push(DETECTION_PATTERNS.urgencyTactics.flag);
    score -= DETECTION_PATTERNS.urgencyTactics.penalty;
  }

  // Check for "too good to be true" promises
  if (DETECTION_PATTERNS.tooGoodToBeTrue.pattern.test(text)) {
    redFlags.push(DETECTION_PATTERNS.tooGoodToBeTrue.flag);
    score -= DETECTION_PATTERNS.tooGoodToBeTrue.penalty;
  }

  // Check for generic/vague job description
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 50) {
    redFlags.push({
      id: "vague-description",
      title: "Vague or Generic Description",
      description:
        "Legitimate job postings typically include detailed information about responsibilities, qualifications, and company background.",
      severity: "low",
    });
    score -= 10;
  }

  // Check for missing company information
  const hasCompanyName = COMPANY_NAME_PATTERN.test(text);
  if (!hasCompanyName && wordCount > 30) {
    redFlags.push({
      id: "missing-company",
      title: "Missing Company Information",
      description:
        "No clear company name or organization mentioned. Legitimate employers are transparent about their identity.",
      severity: "medium",
    });
    score -= 15;
  }

  // Check for personal information requests
  if (DETECTION_PATTERNS.personalInfoRequest.pattern.test(text)) {
    redFlags.push(DETECTION_PATTERNS.personalInfoRequest.flag);
    score -= DETECTION_PATTERNS.personalInfoRequest.penalty;
  }

  // Check for guaranteed income/success
  if (DETECTION_PATTERNS.guaranteedIncome.pattern.test(text)) {
    redFlags.push(DETECTION_PATTERNS.guaranteedIncome.flag);
    score -= DETECTION_PATTERNS.guaranteedIncome.penalty;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  // Determine risk level
  const riskLevel: "safe" | "suspicious" | "high-risk" =
    score >= 70 ? "safe" : score >= 40 ? "suspicious" : "high-risk";

  return {
    trustScore: score,
    riskLevel,
    redFlags,
    summary: RISK_SUMMARIES[riskLevel],
  };
}

/**
 * Get word count from text
 */
export function getWordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}
