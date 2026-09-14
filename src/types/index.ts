export type TrainingStyle = 'rpt' | 'kino' | 'restpause' | 'straight';
export type ProgressionKind = 'double' | 'linear';
export type WorkoutId = 'A' | 'B';

/** Per-set rep target. fixed targets have min === max. */
export interface SetScheme {
  min: number;
  max: number;
}

export interface ExerciseDef {
  id: string;
  name: string;
  style: TrainingStyle;
  progression: ProgressionKind;
  sets: SetScheme[];
  /** kg to drop per set after set 1 (RPT). Mutually exclusive with dropPct. */
  dropAbs?: number;
  dropPct?: number;
  /** kino: suggested per-set increase hint (display only) */
  ascendHint?: number;
  restSeconds: number;
  /** default progression increment in kg (user-overridable in settings) */
  incrementKg: number;
  /** dumbbell moves: weight is per hand */
  perHand?: boolean;
  /** chinups/dips/pullups: log attached weight only; 0 = bodyweight */
  attachedOnly?: boolean;
  /** bodyweight exercises where 0 kg is normal (abs) */
  bodyweightOk?: boolean;
  /** compute warmup sets from set-1 weight (first exercise of a workout) */
  warmup?: boolean;
  /** rest-pause mini-sets following the activation set */
  miniSets?: { count: number; min: number; max: number; restSeconds: number };
  note?: string;
}

export interface WorkoutDef {
  id: WorkoutId;
  title: string;
  focus: string;
  exercises: ExerciseDef[];
}

export interface PhaseDef {
  n: number;
  name: string;
  weeks: number;
  workouts: Record<WorkoutId, WorkoutDef>;
}

// ── Logs ────────────────────────────────────────────────────────────────────

export interface SetLog {
  weight: number; // kg; 0 = bodyweight for attachedOnly/bodyweightOk moves
  reps: number;
  done: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
  miniSets?: SetLog[];
}

export interface SessionLog {
  id: string;
  /** ISO date string */
  date: string;
  phase: number;
  workout: WorkoutId;
  exercises: ExerciseLog[];
}

// ── State ───────────────────────────────────────────────────────────────────

export interface Settings {
  /** per-exercise increment overrides (kg) */
  increments: Record<string, number>;
  bodyweightKg?: number;
  /** manual phase override; null/undefined = automatic */
  phaseOverride?: number | null;
  /** ISO date of first session per phase */
  phaseStartDates: Record<number, string>;
}

/** In-progress workout draft — survives reloads mid-session */
export interface DraftSession {
  workout: WorkoutId;
  phase: number;
  startedAt: string;
  exercises: ExerciseLog[];
}

export interface AppState {
  sessions: SessionLog[];
  settings: Settings;
  draft: DraftSession | null;
  /** one-shot banner (e.g. phase auto-advanced) */
  banner: string | null;
}

// ── Engine results ──────────────────────────────────────────────────────────

export type SuggestionStatus = 'up' | 'hold' | 'deload' | 'calib';

export interface SetSuggestion {
  weight: number | null;
  status: SuggestionStatus;
}

export interface WarmupSet {
  weight: number;
  reps: number;
}

export interface ExerciseSuggestion {
  sets: SetSuggestion[];
  warmup: WarmupSet[];
  message?: string;
}
