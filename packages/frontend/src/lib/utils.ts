import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to readable string
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format salary range
export function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return "Not specified";
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `$${min.toLocaleString()}+`;
  return `Up to $${max?.toLocaleString()}`;
}

// Get color based on TrueScore
export function getTrueScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

// Get background color based on TrueScore
export function getTrueScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-100";
  if (score >= 60) return "bg-yellow-100";
  if (score >= 40) return "bg-orange-100";
  return "bg-red-100";
}

/** Create URL-safe slug from company name for routing */
export function companyToSlug(companyName: string): string {
  return encodeURIComponent(companyName.trim());
}

/** Decode company slug back to company name */
export function slugToCompany(slug: string): string {
  return decodeURIComponent(slug);
}

/** Format days_ago to compact display: 0d, 1d, 7d, 30d or "Xh" for same-day */
export function formatPostedTime(daysAgo: number): string {
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "1d";
  if (daysAgo < 7) return `${daysAgo}d`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)}w`;
  return `${Math.floor(daysAgo / 30)}mo`;
}
