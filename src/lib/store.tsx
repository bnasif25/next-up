import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AppState, DraftSession, SessionLog, Settings } from '@/types';

const KEY = 'nextup-state-v1';

const DEFAULT_STATE: AppState = {
  sessions: [],
  settings: { increments: {}, phaseStartDates: {}, phaseOverride: null },
  draft: null,
  banner: null,
};

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as AppState;
    return { ...DEFAULT_STATE, ...parsed, settings: { ...DEFAULT_STATE.settings, ...parsed.settings } };
  } catch {
    return DEFAULT_STATE;
  }
}

interface Store {
  state: AppState;
  setState: (updater: (s: AppState) => AppState) => void;
  saveSession: (session: SessionLog) => void;
  setDraft: (draft: DraftSession | null) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  clearBanner: () => void;
  exportJson: () => void;
  resetAll: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<AppState>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const store = useMemo<Store>(() => {
    const setState = (updater: (s: AppState) => AppState) => setStateRaw(updater);
    return {
      state,
      setState,
      saveSession: (session) =>
        setStateRaw((s) => {
          const phaseStartDates = { ...s.settings.phaseStartDates };
          if (!phaseStartDates[session.phase]) phaseStartDates[session.phase] = session.date;
          return {
            ...s,
            sessions: [...s.sessions, session],
            draft: null,
            settings: { ...s.settings, phaseStartDates },
          };
        }),
      setDraft: (draft) => setStateRaw((s) => ({ ...s, draft })),
      updateSettings: (patch) =>
        setStateRaw((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      clearBanner: () => setStateRaw((s) => ({ ...s, banner: null })),
      exportJson: () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nextup-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
      resetAll: () => setStateRaw(() => DEFAULT_STATE),
    };
  }, [state]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}
