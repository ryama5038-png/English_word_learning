import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './Home';
import Kurage from './kurage';
import Jinbei from './jinbei';

function ScreenSwitcher() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const screens = [
    { path: '/', label: '🔮 スライム (Home)' },
    { path: '/jinbei', label: '🦈 ジンベイ (jinbei)' },
    { path: '/kurage', label: '🪼 クラゲ (kurage)' },
  ];

  const current =
    location.pathname === '/admin'
      ? screens[2]
      : screens.find((s) => s.path === location.pathname) || screens[0];

  return (
    <div className="fixed bottom-3 right-3 z-50 font-mono text-xs select-none">
      {open ? (
        <div className="bg-[#0b0826]/95 border-2 border-cyan-400 rounded-2xl p-3 shadow-[0_0_25px_rgba(0,242,254,0.4)] backdrop-blur-md flex flex-col gap-2 min-w-[210px]">
          <div className="flex justify-between items-center pb-2 border-b border-cyan-800">
            <span className="font-black text-cyan-300 tracking-wider text-[11px]">&gt; SELECT_SCREEN</span>
            <button
              onClick={() => setOpen(false)}
              className="text-cyan-400 hover:text-white font-black px-1 text-sm"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            {screens.map((s) => {
              const active = location.pathname === s.path;
              return (
                <Link
                  key={s.path}
                  to={s.path}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2 rounded-xl transition-all font-bold text-left flex items-center justify-between ${
                    active
                      ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                      : 'bg-slate-900/40 border border-cyan-900/60 text-slate-300 hover:bg-cyan-950/50 hover:text-cyan-300'
                  }`}
                >
                  <span>{s.label}</span>
                  {active && <span className="text-[10px] text-cyan-400">●</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="group px-3 py-1.5 sm:py-2 bg-[#0d092b]/85 hover:bg-cyan-950 border-2 border-cyan-400/80 hover:border-cyan-300 rounded-full shadow-[0_0_15px_rgba(0,242,254,0.35)] backdrop-blur-sm text-cyan-300 flex items-center gap-1.5 transition-all active:scale-95"
          title="画面を切り替える"
        >
          <span className="text-sm">🧭</span>
          <span className="font-black text-[11px] tracking-wide text-cyan-200 group-hover:text-cyan-100">
            {current.label.split(' ')[0]} 切替
          </span>
        </button>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScreenSwitcher />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kurage" element={<Kurage />} />
        <Route path="/admin" element={<Kurage />} />
        <Route path="/jinbei" element={<Jinbei />} />
      </Routes>
    </Router>
  );
}

export default App;