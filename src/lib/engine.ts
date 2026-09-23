import type {
  AppState,
  ExerciseDef,
  ExerciseLog,
  ExerciseSuggestion,
  SessionLog,
  SetSuggestion,
  WorkoutId,
} from '@/types';
import { PROGRAM } from '@/data/program';

/** Round to the nearest multiple of inc, 2-decimal clean. */
export function roundTo(weight: number, inc: number): number {
  return Math.round((Math.round(weight / inc) * inc) * 100) / 100;
}

/** Add an increment to the previous weight: never re-snap to a grid,
 *  or +2.5 kg on a 56 kg lift would silently become +1.5 kg. */
export function addInc(prev: number, inc: number): number {
  return Math.round((prev + inc) * 100) / 100;
}

export function fmtKg(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(2).replace(/0$/, '');
}

export function incrementFor(ex: ExerciseDef, state: AppState): number {
  return state.settings.increments[ex.id] ?? ex.incrementKg;
}

/** Sessions for a given exercise within a phase, newest first. */
export function exerciseHistory(
  state: AppState,
  exerciseId: string,
  phase: number,
): { session: SessionLog; log: ExerciseLog }[] {
  const out: { session: SessionLog; log: ExerciseLog }[] = [];
  for (const s of [...state.sessions].sort((a, b) => b.date.localeCompare(a.date))) {
    if (s.phase !== phase) continue;
    const log = s.exercises.find((l) => l.exerciseId === exerciseId);
    if (log) out.push({ session: s, log });
  }
  return out;
}

/** Consecutive misses of the set-1 bottom-of-range, newest sessions first. */
function consecutiveMisses(
  state: AppState,
  ex: ExerciseDef,
  phase: number,
): number {
  let misses = 0;
  for (const { log } of exerciseHistory(state, ex.id, phase)) {
    const first = log.sets[0];
    if (!first || !first.done) break;
    if (first.reps < ex.sets[0].min) misses += 1;
    else break;
  }
  return misses;
}

/**
 * Per-set Double Progression with hold-then-deload (ADR-0003).
 * - hit top of a set's range  → that set goes up by the increment next time
 * - miss the bottom on set 1  → hold; two misses in a row → −10 % deload
 * - no history                → calibration, no suggestion
 */
export function suggestExercise(
  state: AppState,
  ex: ExerciseDef,
  phase: number,
): ExerciseSuggestion {
  const inc = incrementFor(ex, state);
  const hist = exerciseHistory(state, ex.id, phase);
  const last = hist[0]?.log;

  if (!last || last.sets.every((s) => !s.done)) {
    return { sets: ex.sets.map(() => ({ weight: null, status: 'calib' })), warmup: [], message: 'First time here: log what you lift. Suggestions start next session.' };
  }

  const misses = consecutiveMisses(state, ex, phase);
  const deloadAll = misses >= 2;

  // ── Linear progression (weighted chinups / dips / pullups / box squats):
  // all sets move together: hit every target → +inc on all sets.
  if (ex.progression === 'linear') {
    const allHit = ex.sets.every((scheme, i) => {
      const s = last.sets[i];
      return s?.done && s.reps >= scheme.max;
    });
    const sets: SetSuggestion[] = ex.sets.map((_, i) => {
      const prev = last.sets[i]?.weight ?? 0;
      if (deloadAll) return { weight: roundTo(prev * 0.9, inc), status: 'deload' };
      if (allHit) return { weight: addInc(prev, inc), status: 'up' };
      return { weight: prev, status: 'hold' };
    });
    return {
      sets,
      warmup: ex.warmup ? warmupFor(sets[0].weight ?? 0) : [],
      message: deloadAll
        ? 'Two misses in a row: dropping ~10%, build back up.'
        : allHit
          ? `Targets hit: add ${fmtKg(inc)} kg to every set.`
          : 'Same weight: chase the targets again.',
    };
  }

  // ── Rest-pause: activation + mini-sets share one weight; progress when
  // activation hits top AND every mini-set hits its top.
  if (ex.style === 'restpause' && ex.miniSets) {
    const prev = last.sets[0]?.weight ?? 0;
    const actTop = (last.sets[0]?.reps ?? 0) >= ex.sets[0].max;
    const minisTop = (last.miniSets ?? []).every(
      (m) => m.done && m.reps >= (ex.miniSets?.max ?? 6),
    );
    const up = actTop && minisTop && (last.miniSets?.length ?? 0) > 0;
    const sets: SetSuggestion[] = ex.sets.map(() =>
      deloadAll
        ? { weight: roundTo(prev * 0.9, inc), status: 'deload' }
        : up
          ? { weight: addInc(prev, inc), status: 'up' }
          : { weight: prev, status: 'hold' },
    );
    return {
      sets,
      warmup: [],
      message: deloadAll
        ? 'Two misses in a row: dropping ~10%, build back up.'
        : up
          ? `15 + 6/6/6 nailed: add ${fmtKg(inc)} kg next time.`
          : 'Same weight: aim for 15, then 6 on every mini-set.',
    };
  }

  // ── Kino rep & straight sets: all sets share the progression trigger
  // (kino: every set hits top → all sets +inc).
  if (ex.style === 'kino' || ex.style === 'straight') {
    const allHit = ex.sets.every((scheme, i) => {
      const s = last.sets[i];
      return s?.done && s.reps >= scheme.max;
    });
    const sets: SetSuggestion[] = ex.sets.map((_, i) => {
      const prev = last.sets[i]?.weight ?? 0;
      if (allHit) return { weight: addInc(prev, inc), status: 'up' };
      return { weight: prev, status: 'hold' };
    });
    return {
      sets,
      warmup: [],
      message: allHit
        ? `Top reps on every set: add ${fmtKg(inc)} kg across the board.`
        : 'Same weights: push each set one rep further.',
    };
  }

  // ── RPT double progression: each set progresses independently.
  const sets: SetSuggestion[] = ex.sets.map((scheme, i) => {
    const s = last.sets[i];
    const prev = s?.weight ?? 0;
    if (i === 0 && deloadAll) return { weight: roundTo(prev * 0.9, inc), status: 'deload' };
    if (s?.done && s.reps >= scheme.max) return { weight: addInc(prev, inc), status: 'up' };
    return { weight: prev, status: 'hold' };
  });

  const anyUp = sets.some((s) => s.status === 'up');
  return {
    sets,
    warmup: ex.warmup ? warmupFor(sets[0].weight ?? 0) : [],
    message: deloadAll
      ? 'Two misses on your heavy set: dropping ~10%, build back up.'
      : anyUp
        ? 'Top of range hit: the marked sets go up.'
        : 'Same weight: add reps before you add plates.',
  };
}

/** Warmup per the document: 50 % × 6, 70 % × 5, 80 % × 3 of set-1 weight. */
export function warmupFor(workingWeight: number): { weight: number; reps: number }[] {
  if (workingWeight <= 0) return [];
  const r = (w: number) => roundTo(w, 2.5);
  return [
    { weight: r(workingWeight * 0.5), reps: 6 },
    { weight: r(workingWeight * 0.7), reps: 5 },
    { weight: r(workingWeight * 0.8), reps: 3 },
  ];
}

/** Calibration pre-fill: derive sets 2+ from set 1 via drop rules once typed. */
export function derivedSetWeight(ex: ExerciseDef, setIndex: number, set1Weight: number): number {
  if (setIndex <= 0) return set1Weight;
  let w = set1Weight;
  for (let i = 1; i <= setIndex; i += 1) {
    if (ex.dropPct) w *= 1 - ex.dropPct;
    else if (ex.dropAbs) w -= ex.dropAbs;
  }
  return Math.max(0, roundTo(w, ex.incrementKg));
}

// ── Alternation & phases ────────────────────────────────────────────────────

/** Next Up: the opposite workout of the last logged session (ADR-0002). */
export function nextWorkout(state: AppState, phase: number): WorkoutId {
  const inPhase = state.sessions
    .filter((s) => s.phase === phase)
    .sort((a, b) => b.date.localeCompare(a.date));
  const last = inPhase[0] ?? state.sessions.sort((a, b) => b.date.localeCompare(a.date))[0];
  return last?.workout === 'A' ? 'B' : 'A';
}

export interface PhaseInfo {
  phase: number;
  week: number; // 1-based, clamped to phase length
  autoAdvanced: boolean;
  programComplete: boolean;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Automatic phase advance (ADR-0004): a phase starts at its first logged
 * session; after `weeks` elapse the app moves on and sets a banner.
 */
export function resolvePhase(state: AppState, now = new Date()): PhaseInfo {
  const override = state.settings.phaseOverride;
  if (override) {
    return { phase: override, week: weekInPhase(state, override, now), autoAdvanced: false, programComplete: false };
  }
  let phase = 1;
  for (let p = PROGRAM.length; p >= 1; p -= 1) {
    if (state.settings.phaseStartDates[p]) {
      phase = p;
      break;
    }
  }
  const start = state.settings.phaseStartDates[phase];
  const def = PROGRAM[phase - 1];
  if (!start) return { phase, week: 1, autoAdvanced: false, programComplete: false };

  const elapsed = now.getTime() - new Date(start).getTime();
  const weeks = Math.floor(elapsed / WEEK_MS);
  if (weeks >= def.weeks) {
    if (phase < PROGRAM.length) {
      return { phase: phase + 1, week: 1, autoAdvanced: true, programComplete: false };
    }
    return { phase, week: def.weeks, autoAdvanced: false, programComplete: true };
  }
  return { phase, week: weeks + 1, autoAdvanced: false, programComplete: false };
}

function weekInPhase(state: AppState, phase: number, now: Date): number {
  const start = state.settings.phaseStartDates[phase];
  if (!start) return 1;
  const weeks = Math.floor((now.getTime() - new Date(start).getTime()) / WEEK_MS);
  return Math.min(weeks + 1, PROGRAM[phase - 1].weeks);
}

/** Best set-1 weight ever logged for an exercise (any phase). */
export function bestWeight(state: AppState, exerciseId: string): number | null {
  let best: number | null = null;
  for (const s of state.sessions) {
    const log = s.exercises.find((l) => l.exerciseId === exerciseId);
    const w = log?.sets[0]?.weight;
    if (log?.sets[0]?.done && w != null && (best === null || w > best)) best = w;
  }
  return best;
}
