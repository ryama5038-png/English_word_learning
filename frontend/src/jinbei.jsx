import React, { useState, useEffect, useRef } from 'react';
import { authApi, petApi } from './api';
import { WordDictionaryModal, QuizModal, SystemConfigModal } from './VocabModals';

// --- Cyber & Aquarium Glowing Icons ---
const EnergyHeartIcon = () => (
  <div className="relative w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shrink-0">
    <div className="absolute inset-0 bg-[#00f2fe]/40 rounded-full blur-md"></div>
    <svg className="relative w-5 h-5 sm:w-7 sm:h-7 drop-shadow-[0_0_8px_#00f2fe]" viewBox="0 0 24 24" fill="#00f2fe">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      <path d="M12 7l-2 5h3l-1.5 5 4.5-6h-3l2-4h-3z" fill="#0b132b" />
    </svg>
  </div>
);

const CreditHexIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff007f] drop-shadow-[0_0_8px_#ff007f] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#ff007f" fillOpacity="0.15" />
    <path d="M12 6v12M8 10h8" strokeLinecap="round" stroke="#ff80bf" />
  </svg>
);

const BatteryChargeIcon = () => (
  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-[#00f2fe] drop-shadow-[0_0_8px_#00f2fe] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="16" height="12" rx="2" />
    <path d="M20 10v4" />
    <path d="M10 9l-2 3h4l-2 3" fill="currentColor" stroke="none" />
  </svg>
);

const OptimizeDiskIcon = () => (
  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-[#ff007f] drop-shadow-[0_0_8px_#ff007f] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" fill="#ff007f" fillOpacity="0.4" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
  </svg>
);

// --- ホログラムジンベイザメ本体 (水泳アニメーション・斑点・表情リアクション) ---
const HoloWhaleSharkSprite = ({ isReacting }) => {
  return (
    <div className="relative w-60 h-48 sm:w-80 sm:h-64 md:w-96 md:h-72 flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 360 260" className="w-full h-full overflow-visible">
        <defs>
          {/* ジンベイザメ本体の半透明ホログラムグラデーション */}
          <radialGradient id="sharkBodyGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="22%" stopColor="#99f6ff" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#00c8e6" stopOpacity="0.6" />
            <stop offset="88%" stopColor="#0284c7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.7" />
          </radialGradient>

          {/* お腹の白い発光 */}
          <linearGradient id="sharkBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#cffafe" stopOpacity="0.8" />
          </linearGradient>

          {/* ネオングローフィルター */}
          <filter id="sharkNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. 回転するサイバーオービットリング (サメの周囲) */}
        <g className="animate-[spin_14s_linear_infinite]" style={{ transformOrigin: '180px 130px' }}>
          <ellipse
            cx="180"
            cy="130"
            rx="145"
            ry="45"
            fill="none"
            stroke="#00f2fe"
            strokeWidth="1.8"
            strokeDasharray="4 6"
            opacity="0.65"
            transform="rotate(-15 180 130)"
          />
          <ellipse
            cx="180"
            cy="130"
            rx="130"
            ry="38"
            fill="none"
            stroke="#e0f7ff"
            strokeWidth="1.2"
            strokeDasharray="10 8"
            opacity="0.4"
            transform="rotate(18 180 130)"
          />
        </g>

        {/* 2. サメ本体グループ（全体の泳ぎ揺らめき適用） */}
        <g className="shark-swim-group">
          
          {/* 奥側の胸ビレ (右側) */}
          <path
            d="M 175 110 C 195 95, 230 100, 240 115 C 230 125, 200 125, 175 110 Z"
            fill="#0284c7"
            opacity="0.45"
          />

          {/* 尾ビレ（尾部と一体化して揺らぐパーツ） */}
          <g className="shark-tail-wave" style={{ transformOrigin: '240px 125px' }}>
            <path
              d="M 255 122
                 C 275 115, 305 75, 320 65
                 C 310 95, 298 120, 305 125
                 C 312 130, 318 155, 312 175
                 C 295 155, 275 135, 255 128 Z"
              fill="url(#sharkBodyGrad)"
              stroke="#99f6ff"
              strokeWidth="2"
              filter="url(#sharkNeonGlow)"
            />
            {/* 尾ビレの光るストライプ */}
            <path d="M 270 120 Q 295 95 310 75" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" strokeDasharray="3 3" />
            <path d="M 270 128 Q 295 145 305 165" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" strokeDasharray="3 3" />
          </g>

          {/* 小さな第2背ビレ */}
          <path
            d="M 235 105 C 245 88, 255 90, 258 105 Z"
            fill="url(#sharkBodyGrad)"
            stroke="#99f6ff"
            strokeWidth="1.5"
          />

          {/* メイン背ビレ（上部） */}
          <path
            d="M 185 88
               C 195 45, 215 48, 225 90
               C 210 98, 195 95, 185 88 Z"
            fill="url(#sharkBodyGrad)"
            stroke="#99f6ff"
            strokeWidth="2"
            filter="url(#sharkNeonGlow)"
          />

          {/* ジンベイザメのメインボディ（丸っこく愛らしいフォルム） */}
          <path
            d="M 85 130
               C 65 130, 55 100, 85 80
               C 120 60, 195 65, 260 115
               C 268 122, 268 128, 260 135
               C 210 170, 130 170, 85 155
               C 65 148, 65 135, 85 130 Z"
            fill="url(#sharkBodyGrad)"
            stroke="#99f6ff"
            strokeWidth="2.5"
            filter="url(#sharkNeonGlow)"
          />

          {/* お腹の白い光沢レイヤー */}
          <path
            d="M 85 132
               C 105 135, 140 148, 185 145
               C 220 142, 245 132, 255 128
               C 235 155, 150 168, 85 155 Z"
            fill="url(#sharkBellyGrad)"
          />

          {/* 手前側の大きな胸ビレ（パタパタ揺れる） */}
          <path
            d="M 125 140
               C 135 168, 175 195, 195 185
               C 200 172, 175 150, 150 135 Z"
            fill="url(#sharkBodyGrad)"
            stroke="#99f6ff"
            strokeWidth="2"
            className="shark-fin-wave"
            style={{ transformOrigin: '135px 140px' }}
            filter="url(#sharkNeonGlow)"
          />

          {/* 3. ジンベイザメの象徴的な白い斑点模様 (Dots Pattern) */}
          <g fill="#ffffff" opacity="0.85">
            {/* 頭部の小さなドット */}
            <circle cx="100" cy="85" r="2" />
            <circle cx="112" cy="78" r="2.5" />
            <circle cx="125" cy="88" r="2" />
            <circle cx="118" cy="98" r="1.8" />
            <circle cx="138" cy="80" r="2.2" />

            {/* 背中・体幹部のドット列 */}
            <circle cx="140" cy="95" r="3" />
            <circle cx="155" cy="84" r="3.2" />
            <circle cx="160" cy="98" r="2.8" />
            <circle cx="175" cy="90" r="3.5" />
            <circle cx="178" cy="105" r="2.5" />
            <circle cx="192" cy="98" r="3" />
            <circle cx="198" cy="112" r="2.6" />
            <circle cx="212" cy="104" r="3" />
            <circle cx="218" cy="118" r="2.4" />
            <circle cx="230" cy="112" r="2.5" />
            <circle cx="235" cy="122" r="2" />
            <circle cx="248" cy="118" r="2.2" />

            {/* 下腹部側の小さめドット */}
            <circle cx="130" cy="112" r="1.8" />
            <circle cx="148" cy="120" r="2" />
            <circle cx="165" cy="122" r="2.2" />
            <circle cx="185" cy="125" r="2" />
          </g>

          {/* 体側の発光ライン (側線) */}
          <path d="M 130 92 Q 185 96 245 116" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.5" strokeDasharray="5 3" />
          <path d="M 140 106 Q 195 110 240 124" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" strokeDasharray="4 4" />

          {/* ジンベイザメのエラ穴 (4本の発光スリット) */}
          <g stroke="#99f6ff" strokeWidth="2" strokeLinecap="round" opacity="0.8">
            <path d="M 125 118 Q 128 126 125 134" />
            <path d="M 129 119 Q 132 126 129 133" />
            <path d="M 133 120 Q 136 126 133 132" />
            <path d="M 137 121 Q 140 126 137 131" />
          </g>

          {/* 頭部のツヤ（ハイライト） */}
          <ellipse cx="98" cy="84" rx="14" ry="7" fill="#ffffff" opacity="0.75" transform="rotate(-15 98 84)" />

          {/* 4. サメの表情（愛らしい口と目、ほっぺ） */}
          {isReacting ? (
            // ★ リアクション時：目をキュッと細めた (^ ^) 笑顔＋ほんのり赤らむチーク
            <g className="transition-all duration-300">
              {/* 左目：キュッとした (^ 目) */}
              <path
                d="M 72 108 Q 79 96 86 108"
                fill="none"
                stroke="#00ffff"
                strokeWidth="4"
                strokeLinecap="round"
                filter="drop-shadow(0 0 6px #00ffff)"
              />
              {/* 右目：キュッとした (^ 目) */}
              <path
                d="M 104 108 Q 111 96 118 108"
                fill="none"
                stroke="#00ffff"
                strokeWidth="4"
                strokeLinecap="round"
                filter="drop-shadow(0 0 6px #00ffff)"
              />
              {/* お口：にっこり開いた猫口 (w口) */}
              <path
                d="M 83 118 Q 89 126 95 119 Q 101 126 107 118"
                fill="none"
                stroke="#00ffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="drop-shadow(0 0 4px #00ffff)"
              />
              {/* 発光ピンクほっぺ */}
              <ellipse cx="68" cy="116" rx="6.5" ry="4" fill="#ff007f" opacity="0.85" filter="drop-shadow(0 0 6px #ff007f)" />
              <ellipse cx="122" cy="116" rx="6.5" ry="4" fill="#ff007f" opacity="0.85" filter="drop-shadow(0 0 6px #ff007f)" />
            </g>
          ) : (
            // 通常時：画像そのままの穏やかな (^ ω ^) 表情
            <g className="transition-all duration-300">
              {/* 左目：やさしい弧 */}
              <path
                d="M 73 108 Q 79 98 85 108"
                fill="none"
                stroke="#00f2fe"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="drop-shadow(0 0 3px #00f2fe)"
              />
              {/* 右目：やさしい弧 */}
              <path
                d="M 105 108 Q 111 98 117 108"
                fill="none"
                stroke="#00f2fe"
                strokeWidth="3.5"
                strokeLinecap="round"
                filter="drop-shadow(0 0 3px #00f2fe)"
              />
              {/* 口：ぽよんとした ω 口 */}
              <path
                d="M 84 117 Q 89 124 95 118 Q 101 124 106 117"
                fill="none"
                stroke="#00e5ff"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* うっすらピンクのほっぺ */}
              <ellipse cx="69" cy="115" rx="5" ry="3" fill="#ff007f" opacity="0.5" />
              <ellipse cx="121" cy="115" rx="5" ry="3" fill="#ff007f" opacity="0.5" />
            </g>
          )}

        </g>

        {/* 5. 前面オービットリングと輝く粒子 */}
        <g className="animate-[spin_10s_linear_infinite_reverse]" style={{ transformOrigin: '180px 130px' }}>
          <ellipse
            cx="180"
            cy="130"
            rx="155"
            ry="48"
            fill="none"
            stroke="#80f7ff"
            strokeWidth="2"
            strokeDasharray="16 10 4 8"
            opacity="0.8"
            transform="rotate(-12 180 130)"
          />
          <circle cx="330" cy="100" r="4.5" fill="#ffffff" filter="url(#sharkNeonGlow)" />
          <circle cx="30" cy="160" r="3" fill="#00f2fe" filter="url(#sharkNeonGlow)" />
        </g>
      </svg>
    </div>
  );
};

// --- アニメーションCSS (アクアリウム＆ジンベイザメの優雅な遊泳) ---
const SharkAquariumStyles = () => (
  <style>{`
    /* サメ全体の上下浮遊と前進・後退の遊泳感 */
    @keyframes sharkCruise {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      30% { transform: translateY(-14px) rotate(-1.5deg); }
      70% { transform: translateY(8px) rotate(1deg); }
    }
    /* 尾ビレのしなやかな推進運動 */
    @keyframes tailOscillation {
      0%, 100% { transform: rotate(0deg) skewY(0deg); }
      25% { transform: rotate(-5deg) skewY(-3deg); }
      75% { transform: rotate(6deg) skewY(4deg); }
    }
    /* 胸ビレのパタパタ */
    @keyframes finFlap {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(7deg) scaleY(0.95); }
    }
    /* タップ時の大喜びスカッシュ＆ジャンプ */
    @keyframes sharkJoyJump {
      0% { transform: scale(1, 1) translateY(0); }
      20% { transform: scale(1.15, 0.85) translateY(12px); }
      45% { transform: scale(0.92, 1.2) translateY(-40px) rotate(-3deg); }
      65% { transform: scale(1.06, 0.95) translateY(-14px) rotate(2deg); }
      85% { transform: scale(0.98, 1.02) translateY(0); }
      100% { transform: scale(1, 1) translateY(0); }
    }

    .shark-float { animation: sharkCruise 5.2s ease-in-out infinite; }
    .shark-react { animation: sharkJoyJump 0.85s cubic-bezier(0.28, 0.84, 0.42, 1); }
    .shark-tail-wave { animation: tailOscillation 2.6s ease-in-out infinite; }
    .shark-fin-wave { animation: finFlap 3.2s ease-in-out infinite; }

    /* 水中の気泡（バブル）の上昇アニメーション */
    @keyframes bubbleRise {
      0% { transform: translateY(100vh) scale(0.4); opacity: 0; }
      20% { opacity: 0.75; }
      80% { opacity: 0.75; }
      100% { transform: translateY(-10vh) scale(1.15); opacity: 0; }
    }
    .bubble-1 { animation: bubbleRise 11s linear infinite; }
    .bubble-2 { animation: bubbleRise 14s linear infinite 3s; }
    .bubble-3 { animation: bubbleRise 9s linear infinite 5s; }
    .bubble-4 { animation: bubbleRise 16s linear infinite 1s; }
    .bubble-5 { animation: bubbleRise 12s linear infinite 7s; }

    /* 3Dサイバーグリッド床 */
    .aquarium-grid-floor {
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

export default function Jinbei() {
  const [user, setUser] = useState(null);
  const [energy, setEnergy] = useState(95);
  const [credits, setCredits] = useState(230);
  const [isReacting, setIsReacting] = useState(false);
  const [speech, setSpeech] = useState("マスター、おかえりなさい！⚡");
  const [showSpeech, setShowSpeech] = useState(true);
  const [particles, setParticles] = useState([]);
  const [modalOpen, setModalOpen] = useState(null);
  const lastWordIdRef = useRef(null);

  // 初回マウント時：バックエンドからユーザー状態＆エネルギー減衰を取得
  useEffect(() => {
    authApi
      .getMe()
      .then((u) => {
        setUser(u);
        setEnergy(u.energy);
        setCredits(u.points);
        if (u.decayed_amount > 0) {
          setSpeech(
            `ぷかぷか…放置中にエネルギーが -${u.decayed_amount}% 減っちゃったよ…🫧`
          );
        }
      })
      .catch(() => {});
  }, []);

  // 定期的な無意識復習（直近検索した最大20語の品詞別意味＋エネルギー残量に応じた口調変化）
  useEffect(() => {
    const timer = setInterval(async () => {
      if (isReacting) return;
      try {
        const data = await petApi.getIdleTalk(lastWordIdRef.current);
        if (data && data.speech) {
          setSpeech(data.speech);
          setEnergy(data.energy);
          if (data.word_id) lastWordIdRef.current = data.word_id;
          setShowSpeech(true);
        }
      } catch {
        const idleTalks = [
          "マスター、おかえりなさい！⚡",
          "ぷかぷか〜♪ 水温もサイバーネットも快調！",
          "ジンベイザメの模様、きれいでしょう？✨",
        ];
        setSpeech(idleTalks[Math.floor(Math.random() * idleTalks.length)]);
        setShowSpeech(true);
      }
    }, 7500);
    return () => clearInterval(timer);
  }, [isReacting]);

  // パーティクル生成ヘルパー
  const triggerParticles = () => {
    const symbols = ['🫧', '✨', '⚡', '💖', '⭐', '🦈'];
    const newItems = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 180,
      y: (Math.random() - 0.5) * 70 - 30,
      symbol: symbols[Math.floor(Math.random() * symbols.length)]
    }));
    setParticles(newItems);
    setTimeout(() => setParticles([]), 1200);
  };

  // ★ ジンベイザメタップ時のランダムリアクション＋直近検索単語の復習
  const handlePetClick = async (e) => {
    e.stopPropagation();
    if (isReacting) return;

    setIsReacting(true);
    triggerParticles();

    try {
      const data = await petApi.getIdleTalk(lastWordIdRef.current);
      if (data && data.speech) {
        setSpeech(`ぷかぷか〜🫧 ${data.speech}`);
        if (data.word_id) lastWordIdRef.current = data.word_id;
      }
    } catch {
      const reactionQuotes = [
        "きゅ〜ん！マスターだいすきっ！♡",
        "ぷかぷか〜！くすぐったいよ⚡",
        "ヒレをパタパタ！パワーMAXだよ！✨",
      ];
      setSpeech(reactionQuotes[Math.floor(Math.random() * reactionQuotes.length)]);
    }
    setShowSpeech(true);

    setTimeout(() => {
      setIsReacting(false);
    }, 850);
  };

  // CHARGE (プランクトン給餌・充電)
  const handleCharge = async () => {
    try {
      const res = await petApi.performAction('charge');
      setCredits(res.points);
      setEnergy(res.energy);
      setSpeech(res.speech);
      setShowSpeech(true);
      setIsReacting(true);
      triggerParticles();
      setTimeout(() => setIsReacting(false), 850);
    } catch (err) {
      setSpeech(err.response?.data?.detail || "クレジットが足りないよ…学習して稼ごう！");
      setShowSpeech(true);
    }
  };

  // OPTIMIZE (遊泳・最適化)
  const handleOptimize = async () => {
    try {
      const res = await petApi.performAction('optimize');
      setCredits(res.points);
      setEnergy(res.energy);
      setSpeech(res.speech);
      setShowSpeech(true);
      setIsReacting(true);
      triggerParticles();
      setTimeout(() => setIsReacting(false), 850);
    } catch (err) {
      setSpeech(err.response?.data?.detail || "クレジットが足りないよ…学習して稼ごう！");
      setShowSpeech(true);
    }
  };

  const handleWordSearched = (word) => {
    lastWordIdRef.current = word.id;
    const pos = [
      word.noun_meaning ? `【名】${word.noun_meaning}` : null,
      word.verb_meaning ? `【動】${word.verb_meaning}` : null,
      word.adj_meaning ? `【形】${word.adj_meaning}` : null,
      word.adv_meaning ? `【副】${word.adv_meaning}` : null,
    ]
      .filter(Boolean)
      .join(' / ');
    setSpeech(`「${word.word_spell}」(${pos}) を覚えたよ！一緒に復習しようね🦈`);
    setShowSpeech(true);
  };

  const handleQuizComplete = (res) => {
    setCredits(res.total_points);
    setSpeech(res.speech);
    setShowSpeech(true);
    setIsReacting(true);
    triggerParticles();
    setTimeout(() => setIsReacting(false), 850);
  };

  return (
    <div className="relative w-full h-[100dvh] md:w-screen md:h-screen overflow-hidden bg-[#09071c] font-sans select-none text-slate-100 flex flex-col justify-between">
      <SharkAquariumStyles />

      {/* ========================================================= */}
      {/* 1. 背景環境レイヤー（深海アクアリウム・サンゴ・パイプ・気泡） */}
      {/* ========================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* 背景の深海ラジアルグラデーション */}
        <div className="absolute inset-0 bg-radial-[at_50%_40%] from-[#191040] via-[#0d0926] to-[#040310] opacity-95"></div>

        {/* 昇っていく水中の気泡（Bubbles） */}
        <div className="absolute left-[12%] w-4 h-4 rounded-full border border-cyan-300/60 bg-cyan-400/20 bubble-1"></div>
        <div className="absolute left-[24%] w-6 h-6 rounded-full border border-cyan-300/50 bg-cyan-400/15 bubble-2"></div>
        <div className="absolute left-[45%] w-3 h-3 rounded-full border border-cyan-200/70 bg-cyan-300/25 bubble-3"></div>
        <div className="absolute right-[22%] w-5 h-5 rounded-full border border-pink-300/50 bg-pink-400/15 bubble-4"></div>
        <div className="absolute right-[14%] w-4 h-4 rounded-full border border-cyan-300/60 bg-cyan-400/20 bubble-5"></div>

        {/* 左側：深海水草＆発光サンゴのネオンシルエット */}
        <div className="absolute bottom-[20%] left-2 sm:left-14 w-28 sm:w-44 h-32 sm:h-48 opacity-25 sm:opacity-45">
          <svg className="w-full h-full" viewBox="0 0 160 160" fill="none">
            <path d="M20 160 Q 30 110 15 70 T 35 10" stroke="#00f2fe" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
            <path d="M40 160 Q 55 120 45 80 T 60 30" stroke="#00b4d8" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
            <path d="M60 160 Q 75 130 65 95 T 80 50" stroke="#ff007f" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
          </svg>
        </div>

        {/* 右側：深海ネオンパイプ＆発光バイオノード */}
        <div className="absolute top-0 right-2 sm:right-16 w-24 sm:w-36 h-60 sm:h-80 opacity-35 sm:opacity-55">
          <svg className="w-full h-full" viewBox="0 0 140 320" fill="none">
            <path d="M120 0 V140 C120 170, 95 190, 65 190 H0" stroke="#00f2fe" strokeWidth="8" strokeOpacity="0.4" />
            <path d="M135 0 V130 C135 175, 100 205, 55 205 H0" stroke="#ff007f" strokeWidth="6" strokeOpacity="0.35" />
          </svg>
        </div>
        <div className="absolute bottom-[22%] right-2 sm:right-10 w-16 sm:w-24 h-16 sm:h-24 opacity-25 sm:opacity-40">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <path d="M20 100 Q 30 70 20 40" stroke="#ff007f" strokeWidth="4" strokeLinecap="round" />
            <circle cx="20" cy="38" r="3" fill="#ff007f" className="animate-ping" />
            <path d="M50 100 Q 60 65 50 30" stroke="#00f2fe" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="28" r="3" fill="#00f2fe" className="animate-ping" />
          </svg>
        </div>

        {/* 奥の光彩（ブルーム効果） */}
        <div className="absolute top-[28%] left-1/4 w-[480px] h-64 bg-purple-600/15 rounded-full blur-[100px]"></div>
        <div className="absolute top-[35%] right-1/4 w-[450px] h-64 bg-cyan-500/15 rounded-full blur-[90px]"></div>

        {/* 立体サイバーグリッド床（手前から奥へのパース） */}
        <div
          className="absolute bottom-0 w-[200%] -left-[50%] h-[55vh] aquarium-grid-floor border-t-2 border-cyan-400/50 shadow-[0_0_35px_rgba(0,242,254,0.3)]"
          style={{
            transformOrigin: 'bottom center',
            transform: 'perspective(600px) rotateX(68deg)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)'
          }}
        />
      </div>

      {/* ========================================================= */}
      {/* 2. 前面ヘッダーUI（ENERGY・CREDITS・学習ボタン）           */}
      {/* ========================================================= */}
      <header className="relative z-30 p-3 sm:p-5 md:p-7 flex items-start justify-between w-full pointer-events-none">
        {/* 左上ステータス */}
        <div className="flex flex-col space-y-2 sm:space-y-3 pointer-events-auto">
          {/* ENERGY カード */}
          <div className="glass-card border border-[#00f2fe]/60 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-[0_0_20px_rgba(0,242,254,0.25)] flex flex-col w-44 sm:w-64 md:w-72">
            <div className="flex items-center justify-between text-[11px] sm:text-xs md:text-sm font-black text-cyan-300 tracking-wider mb-1 sm:mb-2 font-mono">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <EnergyHeartIcon />
                <span>ENERGY</span>
              </div>
              <span className="text-[#00f2fe] drop-shadow-[0_0_8px_#00f2fe] text-xs sm:text-base">{energy}%</span>
            </div>
            {/* ネオンプログレスバー */}
            <div className="w-full h-2.5 sm:h-3.5 bg-[#09071c] rounded-full overflow-hidden border border-[#00f2fe]/40 p-0.5">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#00b4d8] to-[#00f2fe] shadow-[0_0_12px_#00f2fe]"
                style={{ width: `${energy}%` }}
              />
            </div>
          </div>

          {/* CREDITS カード */}
          <div className="glass-card border border-[#ff007f]/60 rounded-xl sm:rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2.5 shadow-[0_0_20px_rgba(255,0,127,0.25)] flex items-center justify-between w-36 sm:w-48 md:w-56 font-mono">
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <CreditHexIcon />
              <span className="text-[10px] sm:text-xs md:text-sm font-bold text-pink-300 tracking-wider">CREDITS</span>
            </div>
            <span className="text-sm sm:text-lg md:text-xl font-black text-[#ff80bf] drop-shadow-[0_0_8px_#ff007f]">
              {credits}
            </span>
          </div>
        </div>

        {/* 右上メニュー：単語検索・マイ単語帳 ＆ 単語テスト ＆ 設定ボタン */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 pointer-events-auto">
          {/* > Vocab_Dict() (単語検索＆マイ単語帳) ボタン */}
          <button
            onClick={() => setModalOpen('dict')}
            className="group relative px-2.5 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 glass-card hover:bg-cyan-950/40 border-2 border-[#00f2fe] rounded-xl sm:rounded-2xl shadow-[0_0_16px_rgba(0,242,254,0.3)] active:scale-95 transition-all flex items-center gap-1 sm:gap-2"
          >
            <span className="text-[11px] sm:text-xs md:text-sm font-mono font-black text-[#00f2fe] tracking-wider group-hover:drop-shadow-[0_0_8px_#00f2fe]">
              <span className="hidden sm:inline">&gt; Vocab_Dict()</span>
              <span className="sm:hidden">🔍辞書</span>
            </span>
          </button>

          {/* > Execute_Learn() ボタン */}
          <button
            onClick={() => setModalOpen('study')}
            className="group relative px-2.5 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 glass-card hover:bg-emerald-950/40 border-2 border-[#00ff88] rounded-xl sm:rounded-2xl shadow-[0_0_18px_rgba(0,255,136,0.35)] active:scale-95 transition-all flex items-center gap-1 sm:gap-2"
          >
            <span className="text-[11px] sm:text-xs md:text-sm font-mono font-black text-[#00ff88] tracking-wider group-hover:drop-shadow-[0_0_8px_#00ff88]">
              <span className="hidden sm:inline">&gt; Execute_Learn()</span>
              <span className="sm:hidden">&gt; Learn()</span>
            </span>
          </button>

          {/* 設定ボタン */}
          <button
            onClick={() => setModalOpen('settings')}
            className="p-2 sm:p-2.5 md:p-3 glass-card hover:bg-cyan-950/40 border border-cyan-500/50 hover:border-cyan-400 rounded-xl sm:rounded-2xl shadow-[0_0_12px_rgba(0,242,254,0.2)] active:scale-90 transition-all text-cyan-300"
            title="設定"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
      {/* 3. 中央ステージ（台座・光線コーン・ジンベイザメ本体）        */}
      {/* ========================================================= */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center -mt-2 sm:-mt-4 md:-mt-4">
        <div className="relative flex flex-col items-center">
          
          {/* デジタル吹き出し（セリフ表示） */}
          <div
            className={`transition-all duration-300 transform mb-2 pointer-events-none max-w-[85vw] sm:max-w-md ${
              showSpeech ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'
            }`}
          >
            <div className="relative glass-card border border-[#00f2fe] px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(0,242,254,0.4)] text-xs sm:text-sm font-bold text-cyan-100 font-mono tracking-wide text-center">
              <span className="text-[#ff007f] mr-1.5 font-black">&gt;</span>
              {speech}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-[#00f2fe]"></div>
            </div>
          </div>

          {/* ★ ジンベイザメタップ領域（クリックで目をキュッと閉じて跳ねる！） */}
          <div
            onClick={handlePetClick}
            className={`relative cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 z-30 ${
              isReacting ? 'shark-react' : 'shark-float'
            }`}
            title="タップしてなでなで！"
          >
            <HoloWhaleSharkSprite isReacting={isReacting} />

            {/* 飛び交う泡・パーティクル */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute animate-ping text-lg sm:text-2xl drop-shadow-[0_0_8px_#00f2fe]"
                  style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
                >
                  {p.symbol}
                </div>
              ))}
            </div>
          </div>

          {/* 台座から上へ伸びるホログラム光コーン */}
          <div
            className="absolute -bottom-6 sm:-bottom-6 w-40 sm:w-48 md:w-60 h-36 sm:h-48 bg-gradient-to-t from-[#00f2fe]/45 via-[#00f2fe]/15 to-transparent blur-md pointer-events-none"
            style={{ clipPath: 'polygon(20% 100%, 80% 100%, 100% 0%, 0% 0%)' }}
          />

          {/* 円形ホログラム台座（2段ネオンリング） */}
          <div className="relative -mt-8 sm:-mt-10 md:-mt-12 flex flex-col items-center pointer-events-none">
            {/* 上段リング (シアン発光) */}
            <div className="w-40 h-10 sm:w-52 sm:h-14 md:w-64 rounded-[50%] border-2 sm:border-3 border-[#00f2fe] bg-[#00f2fe]/25 shadow-[0_0_25px_#00f2fe] flex items-center justify-center">
              <div className="w-32 h-6 sm:w-40 sm:h-8 md:w-48 rounded-[50%] border border-cyan-200/60 border-dashed animate-[spin_8s_linear_infinite]"></div>
            </div>
            {/* 下段リング (マゼンタ発光ベース) */}
            <div className="w-48 h-10 -mt-6 sm:w-60 sm:h-14 sm:-mt-9 md:w-76 rounded-[50%] border-2 sm:border-3 border-[#ff007f] bg-[#12082b] shadow-[0_0_30px_rgba(255,0,127,0.45)]"></div>
          </div>

        </div>
      </main>

      {/* ========================================================= */}
      {/* 4. フッターUI（CHARGEボタン・OPTIMIZEボタン）              */}
      {/* ========================================================= */}
      <footer className="relative z-30 p-3 sm:p-5 md:p-8 flex items-center justify-center gap-3 sm:gap-6 md:gap-12 pointer-events-none w-full">
        {/* CHARGE (充電・給餌) ボタン */}
        <button
          onClick={handleCharge}
          className="pointer-events-auto group relative flex-1 max-w-[160px] sm:flex-initial sm:max-w-none px-3.5 sm:px-7 md:px-11 py-2.5 sm:py-3.5 md:py-4 glass-card hover:bg-cyan-950/50 active:scale-95 rounded-xl sm:rounded-2xl border-2 md:border-3 border-[#00f2fe] shadow-[0_0_25px_rgba(0,242,254,0.35)] active:shadow-[0_0_10px_#00f2fe] transition-all flex items-center justify-center sm:justify-start gap-2 sm:gap-3.5"
        >
          <div className="group-hover:rotate-12 transition-transform shrink-0">
            <BatteryChargeIcon />
          </div>
          <div className="text-left font-mono">
            <span className="block text-xs sm:text-sm md:text-base font-black text-[#00f2fe] tracking-wider drop-shadow-[0_0_6px_#00f2fe]">
              CHARGE
            </span>
            <span className="block text-[10px] sm:text-xs font-bold text-cyan-300/80">
              -20 CR
            </span>
          </div>
        </button>

        {/* OPTIMIZE (最適化・遊泳) ボタン */}
        <button
          onClick={handleOptimize}
          className="pointer-events-auto group relative flex-1 max-w-[160px] sm:flex-initial sm:max-w-none px-3.5 sm:px-7 md:px-11 py-2.5 sm:py-3.5 md:py-4 glass-card hover:bg-pink-950/50 active:scale-95 rounded-xl sm:rounded-2xl border-2 md:border-3 border-[#ff007f] shadow-[0_0_25px_rgba(255,0,127,0.35)] active:shadow-[0_0_10px_#ff007f] transition-all flex items-center justify-center sm:justify-start gap-2 sm:gap-3.5"
        >
          <div className="group-hover:animate-spin transition-transform shrink-0">
            <OptimizeDiskIcon />
          </div>
          <div className="text-left font-mono">
            <span className="block text-xs sm:text-sm md:text-base font-black text-[#ff007f] tracking-wider drop-shadow-[0_0_6px_#ff007f]">
              OPTIMIZE
            </span>
            <span className="block text-[10px] sm:text-xs font-bold text-pink-300/80">
              -15 CR
            </span>
          </div>
        </button>
      </footer>

      {/* ========================================================= */}
      {/* 5. 学習モジュール・設定用 モーダル                         */}
      {/* ========================================================= */}
      {modalOpen === 'dict' && (
        <WordDictionaryModal
          onClose={() => setModalOpen(null)}
          onWordSearched={handleWordSearched}
        />
      )}

      {modalOpen === 'study' && (
        <QuizModal
          onClose={() => setModalOpen(null)}
          onQuizComplete={handleQuizComplete}
        />
      )}

      {modalOpen === 'settings' && (
        <SystemConfigModal
          user={user}
          onUserChange={(u) => {
            setUser(u);
            setEnergy(u.energy);
            setCredits(u.points);
          }}
          onClose={() => setModalOpen(null)}
        />
      )}
    </div>
  );
}