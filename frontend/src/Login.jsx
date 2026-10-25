import React, { useState } from 'react';
import { authApi } from './api';

export default function Login({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('ユーザー名とパスワードを入力してください。');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const userData =
        mode === 'login'
          ? await authApi.login(username.trim(), password)
          : await authApi.register(username.trim(), password);
      if (onAuthSuccess) {
        onAuthSuccess(userData);
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail ||
          (mode === 'login'
            ? 'ログインに失敗しました。ユーザー名またはパスワードを確認してください。'
            : '新規登録に失敗しました。')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTestLogin = async (testUser, testPass) => {
    setMode('login');
    setUsername(testUser);
    setPassword(testPass);
    setLoading(true);
    setErrorMsg('');
    try {
      const userData = await authApi.login(testUser, testPass);
      if (onAuthSuccess) {
        onAuthSuccess(userData);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'テストログインに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-[100dvh] overflow-hidden bg-[#09071c] font-mono select-none text-slate-100 flex items-center justify-center p-4">
      <style>{`
        @keyframes bubbleRiseLogin {
          0% { transform: translateY(100vh) scale(0.4); opacity: 0; }
          20% { opacity: 0.65; }
          80% { opacity: 0.65; }
          100% { transform: translateY(-10vh) scale(1.1); opacity: 0; }
        }
        @keyframes miniJellyFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .login-bubble-1 { animation: bubbleRiseLogin 11s linear infinite; }
        .login-bubble-2 { animation: bubbleRiseLogin 14s linear infinite 3s; }
        .login-bubble-3 { animation: bubbleRiseLogin 9s linear infinite 5s; }
        .login-grid-floor {
          background-size: 60px 60px;
          background-image:
            linear-gradient(to right, rgba(0, 242, 254, 0.25) 1.5px, transparent 1.5px),
            linear-gradient(to bottom, rgba(255, 0, 127, 0.2) 1.5px, transparent 1.5px);
        }
        .glass-login-card {
          background: rgba(16, 14, 38, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
      `}</style>

      {/* 背景レイヤー（深海アクアリウム・サイバーグリッド） */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-radial-[at_50%_35%] from-[#1b1145] via-[#0d0926] to-[#040310] opacity-95"></div>
        <div className="absolute left-[15%] w-4 h-4 rounded-full border border-cyan-300/60 bg-cyan-400/20 login-bubble-1"></div>
        <div className="absolute left-[48%] w-3 h-3 rounded-full border border-cyan-200/70 bg-cyan-300/25 login-bubble-3"></div>
        <div className="absolute right-[18%] w-5 h-5 rounded-full border border-pink-300/50 bg-pink-400/15 login-bubble-2"></div>

        <div className="absolute top-[20%] left-1/4 w-96 h-56 bg-purple-600/15 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[20%] right-1/4 w-96 h-56 bg-cyan-500/15 rounded-full blur-[90px]"></div>

        <div
          className="absolute bottom-0 w-[200%] -left-[50%] h-[50vh] login-grid-floor border-t-2 border-cyan-400/40"
          style={{
            transformOrigin: 'bottom center',
            transform: 'perspective(600px) rotateX(68deg)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 95%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 95%)',
          }}
        />
      </div>

      {/* メイン認証カード */}
      <div className="relative z-10 w-full max-w-md glass-login-card border-2 border-[#00f2fe] rounded-3xl p-6 sm:p-8 shadow-[0_0_45px_rgba(0,242,254,0.3)]">
        {/* ホログラムクラゲ ミニアイコン＆タイトル */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-[#00f2fe]/70 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.35)] mb-3"
            style={{ animation: 'miniJellyFloat 3.5s ease-in-out infinite' }}
          >
            <svg viewBox="0 0 64 64" className="w-11 h-11">
              <path
                d="M14 30 C14 12, 50 12, 50 30 C50 37, 44 39, 39 37 C35 35, 29 35, 25 37 C20 39, 14 37, 14 30 Z"
                fill="#00f2fe"
                fillOpacity="0.35"
                stroke="#80f7ff"
                strokeWidth="2"
              />
              <path d="M22 38 Q 19 48 23 56" stroke="#00f2fe" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M32 39 Q 35 49 31 58" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M42 38 Q 45 48 41 56" stroke="#ff007f" strokeWidth="2" fill="none" strokeLinecap="round" />
              <circle cx="26" cy="26" r="2.2" fill="#ffffff" />
              <circle cx="38" cy="26" r="2.2" fill="#ffffff" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#00f2fe] tracking-wider drop-shadow-[0_0_10px_#00f2fe]">
            PET-VOCAB AQUARIUM
          </h1>
          <p className="text-[11px] sm:text-xs text-cyan-200/80 mt-1">
            個別最適化・サイバーペット育成型 英単語学習システム
          </p>
        </div>

        {/* LOGIN / REGISTER 切り替えタブ */}
        <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-[#070516] rounded-2xl border border-cyan-900/70">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-wider transition-all ${
              mode === 'login'
                ? 'bg-cyan-500/30 border border-[#00f2fe] text-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.3)]'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
          >
            &gt; LOGIN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-wider transition-all ${
              mode === 'register'
                ? 'bg-pink-500/30 border border-[#ff007f] text-[#ff80bf] shadow-[0_0_15px_rgba(255,0,127,0.3)]'
                : 'text-slate-400 hover:text-pink-200'
            }`}
          >
            &gt; REGISTER
          </button>
        </div>

        {/* 新規登録時の3ステップフロー案内 */}
        {mode === 'register' && (
          <div className="mb-4 p-3 rounded-2xl bg-pink-950/35 border border-pink-500/50 text-[11px] text-pink-100">
            <div className="font-black text-[#ff80bf] mb-1.5 text-center">
              ✨ アカウント作成〜サービス開始までの流れ
            </div>
            <div className="flex items-center justify-center gap-1.5 font-bold text-[10px] sm:text-[11px]">
              <span className="px-2 py-0.5 rounded bg-pink-500/40 border border-[#ff007f] text-white">
                1. 新規登録
              </span>
              <span className="text-pink-400">➔</span>
              <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-cyan-500/40 text-cyan-200">
                2. キャラ選択 (3種)
              </span>
              <span className="text-pink-400">➔</span>
              <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-emerald-500/40 text-emerald-200">
                3. サービス開始
              </span>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {errorMsg && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 入力フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-cyan-300 mb-1.5">
              USERNAME
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="例: testuser_a"
              className="w-full bg-[#070516] border border-cyan-500/60 focus:border-[#00f2fe] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-cyan-300 mb-1.5">
              PASSWORD
            </label>
            <input
              type="password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力 (4文字以上)"
              className="w-full bg-[#070516] border border-cyan-500/60 focus:border-[#00f2fe] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-black text-sm tracking-wider transition-all active:scale-98 border-2 ${
              mode === 'login'
                ? 'bg-emerald-950/60 hover:bg-emerald-900/70 border-[#00ff88] text-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.35)]'
                : 'bg-pink-950/60 hover:bg-pink-900/70 border-[#ff007f] text-[#ff80bf] shadow-[0_0_20px_rgba(255,0,127,0.35)]'
            }`}
          >
            {loading
              ? 'AUTHENTICATING...'
              : mode === 'login'
              ? '> ACCESS_AQUARIUM() [ログイン]'
              : '> NEXT: SELECT_CHARACTER() [登録してキャラ選択へ]'}
          </button>
        </form>

        {/* テストアカウント ワンクリックログイン */}
        <div className="mt-6 pt-4 border-t border-cyan-900/70">
          <div className="text-[11px] font-bold text-cyan-300/90 mb-2 flex items-center justify-between">
            <span>🧪 キャラ別・動作確認用テストアカウント</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickTestLogin('testuser_a', 'password123')}
              className="px-2.5 py-2 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/50 text-left transition-all"
            >
              <div className="text-xs font-black text-[#00f2fe]">🪼 testuser_a</div>
              <div className="text-[10px] text-cyan-200/80">相棒: クラゲ</div>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickTestLogin('testuser_b', 'password456')}
              className="px-2.5 py-2 rounded-xl bg-sky-950/50 hover:bg-sky-900/60 border border-sky-500/50 text-left transition-all"
            >
              <div className="text-xs font-black text-sky-300">🦈 testuser_b</div>
              <div className="text-[10px] text-sky-200/80">相棒: ジンベイザメ</div>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickTestLogin('master', 'password123')}
              className="px-2.5 py-2 rounded-xl bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/50 text-left transition-all"
            >
              <div className="text-xs font-black text-[#ff80bf]">🔮 master</div>
              <div className="text-[10px] text-pink-200/80">相棒: スライム</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
