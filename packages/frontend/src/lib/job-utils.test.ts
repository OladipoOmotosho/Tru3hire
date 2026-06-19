import { describe, it, expect } from "vitest";
import { getSnippet, getSalaryText } from "./job-utils";

describe("getSnippet", () => {
  it("strips HTML tags and returns plain text", () => {
    expect(getSnippet("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("truncates text longer than maxLength and appends an ellipsis", () => {
    const long = "a".repeat(200);
    const out = getSnippet(`<div>${long}</div>`, 80);
    expect(out).toHaveLength(83); // 80 chars + "..."
    expect(out.endsWith("...")).toBe(true);
  });

  it("does not append an ellipsis when text fits within maxLength", () => {
    expect(getSnippet("<span>short</span>", 80)).toBe("short");
  });

  it("respects a custom maxLength", () => {
    expect(getSnippet("abcdefghij", 5)).toBe("abcde...");
  });
});

describe("getSalaryText", () => {
  const fmt = (min?: number, max?: number) =>
    min && max ? `$${min}–$${max}` : "Not specified";

  it("prefers an explicit salaryDisplay string", () => {
    expect(getSalaryText("$80k–$100k", null, fmt)).toBe("$80k–$100k");
  });

  it("falls back to formatSalary when no display string is given", () => {
    expect(getSalaryText(undefined, { min: 80, max: 100 }, fmt)).toBe("$80–$100");
  });

  it("returns null for placeholder values", () => {
    expect(getSalaryText("Not specified", null, fmt)).toBeNull();
    expect(getSalaryText("unspecified", null, fmt)).toBeNull();
    expect(getSalaryText("N/A", null, fmt)).toBeNull();
  });

  it("returns null when neither display nor salary is provided", () => {
    expect(getSalaryText(undefined, null, fmt)).toBeNull();
  });
});
