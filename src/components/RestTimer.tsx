import { useEffect, useRef, useState } from 'react';

interface Props {
  seconds: number;
  label: string;
  onDone: () => void;
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    /* audio unavailable */
  }
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    /* no vibration */
  }
}

export default function RestTimer({ seconds, label, onDone }: Props) {
  const [total, setTotal] = useState(seconds);
  const [left, setLeft] = useState(seconds);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (left <= 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        beep();
      }
      return;
    }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const mm = Math.floor(Math.max(0, left) / 60);
  const ss = Math.max(0, left) % 60;
  const frac = total > 0 ? left / total : 0;
  const R = 88;
  const C = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <p className="text-zinc-400 text-sm tracking-widest uppercase mb-1">{label}</p>
      <p className="text-[#E7C464] text-xs tracking-widest uppercase mb-6">Rest</p>

      <div className="relative">
        <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
          <circle cx="110" cy="110" r={R} fill="none" stroke="#27272a" strokeWidth="10" />
          <circle
            cx="110"
            cy="110"
            r={R}
            fill="none"
            stroke={left <= 0 ? '#4ade80' : '#E7C464'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - frac)}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-6xl font-bold tabular-nums ${left <= 0 ? 'text-green-400' : 'text-zinc-50'}`}>
            {left <= 0 ? 'GO' : `${mm}:${ss.toString().padStart(2, '0')}`}
          </span>
        </div>
      </div>

      <div className="flex gap-4 mt-10">
        <button
          onClick={() => {
            setTotal((t) => t + 30);
            setLeft((v) => Math.max(0, v) + 30);
            finishedRef.current = false;
          }}
          className="px-8 py-4 rounded-2xl bg-zinc-800 text-zinc-200 text-lg font-semibold active:scale-95 transition-transform"
        >
          +30s
        </button>
        <button
          onClick={onDone}
          className="px-8 py-4 rounded-2xl bg-[#E7C464] text-zinc-950 text-lg font-bold active:scale-95 transition-transform"
        >
          {left <= 0 ? "Let's go" : 'Skip'}
        </button>
      </div>
    </div>
  );
}
