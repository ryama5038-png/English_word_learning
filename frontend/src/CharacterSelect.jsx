import React, { useState } from 'react';
import { authApi } from './api';

const CHARACTER_OPTIONS = [
  {
    id: 'kurage',
    name: 'クラゲ',
    codeName: 'AQUA_JELLY // TYPE-01',
    badge: '🪼 深海癒やし系エージェント',
    environment: '深海サイバーアクアリウム',
    accentColor: '#00f2fe',
    borderClass: 'border-[#00f2fe]',
    bgGlowClass: 'from-cyan-500/25 via-blue-900/20 to-transparent',
    description:
      'ゆらゆらと光る触手で深海を漂う癒やし系パートナー。直近で調べた英単語を優しいリズムで呟き、リラックスしながら記憶の定着をサポートします。',
    greeting:
      '「ふわふわ〜🫧 マスターの単語学習、わたしが優しくサポートするね！一緒に深海アクアリウムで頑張ろう♪」',
  },
  {
    id: 'jinbei',
    name: 'ジンベイザメ',
    codeName: 'WHALE_SHARK // TYPE-02',
    badge: '🦈 大海原クルーズ型エージェント',
    environment: '深海ワイドアクアリウム',
    accentColor: '#38bdf8',
    borderClass: 'border-sky-400',
    bgGlowClass: 'from-sky-500/25 via-indigo-900/20 to-transparent',
    description:
      '星座のような発光ドットをまとって悠々と泳ぐ頼もしい相棒。基礎単語からTOEIC・難関大レベルの広大な語彙の海まで、一緒に楽しく泳ぎ切れます。',
    greeting:
      '「ぷかぷか〜🦈 たくさんの英単語をどんどん吸収して、マスターと一緒に広い知識の海を泳ぎたいな！」',
  },
  {
    id: 'slime',
    name: 'スライム',
    codeName: 'NEON_CORE_ORB // TYPE-03',
    badge: '🔮 電脳コア型AIエージェント',
    environment: 'サイバーメインサーバー室',
    accentColor: '#ff007f',
    borderClass: 'border-[#ff007f]',
    bgGlowClass: 'from-pink-500/25 via-purple-900/20 to-transparent',
    description:
      '電脳空間のメインサーバー室で稼働する高感度ホログラム生命体。テンポの良い反復復習と4択テストで、効率重視の語彙力強化をバックアップします。',
    greeting:
      '「ピポパッ⚡ アクセス承認！マスターの語彙データベース構築と弱点克服、ぼくに全部まかせてね✨」',
  },
];

function CharacterPreviewSvg({ type, selected }) {
  if (type === 'kurage') {
    return (
      <svg viewBox="0 0 180 180" className="w-28 h-28 sm:w-32 sm:h-32 overflow-visible">
        <defs>
          <radialGradient id="selJellyGrad" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#80f7ff" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#00c8e6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#004766" stopOpacity="0.7" />
          </radialGradient>
        </defs>
        <ellipse
          cx="90"
          cy="78"
          rx="68"
          ry="20"
          fill="none"
          stroke="#00f2fe"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.65"
          transform="rotate(-15 90 78)"
        />
        {/* 触手 */}
        <path d="M 65 106 Q 55 130 62 155" fill="none" stroke="#00f2fe" strokeWidth="3" strokeLinecap="round" />
        <path d="M 78 108 Q 72 135 80 160" fill="none" stroke="#80f7ff" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M 90 110 Q 95 136 88 164" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 102 108 Q 108 135 100 160" fill="none" stroke="#80f7ff" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M 115 106 Q 125 130 118 155" fill="none" stroke="#00f2fe" strokeWidth="3" strokeLinecap="round" />
        {/* 傘 */}
        <path
          d="M 46 86 C 46 38, 134 38, 134 86 C 134 106, 122 112, 110 107 C 102 104, 96 110, 90 107 C 84 110, 78 104, 70 107 C 58 112, 46 106, 46 86 Z"
          fill="url(#selJellyGrad)"
          stroke="#99f6ff"
          strokeWidth="2.2"
        />
        <ellipse cx="74" cy="58" rx="10" ry="5.5" fill="#ffffff" opacity="0.8" transform="rotate(-28 74 58)" />
        {/* 表情 */}
        {selected ? (
          <g>
            <path d="M 68 80 Q 74 71 80 80" fill="none" stroke="#00ffff" strokeWidth="3" strokeLinecap="round" />
            <path d="M 100 80 Q 106 71 112 80" fill="none" stroke="#00ffff" strokeWidth="3" strokeLinecap="round" />
            <path d="M 86 85 Q 90 91 94 85" fill="none" stroke="#00ffff" strokeWidth="2.8" strokeLinecap="round" />
            <ellipse cx="64" cy="86" rx="5" ry="3" fill="#ff007f" opacity="0.85" />
            <ellipse cx="116" cy="86" rx="5" ry="3" fill="#ff007f" opacity="0.85" />
          </g>
        ) : (
          <g>
            <rect x="70" y="74" width="8" height="9" rx="2" fill="#00f2fe" />
            <rect x="71.5" y="75" width="3" height="3" rx="0.8" fill="#ffffff" />
            <rect x="102" y="74" width="8" height="9" rx="2" fill="#00f2fe" />
            <rect x="103.5" y="75" width="3" height="3" rx="0.8" fill="#ffffff" />
            <path d="M 86 86 Q 90 89 94 86" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
      </svg>
    );
  }

  if (type === 'jinbei') {
    return (
      <svg viewBox="0 0 240 180" className="w-32 h-28 sm:w-36 sm:h-32 overflow-visible">
        <defs>
          <radialGradient id="selSharkGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#99f6ff" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#00c8e6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.75" />
          </radialGradient>
        </defs>
        <ellipse
          cx="120"
          cy="95"
          rx="100"
          ry="30"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeDasharray="4 5"
          opacity="0.6"
          transform="rotate(-12 120 95)"
        />
        {/* 尾ビレ */}
        <path
          d="M 172 90 C 188 84, 208 55, 218 48 C 210 70, 202 88, 206 92 C 210 96, 215 112, 210 126 C 198 112, 185 98, 172 94 Z"
          fill="url(#selSharkGrad)"
          stroke="#99f6ff"
          strokeWidth="1.8"
        />
        {/* 背ビレ */}
        <path
          d="M 122 65 C 130 35, 144 38, 150 67 Z"
          fill="url(#selSharkGrad)"
          stroke="#99f6ff"
          strokeWidth="1.8"
        />
        {/* ボディ */}
        <path
          d="M 52 95 C 38 95, 32 72, 52 58 C 78 44, 130 48, 176 84 C 182 89, 182 94, 176 98 C 142 122, 85 122, 52 112 C 38 107, 38 98, 52 95 Z"
          fill="url(#selSharkGrad)"
          stroke="#99f6ff"
          strokeWidth="2.2"
        />
        {/* 胸ビレ */}
        <path
          d="M 82 102 C 90 122, 118 140, 132 132 C 135 122, 118 108, 100 98 Z"
          fill="url(#selSharkGrad)"
          stroke="#99f6ff"
          strokeWidth="1.8"
        />
        {/* 斑点模様 */}
        <g fill="#ffffff" opacity="0.85">
          <circle cx="85" cy="64" r="2" />
          <circle cx="98" cy="70" r="2.2" />
          <circle cx="110" cy="62" r="2.4" />
          <circle cx="122" cy="74" r="2.2" />
          <circle cx="136" cy="68" r="2.5" />
          <circle cx="148" cy="78" r="2" />
          <circle cx="160" cy="84" r="1.8" />
        </g>
        {/* 表情 */}
        <path d="M 45 78 Q 50 70 55 78" fill="none" stroke="#00ffff" strokeWidth="3" strokeLinecap="round" />
        <path d="M 68 78 Q 73 70 78 78" fill="none" stroke="#00ffff" strokeWidth="3" strokeLinecap="round" />
        <path d="M 53 85 Q 57 90 61 86 Q 65 90 69 85" fill="none" stroke="#00ffff" strokeWidth="2.6" strokeLinecap="round" />
        {selected && (
          <>
            <ellipse cx="42" cy="84" rx="4.5" ry="2.8" fill="#ff007f" opacity="0.85" />
            <ellipse cx="81" cy="84" rx="4.5" ry="2.8" fill="#ff007f" opacity="0.85" />
          </>
        )}
      </svg>
    );
  }

  // slime
  return (
    <svg viewBox="0 0 180 180" className="w-28 h-28 sm:w-32 sm:h-32 overflow-visible">
      <defs>
        <radialGradient id="selSlimeGrad" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="28%" stopColor="#80f7ff" stopOpacity="0.78" />
          <stop offset="68%" stopColor="#00c8e6" stopOpacity="0.52" />
          <stop offset="100%" stopColor="#004766" stopOpacity="0.65" />
        </radialGradient>
      </defs>
      <ellipse
        cx="90"
        cy="90"
        rx="76"
        ry="24"
        fill="none"
        stroke="#ff007f"
        strokeWidth="1.6"
        strokeDasharray="6 4"
        opacity="0.7"
        transform="rotate(-18 90 90)"
      />
      <ellipse
        cx="90"
        cy="90"
        rx="68"
        ry="20"
        fill="none"
        stroke="#00f2fe"
        strokeWidth="1.5"
        strokeDasharray="3 4"
        opacity="0.65"
        transform="rotate(16 90 90)"
      />
      <circle cx="90" cy="90" r="46" fill="url(#selSlimeGrad)" stroke="#99f6ff" strokeWidth="2.2" />
      <ellipse cx="74" cy="66" rx="10" ry="6.5" fill="#ffffff" opacity="0.8" transform="rotate(-30 74 66)" />
      {selected ? (
        <g>
          <path d="M 66 93 Q 73 83 80 93" fill="none" stroke="#00ffff" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 100 93 Q 107 83 114 93" fill="none" stroke="#00ffff" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 85 98 Q 90 104 95 98" fill="none" stroke="#00ffff" strokeWidth="2.8" strokeLinecap="round" />
          <ellipse cx="62" cy="99" rx="5" ry="3" fill="#ff007f" opacity="0.85" />
          <ellipse cx="118" cy="99" rx="5" ry="3" fill="#ff007f" opacity="0.85" />
        </g>
      ) : (
        <g>
          <rect x="68" y="85" width="9" height="10" rx="2" fill="#00f2fe" />
          <rect x="70" y="86.5" width="3" height="3" rx="0.8" fill="#ffffff" />
          <rect x="103" y="85" width="9" height="10" rx="2" fill="#00f2fe" />
          <rect x="105" y="86.5" width="3" height="3" rx="0.8" fill="#ffffff" />
          <path d="M 86 99 Q 90 102 94 99" fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

export default function CharacterSelect({ user, onCharacterSelected, onLogout }) {
  const [selectedId, setSelectedId] = useState('kurage');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedChar =
    CHARACTER_OPTIONS.find((c) => c.id === selectedId) || CHARACTER_OPTIONS[0];

  const handleConfirm = async () => {
    if (!selectedId || submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const updatedUser = await authApi.selectCharacter(selectedId);
      if (onCharacterSelected) {
        onCharacterSelected(updatedUser);
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail ||
          'キャラクターの登録に失敗しました。もう一度お試しください。'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="relative w-full min-h-[100dvh] overflow-x-hidden bg-[#08061a] font-mono select-none text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6">
      <style>{`
        @keyframes charPreviewFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .char-float {
          animation: charPreviewFloat 3.6s ease-in-out infinite;
        }
        .select-grid-floor {
          background-size: 60px 60px;
          background-image:
            linear-gradient(to right, rgba(0, 242, 254, 0.22) 1.5px, transparent 1.5px),
            linear-gradient(to bottom, rgba(255, 0, 127, 0.18) 1.5px, transparent 1.5px);
        }
        .glass-select-panel {
          background: rgba(16, 14, 38, 0.78);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
      `}</style>

      {/* 背景レイヤー */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-radial-[at_50%_30%] from-[#1d1147] via-[#0c0824] to-[#040310] opacity-95" />
        <div className="absolute top-[15%] left-1/4 w-96 h-56 bg-cyan-500/15 rounded-full blur-[110px]" />
        <div className="absolute bottom-[15%] right-1/4 w-96 h-56 bg-pink-500/15 rounded-full blur-[110px]" />
        <div
          className="absolute bottom-0 w-[200%] -left-[50%] h-[45vh] select-grid-floor border-t-2 border-cyan-400/35"
          style={{
            transformOrigin: 'bottom center',
            transform: 'perspective(600px) rotateX(68deg)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 95%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 95%)',
          }}
        />
      </div>

      {/* メインコンテナ */}
      <div className="relative z-10 w-full max-w-5xl my-auto py-2">
        {/* ステップインジケーター（新規登録 → キャラクター選択 → サービス開始） */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5 glass-select-panel border border-cyan-500/40 rounded-2xl px-4 py-3 shadow-[0_0_25px_rgba(0,242,254,0.18)]">
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-black">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-[#00ff88]/70 text-[#00ff88]">
              ✓ 1. 新規登録完了
            </span>
            <span className="text-cyan-500">──&gt;</span>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/30 border-2 border-[#00f2fe] text-white shadow-[0_0_12px_rgba(0,242,254,0.4)]">
              2. キャラクター選択
            </span>
            <span className="text-cyan-500">──&gt;</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-400">
              3. サービス開始
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-cyan-300 font-bold">
              👤 {user?.username}
            </span>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/60 text-rose-200 text-[11px] font-bold transition-all"
              >
                別のアカウントへ切替
              </button>
            )}
          </div>
        </div>

        {/* タイトルヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-3xl font-black text-[#00f2fe] tracking-wider drop-shadow-[0_0_12px_rgba(0,242,254,0.5)]">
            &gt; SELECT_YOUR_LEARNING_AGENT()
          </h1>
          <p className="text-xs sm:text-sm text-cyan-100/85 mt-1.5">
            あなたの英単語学習に伴走するパートナーを <span className="text-[#00ff88] font-bold">クラゲ・ジンベイザメ・スライム</span> の3体から1つ選んでください
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-950/85 border border-rose-500 text-rose-200 text-xs sm:text-sm font-bold text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* 3体のキャラクター選択カードグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {CHARACTER_OPTIONS.map((char) => {
            const isSelected = selectedId === char.id;
            return (
              <div
                key={char.id}
                onClick={() => setSelectedId(char.id)}
                className={`group relative cursor-pointer rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between glass-select-panel border-2 ${
                  isSelected
                    ? `${char.borderClass} scale-[1.02] shadow-[0_0_35px_rgba(0,242,254,0.38)] bg-gradient-to-b ${char.bgGlowClass}`
                    : 'border-cyan-900/60 hover:border-cyan-400/60 opacity-85 hover:opacity-100'
                }`}
              >
                {/* 選択中バッジ */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-widest text-cyan-300/80">
                    {char.codeName}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all ${
                      isSelected
                        ? 'bg-[#00ff88] text-[#050311] shadow-[0_0_12px_#00ff88]'
                        : 'bg-slate-900/80 border border-cyan-800 text-slate-400'
                    }`}
                  >
                    {isSelected ? '● SELECTED' : 'SELECT'}
                  </span>
                </div>

                {/* キャラクターホログラムプレビュー */}
                <div className="relative h-36 sm:h-40 flex items-center justify-center my-1">
                  <div
                    className="absolute w-28 h-28 rounded-full blur-2xl opacity-35 pointer-events-none"
                    style={{ backgroundColor: char.accentColor }}
                  />
                  <div className="char-float">
                    <CharacterPreviewSvg type={char.id} selected={isSelected} />
                  </div>
                </div>

                {/* キャラクター名・特徴説明 */}
                <div>
                  <div className="text-center mb-2">
                    <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 font-bold mb-1">
                      {char.badge}
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                      {char.name}
                    </h2>
                    <div className="text-[11px] text-cyan-300/75">
                      ステージ: {char.environment}
                    </div>
                  </div>

                  <p className="text-xs text-slate-200/90 leading-relaxed bg-[#070516]/75 border border-cyan-900/50 rounded-2xl p-3">
                    {char.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 選択中キャラクターのセリフプレビュー ＆ サービス開始ボタン */}
        <div className="glass-select-panel border-2 border-[#00f2fe] rounded-3xl p-4 sm:p-6 shadow-[0_0_35px_rgba(0,242,254,0.25)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-left">
            <div className="text-xs font-black text-[#00f2fe] mb-1 flex items-center gap-2">
              <span>&gt; SELECTED_AGENT: 【{selectedChar.name}】からのメッセージ</span>
            </div>
            <p className="text-xs sm:text-sm text-cyan-100 font-bold">
              {selectedChar.greeting}
            </p>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirm}
            className="w-full sm:w-auto shrink-0 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#00ff88] to-[#00f2fe] hover:from-emerald-300 hover:to-cyan-300 text-[#050311] font-black text-sm sm:text-base tracking-wider shadow-[0_0_25px_rgba(0,255,136,0.5)] active:scale-95 transition-all"
          >
            {submitting
              ? 'INITIALIZING_AGENT...'
              : `> START_SERVICE() [${selectedChar.name}とサービス開始！]`}
          </button>
        </div>
      </div>
    </div>
  );
}
