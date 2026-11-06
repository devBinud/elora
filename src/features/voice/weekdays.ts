import type { Weekday } from './types';

/** Index matches `Date.getDay()` (0 = Sunday). */
export const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

const WORKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
const WEEKEND: Weekday[] = ['sat', 'sun'];

const sameSet = (a: Weekday[], b: Weekday[]) => a.length === b.length && a.every((d) => b.includes(d));

/** "Every day", "Weekdays", "Weekends" or "Mon, Wed, Fri". */
export function describeDays(days: Weekday[] | undefined | null): string {
  if (!days || days.length === 0 || days.length === 7) return 'Every day';
  if (sameSet(days, WORKDAYS)) return 'Weekdays';
  if (sameSet(days, WEEKEND)) return 'Weekends';
  return WEEKDAYS.filter((d) => days.includes(d))
    .map((d) => WEEKDAY_SHORT[d])
    .join(', ');
}

export const DAY_PRESETS: { label: string; days: Weekday[] }[] = [
  { label: 'Every day', days: WEEKDAYS },
  { label: 'Weekdays', days: WORKDAYS },
  { label: 'Weekends', days: WEEKEND },
];
