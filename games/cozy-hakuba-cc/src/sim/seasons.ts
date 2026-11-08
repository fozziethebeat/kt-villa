import type { CalendarEntry, SeasonId, SeasonInfo } from './types';

export function yearLength(calendar: CalendarEntry[]): number {
  return calendar.reduce((n, c) => n + c.days, 0);
}

/** Map an absolute 1-based day to its season on the repeating calendar. */
export function seasonForDay(day: number, calendar: CalendarEntry[]): SeasonInfo {
  if (day < 1) throw new Error('day must be >= 1');
  const len = yearLength(calendar);
  const year = Math.floor((day - 1) / len) + 1;
  let offset = (day - 1) % len;
  for (const entry of calendar) {
    if (offset < entry.days) {
      return {
        season: entry.season,
        label: entry.label,
        scored: entry.scored,
        dayInSeason: offset + 1,
        seasonLength: entry.days,
        year,
      };
    }
    offset -= entry.days;
  }
  throw new Error('unreachable: calendar walk failed');
}

/** First day (>= fromDay) that falls in the given season. Used by the debug API. */
export function firstDayOfSeason(season: SeasonId, fromDay: number, calendar: CalendarEntry[]): number {
  if (!calendar.some((c) => c.season === season)) throw new Error(`Season not in calendar: ${season}`);
  for (let d = fromDay; d < fromDay + yearLength(calendar) * 2; d++) {
    const info = seasonForDay(d, calendar);
    if (info.season === season && info.dayInSeason === 1) return d;
  }
  throw new Error('unreachable');
}

/** Seasons that render with a snow layer. */
export function isSnowy(season: SeasonId): boolean {
  return season === 'winter' || season === 'autumn';
}
