/**
 * Shared job card helpers: snippet from HTML, salary display text.
 * SSR-safe and used by JobCard and GroupedJobCard.
 */

/**
 * Strip HTML and truncate to maxLength. SSR-safe: uses regex when document is undefined.
 */
export function getSnippet(html: string, maxLength: number = 80): string {
  let text: string;
  if (typeof document !== "undefined") {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    text = tmp.textContent || tmp.innerText || "";
  } else {
    text = html.replace(/<[^>]+>/g, "").trim();
  }
  return text.substring(0, maxLength) + (text.length > maxLength ? "..." : "");
}

/**
 * Return displayable salary text, or null for "not specified" / "unspecified" / "n/a".
 */
export function getSalaryText(
  salaryDisplay: string | undefined,
  salary: { min?: number; max?: number } | null | undefined,
  formatSalary: (min?: number, max?: number) => string
): string | null {
  const raw = salaryDisplay
    ? salaryDisplay
    : salary
      ? formatSalary(salary.min, salary.max)
      : null;
  if (!raw || /^(not specified|unspecified|n\/a)$/i.test(raw.trim()))
    return null;
  return raw;
}
