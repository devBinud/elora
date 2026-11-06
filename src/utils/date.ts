import { format, formatDistanceToNow } from 'date-fns';

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

/** e.g. "Friday, 6 November" */
export function formatLongDate(date: Date): string {
  return format(date, 'EEEE, d MMMM');
}

/** e.g. "07:45" (24-hour) */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

/** e.g. "5 minutes ago" */
export function formatRelative(timestamp: number): string {
  return formatDistanceToNow(timestamp, { addSuffix: true });
}

/** e.g. { time: "2:25", period: "PM" } (12-hour clock, for display) */
export function formatClock(date: Date): { time: string; period: string } {
  return { time: format(date, 'h:mm'), period: format(date, 'a') };
}
