/**
 * Japan Standard Time (JST, Asia/Tokyo, permanently UTC+9 with no DST)
 * date utilities.
 *
 * All booking dates at KT Villa (Hakuba, Japan) are anchored to JST calendar
 * days and persisted as midnight JST (YYYY-MM-DDT00:00:00+09:00, which is
 * 15:00:00.000Z of the previous UTC day).
 */

export const JST_TIME_ZONE = "Asia/Tokyo";
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface JstDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

/**
 * Extracts the { year, month, day } calendar date in Japan Standard Time.
 * Accepts ISO strings, Date instances, or bare "YYYY-MM-DD" strings.
 */
export function getJstDateParts(input: Date | string): JstDateParts {
  if (typeof input === "string") {
    const match = DATE_ONLY_REGEX.exec(input.trim());
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      };
    }
  }
  const date = input instanceof Date ? input : new Date(input);
  const shifted = new Date(date.getTime() + JST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/**
 * Returns the UTC Date instant corresponding to 00:00:00 JST on (year, month, day).
 */
export function jstMidnightUtc(
  year: number,
  month: number,
  day: number
): Date {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - JST_OFFSET_MS);
}

/**
 * Normalizes any Date, ISO string, or "YYYY-MM-DD" string to midnight JST
 * (represented as a UTC Date for Prisma / Postgres storage).
 */
export function parseJstDateToUtc(input: Date | string): Date {
  const { year, month, day } = getJstDateParts(input);
  return jstMidnightUtc(year, month, day);
}

/**
 * Converts a local calendar Date from react-day-picker (where local Y/M/D is
 * the user's chosen calendar day) into a midnight-JST ISO string for GraphQL.
 */
export function calendarDateToJstIso(localDate: Date): string {
  return jstMidnightUtc(
    localDate.getFullYear(),
    localDate.getMonth() + 1,
    localDate.getDate()
  ).toISOString();
}

/**
 * Converts a stored DB/GraphQL timestamp into a local-midnight Date whose
 * local Y/M/D matches the JST calendar day — for display in react-day-picker.
 */
export function jstToCalendarDate(input: Date | string): Date {
  const { year, month, day } = getJstDateParts(input);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Returns midnight JST of today (in Japan) as a UTC Date.
 */
export function getStartOfTodayJstUtc(): Date {
  return parseJstDateToUtc(new Date());
}

/**
 * Returns today's calendar day in Japan as a local-midnight Date for react-day-picker.
 */
export function getTodayInJstCalendarDate(): Date {
  return jstToCalendarDate(new Date());
}

/**
 * Exact number of calendar nights between two dates in JST.
 */
export function getJstNights(
  start: Date | string,
  end: Date | string
): number {
  const s = parseJstDateToUtc(start).getTime();
  const e = parseJstDateToUtc(end).getTime();
  return Math.round((e - s) / MS_PER_DAY);
}

/**
 * Formats a date as "YYYY-MM-DD" in JST.
 */
export function toJstDateString(input: Date | string): string {
  const { year, month, day } = getJstDateParts(input);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: JST_TIME_ZONE,
  month: "short",
  day: "numeric",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: JST_TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: JST_TIME_ZONE,
  weekday: "long",
});

function toDateForFormat(input: Date | string): Date {
  if (typeof input === "string" && DATE_ONLY_REGEX.test(input.trim())) {
    return parseJstDateToUtc(input);
  }
  return input instanceof Date ? input : new Date(input);
}

/** e.g. "Mar 24" (always in JST) */
export function formatJstMonthDay(input: Date | string): string {
  return monthDayFormatter.format(toDateForFormat(input));
}

/** e.g. "Mar 24, 2025" (always in JST) */
export function formatJstFullDate(input: Date | string): string {
  return fullDateFormatter.format(toDateForFormat(input));
}

/** e.g. "Monday" (always in JST) */
export function formatJstWeekday(input: Date | string): string {
  return weekdayFormatter.format(toDateForFormat(input));
}
