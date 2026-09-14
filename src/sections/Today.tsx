import { useEffect, useMemo, useState } from 'react';
import type { AppState, DraftSession, ExerciseDef, ExerciseLog, SessionLog, WorkoutId } from '@/types';
import { PROGRAM } from '@/data/program';
import {
  exerciseHistory,
  fmtKg,
  incrementFor,
  nextWorkout,
  resolvePhase,
  suggestExercise,
} from '@/lib/engine';
import { useStore } from '@/lib/store';
import Stepper from '@/components/Stepper';
import RestTimer from '@/components/RestTimer';
import GoalsCard from '@/components/GoalsCard';

function weightLabel(ex: ExerciseDef, w: number): string {
  if ((ex.attachedOnly || ex.bodyweightOk) && w === 0) return 'BW';
  return fmtKg(w);
}

function lastTimeText(state: AppState, ex: ExerciseDef, phase: number): string | null {
  const last = exerciseHistory(state, ex.id, phase)[0]?.log;
  if (!last) return null;
  const parts = last.sets
    .filter((s) => s.done)
    .map((s) => `${weightLabel(ex, s.weight)}${s.weight === 0 && (ex.attachedOnly || ex.bodyweightOk) ? '' : ' kg'} × ${s.reps}`);
  return parts.length ? `Last: ${parts.join(' · ')}` : null;
}

const STATUS_BADGE: Record<string, { text: string; cls: string }> = {
  up: { text: '▲ up', cls: 'text-green-400' },
  deload: { text: '▼ −10%', cls: 'text-orange-400' },
  hold: { text: '= hold', cls: 'text-zinc-500' },
  calib: { text: 'log it', cls: 'text-zinc-500' },
};

export default function Today() {
  const { state, setDraft, saveSession, setState, clearBanner } = useStore();
  const info = useMemo(() => resolvePhase(state), [state]);
  const [timer, setTimer] = useState<{ seconds: number; label: string } | null>(null);
  const [finished, setFinished] = useState<WorkoutId | null>(null);
  const [warmupTicks, setWarmupTicks] = useState<Record<string, boolean>>({});

  // Surface the auto phase-advance banner once (ADR-0004).
  useEffect(() => {
    if (info.autoAdvanced && !state.banner) {
      const def = PROGRAM[info.phase - 1];
      setState((s) => ({
        ...s,
        banner: `Phase ${info.phase} unlocked — ${def.name}. New exercises, same grind.`,
      }));
    }
  }, [info.autoAdvanced, info.phase, state.banner, setState]);

  const draft = state.draft;
  const workoutId: WorkoutId = draft ? draft.workout : nextWorkout(state, info.phase);
  const phaseDef = PROGRAM[(draft ? draft.phase : info.phase) - 1];
  const workout = phaseDef.workouts[workoutId];

  const startDraft = () => {
    const exercises: ExerciseLog[] = workout.exercises.map((ex) => {
      const sug = suggestExercise(state, ex, info.phase);
      const shared = sug.sets[0]?.weight ?? 0;
      return {
        exerciseId: ex.id,
        sets: ex.sets.map((scheme, i) => ({
          weight: ex.style === 'restpause' ? shared : sug.sets[i]?.weight ?? 0,
          reps: scheme.min,
          done: false,
        })),
        miniSets: ex.miniSets
          ? Array.from({ length: ex.miniSets.count }, () => ({
              weight: shared,
              reps: ex.miniSets!.min,
              done: false,
            }))
          : undefined,
      };
    });
    const d: DraftSession = {
      workout: workoutId,
      phase: info.phase,
      startedAt: new Date().toISOString(),
      exercises,
    };
    setDraft(d);
    setWarmupTicks({});
  };

  const updateDraft = (fn: (d: DraftSession) => DraftSession) => {
    if (draft) setDraft(fn(draft));
  };

  const totalSets = draft
    ? draft.exercises.reduce((n, l) => n + l.sets.length + (l.miniSets?.length ?? 0), 0)
    : 0;
  const doneSets = draft
    ? draft.exercises.reduce(
        (n, l) => n + l.sets.filter((s) => s.done).length + (l.miniSets?.filter((s) => s.done).length ?? 0),
        0,
      )
    : 0;

  const finish = () => {
    if (!draft) return;
    const session: SessionLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      phase: draft.phase,
      workout: draft.workout,
      exercises: draft.exercises,
    };
    saveSession(session);
    setFinished(draft.workout);
  };

  // ── program complete ──────────────────────────────────────────────────────
  if (info.programComplete && !draft) {
    return (
      <div className="px-5 pt-16 pb-28 text-center animate-in fade-in duration-500">
        <p className="text-6xl mb-6">🏛️</p>
        <h1 className="text-3xl font-bold text-zinc-50 mb-3">Program complete.</h1>
        <p className="text-zinc-400 mb-2">Six months of Greek God 2.0 in the books.</p>
        <p className="text-zinc-500 text-sm mb-10">
          Check History to see how far the numbers climbed — then run it back heavier.
        </p>
        <button
          onClick={() =>
            setState((s) => ({
              ...s,
              settings: { ...s.settings, phaseStartDates: {}, phaseOverride: null },
            }))
          }
          className="px-10 py-4 rounded-2xl bg-[#E7C464] text-zinc-950 text-lg font-bold active:scale-95 transition-transform"
        >
          Restart cycle
        </button>
      </div>
    );
  }

  // ── finished summary ──────────────────────────────────────────────────────
  if (finished) {
    const next = finished === 'A' ? 'B' : 'A';
    return (
      <div className="px-5 pt-16 pb-28 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#E7C464]/15 flex items-center justify-center">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-50 mb-2">Workout {finished} logged.</h1>
        <p className="text-zinc-400 mb-10">
          Next up: <span className="text-[#E7C464] font-bold">Workout {next}</span>
        </p>
        <button
          onClick={() => setFinished(null)}
          className="px-10 py-4 rounded-2xl bg-zinc-800 text-zinc-100 text-lg font-semibold active:scale-95 transition-transform"
        >
          Done
        </button>
      </div>
    );
  }

  // ── next-up overview ──────────────────────────────────────────────────────
  if (!draft) {
    return (
      <div className="px-5 pt-8 pb-28 space-y-6">
        {state.banner && (
          <button
            onClick={clearBanner}
            className="w-full text-left rounded-2xl border border-[#E7C464]/40 bg-[#E7C464]/10 p-4 text-sm text-[#E7C464]"
          >
            {state.banner} <span className="float-right text-zinc-500">dismiss ✕</span>
          </button>
        )}

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-1">Next up</p>
          <div className="flex items-end gap-4">
            <span className="text-[7rem] leading-none font-black text-[#E7C464] drop-shadow-[0_0_30px_rgba(231,196,100,0.25)]">
              {workoutId}
            </span>
            <div className="pb-4">
              <p className="text-xl font-bold text-zinc-50">{workout.title}</p>
              <p className="text-sm text-zinc-400">{workout.focus}</p>
              <p className="text-xs text-zinc-500 mt-1">
                Phase {info.phase} · Week {info.week} of {phaseDef.weeks} · {phaseDef.name}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 divide-y divide-zinc-800/70">
          {workout.exercises.map((ex) => {
            const sug = suggestExercise(state, ex, info.phase);
            const s1 = sug.sets[0];
            const scheme = ex.sets[0];
            const target =
              scheme.min === scheme.max ? `${scheme.min}` : `${scheme.min}–${scheme.max}`;
            return (
              <div key={ex.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-semibold text-zinc-100">{ex.name}</p>
                  <p className="text-xs text-zinc-500">
                    {ex.sets.length} sets · {target} reps
                    {ex.miniSets ? ` + ${ex.miniSets.count} mini` : ''}
                    {ex.perHand ? ' · per hand' : ''}
                  </p>
                </div>
                <div className="text-right">
                  {s1?.weight !== null && s1 !== undefined ? (
                    <>
                      <p className="text-lg font-bold tabular-nums text-zinc-50">
                        {weightLabel(ex, s1.weight)}
                        {s1.weight > 0 && <span className="text-xs text-zinc-500 font-normal"> kg</span>}
                      </p>
                      <p className={`text-[10px] font-semibold ${STATUS_BADGE[s1.status].cls}`}>
                        {STATUS_BADGE[s1.status].text}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-zinc-500">calibration</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={startDraft}
          className="w-full py-5 rounded-3xl bg-[#E7C464] text-zinc-950 text-xl font-black tracking-wide active:scale-[0.98] transition-transform shadow-[0_8px_40px_rgba(231,196,100,0.25)]"
        >
          START WORKOUT {workoutId}
        </button>

        <GoalsCard />
      </div>
    );
  }

  // ── active session ────────────────────────────────────────────────────────
  return (
    <div className="px-4 pt-6 pb-40 space-y-5">
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-zinc-950/90 backdrop-blur border-b border-zinc-900">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-zinc-50">
            Workout {draft.workout} <span className="text-zinc-500 font-normal">· Phase {draft.phase}</span>
          </p>
          <p className="text-sm text-zinc-400 tabular-nums">
            {doneSets}/{totalSets} sets
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-[#E7C464] transition-all duration-500"
            style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
          />
        </div>
      </div>

      {workout.exercises.map((ex, exIdx) => {
        const log = draft.exercises[exIdx];
        const inc = incrementFor(ex, state);
        const sug = suggestExercise(state, ex, draft.phase);
        const lastText = lastTimeText(state, ex, draft.phase);
        const isRestPause = ex.style === 'restpause' && ex.miniSets;
        const sharedWeight = log.sets[0]?.weight ?? 0;

        const setSet = (setIdx: number, patch: Partial<{ weight: number; reps: number; done: boolean }>) =>
          updateDraft((d) => {
            const copy = structuredClone(d);
            Object.assign(copy.exercises[exIdx].sets[setIdx], patch);
            if (isRestPause && patch.weight !== undefined) {
              copy.exercises[exIdx].sets.forEach((s) => (s.weight = patch.weight!));
              copy.exercises[exIdx].miniSets?.forEach((s) => (s.weight = patch.weight!));
            }
            return copy;
          });

        const setMini = (miniIdx: number, patch: Partial<{ reps: number; done: boolean }>) =>
          updateDraft((d) => {
            const copy = structuredClone(d);
            Object.assign(copy.exercises[exIdx].miniSets![miniIdx], patch);
            return copy;
          });

        return (
          <div key={ex.id} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <p className="font-bold text-lg text-zinc-50">{ex.name}</p>
              <p className="text-xs text-zinc-500">
                {ex.style === 'rpt' && 'Reverse pyramid · '}
                {ex.style === 'kino' && 'Kino rep · '}
                {ex.style === 'restpause' && 'Rest-pause · '}
                {ex.style === 'straight' && 'Straight sets · '}
                rest {ex.restSeconds >= 60 ? `${ex.restSeconds / 60} min` : `${ex.restSeconds} s`}
                {ex.perHand ? ' · per hand' : ''}
              </p>
              {lastText && <p className="text-xs text-[#E7C464]/80 mt-1">{lastText}</p>}
              {sug.message && !lastText && <p className="text-xs text-zinc-500 mt-1">{sug.message}</p>}
              {ex.note && <p className="text-[11px] text-zinc-600 mt-1 italic">{ex.note}</p>}
            </div>

            {/* warmup sets */}
            {ex.warmup && sug.warmup.length > 0 && (
              <div className="mx-4 mb-2 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 px-4 py-2">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 py-1">Warmup</p>
                {sug.warmup.map((w, i) => {
                  const key = `${ex.id}-w${i}`;
                  const ticked = warmupTicks[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setWarmupTicks((t) => ({ ...t, [key]: !t[key] }))}
                      className="w-full flex items-center justify-between py-2 text-sm active:scale-[0.99] transition-transform"
                    >
                      <span className={ticked ? 'text-zinc-600 line-through' : 'text-zinc-400'}>
                        {fmtKg(w.weight)} kg × {w.reps}
                      </span>
                      <span
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                          ticked ? 'bg-[#E7C464] border-[#E7C464] text-zinc-950' : 'border-zinc-700 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* working sets */}
            <div className="px-4 pb-4 space-y-2">
              {log.sets.map((set, i) => {
                const scheme = ex.sets[i];
                const target = scheme.min === scheme.max ? `${scheme.min}` : `${scheme.min}–${scheme.max}`;
                const badge = STATUS_BADGE[sug.sets[i]?.status ?? 'hold'];
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 transition-colors ${
                      set.done ? 'bg-[#E7C464]/10 border border-[#E7C464]/30' : 'bg-zinc-950/60 border border-zinc-800/60'
                    }`}
                  >
                    <div className="w-16">
                      <p className="text-[10px] uppercase tracking-wide text-zinc-500">Set {i + 1}</p>
                      <p className="text-sm font-bold text-zinc-300">{target}</p>
                      {!set.done && sug.sets[i] && sug.sets[i].status !== 'hold' && sug.sets[i].status !== 'calib' && (
                        <p className={`text-[10px] font-semibold ${badge.cls}`}>{badge.text}</p>
                      )}
                    </div>
                    <Stepper
                      value={set.weight}
                      step={inc}
                      onChange={(v) => setSet(i, { weight: v })}
                      display={weightLabel(ex, set.weight)}
                      unit={set.weight > 0 ? (ex.perHand ? 'kg/hand' : 'kg') : undefined}
                      disabled={set.done}
                    />
                    <Stepper
                      value={set.reps}
                      step={1}
                      onChange={(v) => setSet(i, { reps: v })}
                      unit="reps"
                      disabled={set.done}
                    />
                    <button
                      onClick={() => {
                        if (set.done) {
                          setSet(i, { done: false });
                        } else {
                          setSet(i, { done: true });
                          setTimer({ seconds: ex.restSeconds, label: ex.name });
                        }
                      }}
                      className={`w-12 h-12 rounded-full text-xl font-black active:scale-90 transition-all ${
                        set.done
                          ? 'bg-[#E7C464] text-zinc-950 shadow-[0_0_20px_rgba(231,196,100,0.4)]'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                      aria-label="toggle set done"
                    >
                      ✓
                    </button>
                  </div>
                );
              })}

              {/* rest-pause mini-sets */}
              {isRestPause &&
                log.miniSets!.map((mini, mi) => (
                  <div
                    key={`m${mi}`}
                    className={`flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 transition-colors ${
                      mini.done
                        ? 'bg-[#E7C464]/10 border border-[#E7C464]/30'
                        : 'bg-zinc-950/60 border border-zinc-800/60'
                    }`}
                  >
                    <div className="w-16">
                      <p className="text-[10px] uppercase tracking-wide text-zinc-500">Mini {mi + 1}</p>
                      <p className="text-sm font-bold text-zinc-300">
                        {ex.miniSets!.min}–{ex.miniSets!.max}
                      </p>
                    </div>
                    <span className="text-sm text-zinc-500 tabular-nums min-w-[4.5rem] text-center">
                      {weightLabel(ex, sharedWeight)}
                      {sharedWeight > 0 && <span className="block text-[10px] uppercase">kg</span>}
                    </span>
                    <Stepper
                      value={mini.reps}
                      step={1}
                      onChange={(v) => setMini(mi, { reps: v })}
                      unit="reps"
                      disabled={mini.done}
                    />
                    <button
                      onClick={() => {
                        if (mini.done) {
                          setMini(mi, { done: false });
                        } else {
                          setMini(mi, { done: true });
                          setTimer({ seconds: ex.miniSets!.restSeconds, label: `${ex.name} · mini-set` });
                        }
                      }}
                      className={`w-12 h-12 rounded-full text-xl font-black active:scale-90 transition-all ${
                        mini.done
                          ? 'bg-[#E7C464] text-zinc-950 shadow-[0_0_20px_rgba(231,196,100,0.4)]'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                      aria-label="toggle mini-set done"
                    >
                      ✓
                    </button>
                  </div>
                ))}
            </div>
          </div>
        );
      })}

      <div className="fixed bottom-20 left-0 right-0 px-4 z-20">
        <button
          onClick={finish}
          disabled={doneSets === 0}
          className="w-full py-4 rounded-3xl bg-[#E7C464] text-zinc-950 text-lg font-black tracking-wide active:scale-[0.98] transition-transform disabled:opacity-30 shadow-[0_8px_40px_rgba(231,196,100,0.25)]"
        >
          FINISH WORKOUT · {doneSets}/{totalSets}
        </button>
      </div>

      {timer && <RestTimer seconds={timer.seconds} label={timer.label} onDone={() => setTimer(null)} />}
    </div>
  );
}
