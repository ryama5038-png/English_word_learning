import React, { useState, useEffect } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import Kurage from './kurage';
import Jinbei from './jinbei';
import Mendako from './mendako';
import SeaSlug from './sea_slug';
import Login from './Login';
import CharacterSelect from './CharacterSelect';
import { authApi } from './api';

const CHARACTER_META = {
  jellyfish: { path: '/jellyfish', label: '🪼 クラゲ', shortIcon: '🪼' },
  whaleshark: { path: '/whaleshark', label: '🦈 ジンベイザメ', shortIcon: '🦈' },
  mendako: { path: '/mendako', label: '🐙 メンダコ', shortIcon: '🐙' },
  sea_slug: { path: '/sea_slug', label: '🫧 アオウミウシ', shortIcon: '🫧' },
  // レガシー互換エイリアス
  kurage: { path: '/jellyfish', label: '🪼 クラゲ', shortIcon: '🪼' },
  jinbei: { path: '/whaleshark', label: '🦈 ジンベイザメ', shortIcon: '🦈' },
  slime: { path: '/mendako', label: '🐙 メンダコ', shortIcon: '🐙' },
};

export function getCharacterMeta(characterType) {
  return CHARACTER_META[characterType] || CHARACTER_META.jellyfish;
}

function AgentStatusBadge({ authUser, onLogout }) {
  const [open, setOpen] = useState(false);
  const meta = getCharacterMeta(authUser?.character_type);

  return (
    <div className="fixed top-[118px] left-3 sm:top-auto sm:left-auto sm:bottom-3 sm:right-3 z-40 font-mono text-xs select-none">
      {open ? (
        <div className="bg-[#0b0826]/95 border-2 border-cyan-400 rounded-2xl p-3.5 shadow-[0_0_25px_rgba(0,242,254,0.4)] backdrop-blur-md flex flex-col gap-2 min-w-[230px]">
          <div className="flex justify-between items-center pb-2 border-b border-cyan-800">
            <span className="font-black text-cyan-300 tracking-wider text-[11px]">
              &gt; MY_LEARNING_AGENT
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-cyan-400 hover:text-white font-black px-1 text-sm"
            >
              ✕
            </button>
          </div>

          <div className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/70 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">USER:</span>
            <span className="font-black text-[#00f2fe] truncate max-w-[130px]">
              👤 {authUser?.username}
            </span>
          </div>

          <div className="px-2.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-100 flex items-center justify-between text-xs font-bold">
            <span className="text-cyan-300/90 text-[11px]">パートナー:</span>
            <span>{meta.label}</span>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="mt-1 px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900/90 border border-rose-500/80 text-rose-200 font-black text-[11px] transition-all text-center"
          >
            🚪 LOGOUT ({authUser?.username})
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="group px-3 py-1.5 sm:py-2 bg-[#0d092b]/85 hover:bg-cyan-950 border-2 border-cyan-400/80 hover:border-cyan-300 rounded-full shadow-[0_0_15px_rgba(0,242,254,0.35)] backdrop-blur-sm text-cyan-300 flex items-center gap-1.5 transition-all active:scale-95"
          title="ユーザー＆パートナー情報・ログアウト"
        >
          <span className="text-sm">{meta.shortIcon}</span>
          <span className="font-black text-[11px] tracking-wide text-cyan-200 group-hover:text-cyan-100">
            {meta.label.split(' ')[1]} / 👤{authUser?.username}
          </span>
        </button>
      )}
    </div>
  );
}

function AuthenticatedRoutes({ authUser, onLogout, onAuthSuccess }) {
  const navigate = useNavigate();

  const handleLoginOrRegisterSuccess = (userData) => {
    onAuthSuccess(userData);
    if (!userData.character_type) {
      // 新規登録直後（キャラクター未選択）→ キャラクター選択画面へ遷移
      navigate('/select-character', { replace: true });
    } else {
      // 既存ログイン（キャラクター選択済）→ 選択したキャラクターの学習画面へ遷移
      const targetPath = getCharacterMeta(userData.character_type).path;
      navigate(targetPath, { replace: true });
    }
  };

  const handleCharacterSelected = (updatedUser) => {
    onAuthSuccess(updatedUser);
    const targetPath = getCharacterMeta(updatedUser.character_type).path;
    navigate(targetPath, { replace: true });
  };

  // Step 1: 未ログイン時はログイン／新規登録画面
  if (!authUser) {
    return <Login onAuthSuccess={handleLoginOrRegisterSuccess} />;
  }

  // Step 2: 新規登録後、まだキャラクターを選択していない場合はキャラクター選択画面
  if (!authUser.character_type) {
    return (
      <CharacterSelect
        user={authUser}
        onCharacterSelected={handleCharacterSelected}
        onLogout={onLogout}
      />
    );
  }

  // Step 3: キャラクター選択済み → そのキャラクター専用の学習エージェント画面でサービス開始
  const assignedPath = getCharacterMeta(authUser.character_type).path;

  return (
    <>
      <AgentStatusBadge authUser={authUser} onLogout={onLogout} />
      <Routes>
        <Route path="/" element={<Navigate to={assignedPath} replace />} />
        <Route
          path="/jellyfish"
          element={
            authUser.character_type === 'jellyfish' || authUser.character_type === 'kurage' ? (
              <Kurage key={authUser.id} />
            ) : (
              <Navigate to={assignedPath} replace />
            )
          }
        />
        <Route path="/kurage" element={<Navigate to="/jellyfish" replace />} />
        <Route
          path="/whaleshark"
          element={
            authUser.character_type === 'whaleshark' || authUser.character_type === 'jinbei' ? (
              <Jinbei key={authUser.id} />
            ) : (
              <Navigate to={assignedPath} replace />
            )
          }
        />
        <Route path="/jinbei" element={<Navigate to="/whaleshark" replace />} />
        <Route
          path="/mendako"
          element={
            authUser.character_type === 'mendako' ? (
              <Mendako key={authUser.id} />
            ) : (
              <Navigate to={assignedPath} replace />
            )
          }
        />
        <Route
          path="/sea_slug"
          element={
            authUser.character_type === 'sea_slug' ? (
              <SeaSlug key={authUser.id} />
            ) : (
              <Navigate to={assignedPath} replace />
            )
          }
        />
        <Route path="/slime" element={<Navigate to="/mendako" replace />} />
        <Route path="*" element={<Navigate to={assignedPath} replace />} />
      </Routes>
    </>
  );
}

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;
    authApi
      .getMe()
      .then((user) => {
        if (mounted) setAuthUser(user);
      })
      .catch(() => {
        if (mounted) setAuthUser(null);
      })
      .finally(() => {
        if (mounted) setCheckingAuth(false);
      });

    const handleAuthEvent = (e) => {
      setAuthUser(e.detail || null);
    };
    window.addEventListener('pet-auth-changed', handleAuthEvent);
    return () => {
      mounted = false;
      window.removeEventListener('pet-auth-changed', handleAuthEvent);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error(e);
    }
    setAuthUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full bg-[#070514] text-cyan-300 font-mono flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-[#00f2fe] border-t-transparent animate-spin shadow-[0_0_20px_#00f2fe]" />
        <div className="text-xs tracking-widest animate-pulse">
          &gt; VERIFYING_SESSION_COOKIE...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AuthenticatedRoutes
        authUser={authUser}
        onLogout={handleLogout}
        onAuthSuccess={(u) => setAuthUser(u)}
      />
    </Router>
  );
}

export default App;
