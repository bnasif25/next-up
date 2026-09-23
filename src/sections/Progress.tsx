import { ChartLineUp } from '@phosphor-icons/react';
import { TOTAL_WEEKS } from '@/data/program';
import { fmtKg } from '@/lib/engine';
import { INDICATORS, seriesFor, type Point } from '@/lib/progress';
import { useStore } from '@/lib/store';

const W = 320;
const H = 96;
const P = 10;

function LineChart({ points, god }: { points: Point[]; god: number | null }) {
  const ws = points.map((p) => p.weight);
  // Scale to the data only; the godlike line appears once it's within reach
  // (≤25% above the current max), so early progress isn't squashed flat.
  const lo = Math.min(...ws);
  const hi = Math.max(...ws);
  const span = hi - lo || 1;
  const showGod = god !== null && god >= lo && god <= hi + span * 0.25;
  const x = (i: number) => P + (points.length === 1 ? (W - 2 * P) / 2 : (i / (points.length - 1)) * (W - 2 * P));
  const y = (w: number) => Math.max(P, H - P - ((w - lo) / span) * (H - 2 * P));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.weight).toFixed(1)}`).join(' ');
  const area = `${path} L${x(points.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="goldfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E7C464" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#E7C464" stopOpacity="0" />
        </linearGradient>
      </defs>
      {showGod && (
        <>
          <line x1={P} x2={W - P} y1={y(god!)} y2={y(god!)} stroke="#E7C464" strokeOpacity="0.4" strokeDasharray="4 4" />
          <text x={W - P} y={y(god!) - 3} textAnchor="end" fontSize="8" fill="#E7C464" fillOpacity="0.7">
            godlike {fmtKg(god!)}
          </text>
        </>
      )}
      <path d={area} fill="url(#goldfill)" />
      <path d={path} fill="none" stroke="#E7C464" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.weight)} r={i === points.length - 1 ? 4 : 2.5} fill={i === points.length - 1 ? '#E7C464' : '#71717a'} />
      ))}
    </svg>
  );
}

export default function Progress() {
  const { state } = useStore();
  const bw = state.settings.bodyweightKg;
  const phase1Start = state.settings.phaseStartDates[1];
  const programWeek = phase1Start
    ? Math.min(TOTAL_WEEKS, Math.floor((Date.now() - new Date(phase1Start).getTime()) / (7 * 86400000)) + 1)
    : null;

  const cards = INDICATORS.map((ind) => ({
    ...ind,
    points: seriesFor(state, ind.id),
    god: bw ? Math.round(ind.godMult * bw * 2) / 2 : null,
  })).filter((c) => c.points.length > 0);

  return (
    <div className="px-4 pt-6 pb-28 space-y-4">
      <div className="px-1">
        <h1 className="text-2xl font-bold text-zinc-50">Progress</h1>
        {programWeek !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
              <span>Program week {programWeek} of {TOTAL_WEEKS}</span>
              <span>{Math.round((programWeek / TOTAL_WEEKS) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#8a6d2a] to-[#E7C464]" style={{ width: `${(programWeek / TOTAL_WEEKS) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="text-center pt-16">
          <ChartLineUp size={56} weight="duotone" className="mx-auto mb-4 text-zinc-600" />
          <h2 className="text-xl font-bold text-zinc-50 mb-2">Nothing to plot yet</h2>
          <p className="text-zinc-500 text-sm px-8">
            Log a couple of sessions and your indicator lifts will start climbing here.
          </p>
        </div>
      ) : (
        cards.map((c) => {
          const first = c.points[0].weight;
          const last = c.points[c.points.length - 1].weight;
          const delta = Math.round((last - first) * 100) / 100;
          return (
            <div key={c.id} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex items-baseline justify-between mb-2">
                <p className="font-semibold text-zinc-100">{c.name}</p>
                <p className="text-sm tabular-nums">
                  <span className="text-[#E7C464] font-bold text-lg">{fmtKg(last)} kg</span>
                  {delta !== 0 && (
                    <span className={`ml-2 text-xs font-semibold ${delta > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                      {delta > 0 ? '▲' : '▼'} {fmtKg(Math.abs(delta))}
                    </span>
                  )}
                </p>
              </div>
              <LineChart points={c.points} god={c.god} />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                <span>{new Date(c.points[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span>{c.points.length} session{c.points.length > 1 ? 's' : ''}</span>
                <span>{new Date(c.points[c.points.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
