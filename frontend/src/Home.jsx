import React, { useState, useEffect } from 'react';

// --- Cyberpunk Glowing Icons ---
const EnergyHeartIcon = () => (
  <div className="relative w-8 h-8 flex items-center justify-center">
    <div className="absolute inset-0 bg-[#00f2fe]/40 rounded-full blur-md"></div>
    <svg className="relative w-7 h-7 drop-shadow-[0_0_8px_#00f2fe]" viewBox="0 0 24 24" fill="#00f2fe">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      <path d="M12 7l-2 5h3l-1.5 5 4.5-6h-3l2-4h-3z" fill="#0b132b" />
    </svg>
  </div>
);

const CreditHexIcon = () => (
  <svg className="w-6 h-6 text-[#ff007f] drop-shadow-[0_0_8px_#ff007f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#ff007f" fillOpacity="0.15" />
    <path d="M12 6v12M8 10h8" strokeLinecap="round" stroke="#ff80bf" />
  </svg>
);

const BatteryChargeIcon = () => (
  <svg className="w-6 h-6 text-[#00f2fe] drop-shadow-[0_0_6px_#00f2fe]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="16" height="12" rx="2" />
    <path d="M20 10v4" />
    <path d="M10 9l-2 3h4l-2 3" fill="currentColor" stroke="none" />
  </svg>
);

const OptimizeDiskIcon = () => (
  <svg className="w-6 h-6 text-[#ff007f] drop-shadow-[0_0_6px_#ff007f]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" fill="#ff007f" fillOpacity="0.4" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
  </svg>
);

// --- ホログラムスライム本体 (キュッと目を閉じるリアクション対応) ---
const HoloPetOrb = ({ isReacting }) => {
  return (
    <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 260 260" className="w-full h-full overflow-visible">
        <defs>
          {/* 球体のグラデーション（半透明の光沢感） */}
          <radialGradient id="sphereGrad" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#80f7ff" stopOpacity="0.75" />
            <stop offset="65%" stopColor="#00c8e6" stopOpacity="0.5" />
            <stop offset="90%" stopColor="#006b8f" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#004766" stopOpacity="0.6" />
          </radialGradient>

          {/* 発光フィルター */}
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. オービット軌道リング (背後) */}
        <g className="animate-[spin_12s_linear_infinite]" style={{ transformOrigin: '130px 130px' }}>
          <ellipse cx="130" cy="130" rx="105" ry="32" fill="none" stroke="#00f2fe" strokeWidth="1.8" strokeDasharray="3 4" opacity="0.65" transform="rotate(-20 130 130)" />
          <ellipse cx="130" cy="130" rx="92" ry="26" fill="none" stroke="#e0f7ff" strokeWidth="1.2" strokeDasharray="8 6" opacity="0.4" transform="rotate(18 130 130)" />
        </g>

        {/* 2. 発光オーラ */}
        <circle cx="130" cy="130" r="68" fill="#00f2fe" opacity="0.25" filter="url(#neonGlow)" />

        {/* 3. 半透明ホログラム球体本体 */}
        <circle
          cx="130"
          cy="130"
          r="62"
          fill="url(#sphereGrad)"
          stroke="#99f6ff"
          strokeWidth="2"
          filter="url(#neonGlow)"
        />

        {/* 球体表面の光のハイライト（水玉ハイライト） */}
        <ellipse cx="108" cy="98" rx="14" ry="9" fill="#ffffff" opacity="0.8" transform="rotate(-30 108 98)" />
        <circle cx="94" cy="112" r="4.5" fill="#ffffff" opacity="0.75" />

        {/* 4. デジタル表情 (LEDピクセル風) */}
        {isReacting ? (
          // ★ 喜んでいる時の表情：目をキュッと閉じた (^ ^) にっこり笑顔 ＋ ほっぺ
          <g className="transition-all duration-300">
            {/* 左目：キュッとした弧 (^ 目) */}
            <path
              d="M 98 134 Q 107 121 116 134"
              fill="none"
              stroke="#00ffff"
              strokeWidth="4"
              strokeLinecap="round"
              filter="drop-shadow(0 0 6px #00ffff)"
            />
            {/* 右目：キュッとした弧 (^ 目) */}
            <path
              d="M 144 134 Q 153 121 162 134"
              fill="none"
              stroke="#00ffff"
              strokeWidth="4"
              strokeLinecap="round"
              filter="drop-shadow(0 0 6px #00ffff)"
            />

            {/* お口：にっこり開いた猫口 (w口) */}
            <path
              d="M 124 140 Q 130 148 136 140"
              fill="none"
              stroke="#00ffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="drop-shadow(0 0 4px #00ffff)"
            />

            {/* 照れたピンクのほっぺ (LEDドット) */}
            <ellipse cx="94" cy="142" rx="7" ry="4" fill="#ff007f" opacity="0.8" filter="drop-shadow(0 0 5px #ff007f)" />
            <ellipse cx="166" cy="142" rx="7" ry="4" fill="#ff007f" opacity="0.8" filter="drop-shadow(0 0 5px #ff007f)" />
          </g>
        ) : (
          // 通常時の表情：丸いキラキラドット目 (・ω・風)
          <g className="transition-all duration-300">
            {/* 左目 (キラキラピクセル) */}
            <g transform="translate(100, 122)">
              <rect x="0" y="2" width="14" height="15" rx="4" fill="#021d2d" opacity="0.6" />
              <rect x="2" y="4" width="10" height="11" rx="2" fill="#00f2fe" filter="drop-shadow(0 0 4px #00f2fe)" />
              <rect x="4" y="5" width="4" height="4" rx="1" fill="#ffffff" />
            </g>

            {/* 右目 (キラキラピクセル) */}
            <g transform="translate(146, 122)">
              <rect x="0" y="2" width="14" height="15" rx="4" fill="#021d2d" opacity="0.6" />
              <rect x="2" y="4" width="10" height="11" rx="2" fill="#00f2fe" filter="drop-shadow(0 0 4px #00f2fe)" />
              <rect x="4" y="5" width="4" height="4" rx="1" fill="#ffffff" />
            </g>

            {/* 通常のお口 (・ 3 ・) */}
            <path
              d="M 125 141 Q 130 144 135 141"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* うっすらピンクのほっぺ */}
            <ellipse cx="96" cy="140" rx="5" ry="3" fill="#ff007f" opacity="0.45" />
            <ellipse cx="164" cy="140" rx="5" ry="3" fill="#ff007f" opacity="0.45" />
          </g>
        )}

        {/* 5. 前面オービットリングと輝く星屑 */}
        <g className="animate-[spin_10s_linear_infinite_reverse]" style={{ transformOrigin: '130px 130px' }}>
          <ellipse cx="130" cy="130" rx="114" ry="36" fill="none" stroke="#80f7ff" strokeWidth="2.2" strokeDasharray="16 10 4 8" opacity="0.8" transform="rotate(-15 130 130)" />
          {/* リング上の光る衛星オーブ */}
          <circle cx="242" cy="100" r="4.5" fill="#ffffff" filter="url(#neonGlow)" />
          <circle cx="18" cy="160" r="3" fill="#00f2fe" filter="url(#neonGlow)" />
        </g>
      </svg>
    </div>
  );
};

// --- アニメーションCSS ---
const CyberStyles = () => (
  <style>{`
    @keyframes floatOrb {
      0%, 100% { transform: translateY(0px) scale(1); }
      50% { transform: translateY(-12px) scale(1.02); }
    }
    @keyframes joySquashJump {
      0% { transform: scale(1, 1) translateY(0); }
      20% { transform: scale(1.2, 0.8) translateY(10px); }
      45% { transform: scale(0.9, 1.25) translateY(-38px); }
      65% { transform: scale(1.08, 0.95) translateY(-15px); }
      85% { transform: scale(0.98, 1.02) translateY(0); }
      100% { transform: scale(1, 1) translateY(0); }
    }
    @keyframes beamPulse {
      0%, 100% { opacity: 0.55; }
      50% { opacity: 0.85; }
    }
    .orb-hover { animation: floatOrb 4.5s ease-in-out infinite; }
    .orb-joy { animation: joySquashJump 0.8s cubic-bezier(0.28, 0.84, 0.42, 1); }
    .beam-glow { animation: beamPulse 3s ease-in-out infinite; }
    
    /* 3Dサイバーグリッド床 */
    .grid-floor {
      background-size: 60px 60px;
      background-image: 
        linear-gradient(to right, rgba(0, 242, 254, 0.28) 1.5px, transparent 1.5px),
        linear-gradient(to bottom, rgba(255, 0, 127, 0.22) 1.5px, transparent 1.5px);
    }
    /* グラスモーフィズムパネル */
    .glass-card {
      background: rgba(18, 16, 42, 0.65);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }
  `}</style>
);

export default function Home() {
  const [energy, setEnergy] = useState(95);
  const [credits, setCredits] = useState(230);
  const [isReacting, setIsReacting] = useState(false);
  const [speech, setSpeech] = useState("マスター、おかえりなさい！⚡");
  const [showSpeech, setShowSpeech] = useState(true);
  const [particles, setParticles] = useState([]);
  const [modalOpen, setModalOpen] = useState(null);

  // 定期的な独り言メッセージ
  useEffect(() => {
    const idleTalks = [
      "マスター、おかえりなさい！⚡",
      "システム安定中。いつでも学習OK！",
      "きょうもコードをたくさん書こうね♪",
      "アップデート待機中…ポヨン！",
      "エネルギー満タンで絶好調だよ！✨"
    ];
    const timer = setInterval(() => {
      if (!isReacting) {
        setSpeech(idleTalks[Math.floor(Math.random() * idleTalks.length)]);
        setShowSpeech(true);
      }
    }, 8500);
    return () => clearInterval(timer);
  }, [isReacting]);

  // パーティクル生成ヘルパー
  const triggerParticles = () => {
    const newItems = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 160,
      y: (Math.random() - 0.5) * 60 - 30,
      symbol: ['✨', '⚡', '💖', '⭐'][Math.floor(Math.random() * 4)]
    }));
    setParticles(newItems);
    setTimeout(() => setParticles([]), 1200);
  };

  // ★ キャラクターをクリックした時のランダムリアクション関数
  const handlePetClick = (e) => {
    e.stopPropagation();
    if (isReacting) return;

    // ランダムなセリフ一覧
    const reactionQuotes = [
      "きゅ〜ん！マスターだいすきっ！♡",
      "えへへっ、くすぐったいよ〜！⚡",
      "アクセス承認！パワーMAXだよ！✨",
      "なでなで検知！システム幸福度上昇中♪",
      "もっとかまって！ピポパ…♡",
      "わーいっ！ぎゅ〜〜ってして！⭐"
    ];

    const randomText = reactionQuotes[Math.floor(Math.random() * reactionQuotes.length)];
    setSpeech(randomText);
    setShowSpeech(true);
    setIsReacting(true);
    triggerParticles();

    // 0.85秒後にリアクション（目を閉じるアニメ）を解除
    setTimeout(() => {
      setIsReacting(false);
    }, 850);
  };

  // 充電（えさ）
  const handleCharge = () => {
    if (credits < 20) {
      setSpeech("クレジットが足りないよ…学習して稼ごう！");
      setShowSpeech(true);
      return;
    }
    setCredits((c) => c - 20);
    setEnergy((e) => Math.min(100, e + 10));
    setSpeech("エネルギー充填完了！チャージありがとう！⚡");
    setShowSpeech(true);
    setIsReacting(true);
    triggerParticles();
    setTimeout(() => setIsReacting(false), 850);
  };

  // 最適化（あそぶ）
  const handleOptimize = () => {
    if (credits < 15) {
      setSpeech("クレジットが足りないよ…学習して稼ごう！");
      setShowSpeech(true);
      return;
    }
    setCredits((c) => c - 15);
    setEnergy((e) => Math.min(100, e + 5));
    setSpeech("システム最適化完了！動作サクサクだよ♪✨");
    setShowSpeech(true);
    setIsReacting(true);
    triggerParticles();
    setTimeout(() => setIsReacting(false), 850);
  };

  // 学習によるクレジット付与
  const handleEarnCredits = (amount) => {
    setCredits((c) => c + amount);
    setModalOpen(null);
    setSpeech(`問題クリア！ +${amount} CR 獲得したよ！🎉`);
    setShowSpeech(true);
    setIsReacting(true);
    triggerParticles();
    setTimeout(() => setIsReacting(false), 850);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a071c] font-sans select-none text-slate-100 flex flex-col justify-between">
      <CyberStyles />

      {/* ========================================================= */}
      {/* 1. 背景環境レイヤー（サイバー空間・サーバー室・配管）         */}
      {/* ========================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* 背景のネオン霧グラデーション */}
        <div className="absolute inset-0 bg-radial-[at_50%_40%] from-[#1f1042] via-[#0e0a26] to-[#050311] opacity-90"></div>

        {/* 左側：サーバーラック群のシルエットとLED */}
        <div className="absolute top-[28%] left-4 sm:left-12 w-44 sm:w-64 h-72 border border-purple-900/40 bg-purple-950/20 rounded-lg p-2.5 opacity-45 flex flex-col justify-between">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 border-b border-purple-800/30 flex items-center justify-between px-2">
              <div className="w-16 h-1 bg-cyan-500/30 rounded"></div>
              <div className="flex gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-cyan-400 animate-pulse' : 'bg-purple-500'}`}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
              </div>
            </div>
          ))}
        </div>

        {/* 右側：ネオン配管パイプ */}
        <div className="absolute top-0 right-4 sm:right-16 w-36 h-80 opacity-55">
          <svg className="w-full h-full" viewBox="0 0 140 320" fill="none">
            <path d="M120 0 V140 C120 170, 95 190, 65 190 H0" stroke="#00f2fe" strokeWidth="8" strokeOpacity="0.4" />
            <path d="M135 0 V130 C135 175, 100 205, 55 205 H0" stroke="#ff007f" strokeWidth="6" strokeOpacity="0.35" />
            <path d="M120 0 V140 C120 170, 95 190, 65 190 H0" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="10 30" opacity="0.6" />
          </svg>
        </div>

        {/* 遠景の浮遊ホログラムモニター（右奥） */}
        <div className="absolute top-[32%] right-20 sm:right-36 w-36 sm:w-44 h-24 glass-card border border-cyan-500/20 rounded-md p-2 opacity-35 font-mono text-[9px] text-cyan-300">
          <div className="border-b border-cyan-500/30 pb-1 flex justify-between font-bold">
            <span>TERMINAL</span>
            <span className="text-pink-400">ONLINE</span>
          </div>
          <div className="mt-1.5 space-y-1 text-cyan-400/80">
            <p>&gt; sys.integrity: 100%</p>
            <p>&gt; load_factor: 0.12</p>
            <p>&gt; neural_sync: ACTIVE</p>
          </div>
        </div>

        {/* 奥の紫と青の霧（ブルーム） */}
        <div className="absolute top-[25%] left-1/4 w-[500px] h-72 bg-purple-600/15 rounded-full blur-[110px]"></div>
        <div className="absolute top-[35%] right-1/4 w-[450px] h-64 bg-cyan-500/15 rounded-full blur-[90px]"></div>

        {/* 立体サイバーグリッド床（手前から奥への遠近法） */}
        <div
          className="absolute bottom-0 w-[200%] -left-[50%] h-[55vh] grid-floor border-t-2 border-cyan-400/50 shadow-[0_0_35px_rgba(0,242,254,0.3)]"
          style={{
            transformOrigin: 'bottom center',
            transform: 'perspective(600px) rotateX(68deg)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)'
          }}
        />
      </div>

      {/* ========================================================= */}
      {/* 2. 前面ヘッダーUI（エネルギーゲージ・クレジット・学習ボタン） */}
      {/* ========================================================= */}
      <header className="relative z-30 p-4 sm:p-7 flex items-start justify-between w-full pointer-events-none">
        {/* 左上ステータス */}
        <div className="flex flex-col space-y-3 pointer-events-auto">
          {/* ENERGY カード */}
          <div className="glass-card border border-[#00f2fe]/60 rounded-2xl px-4 py-3 shadow-[0_0_20px_rgba(0,242,254,0.25)] flex flex-col w-64 sm:w-72">
            <div className="flex items-center justify-between text-xs sm:text-sm font-black text-cyan-300 tracking-wider mb-2 font-mono">
              <div className="flex items-center gap-2">
                <EnergyHeartIcon />
                <span>ENERGY</span>
              </div>
              <span className="text-[#00f2fe] drop-shadow-[0_0_8px_#00f2fe] text-base">{energy}%</span>
            </div>
            {/* ネオンプログレスバー */}
            <div className="w-full h-3.5 bg-[#09071c] rounded-full overflow-hidden border border-[#00f2fe]/40 p-0.5">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#00b4d8] to-[#00f2fe] shadow-[0_0_12px_#00f2fe]"
                style={{ width: `${energy}%` }}
              />
            </div>
          </div>

          {/* CREDITS カード */}
          <div className="glass-card border border-[#ff007f]/60 rounded-2xl px-4 py-2.5 shadow-[0_0_20px_rgba(255,0,127,0.25)] flex items-center justify-between w-48 sm:w-56 font-mono">
            <div className="flex items-center gap-2.5">
              <CreditHexIcon />
              <span className="text-xs sm:text-sm font-bold text-pink-300 tracking-wider">CREDITS</span>
            </div>
            <span className="text-lg sm:text-xl font-black text-[#ff80bf] drop-shadow-[0_0_8px_#ff007f]">
              {credits}
            </span>
          </div>
        </div>

        {/* 右上メニュー＆学習ボタン */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          {/* > Execute_Learn() ボタン */}
          <button
            onClick={() => setModalOpen('study')}
            className="group relative px-5 sm:px-6 py-2.5 sm:py-3 glass-card hover:bg-emerald-950/40 border-2 border-[#00ff88] rounded-2xl shadow-[0_0_18px_rgba(0,255,136,0.35)] active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="text-xs sm:text-sm font-mono font-black text-[#00ff88] tracking-wider group-hover:drop-shadow-[0_0_8px_#00ff88]">
              &gt; Execute_Learn()
            </span>
          </button>

          {/* 設定ボタン */}
          <button
            onClick={() => setModalOpen('settings')}
            className="p-3 glass-card hover:bg-cyan-950/40 border border-cyan-500/50 hover:border-cyan-400 rounded-2xl shadow-[0_0_12px_rgba(0,242,254,0.2)] active:scale-90 transition-all text-cyan-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
              <circle cx="8" cy="6" r="2" fill="#00f2fe" />
              <circle cx="16" cy="12" r="2" fill="#ff007f" />
              <circle cx="10" cy="18" r="2" fill="#00ff88" />
            </svg>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 3. 中央ステージ（台座・上向き照射光・タップ可能なペット）   */}
      {/* ========================================================= */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center -mt-6">
        {/* ホログラム照射台座と光ビーム */}
        <div className="relative flex flex-col items-center">
          
          {/* デジタル吹き出し（セリフ表示） */}
          <div
            className={`transition-all duration-300 transform mb-2 pointer-events-none ${
              showSpeech ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'
            }`}
          >
            <div className="relative glass-card border border-[#00f2fe] px-5 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(0,242,254,0.4)] text-xs sm:text-sm font-bold text-cyan-100 font-mono tracking-wide">
              <span className="text-[#ff007f] mr-1.5 font-black">&gt;</span>
              {speech}
              {/* 下向きの角ばったネオン三角 */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-[#00f2fe]"></div>
            </div>
          </div>

          {/* ★ キャラクタータップ領域（クリックでアニメーション＆セリフ実行） */}
          <div
            onClick={handlePetClick}
            className={`relative cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 z-30 ${
              isReacting ? 'orb-joy' : 'orb-hover'
            }`}
            title="タップしてなでなで！"
          >
            <HoloPetOrb isReacting={isReacting} />

            {/* 飛び交うリアクションパーティクル */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute animate-ping text-xl sm:text-2xl drop-shadow-[0_0_8px_#00f2fe]"
                  style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
                >
                  {p.symbol}
                </div>
              ))}
            </div>
          </div>

          {/* 台座から上へ伸びるホログラム光コーン */}
          <div
            className="absolute -bottom-8 w-44 sm:w-56 h-48 bg-gradient-to-t from-[#00f2fe]/45 via-[#00f2fe]/15 to-transparent blur-md beam-glow pointer-events-none"
            style={{ clipPath: 'polygon(20% 100%, 80% 100%, 100% 0%, 0% 0%)' }}
          />

          {/* 円形ホログラム台座（2段ネオンリング） */}
          <div className="relative -mt-10 sm:-mt-12 flex flex-col items-center pointer-events-none">
            {/* 上段リング (シアン発光) */}
            <div className="w-48 sm:w-60 h-14 rounded-[50%] border-3 border-[#00f2fe] bg-[#00f2fe]/25 shadow-[0_0_25px_#00f2fe] flex items-center justify-center">
              {/* 内側の回転スキャナー */}
              <div className="w-36 sm:w-44 h-8 rounded-[50%] border border-cyan-200/60 border-dashed animate-[spin_8s_linear_infinite]"></div>
            </div>
            {/* 下段リング (マゼンタ発光ベース) */}
            <div className="w-56 sm:w-72 h-14 -mt-9 rounded-[50%] border-3 border-[#ff007f] bg-[#12082b] shadow-[0_0_30px_rgba(255,0,127,0.45)]"></div>
          </div>

        </div>
      </main>

      {/* ========================================================= */}
      {/* 4. フッターUI（CHARGEボタン・OPTIMIZEボタン）              */}
      {/* ========================================================= */}
      <footer className="relative z-30 p-5 sm:p-8 flex items-center justify-center gap-6 sm:gap-12 pointer-events-none">
        {/* CHARGE (充電) ボタン */}
        <button
          onClick={handleCharge}
          className="pointer-events-auto group relative px-7 sm:px-11 py-3.5 sm:py-4 glass-card hover:bg-cyan-950/50 active:scale-95 rounded-2xl border-2 sm:border-3 border-[#00f2fe] shadow-[0_0_25px_rgba(0,242,254,0.35)] active:shadow-[0_0_10px_#00f2fe] transition-all flex items-center gap-3.5"
        >
          <div className="group-hover:rotate-12 transition-transform">
            <BatteryChargeIcon />
          </div>
          <div className="text-left font-mono">
            <span className="block text-sm sm:text-base font-black text-[#00f2fe] tracking-wider drop-shadow-[0_0_6px_#00f2fe]">
              CHARGE
            </span>
            <span className="block text-xs font-bold text-cyan-300/80">
              -20 CR
            </span>
          </div>
        </button>

        {/* OPTIMIZE (最適化) ボタン */}
        <button
          onClick={handleOptimize}
          className="pointer-events-auto group relative px-7 sm:px-11 py-3.5 sm:py-4 glass-card hover:bg-pink-950/50 active:scale-95 rounded-2xl border-2 sm:border-3 border-[#ff007f] shadow-[0_0_25px_rgba(255,0,127,0.35)] active:shadow-[0_0_10px_#ff007f] transition-all flex items-center gap-3.5"
        >
          <div className="group-hover:animate-spin transition-transform">
            <OptimizeDiskIcon />
          </div>
          <div className="text-left font-mono">
            <span className="block text-sm sm:text-base font-black text-[#ff007f] tracking-wider drop-shadow-[0_0_6px_#ff007f]">
              OPTIMIZE
            </span>
            <span className="block text-xs font-bold text-pink-300/80">
              -15 CR
            </span>
          </div>
        </button>
      </footer>

      {/* ========================================================= */}
      {/* 5. 学習モジュール・設定用 モーダル                         */}
      {/* ========================================================= */}
      {modalOpen && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card border-2 border-[#00f2fe] rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_40px_rgba(0,242,254,0.3)] relative font-mono">
            <button
              onClick={() => setModalOpen(null)}
              className="absolute top-4 right-4 text-cyan-400 hover:text-white font-black text-xl transition-colors"
            >
              ✕
            </button>

            {modalOpen === 'study' && (
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#00ff88] mb-2 flex items-center gap-2">
                  <span>&gt; SELECT_DIFFICULTY</span>
                </h3>
                <p className="text-xs sm:text-sm text-cyan-200/80 mb-5">
                  学習問題を解いて生物育成用のクレジット(CR)を獲得します。
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => handleEarnCredits(10)}
                    className="w-full py-3 px-4 bg-emerald-950/40 hover:bg-emerald-900/60 border border-[#00ff88] text-[#00ff88] rounded-xl font-bold text-sm transition-all text-left flex justify-between items-center"
                  >
                    <span>[初級] 基礎文法モジュール</span>
                    <span className="text-xs bg-emerald-500/20 px-2 py-1 rounded">+10 CR</span>
                  </button>
                  <button
                    onClick={() => handleEarnCredits(30)}
                    className="w-full py-3 px-4 bg-cyan-950/40 hover:bg-cyan-900/60 border border-[#00f2fe] text-[#00f2fe] rounded-xl font-bold text-sm transition-all text-left flex justify-between items-center"
                  >
                    <span>[中級] アルゴリズム実践</span>
                    <span className="text-xs bg-cyan-500/20 px-2 py-1 rounded">+30 CR</span>
                  </button>
                  <button
                    onClick={() => handleEarnCredits(60)}
                    className="w-full py-3 px-4 bg-pink-950/40 hover:bg-pink-900/60 border border-[#ff007f] text-[#ff80bf] rounded-xl font-bold text-sm transition-all text-left flex justify-between items-center"
                  >
                    <span>[上級] データベース設計</span>
                    <span className="text-xs bg-pink-500/20 px-2 py-1 rounded">+60 CR</span>
                  </button>
                </div>
              </div>
            )}

            {modalOpen === 'settings' && (
              <div>
                <h3 className="text-lg font-black text-cyan-300 mb-3 border-b border-cyan-800 pb-2">
                  &gt; SYSTEM_CONFIG
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <div className="flex justify-between items-center py-1">
                    <span>BGM / 音響効果</span>
                    <input type="checkbox" defaultChecked className="accent-cyan-400 cursor-pointer" />
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>放置減衰アラート</span>
                    <input type="checkbox" defaultChecked className="accent-cyan-400 cursor-pointer" />
                  </div>
                  <p className="text-[11px] text-cyan-400/60 pt-2 border-t border-cyan-900">
                    ※ バックエンドAPIと接続時、Cookie経由で認証情報が維持されます。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}