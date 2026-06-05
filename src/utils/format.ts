/** Small presentation helpers for biodata fields. */

/** Convert an UPPER_SNAKE enum value to Title Case ("NEVER_MARRIED" → "Never Married"). */
export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Render height in cm as feet/inches plus cm, e.g. "5'7" (170 cm)". */
export function formatHeight(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}" (${cm} cm)`;
}

/**
 * Format a gross annual income (in INR) using the Indian numbering system.
 *
 * - < 1,00,000   → "50,000"
 * - 1L – 99.9L   → "12.5L"   (lakhs)
 * - ≥ 1Cr        → "1.2Cr"   (crores)
 *
 * @param income — annual income in rupees (NOT lakhs)
 */
export function formatIndianIncome(income: number): string {
  if (income < 100_000) {
    return `₹${income.toLocaleString('en-IN')}`;
  }
  if (income < 10_000_000) {
    const lakhs = income / 100_000;
    // Show one decimal if non-integer, else whole number
    const formatted = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1);
    return `₹${formatted}L`;
  }
  const crores = income / 10_000_000;
  const formatted = crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(1);
  return `₹${formatted}Cr`;
}

/** Build initials from a full name, e.g. "Aarav Mehta" → "AM". */
export function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}
