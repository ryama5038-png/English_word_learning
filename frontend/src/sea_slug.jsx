import React, { useState, useEffect, useRef } from 'react';
import { authApi, petApi, wordsApi } from './api';
import { WordDictionaryModal, QuizModal, SystemConfigModal, VocabBookModal } from './VocabModals';

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

// --- ホログラムアオウミウシ本体 (鮮やかなサイバーネオンブルーと触角・エラを持つスタイリッシュなウミウシ) ---
export const SeaSlugSprite = ({ isReacting }) => {
  return (
    <div className="relative w-56 h-52 sm:w-72 sm:h-64 md:w-80 md:h-72 flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 320 260" className="w-full h-full overflow-visible">
        <defs>
          {/* アオウミウシ本体の鮮やかなサイバーネオンブルーグラデーション */}
          <linearGradient id="slugBodyGrad" x1="15%" y1="15%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95" />
            <stop offset="28%" stopColor="#00f2fe" stopOpacity="0.88" />
            <stop offset="68%" stopColor="#0284c7" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.85" />
          </linearGradient>

          {/* 触角・二次鰓（エラ）のネオンオレンジ＆ゴールドグラデーション */}
          <linearGradient id="slugAccentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="35%" stopColor="#fde047" stopOpacity="0.95" />
            <stop offset="80%" stopColor="#f97316" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ff007f" stopOpacity="0.85" />
          </linearGradient>

          {/* ネオングローフィルター */}
          <filter id="slugNeonGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="5.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. 回転するサイバーオービットリング (背後) */}
        <g className="animate-[spin_14s_linear_infinite]" style={{ transformOrigin: '160px 135px' }}>
          <ellipse
            cx="160"
            cy="135"
            rx="132"
            ry="40"
            fill="none"
            stroke="#00f2fe"
            strokeWidth="1.8"
            strokeDasharray="4 6"
            opacity="0.65"
            transform="rotate(-14 160 135)"
          />
          <ellipse
            cx="160"
            cy="135"
            rx="116"
            ry="32"
            fill="none"
            stroke="#fde047"
            strokeWidth="1.2"
            strokeDasharray="10 8"
            opacity="0.45"
            transform="rotate(16 160 135)"
          />
        </g>

        {/* 2. アオウミウシ本体グループ（しなやかな遊泳・波動アニメーション） */}
        <g className="seaslug-swim-group">
          {/* 背部後方の二次鰓（エラの花びら状の突起・ゆらゆら揺れる） */}
          <g className="seaslug-gills" style={{ transformOrigin: '212px 115px' }}>
            <path
              d="M 206 116 C 202 88, 214 74, 220 92 C 224 72, 238 78, 230 100 C 246 88, 252 104, 232 116 C 248 114, 244 128, 224 124 Z"
              fill="url(#slugAccentGrad)"
              stroke="#fef08a"
              strokeWidth="1.8"
              filter="url(#slugNeonGlow)"
            />
            <circle cx="218" cy="84" r="2.2" fill="#ffffff" />
            <circle cx="232" cy="86" r="2.2" fill="#ffffff" />
            <circle cx="242" cy="98" r="2" fill="#ffffff" />
          </g>

          {/* 頭部の2本の触角 (Rhinophores) */}
          <g className="seaslug-antennas" style={{ transformOrigin: '100px 92px' }}>
            {/* 左触角 */}
            <path
              d="M 88 94 C 78 66, 68 50, 78 44 C 88 40, 96 64, 98 90 Z"
              fill="url(#slugAccentGrad)"
              stroke="#fef08a"
              strokeWidth="1.8"
              filter="url(#slugNeonGlow)"
            />
            <path d="M 76 56 L 86 58 M 78 66 L 90 68 M 82 76 L 93 77" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />

            {/* 右触角 */}
            <path
              d="M 112 90 C 112 62, 118 44, 128 44 C 138 46, 130 68, 122 92 Z"
              fill="url(#slugAccentGrad)"
              stroke="#fef08a"
              strokeWidth="1.8"
              filter="url(#slugNeonGlow)"
            />
            <path d="M 118 55 L 129 57 M 116 65 L 127 67 M 115 75 L 125 77" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
          </g>

          {/* スタイリッシュな流線型ボディ＋波打つ外套膜フリル（黄色の縁取り） */}
          <path
            d="M 64 134
               C 52 114, 68 84, 104 82
               C 142 80, 184 96, 232 114
               C 254 122, 268 134, 260 144
               C 248 158, 218 164, 186 160
               C 156 156, 138 168, 108 164
               C 80 160, 72 148, 64 134 Z"
            fill="url(#slugBodyGrad)"
            stroke="#fde047"
            strokeWidth="3"
            filter="url(#slugNeonGlow)"
          />

          {/* 外套膜の内側シアンネオン縁取り */}
          <path
            d="M 70 132
               C 60 116, 74 90, 104 88
               C 140 86, 180 102, 226 118
               C 246 126, 256 134, 248 142
               C 236 152, 210 156, 182 152
               C 154 148, 136 160, 108 156
               C 84 152, 76 142, 70 132 Z"
            fill="none"
            stroke="#80f7ff"
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* アオウミウシ特有の背面の黄色＆黒・ネオンストライプ模様 */}
          <path
            d="M 102 90 Q 148 96 196 112"
            fill="none"
            stroke="#fde047"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="drop-shadow(0 0 5px #fde047)"
          />
          <path
            d="M 118 106 Q 160 112 204 126"
            fill="none"
            stroke="#021d2d"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M 118 106 Q 160 112 204 126"
            fill="none"
            stroke="#00f2fe"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
          {/* 発光サイバースポット */}
          <g fill="#fde047" opacity="0.9">
            <circle cx="142" cy="122" r="3" />
            <circle cx="166" cy="126" r="3.2" />
            <circle cx="190" cy="132" r="2.8" />
            <circle cx="212" cy="136" r="2.4" />
          </g>

          {/* 頭部の光沢ハイライト */}
          <ellipse cx="94" cy="100" rx="12" ry="5.5" fill="#ffffff" opacity="0.75" transform="rotate(-18 94 100)" />

          {/* 3. アオウミウシの表情 */}
          {isReacting ? (
            // ★ リアクション時：目をキュッと閉じた (^ ^) 笑顔＋発光ほっぺ
            <g className="transition-all duration-300">
              <path
                d="M 76 122 Q 83 111 90 122"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.8"
                strokeLinecap="round"
                filter="drop-shadow(0 0 6px #00ffff)"
              />
              <path
                d="M 108 120 Q 115 109 122 120"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.8"
                strokeLinecap="round"
                filter="drop-shadow(0 0 6px #00ffff)"
              />
              <path
                d="M 91 129 Q 98 137 105 129"
                fill="none"
                stroke="#fde047"
                strokeWidth="3.2"
                strokeLinecap="round"
                filter="drop-shadow(0 0 5px #fde047)"
              />
              <ellipse cx="72" cy="130" rx="6" ry="3.5" fill="#ff007f" opacity="0.9" filter="drop-shadow(0 0 5px #ff007f)" />
              <ellipse cx="126" cy="128" rx="6" ry="3.5" fill="#ff007f" opacity="0.9" filter="drop-shadow(0 0 5px #ff007f)" />
            </g>
          ) : (
            // 通常時：クールで可愛いサイバーアイ
            <g className="transition-all duration-300">
              <circle cx="83" cy="121" r="6.5" fill="#041022" stroke="#ffffff" strokeWidth="1.8" />
              <circle cx="81" cy="119" r="2.4" fill="#00f2fe" />
              <circle cx="115" cy="119" r="6.5" fill="#041022" stroke="#ffffff" strokeWidth="1.8" />
              <circle cx="113" cy="117" r="2.4" fill="#00f2fe" />
              <path
                d="M 93 128 Q 98 133 103 128"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <ellipse cx="73" cy="129" rx="5" ry="2.8" fill="#ff007f" opacity="0.55" />
              <ellipse cx="125" cy="127" rx="5" ry="2.8" fill="#ff007f" opacity="0.55" />
            </g>
          )}
        </g>

        {/* 4. 前面オービットリングと輝く粒子 */}
        <g className="animate-[spin_10s_linear_infinite_reverse]" style={{ transformOrigin: '160px 135px' }}>
          <ellipse
            cx="160"
            cy="135"
            rx="142"
            ry="44"
            fill="none"
            stroke="#80f7ff"
            strokeWidth="2"
            strokeDasharray="16 10 4 8"
            opacity="0.8"
            transform="rotate(-12 160 135)"
          />
          <circle cx="298" cy="108" r="4" fill="#fde047" filter="url(#slugNeonGlow)" />
          <circle cx="22" cy="162" r="3.2" fill="#00f2fe" filter="url(#slugNeonGlow)" />
        </g>
      </svg>
    </div>
  );
};

// --- アニメーション＆アクアリウムスタイル ---
const SeaSlugAquariumStyles = () => (
  <style>{`
    /* アオウミウシのしなやかな水中グライド遊泳 */
    @keyframes slugGlide {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      35% { transform: translateY(-14px) rotate(-2deg); }
      70% { transform: translateY(6px) rotate(1.5deg); }
    }
    /* 触角とエラのゆらめき */
    @keyframes slugAntennaSway {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(-8deg) skewX(-4deg); }
    }
    @keyframes slugGillsFlutter {
      0%, 100% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.08) rotate(6deg); }
    }
    /* タップ時の大喜びジャンプ */
    @keyframes slugJoyJump {
      0% { transform: scale(1, 1) translateY(0); }
      20% { transform: scale(1.16, 0.84) translateY(12px); }
      45% { transform: scale(0.92, 1.2) translateY(-40px) rotate(-3deg); }
      65% { transform: scale(1.06, 0.95) translateY(-14px) rotate(2deg); }
      85% { transform: scale(0.98, 1.02) translateY(0); }
      100% { transform: scale(1, 1) translateY(0); }
    }

    .seaslug-float { animation: slugGlide 4.8s ease-in-out infinite; }
    .seaslug-react { animation: slugJoyJump 0.85s cubic-bezier(0.28, 0.84, 0.42, 1); }
    .seaslug-antennas { animation: slugAntennaSway 2.4s ease-in-out infinite; }
    .seaslug-gills { animation: slugGillsFlutter 2.1s ease-in-out infinite; }

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

export default function SeaSlug() {
  const [user, setUser] = useState(null);
  const [energy, setEnergy] = useState(95);
  const [credits, setCredits] = useState(230);
  const [isReacting, setIsReacting] = useState(false);
  const [speech, setSpeech] = useState("マスター、おかえりなさい！⚡");
  const [showSpeech, setShowSpeech] = useState(true);
  const [particles, setParticles] = useState([]);
  const [modalOpen, setModalOpen] = useState(null);
  const lastWordIdRef = useRef(null);
  const reviewWordsRef = useRef([]);
  const reviewIndexRef = useRef(0);

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
            `ゆらゆら…放置中にエネルギーが -${u.decayed_amount}% 減っちゃったよ…🫧`
          );
        }
      })
      .catch(() => {});
  }, []);

  // 優先順位付き復習単語リスト（間違えた単語 → しおり付近/マイ単語帳 → 正解した単語）を取得
  useEffect(() => {
    if (modalOpen !== null) return;
    wordsApi
      .getRecent()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          reviewWordsRef.current = list;
          reviewIndexRef.current = 0;
        }
      })
      .catch(() => {});
  }, [modalOpen]);

  // 定期的な無意識復習（APIから受け取った単語リストの配列順にローテーション＋エネルギー残量に応じた口調変化）
  useEffect(() => {
    const timer = setInterval(async () => {
      if (isReacting) return;
      try {
        if (reviewWordsRef.current.length === 0) {
          const list = await wordsApi.getRecent();
          if (Array.isArray(list) && list.length > 0) {
            reviewWordsRef.current = list;
            reviewIndexRef.current = 0;
          }
        }

        const words = reviewWordsRef.current;
        if (words.length > 0) {
          const idx = reviewIndexRef.current % words.length;
          const targetWord = words[idx];
          reviewIndexRef.current = (idx + 1) % words.length;
          lastWordIdRef.current = targetWord.id;

          const posParts = [
            targetWord.noun_meaning ? `【名】${targetWord.noun_meaning}` : null,
            targetWord.verb_meaning ? `【動】${targetWord.verb_meaning}` : null,
            targetWord.adj_meaning ? `【形】${targetWord.adj_meaning}` : null,
            targetWord.adv_meaning ? `【副】${targetWord.adv_meaning}` : null,
          ].filter(Boolean);
          const posSummary = posParts.length > 0 ? posParts.join(' / ') : '意味未登録';

          let templates;
          if (energy >= 70) {
            templates = [
              `「${targetWord.word_spell}」は ${posSummary} って意味だよ！⚡ バッチリ覚えちゃおう♪`,
              `復習タイム！✨「${targetWord.word_spell}」＝ ${posSummary} だよ！エネルギー満タンで絶好調！`,
              `ねぇマスター！「${targetWord.word_spell}」の意味、覚えてる？ ${posSummary} だよ♪`,
              `「${targetWord.word_spell}」(${posSummary})！品詞の違いにも気をつけてね⚡`,
            ];
          } else if (energy >= 30) {
            templates = [
              `「${targetWord.word_spell}」は ${posSummary} って意味だよ💭 そろそろ少しお腹が空いてきたかも…`,
              `復習メモ：「${targetWord.word_spell}」＝ ${posSummary} だよ。テストでポイントを稼いでチャージしてね。`,
              `「${targetWord.word_spell}」の意味は ${posSummary} … もう少しエネルギーがあると嬉しいな⚡`,
            ];
          } else {
            templates = [
              `うぅ…エネルギー切れそう…💦「${targetWord.word_spell}」は ${posSummary} …はやくCHARGEしてぇ…`,
              `⚠️ バッテリー低下中…「${targetWord.word_spell}」＝ ${posSummary} …力が…出ないよ…`,
              `システム衰弱中…💦「${targetWord.word_spell}」(${posSummary})…テストを解いて助けてマスター…`,
            ];
          }

          setSpeech(templates[idx % templates.length]);
          setShowSpeech(true);
          return;
        }

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
          "ネオンブルーのボディ、サイバー空間に映えるでしょ？💎",
          "触角アンテナで重要単語をキャッチするよ✨",
        ];
        setSpeech(idleTalks[Math.floor(Math.random() * idleTalks.length)]);
        setShowSpeech(true);
      }
    }, 7500);
    return () => clearInterval(timer);
  }, [isReacting, energy]);

  // パーティクル生成ヘルパー
  const triggerParticles = () => {
    const symbols = ['🫧', '✨', '⚡', '💖', '⭐', '💎'];
    const newItems = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 180,
      y: (Math.random() - 0.5) * 70 - 30,
      symbol: symbols[Math.floor(Math.random() * symbols.length)]
    }));
    setParticles(newItems);
    setTimeout(() => setParticles([]), 1200);
  };

  // ★ アオウミウシタップ時のランダムリアクション＋直近検索単語の復習
  const handlePetClick = async (e) => {
    e.stopPropagation();
    if (isReacting) return;

    setIsReacting(true);
    triggerParticles();

    try {
      const data = await petApi.getIdleTalk(lastWordIdRef.current);
      if (data && data.speech) {
        setSpeech(`キラキラ〜💎 ${data.speech}`);
        if (data.word_id) lastWordIdRef.current = data.word_id;
      }
    } catch {
      const reactionQuotes = [
        "きゅ〜ん！マスターだいすきっ！♡",
        "ゆらゆら〜！くすぐったいよ⚡",
        "触角センサー感度MAX！今日も一緒に頑張ろう✨",
      ];
      setSpeech(reactionQuotes[Math.floor(Math.random() * reactionQuotes.length)]);
    }
    setShowSpeech(true);

    setTimeout(() => {
      setIsReacting(false);
    }, 850);
  };

  // CHARGE (充電・給餌)
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
    setSpeech(`「${word.word_spell}」(${pos}) を覚えたよ！一緒に復習しようね💎`);
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
      <SeaSlugAquariumStyles />

      {/* ========================================================= */}
      {/* 1. 背景環境レイヤー（深海アクアリウム・サンゴ・パイプ・気泡） */}
      {/* ========================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
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

        {/* 立体サイバーグリッド床 */}
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

        {/* 右上メニュー：単語検索・単語帳モード ＆ 単語テスト ＆ 設定ボタン */}
        <div className="flex flex-wrap justify-end items-center gap-1.5 sm:gap-2.5 max-w-[180px] sm:max-w-none pointer-events-auto">
          <button
            onClick={() => setModalOpen('book')}
            className="group relative px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2.5 md:py-3 glass-card hover:bg-pink-950/40 border-2 border-[#ff007f] rounded-xl sm:rounded-2xl shadow-[0_0_16px_rgba(255,0,127,0.3)] active:scale-95 transition-all flex items-center gap-1 sm:gap-2"
          >
            <span className="text-[11px] sm:text-xs md:text-sm font-mono font-black text-[#ff80bf] tracking-wider group-hover:drop-shadow-[0_0_8px_#ff007f]">
              <span className="hidden sm:inline">&gt; Vocab_Book()</span>
              <span className="sm:hidden">📕単語帳</span>
            </span>
          </button>

          <button
            onClick={() => setModalOpen('dict')}
            className="group relative px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2.5 md:py-3 glass-card hover:bg-cyan-950/40 border-2 border-[#00f2fe] rounded-xl sm:rounded-2xl shadow-[0_0_16px_rgba(0,242,254,0.3)] active:scale-95 transition-all flex items-center gap-1 sm:gap-2"
          >
            <span className="text-[11px] sm:text-xs md:text-sm font-mono font-black text-[#00f2fe] tracking-wider group-hover:drop-shadow-[0_0_8px_#00f2fe]">
              <span className="hidden sm:inline">&gt; Vocab_Dict()</span>
              <span className="sm:hidden">🔍辞書</span>
            </span>
          </button>

          <button
            onClick={() => setModalOpen('study')}
            className="group relative px-2.5 sm:px-5 md:px-6 py-1.5 sm:py-2.5 md:py-3 glass-card hover:bg-emerald-950/40 border-2 border-[#00ff88] rounded-xl sm:rounded-2xl shadow-[0_0_18px_rgba(0,255,136,0.35)] active:scale-95 transition-all flex items-center gap-1 sm:gap-2"
          >
            <span className="text-[11px] sm:text-xs md:text-sm font-mono font-black text-[#00ff88] tracking-wider group-hover:drop-shadow-[0_0_8px_#00ff88]">
              <span className="hidden sm:inline">&gt; Execute_Learn()</span>
              <span className="sm:hidden">📝テスト</span>
            </span>
          </button>

          <button
            onClick={() => setModalOpen('settings')}
            className="p-1.5 sm:p-2.5 md:p-3 glass-card hover:bg-cyan-950/40 border border-cyan-500/50 hover:border-cyan-400 rounded-xl sm:rounded-2xl shadow-[0_0_12px_rgba(0,242,254,0.2)] active:scale-90 transition-all text-cyan-300"
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
      {/* 3. 中央ステージ（台座・光線コーン・アオウミウシ本体）        */}
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

          {/* ★ アオウミウシタップ領域 */}
          <div
            onClick={handlePetClick}
            className={`relative cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 z-30 ${
              isReacting ? 'seaslug-react' : 'seaslug-float'
            }`}
            title="タップしてなでなで！"
          >
            <SeaSlugSprite isReacting={isReacting} />

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
            <div className="w-40 h-10 sm:w-52 sm:h-14 md:w-64 rounded-[50%] border-2 sm:border-3 border-[#00f2fe] bg-[#00f2fe]/25 shadow-[0_0_25px_#00f2fe] flex items-center justify-center">
              <div className="w-32 h-6 sm:w-40 sm:h-8 md:w-48 rounded-[50%] border border-cyan-200/60 border-dashed animate-[spin_8s_linear_infinite]"></div>
            </div>
            <div className="w-48 h-10 -mt-6 sm:w-60 sm:h-14 sm:-mt-9 md:w-76 rounded-[50%] border-2 sm:border-3 border-[#ff007f] bg-[#12082b] shadow-[0_0_30px_rgba(255,0,127,0.45)]"></div>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 4. フッターUI（CHARGEボタン・OPTIMIZEボタン）              */}
      {/* ========================================================= */}
      <footer className="relative z-30 p-3 sm:p-5 md:p-8 flex items-center justify-center gap-3 sm:gap-6 md:gap-12 pointer-events-none w-full">
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
      {modalOpen === 'book' && (
        <VocabBookModal
          onClose={() => setModalOpen(null)}
          onWordSearched={handleWordSearched}
        />
      )}

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
