import type { Session } from '@huntledger/shared';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Returns the Monday at 00:00 of the week the date falls into (UTC). */
function startOfIsoWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayOfWeek = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - dayOfWeek);
  return d;
}

export interface WeeklyBucket {
  /** Start-of-week timestamp in ms. Useful for sorting. */
  weekStart: number;
  /** Localized label, e.g. "12 May" or "wk 19". */
  label: string;
  sessions: number;
  shots: number;
  hits: number;
}

export function groupSessionsByWeek(sessions: Session[], locale: string): WeeklyBucket[] {
  if (sessions.length === 0) return [];

  const buckets = new Map<number, WeeklyBucket>();

  // Pre-fill 8 weeks back to keep the chart readable even with sparse data.
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfIsoWeek(new Date(now.getTime() - i * WEEK_MS)).getTime();
    if (!buckets.has(weekStart)) {
      buckets.set(weekStart, {
        weekStart,
        label: formatWeekLabel(new Date(weekStart), locale),
        sessions: 0,
        shots: 0,
        hits: 0,
      });
    }
  }

  for (const s of sessions) {
    const ws = startOfIsoWeek(new Date(s.timestampStart)).getTime();
    const bucket =
      buckets.get(ws) ??
      ({
        weekStart: ws,
        label: formatWeekLabel(new Date(ws), locale),
        sessions: 0,
        shots: 0,
        hits: 0,
      } as WeeklyBucket);
    bucket.sessions += 1;
    bucket.shots += s.shotsFired ?? 0;
    bucket.hits += s.hits ?? 0;
    buckets.set(ws, bucket);
  }

  return [...buckets.values()].sort((a, b) => a.weekStart - b.weekStart);
}

function formatWeekLabel(d: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
