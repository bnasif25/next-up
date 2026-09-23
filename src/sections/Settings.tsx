import { ALL_EXERCISES, PROGRAM } from '@/data/program';
import { incrementFor, resolvePhase } from '@/lib/engine';
import { useStore } from '@/lib/store';
import Stepper from '@/components/Stepper';

export default function Settings() {
  const { state, updateSettings, exportJson, resetAll, setState } = useStore();
  const info = resolvePhase(state);
  const bw = state.settings.bodyweightKg ?? 0;

  return (
    <div className="px-4 pt-6 pb-28 space-y-6">
      <h1 className="text-2xl font-bold text-zinc-50 px-1">Settings</h1>

      {/* bodyweight */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Bodyweight</p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400">Used for strength standards only.</p>
          <Stepper
            value={bw}
            step={0.5}
            onChange={(v) => updateSettings({ bodyweightKg: v > 0 ? v : undefined })}
            unit="kg"
          />
        </div>
      </section>

      {/* phase control */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Phase</p>
        <p className="text-sm text-zinc-300 mb-1">
          Currently: <span className="font-bold text-[#E7C464]">Phase {info.phase}, {PROGRAM[info.phase - 1].name}</span>
          {state.settings.phaseOverride ? ' (locked)' : ' (automatic)'}
        </p>
        <p className="text-xs text-zinc-500 mb-4">
          Automatic mode advances 8 weeks after a phase's first logged session.
        </p>
        <div className="flex flex-wrap gap-2">
          {state.settings.phaseOverride ? (
            <button
              onClick={() => updateSettings({ phaseOverride: null })}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-200 active:scale-95 transition-transform"
            >
              Back to automatic
            </button>
          ) : (
            <button
              onClick={() => updateSettings({ phaseOverride: info.phase })}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-200 active:scale-95 transition-transform"
            >
              Lock current phase
            </button>
          )}
          {info.phase < PROGRAM.length && (
            <button
              onClick={() =>
                setState((s) => {
                  const next = info.phase + 1;
                  const phaseStartDates = { ...s.settings.phaseStartDates, [next]: new Date().toISOString() };
                  delete phaseStartDates[info.phase];
                  return {
                    ...s,
                    settings: { ...s.settings, phaseStartDates, phaseOverride: null },
                    banner: `Phase ${next}: ${PROGRAM[next - 1].name}. Let's go.`,
                  };
                })
              }
              className="px-4 py-2.5 rounded-xl bg-[#E7C464]/15 text-[#E7C464] text-sm font-semibold active:scale-95 transition-transform"
            >
              Advance to Phase {info.phase + 1} now
            </button>
          )}
        </div>
      </section>

      {/* increments */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Weight jumps</p>
        <p className="text-xs text-zinc-500 mb-4">
          How much the app adds when you hit the top of a rep range. Match these to your gym's plates.
        </p>
        <div className="space-y-3">
          {ALL_EXERCISES.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between gap-2">
              <p className="text-sm text-zinc-300 flex-1">
                {ex.name}
                {ex.perHand && <span className="text-zinc-600 text-xs"> /hand</span>}
              </p>
              <Stepper
                value={incrementFor(ex, state)}
                step={0.25}
                min={0.25}
                onChange={(v) =>
                  updateSettings({ increments: { ...state.settings.increments, [ex.id]: v } })
                }
                unit="kg"
              />
            </div>
          ))}
        </div>
      </section>

      {/* data */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Data</p>
        <button
          onClick={exportJson}
          className="w-full py-3.5 rounded-2xl bg-zinc-800 text-zinc-100 font-semibold active:scale-[0.98] transition-transform"
        >
          Export backup (JSON) · {state.sessions.length} sessions
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete all ${state.sessions.length} logged sessions and settings? This cannot be undone.`)) {
              resetAll();
            }
          }}
          className="w-full py-3.5 rounded-2xl bg-red-950/50 border border-red-900/50 text-red-400 font-semibold active:scale-[0.98] transition-transform"
        >
          Reset everything
        </button>
        <p className="text-[11px] text-zinc-600">
          All data lives only on this device. Export before switching phones.
        </p>
      </section>

      <p className="text-center text-[11px] text-zinc-700 pb-4">
        Next Up · Greek God Program 2.0 · kg only
      </p>
    </div>
  );
}
