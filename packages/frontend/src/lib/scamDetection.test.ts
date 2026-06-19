import { describe, it, expect } from "vitest";
import {
  analyzeJobPosting,
  validateJobContent,
  getWordCount,
} from "./scamDetection";

// A clean, detailed corporate posting that trips none of the red-flag patterns.
const SAFE_POSTING = `Acme Corporation is seeking a Senior Software Engineer to join our growing
engineering team in Toronto. The successful candidate will design, develop, and
maintain backend services using Python and modern cloud infrastructure.
Responsibilities include collaborating with product managers, writing
well-tested code, reviewing pull requests, and mentoring junior developers.
Qualifications include a degree in computer science or equivalent practical
background, strong communication skills, and several years building production
software. We offer competitive salary, comprehensive health benefits, and a
hybrid work arrangement. Apply through our careers portal to be considered for
this full-time position.`;

const SCAM_POSTING = `Pay a $200 training fee to start today. Send money via wire
transfer to secure your spot. Contact us at recruiter@gmail.com. Anyone can earn
easy money working from home with no experience required. We guarantee income of
thousands per week. Provide your social security number and bank account details
to get hired.`;

describe("analyzeJobPosting", () => {
  it("rates a clean, detailed posting as safe with a high score", () => {
    const r = analyzeJobPosting(SAFE_POSTING);
    expect(r.riskLevel).toBe("safe");
    expect(r.trustScore).toBeGreaterThanOrEqual(70);
    expect(r.redFlags).toHaveLength(0);
  });

  it("flags a posting that requests an upfront payment", () => {
    const r = analyzeJobPosting(
      "Great opportunity at our company. Pay a processing fee to begin onboarding.",
    );
    expect(r.redFlags.map((f) => f.id)).toContain("payment-request");
    expect(r.trustScore).toBeLessThan(100);
  });

  it("flags a personal (non-corporate) email address", () => {
    const r = analyzeJobPosting(
      "Our company is hiring. Send your resume to hr.recruiter@gmail.com today.",
    );
    expect(r.redFlags.map((f) => f.id)).toContain("personal-email");
  });

  it("flags requests for sensitive personal information", () => {
    const r = analyzeJobPosting(
      "To process your application at our company, provide your social security and bank account.",
    );
    expect(r.redFlags.map((f) => f.id)).toContain("personal-info");
  });

  it("rates a posting with many red flags as high-risk", () => {
    const r = analyzeJobPosting(SCAM_POSTING);
    expect(r.riskLevel).toBe("high-risk");
    expect(r.trustScore).toBeLessThan(40);
    expect(r.redFlags.length).toBeGreaterThanOrEqual(3);
  });

  it("never returns a negative trust score", () => {
    const r = analyzeJobPosting(SCAM_POSTING + " " + SCAM_POSTING);
    expect(r.trustScore).toBeGreaterThanOrEqual(0);
  });

  it("is stateless across calls (global-regex lastIndex regression)", () => {
    // Same payment text twice must produce the same flag both times. Before the
    // matchesPattern() fix, the global /g regexes carried lastIndex across calls
    // and could drop the flag on the second run.
    const text = "Join our company. A registration fee is required to apply.";
    const first = analyzeJobPosting(text).redFlags.map((f) => f.id);
    const second = analyzeJobPosting(text).redFlags.map((f) => f.id);
    expect(first).toContain("payment-request");
    expect(second).toEqual(first);
  });
});

describe("validateJobContent", () => {
  it("accepts a plausible job posting", () => {
    const { valid, reason } = validateJobContent(SAFE_POSTING);
    expect(valid).toBe(true);
    expect(reason).toBe("");
  });

  it("rejects text that is too short", () => {
    const { valid, reason } = validateJobContent("hi there");
    expect(valid).toBe(false);
    expect(reason).toMatch(/too short/i);
  });

  it("rejects long text lacking job-posting vocabulary", () => {
    const { valid } = validateJobContent(
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor",
    );
    expect(valid).toBe(false);
  });

  it("rejects repetitive filler content", () => {
    const { valid } = validateJobContent(Array(20).fill("job").join(" "));
    expect(valid).toBe(false);
  });
});

describe("getWordCount", () => {
  it("counts words separated by single spaces", () => {
    expect(getWordCount("hello world")).toBe(2);
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(getWordCount("  a   b  c  ")).toBe(3);
  });

  it("returns 0 for empty or whitespace-only text", () => {
    expect(getWordCount("")).toBe(0);
    expect(getWordCount("   ")).toBe(0);
  });
});
