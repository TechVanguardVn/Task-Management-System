/**
 * Timezone contract
 *
 * - API timestamps are UTC instants. Offset-qualified values are parsed as-is;
 *   offset-less API timestamps are treated as UTC because the backend stores UTC.
 * - User input from <input type="datetime-local"> is local wall time. It must go
 *   through localInputToUtcIso() before it is sent to the API.
 * - Never append "Z" to a datetime-local value directly.
 */

const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const NAIVE_API_DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function normalizeApiTimestamp(value: string): string {
  return NAIVE_API_DATETIME_PATTERN.test(value) ? `${value}Z` : value;
}

/** Parse an API timestamp into a Date, or return null for missing/invalid values. */
export function parseApiDate(
  value: string | null | undefined,
): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(normalizeApiTimestamp(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format an API timestamp in the browser's local timezone. */
export function formatDateTime(
  value: string | null | undefined,
  locale = "vi-VN",
  fallback = "—",
): string {
  const date = parseApiDate(value);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Format only the local calendar date of an API timestamp. */
export function formatDate(
  value: string | null | undefined,
  locale = "vi-VN",
  fallback = "—",
): string {
  const date = parseApiDate(value);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
}

/**
 * Convert datetime-local input ("YYYY-MM-DDTHH:mm") to an ISO 8601 UTC string.
 * Returns null for empty, malformed, impossible, or DST-gap values.
 */
export function localInputToUtcIso(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const match = DATETIME_LOCAL_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const expected = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second ?? "0"),
  };

  const roundTrips =
    date.getFullYear() === expected.year &&
    date.getMonth() + 1 === expected.month &&
    date.getDate() === expected.day &&
    date.getHours() === expected.hour &&
    date.getMinutes() === expected.minute &&
    date.getSeconds() === expected.second;

  return roundTrips ? date.toISOString() : null;
}

/** Convert an API timestamp to a local datetime-local value for editing. */
export function utcIsoToLocalInput(
  value: string | null | undefined,
): string {
  const date = parseApiDate(value);

  if (!date) {
    return "";
  }

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}
