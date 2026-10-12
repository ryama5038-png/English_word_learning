import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Custom inline SVG icons for consistent cozy/pixel aesthetic without external dependencies
const HeartIcon = ({ className = "w-6 h-6", fill = "#ff5b79" }) => (
  <svg className={className} viewBox="0 0 24 24" fill={fill} stroke="#d62246" strokeWidth="1.5">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CoinIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
    <circle cx="12" cy="12" r="7" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
    <path d="M12 7.5v9M9.5 9.5h5a1.5 1.5 0 010 3h-5a1.5 1.5 0 000 3h5" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const AcornIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M7 8c0-2 2.5-4 5-4s5 2 5 4v1H7V8z" fill="#78350F" />
    <path d="M6 9h12a1 1 0 011 1c0 6-3 10-7 11-4-1-7-5-7-11a1 1 0 011-1z" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
    <path d="M12 2v2" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 9a1 1 0 011-1h6a1 1 0 011 1v1H8V9z" fill="#92400E" />
  </svg>
);

const BallIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" fill="#60A5FA" stroke="#2563EB" strokeWidth="1.5" />
    <path d="M12 3a9 9 0 000 18" fill="#F87171" stroke="#DC2626" strokeWidth="1.5" />
    <path d="M3 12a9 9 0 0018 0" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
  </svg>
);

const PawIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#B45309">
    <ellipse cx="6" cy="7.5" rx="2" ry="3" transform="rotate(-15 6 7.5)" />
    <ellipse cx="10.5" cy="5.5" rx="2" ry="3" />
    <ellipse cx="15" cy="6" rx="2" ry="3" transform="rotate(10 15 6)" />
    <ellipse cx="19" cy="8.5" rx="2" ry="3" transform="rotate(25 19 8.5)" />
    <path d="M7.5 13.5c-1.5 2-1 4.5 1 5.5 2.5 1.2 6.5 1.2 8.5-.2 1.8-1.2 2-3.8.5-5.5-2.2-2.5-7.8-2.3-10 .2z" />
  </svg>
);

const SettingsIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#78350F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" fill="#FDE68A" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// An adorable rounded fluffy pet creature matching the reference image's vibes
const PetSprite = ({ isReacting, reactionType }) => {
  return (
    <div className={`relative w-44 h-48 sm:w-56 sm:h-60 transition-transform ${isReacting ? 'scale-110' : ''}`}>
      <svg viewBox="0 0 200 220" className="w-full h-full drop-shadow-xl select-none" style={{ filter: 'drop-shadow(0 14px 10px rgba(78, 52, 22, 0.25))' }}>
        {/* Soft shadow on rug */}
        <ellipse cx="100" cy="205" rx="55" ry="12" fill="rgba(80, 50, 20, 0.2)" />
        
        {/* Tail */}
        <path d="M145 155 C175 145, 185 170, 165 185 C145 190, 138 175, 145 155 Z" fill="#FCE7F3" stroke="#9D174D" strokeWidth="3" />
        
        {/* Left Foot */}
        <ellipse cx="70" cy="192" rx="14" ry="10" fill="#FCE7F3" stroke="#9D174D" strokeWidth="3" />
        {/* Right Foot */}
        <ellipse cx="130" cy="192" rx="14" ry="10" fill="#FCE7F3" stroke="#9D174D" strokeWidth="3" />

        {/* Pet Main Body (Soft fluffy pear shape) */}
        <path
          d="M 100 45 
             C 125 45, 155 60, 160 95
             C 165 130, 165 175, 148 190
             C 130 202, 70 202, 52 190
             C 35 175, 35 130, 40 95
             C 45 60, 75 45, 100 45 Z"
          fill="#FFF1F2"
          stroke="#9D174D"
          strokeWidth="3.5"
        />

        {/* Left Ear */}
        <path d="M 52 65 C 40 40, 60 25, 75 45 Z" fill="#FCE7F3" stroke="#9D174D" strokeWidth="3" />
        <path d="M 56 60 C 48 45, 60 38, 69 48 Z" fill="#F472B6" />

        {/* Right Ear */}
        <path d="M 148 65 C 160 40, 140 25, 125 45 Z" fill="#FCE7F3" stroke="#9D174D" strokeWidth="3" />
        <path d="M 144 60 C 152 45, 140 38, 131 48 Z" fill="#F472B6" />

        {/* Fluffy head tuft */}
        <path d="M 92 46 C 96 35, 104 35, 108 46 C 114 39, 120 42, 116 50 Z" fill="#FFF1F2" stroke="#9D174D" strokeWidth="2.5" />

        {/* Tummy Patch */}
        <ellipse cx="100" cy="140" rx="38" ry="42" fill="#FFFFFF" opacity="0.9" />

        {/* Cheeks blush */}
        <ellipse cx="64" cy="120" rx="10" ry="6" fill="#F472B6" opacity="0.75" />
        <ellipse cx="136" cy="120" rx="10" ry="6" fill="#F472B6" opacity="0.75" />

        {/* Eyes (Sparkly cute eyes) */}
        {reactionType === 'happy' ? (
          // Happy smiling curve eyes (^ ^)
          <g stroke="#831843" strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M 68 112 Q 76 100 84 112" />
            <path d="M 116 112 Q 124 100 132 112" />
          </g>
        ) : (
          // Round big starry eyes
          <g>
            <circle cx="76" cy="108" r="9" fill="#4A044E" />
            <circle cx="73" cy="104" r="3.5" fill="#FFFFFF" />
            <circle cx="78" cy="111" r="1.5" fill="#FFFFFF" />

            <circle cx="124" cy="108" r="9" fill="#4A044E" />
            <circle cx="121" cy="104" r="3.5" fill="#FFFFFF" />
            <circle cx="126" cy="111" r="1.5" fill="#FFFFFF" />
          </g>
        )}

        {/* Nose & Mouth */}
        <path d="M 98 114 L 102 114" stroke="#831843" strokeWidth="2.5" strokeLinecap="round" />
        {reactionType === 'happy' ? (
          <path d="M 93 118 Q 100 128 107 118" fill="#F43F5E" stroke="#831843" strokeWidth="2.5" strokeLinecap="round" />
        ) : (
          <path d="M 94 117 Q 97 122 100 118 Q 103 122 106 117" fill="none" stroke="#831843" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Small Hands / Paws */}
        <ellipse cx="50" cy="138" rx="8" ry="12" fill="#FCE7F3" stroke="#9D174D" strokeWidth="2.5" transform="rotate(20 50 138)" />
        <ellipse cx="150" cy="138" rx="8" ry="12" fill="#FCE7F3" stroke="#9D174D" strokeWidth="2.5" transform="rotate(-20 150 138)" />
      </svg>
    </div>
  );
};

const CustomStyles = () => (
  <style>{`
    @keyframes yurayura {
      0% {
        transform: translateY(0px) rotate(0deg) scale(1);
      }
      25% {
        transform: translateY(-8px) rotate(-2.5deg) scale(1.01);
      }
      50% {
        transform: translateY(-12px) rotate(0deg) scale(1.02);
      }
      75% {
        transform: translateY(-6px) rotate(2.5deg) scale(1.01);
      }
      100% {
        transform: translateY(0px) rotate(0deg) scale(1);
      }
    }

    @keyframes jumpJoy {
      0% { transform: scale(1, 1) translateY(0); }
      20% { transform: scale(1.2, 0.8) translateY(10px); }
      45% { transform: scale(0.9, 1.2) translateY(-40px) rotate(-4deg); }
      65% { transform: scale(1.05, 0.95) translateY(-20px) rotate(3deg); }
      85% { transform: scale(0.98, 1.02) translateY(0); }
      100% { transform: scale(1, 1) translateY(0); }
    }

    @keyframes floatParticle {
      0% {
        opacity: 0;
        transform: translateY(0) scale(0.6) rotate(-10deg);
      }
      25% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translateY(-70px) scale(1.2) rotate(15deg);
      }
    }

    @keyframes ripplePulse {
      0% { transform: scale(0.95); opacity: 0.6; }
      50% { transform: scale(1.05); opacity: 0.2; }
      100% { transform: scale(0.95); opacity: 0.6; }
    }

    .yurayura-idle {
      animation: yurayura 3.8s ease-in-out infinite;
      transform-origin: bottom center;
    }

    .pet-reaction-jump {
      animation: jumpJoy 0.8s cubic-bezier(0.28, 0.84, 0.42, 1);
      transform-origin: bottom center;
    }

    .particle-float {
      animation: floatParticle 1.6s ease-out forwards;
    }

    .soft-rug-shadow {
      animation: ripplePulse 3.8s ease-in-out infinite;
    }
  `}</style>
);

export default function Home() {
  // Game states
  const [affection, setAffection] = useState(85); // 0 to 100%
  const [points, setPoints] = useState(120);       // Currency earned from study
  const [isReacting, setIsReacting] = useState(false);
  const [reactionType, setReactionType] = useState('idle'); // 'idle' | 'happy'
  const [particles, setParticles] = useState([]);
  const [petMessage, setPetMessage] = useState("きょうもべんきょうがんばろう！");
  const [showMessage, setShowMessage] = useState(true);
  const [modalOpen, setModalOpen] = useState(null); // 'settings' | 'shop' | 'study'

  // Periodic random idle messages
  useEffect(() => {
    const idleQuotes = [
      "きょうもべんきょうがんばろう！",
      "なでなでして〜！",
      "えさをたべるとげんきがでるよ♪",
      "ずっといっしょにいてね！",
      "ポヨンポヨン〜♪",
      "よう南出"
    ];
    const timer = setInterval(() => {
      if (!isReacting) {
        const randomQuote = idleQuotes[Math.floor(Math.random() * idleQuotes.length)];
        setPetMessage(randomQuote);
        setShowMessage(true);
      }
    }, 9000);
    return () => clearInterval(timer);
  }, [isReacting]);

  // Spawn floating particle effect helper
  const spawnParticles = (type, count = 3) => {
    const newItems = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      type: type, // 'heart' | 'note' | 'points'
      x: (Math.random() - 0.5) * 120, // offset
      y: (Math.random() - 0.5) * 30,
    }));
    setParticles((prev) => [...prev, ...newItems]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newItems.find((n) => n.id === p.id)));
    }, 1600);
  };

  // Trigger pet reaction animation
  const triggerPetJoy = (message, particleType = 'heart') => {
    setIsReacting(true);
    setReactionType('happy');
    setPetMessage(message);
    setShowMessage(true);
    spawnParticles(particleType, 4);

    setTimeout(() => {
      setIsReacting(false);
      setReactionType('idle');
    }, 850);
  };

  // Action: えさをあげる (Feed)
  const handleFeed = () => {
    const cost = 20;
    if (points < cost) {
      setPetMessage("ポイントがたりないよ...べんきょうしよう！");
      setShowMessage(true);
      return;
    }
    setPoints((p) => p - cost);
    setAffection((a) => Math.min(100, a + 8));
    triggerPetJoy("もぐもぐ！おいしい〜！♡", "heart");
  };

  // Action: おもちゃで遊ぶ (Play)
  const handlePlay = () => {
    const cost = 15;
    if (points < cost) {
      setPetMessage("ポイントがたりないよ...べんきょうしよう！");
      setShowMessage(true);
      return;
    }
    setPoints((p) => p - cost);
    setAffection((a) => Math.min(100, a + 5));
    triggerPetJoy("たのしいっ！わーい！♪", "note");
  };

  // Action: 直接ペットをタップする
  const handlePetClick = () => {
    const taps = ["くすぐったいよ！", "だいすき！♡", "もっとあそぼ！", "なでなで〜♪", "よう、南出！"];
    const text = taps[Math.floor(Math.random() * taps.length)];
    triggerPetJoy(text, "heart");
  };

  // Action: 学習（ポイント獲得シミュレーション）
  const handleSolveQuiz = (earnedPts) => {
    setPoints((p) => p + earnedPts);
    setModalOpen(null);
    triggerPetJoy(`問題正解！ +${earnedPts}Pts ゲット！`, 'note');
  };

  return (
    <div className="relative w-full min-h-screen bg-[#654321] flex items-center justify-center p-2 sm:p-4 overflow-hidden font-sans select-none">
      <CustomStyles />

      {/* Main Container styled like a warm illustrated game viewport */}
      <div className="relative w-full max-w-4xl aspect-[16/10] min-h-[580px] max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border-4 sm:border-8 border-[#5b3719] bg-[#E8BC7E] flex flex-col justify-between">
        
        {/* --- Background Illustration (Room with Window, Woods, Bed, Teddy) --- */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Outdoor green forest through window / opening */}
          <div className="absolute top-0 inset-x-0 h-3/5 bg-gradient-to-b from-[#8fd37c] to-[#aae49a]">
            {/* Distant trees silhouettes */}
            <div className="absolute -bottom-4 inset-x-0 flex justify-around opacity-70">
              <div className="w-48 h-56 bg-[#63a854] rounded-t-full"></div>
              <div className="w-64 h-64 bg-[#518f43] rounded-t-full -ml-16"></div>
              <div className="w-56 h-60 bg-[#72ba62] rounded-t-full -ml-10"></div>
              <div className="w-64 h-72 bg-[#4c873f] rounded-t-full"></div>
            </div>
            {/* Big wooden tree trunk frame on left */}
            <div className="absolute top-0 left-0 w-32 sm:w-48 h-full bg-[#8c5225] border-r-4 border-[#5b3719] rounded-br-[60px]">
              <div className="w-12 h-16 bg-[#6a3c17] rounded-full mx-auto mt-24 opacity-60"></div>
            </div>
          </div>

          {/* Wooden Floor (Bottom 45%) */}
          <div className="absolute bottom-0 inset-x-0 h-[45%] bg-[#D79A59] border-t-4 border-[#8C5225]">
            {/* Wooden floor planks lines */}
            <div className="w-full h-full opacity-35 bg-[repeating-linear-gradient(90deg,#8C5225_0px,#8C5225_3px,transparent_3px,transparent_140px)]"></div>
          </div>

          {/* Oval Green Rug in the center */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 sm:w-[480px] h-32 sm:h-44 bg-[#C8DE85] border-4 border-[#8AA84B] rounded-[50%] soft-rug-shadow">
            <div className="absolute inset-3 border-2 border-dashed border-[#A7C860] rounded-[50%]"></div>
          </div>

          {/* Left Props: Teddy Bear & Toy Block */}
          <div className="absolute bottom-16 left-6 sm:left-14 flex items-end space-x-2">
            {/* Teddy bear */}
            <div className="relative w-20 h-24 sm:w-28 sm:h-32 bg-[#D97706] rounded-t-full border-4 border-[#92400E] shadow-md">
              {/* Ears */}
              <div className="absolute -top-3 left-1 w-7 h-7 bg-[#B45309] rounded-full border-2 border-[#78350F]"></div>
              <div className="absolute -top-3 right-1 w-7 h-7 bg-[#B45309] rounded-full border-2 border-[#78350F]"></div>
              {/* Snout */}
              <div className="absolute top-7 left-1/2 -translate-x-1/2 w-10 h-8 bg-[#FDE68A] rounded-full border border-[#92400E] flex items-center justify-center">
                <div className="w-3 h-2 bg-[#451A03] rounded-full"></div>
              </div>
              {/* Eyes */}
              <div className="absolute top-6 left-5 w-2.5 h-2.5 bg-[#451A03] rounded-full"></div>
              <div className="absolute top-6 right-5 w-2.5 h-2.5 bg-[#451A03] rounded-full"></div>
              {/* Tummy */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-14 h-14 bg-[#FDE68A] rounded-full opacity-60"></div>
            </div>
            {/* Toy Block */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#3B82F6] border-4 border-[#1D4ED8] rounded-lg shadow flex items-center justify-center text-white font-black text-lg">
              Z
            </div>
          </div>

          {/* Right Props: Wooden Cozy Bed */}
          <div className="absolute bottom-20 right-2 sm:right-6 w-36 sm:w-56 h-36 bg-[#A16207] border-4 border-[#713F12] rounded-t-xl shadow-lg">
            {/* Headboard */}
            <div className="absolute -top-10 inset-x-0 h-10 bg-[#854D0E] border-4 border-[#713F12] rounded-t-lg"></div>
            {/* Mattress & Sheet */}
            <div className="absolute top-4 inset-x-2 bottom-2 bg-[#FEF3C7] border-2 border-[#D97706] rounded flex flex-col justify-between p-2">
              {/* Pillow */}
              <div className="w-16 sm:w-24 h-8 bg-white border-2 border-stone-300 rounded-lg shadow-sm"></div>
              {/* Red Cozy Blanket */}
              <div className="w-full h-14 sm:h-16 bg-[#F87171] border-2 border-[#DC2626] rounded"></div>
            </div>
          </div>
        </div>

        {}
        {/* Top Header UI */}
        <header className="relative z-10 p-3 sm:p-5 flex items-start justify-between w-full">
          {/* Left Column: Affection Progress Bar & Points */}
          <div className="flex flex-col space-y-2.5">
            {/* Affection (なつき度) Card */}
            <div className="bg-[#FFFDF7]/95 backdrop-blur-sm border-2 sm:border-3 border-[#78350F] rounded-2xl px-3.5 py-2 shadow-lg flex flex-col w-52 sm:w-64">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#78350F] mb-1">
                <span className="flex items-center gap-1.5">
                  <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff5b79]" />
                  <span>なつき度</span>
                </span>
                <span className="font-extrabold text-[#9D174D]">{affection}%</span>
              </div>
              {/* Progress bar container */}
              <div className="w-full h-3 sm:h-3.5 bg-[#FDE2E4] rounded-full overflow-hidden border border-[#9D174D]/30 p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#FF758F] to-[#FF4D6D] shadow-inner"
                  style={{ width: `${affection}%` }}
                />
              </div>
            </div>

            {/* Points (ポイント) Card */}
            <div className="bg-[#FFFDF7]/95 backdrop-blur-sm border-2 sm:border-3 border-[#78350F] rounded-2xl px-3.5 py-2 shadow-lg flex items-center justify-between w-44 sm:w-52">
              <div className="flex items-center gap-2">
                <CoinIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm font-bold text-[#78350F]">ポイント</span>
              </div>
              <span className="text-sm sm:text-base font-black text-[#B45309]">
                {points} <span className="text-xs font-semibold">Pts</span>
              </span>
            </div>
          </div>

          {/* Right Column: Setting & Menu / Shop Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Study / Quiz shortcut to earn points */}
            <button
              onClick={() => setModalOpen('study')}
              className="px-3 py-2 bg-[#10B981] hover:bg-[#059669] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl border-2 sm:border-3 border-[#065F46] shadow-md flex items-center gap-1.5 transition-transform"
              title="学習してポイントを獲得"
            >
              <span>✏️ 学習する</span>
            </button>

            {/* Paw Shop Button */}
            <button
              onClick={() => setModalOpen('shop')}
              className="p-2.5 sm:p-3 bg-[#FFFDF7] hover:bg-[#FEF3C7] active:scale-90 border-2 sm:border-3 border-[#78350F] rounded-2xl shadow-md transition-transform"
              title="ショップ / ずかん"
            >
              <PawIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setModalOpen('settings')}
              className="p-2.5 sm:p-3 bg-[#FFFDF7] hover:bg-[#FEF3C7] active:scale-90 border-2 sm:border-3 border-[#78350F] rounded-2xl shadow-md transition-transform"
              title="設定"
            >
              <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </header>

        {}
        {/* Center Stage: The Pet Creature & Floating Effects */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-4">
          
          {/* Pet Speech / Thought Bubble */}
          <div
            className={`transition-all duration-300 transform mb-2 ${
              showMessage ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
            }`}
          >
            <div className="relative bg-[#FFFDF7] border-2 sm:border-3 border-[#78350F] px-4 py-2 rounded-2xl shadow-lg max-w-xs text-center text-xs sm:text-sm font-bold text-[#78350F]">
              {petMessage}
              {/* Bubble Arrow */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#78350F]"></div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[7px] border-x-transparent border-t-[7px] border-t-[#FFFDF7]"></div>
            </div>
          </div>

          {/* Interactive Pet Wrapper with Swaying Idle or Reaction */}
          <div
            onClick={handlePetClick}
            className={`cursor-pointer transition-transform ${
              isReacting ? 'pet-reaction-jump' : 'yurayura-idle'
            }`}
            title="クリックしてなでなで！"
          >
            <PetSprite isReacting={isReacting} reactionType={reactionType} />
          </div>

          {/* Floating Heart / Music Note Particles */}
          <div className="absolute pointer-events-none inset-0 flex items-center justify-center">
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute particle-float text-xl sm:text-2xl"
                style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
              >
                {p.type === 'heart' ? '💖' : p.type === 'note' ? '🎵' : '✨'}
              </div>
            ))}
          </div>
        </main>

        {}
        {/* Bottom Action Controls */}
        <footer className="relative z-10 p-4 sm:p-6 flex items-center justify-center gap-4 sm:gap-6">
          {/* Feed Button (えさをあげる) */}
          <button
            onClick={handleFeed}
            className="group relative flex items-center gap-2.5 px-6 sm:px-9 py-2.5 sm:py-3.5 bg-[#FFFDF7] hover:bg-[#FEF3C7] active:scale-95 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-[#78350F] shadow-[0_6px_0_#78350F] active:shadow-[0_2px_0_#78350F] active:translate-y-1 transition-all"
          >
            <AcornIcon className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
            <div className="text-left">
              <span className="block text-sm sm:text-base font-extrabold text-[#78350F]">
                えさをあげる
              </span>
              <span className="block text-[10px] sm:text-xs font-semibold text-[#B45309]">
                20 Pts
              </span>
            </div>
          </button>

          {/* Play with Toy Button (おもちゃで遊ぶ) */}
          <button
            onClick={handlePlay}
            className="group relative flex items-center gap-2.5 px-6 sm:px-9 py-2.5 sm:py-3.5 bg-[#FFFDF7] hover:bg-[#FEF3C7] active:scale-95 rounded-2xl sm:rounded-3xl border-3 sm:border-4 border-[#78350F] shadow-[0_6px_0_#78350F] active:shadow-[0_2px_0_#78350F] active:translate-y-1 transition-all"
          >
            <BallIcon className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-45 transition-transform" />
            <div className="text-left">
              <span className="block text-sm sm:text-base font-extrabold text-[#78350F]">
                おもちゃで遊ぶ
              </span>
              <span className="block text-[10px] sm:text-xs font-semibold text-[#2563EB]">
                15 Pts
              </span>
            </div>
          </button>
        </footer>

        {}
        {/* Simple Modals for Settings, Shop, and Study quiz */}
        {modalOpen && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#FFFDF7] border-4 border-[#78350F] rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl relative">
              <button
                onClick={() => setModalOpen(null)}
                className="absolute top-3 right-3 text-[#78350F] hover:text-black font-extrabold text-lg"
              >
                ✕
              </button>

              {modalOpen === 'study' && (
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#78350F] mb-2 flex items-center gap-2">
                    ✏️ 学習してポイントを稼ぐ
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 mb-4">
                    難易度に応じた問題を解くと、生物にごはんをあげるポイントが手に入ります！
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleSolveQuiz(10)}
                      className="w-full py-2 bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-600 text-emerald-900 rounded-xl font-bold text-xs sm:text-sm"
                    >
                      初級問題を解く (+10 Pts)
                    </button>
                    <button
                      onClick={() => handleSolveQuiz(30)}
                      className="w-full py-2 bg-amber-100 hover:bg-amber-200 border-2 border-amber-600 text-amber-900 rounded-xl font-bold text-xs sm:text-sm"
                    >
                      中級問題を解く (+30 Pts)
                    </button>
                    <button
                      onClick={() => handleSolveQuiz(60)}
                      className="w-full py-2 bg-rose-100 hover:bg-rose-200 border-2 border-rose-600 text-rose-900 rounded-xl font-bold text-xs sm:text-sm"
                    >
                      難関問題を解く (+60 Pts)
                    </button>
                  </div>
                </div>
              )}

              {modalOpen === 'shop' && (
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#78350F] mb-2 flex items-center gap-2">
                    🐾 おみせ＆ずかん
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 mb-3">
                    学習ポイントで特別な家具や進化アイテムを購入できます。
                  </p>
                  <div className="text-center py-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-[#78350F]">
                    ✨ 近日オープン予定 ✨
                  </div>
                </div>
              )}

              {modalOpen === 'settings' && (
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#78350F] mb-2 flex items-center gap-2">
                    ⚙️ アプリ設定
                  </h3>
                  <div className="space-y-3 text-xs sm:text-sm text-[#78350F]">
                    <div className="flex justify-between items-center py-1 border-b">
                      <span>BGM / 効果音</span>
                      <input type="checkbox" defaultChecked className="toggle cursor-pointer" />
                    </div>
                    <div className="flex justify-between items-center py-1 border-b">
                      <span>放置警告の通知</span>
                      <input type="checkbox" defaultChecked className="toggle cursor-pointer" />
                    </div>
                    <div className="text-[11px] text-stone-500 pt-1">
                      ※ DB連携時は最終アクセス日時から減算処理が行われます
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

