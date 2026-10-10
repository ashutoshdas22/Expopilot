/** Keeps digits and a single decimal point for measurement and money fields. */
export function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

/** Whole numbers only (e.g. quantity). */
export function sanitizeIntegerInput(value: string): string {
  return value.replace(/[^\d]/g, "");
}
