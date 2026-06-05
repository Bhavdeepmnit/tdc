import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Compute a person's age in whole years from an ISO date-of-birth.
 * @param isoDate - "YYYY-MM-DD"
 */
export function getAge(isoDate: string): number {
  return dayjs().diff(dayjs(isoDate), 'year');
}

/** Format an ISO timestamp as e.g. "4 Jun 2026". */
export function formatDate(iso: string): string {
  return dayjs(iso).format('D MMM YYYY');
}

/** Format an ISO timestamp as a relative string, e.g. "3 hours ago". */
export function fromNow(iso: string): string {
  return dayjs(iso).fromNow();
}

/** Current time as an ISO 8601 string — single source for `createdAt`/`updatedAt`. */
export function nowIso(): string {
  return dayjs().toISOString();
}

/** Return a time-of-day greeting string. */
export function getGreeting(): string {
  const hour = dayjs().hour();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
