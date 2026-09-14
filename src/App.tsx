import { useState } from 'react';
import { StoreProvider } from '@/lib/store';
import Today from '@/sections/Today';
import History from '@/sections/History';
import Progress from '@/sections/Progress';
import Settings from '@/sections/Settings';

type Tab = 'today' | 'progress' | 'history' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '⚡' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'history', label: 'History', icon: '📓' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function Shell() {
  const [tab, setTab] = useState<Tab>('today');
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50 max-w-md mx-auto relative">
      {tab === 'today' && <Today />}
      {tab === 'progress' && <Progress />}
      {tab === 'history' && <History />}
      {tab === 'settings' && <Settings />}

      <nav className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto bg-zinc-950/90 backdrop-blur border-t border-zinc-900 flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-0.5 transition-colors ${
                tab === t.id ? 'text-[#E7C464]' : 'text-zinc-600'
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
