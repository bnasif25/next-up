import { getExercise } from '@/data/program';
import { fmtKg } from '@/lib/engine';
import { useStore } from '@/lib/store';

export default function History() {
  const { state } = useStore();
  const sessions = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date));

  if (sessions.length === 0) {
    return (
      <div className="px-5 pt-16 pb-28 text-center">
        <p className="text-5xl mb-4">📓</p>
        <h1 className="text-2xl font-bold text-zinc-50 mb-2">No sessions yet</h1>
        <p className="text-zinc-500 text-sm">Your logged workouts will stack up here.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-28 space-y-4">
      <h1 className="text-2xl font-bold text-zinc-50 px-1">History</h1>
      {sessions.map((s) => {
        const d = new Date(s.date);
        const dateText = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        return (
          <div key={s.id} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/70">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#E7C464]/15 text-[#E7C464] font-black flex items-center justify-center">
                  {s.workout}
                </span>
                <div>
                  <p className="font-semibold text-zinc-100 text-sm">Workout {s.workout}</p>
                  <p className="text-[11px] text-zinc-500">Phase {s.phase}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400">{dateText}</p>
            </div>
            <div className="px-5 py-3 space-y-2">
              {s.exercises.map((l) => {
                const ex = getExercise(l.exerciseId);
                if (!ex) return null;
                const setsText = l.sets
                  .filter((x) => x.done)
                  .map((x) => {
                    const w =
                      (ex.attachedOnly || ex.bodyweightOk) && x.weight === 0 ? 'BW' : `${fmtKg(x.weight)}`;
                    return `${w}×${x.reps}`;
                  })
                  .join('  ');
                const minis = (l.miniSets ?? [])
                  .filter((x) => x.done)
                  .map((x) => x.reps)
                  .join('/');
                return (
                  <div key={l.exerciseId} className="flex items-baseline justify-between gap-3">
                    <p className="text-sm text-zinc-300 shrink-0">{ex.name}</p>
                    <p className="text-xs text-zinc-500 tabular-nums text-right">
                      {setsText || '—'}
                      {minis && <span className="text-zinc-600"> +{minis}</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
