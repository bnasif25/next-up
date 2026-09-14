import { useStore } from '@/lib/store';
import { bestWeight, fmtKg } from '@/lib/engine';

interface Standard {
  exerciseId: string | null; // null = target-only (not in current program)
  name: string;
  /** multiples of bodyweight for good / great / godlike */
  mult: [number, number, number];
  reps: number;
  attached?: boolean;
}

const STANDARDS: Standard[] = [
  { exerciseId: 'incline-barbell-press', name: 'Incline Press', mult: [1.0, 1.2, 1.4], reps: 5 },
  { exerciseId: 'weighted-chinups', name: 'Weighted Chinup', mult: [0.3, 0.5, 0.7], reps: 5, attached: true },
  { exerciseId: 'standing-press', name: 'Standing Press', mult: [0.7, 0.85, 1.0], reps: 5 },
  { exerciseId: 'weighted-dips', name: 'Weighted Dip', mult: [0.5, 0.75, 1.0], reps: 6, attached: true },
  { exerciseId: null, name: 'Barbell Curl', mult: [0.55, 0.65, 0.75], reps: 5 },
];

const r2 = (n: number) => Math.round(n * 2) / 2;

export default function GoalsCard() {
  const { state } = useStore();
  const bw = state.settings.bodyweightKg;

  if (!bw) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Strength Standards</p>
        <p className="text-sm text-zinc-400">
          Set your bodyweight in Settings to see your Good → Great → Godlike targets.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5">
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
        Strength Standards · {fmtKg(bw)} kg bodyweight
      </p>
      <div className="space-y-4">
        {STANDARDS.map((s) => {
          const [good, great, god] = s.mult.map((m) => r2(m * bw));
          const best = s.exerciseId ? bestWeight(state, s.exerciseId) : null;
          const pct = best === null ? 0 : Math.min(100, (best / god) * 100);
          const tier =
            best === null ? null : best >= god ? 'GODLIKE' : best >= great ? 'GREAT' : best >= good ? 'GOOD' : null;
          return (
            <div key={s.name}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-semibold text-zinc-200">{s.name}</span>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {best !== null ? (
                    <>
                      <span className="text-[#E7C464] font-bold">{fmtKg(best)} kg</span>
                      {tier && <span className="ml-2 text-[#E7C464]">{tier}</span>}
                      <span className="ml-2">· god {fmtKg(god)} kg{s.attached ? ' +BW' : ''}</span>
                    </>
                  ) : (
                    <>good {fmtKg(good)} · great {fmtKg(great)} · god {fmtKg(god)} kg{s.attached ? ' +BW' : ''} × {s.reps}</>
                  )}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8a6d2a] to-[#E7C464] transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
