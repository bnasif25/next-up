import type { ExerciseDef, PhaseDef, WorkoutDef } from '@/types';

/**
 * Greek God Program 2.0 (Strength & Density) — extracted verbatim from the
 * user's program document. All weights kg. Phase 3 reuses Phase 1 workouts.
 *
 * Rest defaults (seconds) per the document:
 *  RPT compounds 180 · RPT isolations 120 · Kino rep 60–90 (legs 120) ·
 *  rest-pause mini-sets 10–15 · abs ~60.
 */

const inclineBarbellPress: ExerciseDef = {
  id: 'incline-barbell-press',
  name: 'Incline Barbell Press',
  style: 'rpt',
  progression: 'double',
  sets: [{ min: 4, max: 5 }, { min: 6, max: 7 }, { min: 8, max: 10 }],
  dropPct: 0.1,
  restSeconds: 180,
  incrementKg: 2.5,
  warmup: true,
  note: 'Heaviest set first. Leave a rep in the tank on sets 2–3.',
};

const standingPress: ExerciseDef = {
  id: 'standing-press',
  name: 'Standing Press',
  style: 'rpt',
  progression: 'double',
  sets: [{ min: 6, max: 8 }, { min: 8, max: 10 }, { min: 8, max: 10 }],
  dropPct: 0.1,
  restSeconds: 180,
  incrementKg: 2.5,
};

const ropePushdowns: ExerciseDef = {
  id: 'triceps-rope-pushdowns',
  name: 'Triceps Rope Pushdowns',
  style: 'rpt',
  progression: 'double',
  sets: [{ min: 6, max: 8 }, { min: 8, max: 10 }, { min: 10, max: 12 }],
  dropPct: 0.1,
  restSeconds: 120,
  incrementKg: 2.5,
};

const lateralRaises: ExerciseDef = {
  id: 'lateral-raises',
  name: 'Lateral Raises',
  style: 'restpause',
  progression: 'double',
  sets: [{ min: 12, max: 15 }],
  restSeconds: 12,
  incrementKg: 2,
  perHand: true,
  miniSets: { count: 3, min: 4, max: 6, restSeconds: 12 },
  note: 'Same weight for activation + mini-sets. 10–15 s rests only.',
};

const hangingKneeRaises: ExerciseDef = {
  id: 'hanging-knee-raises',
  name: 'Hanging Knee Raises',
  style: 'straight',
  progression: 'double',
  sets: [{ min: 8, max: 12 }, { min: 8, max: 12 }, { min: 8, max: 12 }],
  restSeconds: 60,
  incrementKg: 2.5,
  bodyweightOk: true,
  note: 'Bodyweight is fine — hold a weight between your legs when 3 × 12 gets easy.',
};

const weightedChinups: ExerciseDef = {
  id: 'weighted-chinups',
  name: 'Weighted Chinups',
  style: 'rpt',
  progression: 'linear',
  sets: [{ min: 4, max: 4 }, { min: 6, max: 6 }, { min: 8, max: 8 }],
  dropAbs: 10,
  restSeconds: 180,
  incrementKg: 1.25,
  attachedOnly: true,
  warmup: true,
  note: 'Log the belt weight only — bodyweight sets are "BW". No belt yet? Do 3 sets at bodyweight.',
};

const inclineHammerCurls: ExerciseDef = {
  id: 'incline-hammer-curls',
  name: 'Incline Dumbbell Hammer Curls',
  style: 'rpt',
  progression: 'double',
  sets: [{ min: 6, max: 8 }, { min: 6, max: 8 }, { min: 8, max: 10 }],
  dropAbs: 2.5,
  restSeconds: 120,
  incrementKg: 2,
  perHand: true,
};

const bulgarianSplitSquats: ExerciseDef = {
  id: 'bulgarian-split-squats',
  name: 'Bulgarian Split Squats',
  style: 'kino',
  progression: 'double',
  sets: [{ min: 6, max: 8 }, { min: 6, max: 8 }, { min: 6, max: 8 }, { min: 6, max: 8 }],
  ascendHint: 4.5,
  restSeconds: 120,
  incrementKg: 2,
  perHand: true,
  note: 'Start light, add weight each set. Reps are per leg.',
};

const dumbbellRdl: ExerciseDef = {
  id: 'db-romanian-deadlift',
  name: 'Dumbbell Romanian Deadlifts',
  style: 'kino',
  progression: 'double',
  sets: [{ min: 10, max: 12 }, { min: 10, max: 12 }, { min: 10, max: 12 }, { min: 10, max: 12 }],
  ascendHint: 4.5,
  restSeconds: 120,
  incrementKg: 2,
  perHand: true,
};

const facePulls: ExerciseDef = {
  id: 'face-pulls',
  name: 'Face Pulls',
  style: 'kino',
  progression: 'double',
  sets: [{ min: 12, max: 15 }, { min: 12, max: 15 }, { min: 12, max: 15 }, { min: 12, max: 15 }],
  ascendHint: 2.5,
  restSeconds: 90,
  incrementKg: 2.5,
};

// ── Phase 2 exercises ───────────────────────────────────────────────────────

const inclineDbPress: ExerciseDef = {
  id: 'incline-db-press',
  name: 'Incline Dumbbell Press',
  style: 'rpt',
  progression: 'double',
  sets: [{ min: 6, max: 8 }, { min: 8, max: 10 }, { min: 10, max: 12 }],
  dropAbs: 4.5,
  restSeconds: 180,
  incrementKg: 2,
  perHand: true,
  warmup: true,
};

const weightedDips: ExerciseDef = {
  id: 'weighted-dips',
  name: 'Weighted Dips',
  style: 'rpt',
  progression: 'linear',
  sets: [{ min: 6, max: 6 }, { min: 8, max: 8 }, { min: 10, max: 10 }],
  dropAbs: 12.5,
  restSeconds: 180,
  incrementKg: 1.25,
  attachedOnly: true,
  note: 'Belt weight only. New to dips? Bodyweight for all three sets.',
};

const oneArmOverheadTriceps: ExerciseDef = {
  id: 'one-arm-overhead-triceps',
  name: 'One-Arm Overhead Triceps Extensions',
  style: 'rpt',
  progression: 'double',
  sets: [{ min: 8, max: 10 }, { min: 10, max: 12 }, { min: 12, max: 15 }],
  dropAbs: 2.5,
  restSeconds: 120,
  incrementKg: 2,
  perHand: true,
};

const dbUprightRows: ExerciseDef = {
  id: 'db-upright-rows',
  name: 'Dumbbell Upright Rows',
  style: 'kino',
  progression: 'double',
  sets: [{ min: 10, max: 15 }, { min: 10, max: 15 }, { min: 10, max: 15 }, { min: 10, max: 15 }],
  ascendHint: 2.5,
  restSeconds: 90,
  incrementKg: 2,
  perHand: true,
};

const sideToSideKneeUps: ExerciseDef = {
  id: 'side-to-side-knee-ups',
  name: 'Side-to-Side Knee Ups',
  style: 'straight',
  progression: 'double',
  sets: [{ min: 8, max: 12 }, { min: 8, max: 12 }, { min: 8, max: 12 }],
  restSeconds: 60,
  incrementKg: 2.5,
  bodyweightOk: true,
  note: 'Reps are per side.',
};

const weightedPullups: ExerciseDef = {
  id: 'weighted-pullups',
  name: 'Weighted Pullups',
  style: 'rpt',
  progression: 'linear',
  sets: [{ min: 6, max: 6 }, { min: 8, max: 8 }, { min: 8, max: 8 }],
  dropAbs: 10,
  restSeconds: 180,
  incrementKg: 1.25,
  attachedOnly: true,
  warmup: true,
};

const inclineDbCurls: ExerciseDef = {
  id: 'incline-db-curls',
  name: 'Incline Dumbbell Bicep Curls',
  style: 'rpt',
  progression: 'double',
  sets: [{ min: 6, max: 8 }, { min: 6, max: 8 }, { min: 6, max: 8 }],
  dropAbs: 2.5,
  restSeconds: 120,
  incrementKg: 2,
  perHand: true,
};

const boxSquats: ExerciseDef = {
  id: 'box-squats',
  name: 'Barbell Box Squats',
  style: 'kino',
  progression: 'linear',
  sets: [{ min: 6, max: 6 }, { min: 6, max: 6 }, { min: 6, max: 6 }, { min: 6, max: 6 }, { min: 6, max: 6 }],
  ascendHint: 12.5,
  restSeconds: 120,
  incrementKg: 2.5,
  note: 'Add weight each set. Too heavy by set 4–5? Stay at that weight.',
};

const singleLegRdl: ExerciseDef = {
  id: 'single-leg-rdl',
  name: 'Single-Leg Romanian Deadlifts',
  style: 'kino',
  progression: 'double',
  sets: [{ min: 8, max: 12 }, { min: 8, max: 12 }, { min: 8, max: 12 }],
  ascendHint: 2.5,
  restSeconds: 120,
  incrementKg: 2,
  note: 'Reps per leg. Substitute barbell hip thrusts if you prefer.',
};

const seatedBentOverFlyes: ExerciseDef = {
  id: 'seated-bent-over-flyes',
  name: 'Seated Bent-Over Flyes',
  style: 'restpause',
  progression: 'double',
  sets: [{ min: 12, max: 15 }],
  restSeconds: 12,
  incrementKg: 2,
  perHand: true,
  miniSets: { count: 3, min: 4, max: 6, restSeconds: 12 },
};

// ── Workouts & phases ───────────────────────────────────────────────────────

const phase1A: WorkoutDef = {
  id: 'A',
  title: 'Workout A',
  focus: 'Chest · Shoulders · Triceps · Abs',
  exercises: [inclineBarbellPress, standingPress, ropePushdowns, lateralRaises, hangingKneeRaises],
};

const phase1B: WorkoutDef = {
  id: 'B',
  title: 'Workout B',
  focus: 'Back · Biceps · Legs',
  exercises: [weightedChinups, inclineHammerCurls, bulgarianSplitSquats, dumbbellRdl, facePulls],
};

const phase2A: WorkoutDef = {
  id: 'A',
  title: 'Workout A',
  focus: 'Chest · Triceps · Shoulders',
  exercises: [inclineDbPress, weightedDips, oneArmOverheadTriceps, dbUprightRows, sideToSideKneeUps],
};

const phase2B: WorkoutDef = {
  id: 'B',
  title: 'Workout B',
  focus: 'Back · Biceps · Legs',
  exercises: [weightedPullups, inclineDbCurls, boxSquats, singleLegRdl, seatedBentOverFlyes],
};

export const PROGRAM: PhaseDef[] = [
  { n: 1, name: 'Shoulder Emphasis', weeks: 8, workouts: { A: phase1A, B: phase1B } },
  { n: 2, name: 'Chest Emphasis', weeks: 8, workouts: { A: phase2A, B: phase2B } },
  { n: 3, name: 'Strength & Density', weeks: 8, workouts: { A: phase1A, B: phase1B } },
];

export const TOTAL_WEEKS = PROGRAM.reduce((s, p) => s + p.weeks, 0);

/** All exercise defs, deduped by id (for settings + history lookups). */
export const ALL_EXERCISES: ExerciseDef[] = (() => {
  const map = new Map<string, ExerciseDef>();
  for (const p of PROGRAM) {
    for (const w of Object.values(p.workouts)) {
      for (const e of w.exercises) if (!map.has(e.id)) map.set(e.id, e);
    }
  }
  return [...map.values()];
})();

export function getExercise(id: string): ExerciseDef | undefined {
  return ALL_EXERCISES.find((e) => e.id === id);
}
