/**
 * Helpers for announcement reference ID generation and ordering.
 */

export function extractCircularNumber(ref?: string | null): number {
  if (!ref) return 0;
  // Match standard CIR-XX pattern (e.g. CIR-07, SEVA-CIR-01)
  const cirMatch = ref.match(/CIR[-_\s]?(\d+)/i);
  if (cirMatch && cirMatch[1]) {
    const num = parseInt(cirMatch[1], 10);
    if (!isNaN(num)) return num;
  }
  // Fallback: match the last digit cluster in string, ignoring prefix years like 2026 in DTU/SEVA/2026/CIR-07
  const allDigits = ref.match(/\d+/g);
  if (allDigits && allDigits.length > 0) {
    const lastDigits = allDigits[allDigits.length - 1];
    if (lastDigits) {
      const num = parseInt(lastDigits, 10);
      if (!isNaN(num)) return num;
    }
  }
  return 0;
}

export function getNextAnnouncementId(existingRefs: (string | null | undefined)[]): string {
  let max = 0;
  for (const ref of existingRefs) {
    const num = extractCircularNumber(ref);
    if (num > max) max = num;
  }
  const next = max + 1;
  const padded = String(next).padStart(2, "0");
  return `DTU/SEVA/2026/CIR-${padded}`;
}

export function sortAnnouncementsNewestFirst<
  T extends { refNumber?: string | null; publishedAt?: Date | string; createdAt?: Date | string }
>(list: T[]): T[] {
  return list.sort((a, b) => {
    const numA = extractCircularNumber(a.refNumber);
    const numB = extractCircularNumber(b.refNumber);
    if (numA !== numB) return numB - numA;
    const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });
}
