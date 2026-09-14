interface Props {
  value: number;
  step: number;
  min?: number;
  onChange: (v: number) => void;
  /** display override, e.g. "BW" for bodyweight */
  display?: string;
  unit?: string;
  disabled?: boolean;
}

export default function Stepper({ value, step, min = 0, onChange, display, unit, disabled }: Props) {
  const bump = (dir: 1 | -1) => {
    const next = Math.max(min, Math.round((value + dir * step) * 100) / 100);
    onChange(next);
  };
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => bump(-1)}
        disabled={disabled}
        className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-300 text-xl font-bold active:scale-90 transition-transform disabled:opacity-30"
        aria-label="decrease"
      >
        −
      </button>
      <div className="min-w-[4.5rem] text-center">
        <span className="text-xl font-bold tabular-nums text-zinc-50">
          {display ?? (Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, ''))}
        </span>
        {unit && <span className="block text-[10px] text-zinc-500 uppercase tracking-wide">{unit}</span>}
      </div>
      <button
        onClick={() => bump(1)}
        disabled={disabled}
        className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-300 text-xl font-bold active:scale-90 transition-transform disabled:opacity-30"
        aria-label="increase"
      >
        +
      </button>
    </div>
  );
}
