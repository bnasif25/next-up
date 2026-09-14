import type { AppState } from '@/types';

export interface Point {
  date: string;
  weight: number;
}

/** Best-set (set 1) weight per session for an exercise, oldest first. */
export function seriesFor(state: AppState, exerciseId: string): Point[] {
  return [...state.sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const log = s.exercises.find((l) => l.exerciseId === exerciseId);
      const first = log?.sets[0];
      if (!log || !first?.done) return null;
      return { date: s.date, weight: first.weight };
    })
    .filter((p): p is Point => p !== null);
}

/** Indicator lifts tracked on the Progress screen (Strength Standards). */
export const INDICATORS: { id: string; name: string; godMult: number }[] = [
  { id: 'incline-barbell-press', name: 'Incline Press', godMult: 1.4 },
  { id: 'weighted-chinups', name: 'Weighted Chinup', godMult: 0.7 },
  { id: 'standing-press', name: 'Standing Press', godMult: 1.0 },
  { id: 'weighted-dips', name: 'Weighted Dip', godMult: 1.0 },
];
