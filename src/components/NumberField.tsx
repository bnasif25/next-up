import { useState } from 'react';
import { Minus, Plus } from '@phosphor-icons/react';

interface Props {
  value: number;
  step: number;
  min?: number;
  onChange: (v: number) => void;
  unit?: string;
  /** shown instead of the number, e.g. "BW" for bodyweight */
  displayOverride?: string;
  numericOnly?: boolean;
  disabled?: boolean;
  ariaLabel: string;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ''));

/**
 * Gym-grade number entry: tap the value and type it on the numeric keypad,
 * or nudge with the ± buttons. Never clips: the field flexes, buttons shrink.
 */
export default function NumberField({
  value,
  step,
  min = 0,
  onChange,
  unit,
  displayOverride,
  numericOnly,
  disabled,
  ariaLabel,
}: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const shown = editing ?? displayOverride ?? fmt(value);

  const commit = (raw: string) => {
    setEditing(null);
    const n = parseFloat(raw);
    if (!Number.isNaN(n)) onChange(Math.max(min, r2(n)));
  };

  return (
    <div
      className={`flex items-stretch h-14 rounded-2xl border transition-colors ${
        disabled ? 'border-transparent bg-transparent opacity-70' : 'border-zinc-700/80 bg-zinc-900'
      }`}
    >
      <button
        type="button"
        aria-label={`${ariaLabel} minus`}
        disabled={disabled}
        onClick={() => onChange(Math.max(min, r2(value - step)))}
        className="w-11 shrink-0 flex items-center justify-center text-zinc-400 active:bg-zinc-800 rounded-l-2xl active:scale-95 transition-transform disabled:pointer-events-none"
      >
        <Minus size={18} weight="bold" />
      </button>

      <div className="flex-1 min-w-0 relative">
        <input
          aria-label={ariaLabel}
          inputMode={numericOnly ? 'numeric' : 'decimal'}
          disabled={disabled}
          value={shown}
          onFocus={(e) => {
            setEditing(displayOverride ? '' : fmt(value));
            requestAnimationFrame(() => e.target.select());
          }}
          onChange={(e) => setEditing(e.target.value.replace(/[^0-9.]/g, ''))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          className="w-full h-full bg-transparent text-center text-xl font-bold tabular-nums text-zinc-50 outline-none pb-3 disabled:pointer-events-none"
        />
        {unit && (
          <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] uppercase tracking-widest text-zinc-500 pointer-events-none">
            {unit}
          </span>
        )}
      </div>

      <button
        type="button"
        aria-label={`${ariaLabel} plus`}
        disabled={disabled}
        onClick={() => onChange(r2(value + step))}
        className="w-11 shrink-0 flex items-center justify-center text-zinc-400 active:bg-zinc-800 rounded-r-2xl active:scale-95 transition-transform disabled:pointer-events-none"
      >
        <Plus size={18} weight="bold" />
      </button>
    </div>
  );
}
