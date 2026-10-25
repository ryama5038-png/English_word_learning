import React, { useState, useEffect } from 'react';
import { wordsApi, quizApi, authApi, petApi } from './api';

const LEVEL_LABELS = {
  basic: { label: '基礎', color: 'text-emerald-300 border-emerald-500/50 bg-emerald-950/40' },
  advanced: { label: '応用', color: 'text-cyan-300 border-cyan-500/50 bg-cyan-950/40' },
  toeic: { label: 'TOEIC', color: 'text-amber-300 border-amber-500/50 bg-amber-950/40' },
  custom: { label: 'カスタム', color: 'text-pink-300 border-pink-500/50 bg-pink-950/40' },
};

// ============================================================================
// 1. 単語検索 ＆ マイ単語帳 ＆ カスタム単語登録モーダル
// ============================================================================
export function WordDictionaryModal({ onClose, onWordSearched }) {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'my_book' | 'recent' | 'custom'
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [totalWordsCount, setTotalWordsCount] = useState(0);

  // カスタム単語登録フォームステート
  const [customSpell, setCustomSpell] = useState('');
  const [customLevel, setCustomLevel] = useState('custom');
  const [nounMeaning, setNounMeaning] = useState('');
  const [verbMeaning, setVerbMeaning] = useState('');
  const [adjMeaning, setAdjMeaning] = useState('');
  const [advMeaning, setAdvMeaning] = useState('');
  const [addToMyBook, setAddToMyBook] = useState(true);

  const fetchWordsList = async (recordSearch = false) => {
    setLoading(true);
    try {
      const data = await wordsApi.search({
        q: activeTab === 'search' ? query : '',
        level: activeTab === 'search' ? levelFilter : 'all',
        myBookOnly: activeTab === 'my_book',
        recentOnly: activeTab === 'recent',
        recordSearch,
      });
      setWords(data);
      if (recordSearch && data.length > 0 && onWordSearched) {
        onWordSearched(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    wordsApi
      .getStats()
      .then((s) => {
        if (s && s.total_words) setTotalWordsCount(s.total_words);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab !== 'custom') {
      const timer = setTimeout(() => {
        fetchWordsList(false);
      }, activeTab === 'search' && query ? 220 : 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab, levelFilter, query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchWordsList(true);
  };

  const handleToggleBook = async (wordId) => {
    try {
      const updated = await wordsApi.toggleBook(wordId);
      setWords((prev) =>
        prev
          .map((w) => (w.id === wordId ? updated : w))
          .filter((w) => (activeTab === 'my_book' ? w.in_my_book : true))
      );
      setFeedbackMsg(
        updated.in_my_book
          ? `「${updated.word_spell}」をマイ単語帳に追加しました！⭐`
          : `「${updated.word_spell}」をマイ単語帳から解除しました。`
      );
      setTimeout(() => setFeedbackMsg(''), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogSearch = async (word) => {
    try {
      const updated = await wordsApi.logSearch(word.id);
      setWords((prev) => prev.map((w) => (w.id === word.id ? updated : w)));
      setFeedbackMsg(`「${word.word_spell}」を直近検索リストに記録！ペットが呟くようになります⚡`);
      if (onWordSearched) {
        onWordSearched(updated);
      }
      setTimeout(() => setFeedbackMsg(''), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomWord = async (e) => {
    e.preventDefault();
    if (!customSpell.trim()) return;
    if (!nounMeaning.trim() && !verbMeaning.trim() && !adjMeaning.trim() && !advMeaning.trim()) {
      setFeedbackMsg('⚠️ 名詞・動詞・形容詞・副詞のいずれか1つ以上の意味を入力してください。');
      return;
    }
    try {
      const created = await wordsApi.createCustom({
        word_spell: customSpell,
        level: customLevel,
        noun_meaning: nounMeaning || null,
        verb_meaning: verbMeaning || null,
        adj_meaning: adjMeaning || null,
        adv_meaning: advMeaning || null,
        add_to_my_book: addToMyBook,
      });
      setFeedbackMsg(`✨ 単語「${created.word_spell}」をDB＆マイ単語帳に登録しました！`);
      setCustomSpell('');
      setNounMeaning('');
      setVerbMeaning('');
      setAdjMeaning('');
      setAdvMeaning('');
      if (onWordSearched) {
        onWordSearched(created);
      }
      setTimeout(() => {
        setFeedbackMsg('');
        setActiveTab('my_book');
      }, 1500);
    } catch (err) {
      setFeedbackMsg(err.response?.data?.detail || '登録に失敗しました。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4">
      <div className="glass-card border-2 border-[#00f2fe] rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-[0_0_40px_rgba(0,242,254,0.3)] relative font-mono max-h-[90dvh] flex flex-col text-slate-100">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-cyan-800/70 pb-3 mb-3 shrink-0">
          <h3 className="text-base sm:text-xl font-black text-[#00f2fe] flex items-center gap-2 flex-wrap">
            <span>&gt; VOCAB_DATABASE</span>
            <span className="text-[10px] sm:text-xs font-normal text-cyan-300/80 hidden sm:inline">
              (品詞別辞書・マイ単語帳)
            </span>
            {totalWordsCount > 0 && (
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-bold">
                収録: {totalWordsCount.toLocaleString()}語
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-white font-black text-xl px-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-3 shrink-0">
          {[
            { id: 'search', label: '🔍 辞書検索' },
            { id: 'my_book', label: '⭐ マイ単語帳' },
            { id: 'recent', label: '🕒 直近検索(20)' },
            { id: 'custom', label: '➕ 単語追加' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === t.id
                  ? 'bg-cyan-500/30 border-[#00f2fe] text-white shadow-[0_0_12px_rgba(0,242,254,0.35)]'
                  : 'bg-slate-900/50 border-cyan-900/50 text-cyan-300/70 hover:text-cyan-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* フィードバック通知 */}
        {feedbackMsg && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-950/80 border border-[#00ff88] text-[#00ff88] text-xs font-bold shrink-0">
            {feedbackMsg}
          </div>
        )}

        {/* 検索バー（辞書検索タブ時） */}
        {activeTab === 'search' && (
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 mb-3 shrink-0">
            <div className="flex gap-1.5 flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="英単語 または 日本語の意味で検索..."
                className="flex-1 bg-[#08061a] border border-cyan-500/60 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00f2fe]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500/25 hover:bg-cyan-500/40 border border-[#00f2fe] text-[#00f2fe] rounded-xl text-xs sm:text-sm font-black transition-all shrink-0"
              >
                検索
              </button>
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-[#08061a] border border-cyan-500/50 rounded-xl px-2.5 py-2 text-xs text-cyan-200 focus:outline-none"
            >
              <option value="all">全レベル</option>
              <option value="basic">基礎 (共通テスト)</option>
              <option value="advanced">応用 (難関大)</option>
              <option value="toeic">TOEIC頻出</option>
              <option value="custom">カスタム登録語</option>
            </select>
          </form>
        )}

        {/* タブ説明（マイ単語帳 / 直近検索） */}
        {activeTab === 'my_book' && (
          <p className="text-[11px] sm:text-xs text-cyan-200/80 mb-2 shrink-0">
            ⭐ マイ単語帳に登録した重要単語一覧です。テストの「マイ単語帳」範囲から集中出題できます。
          </p>
        )}
        {activeTab === 'recent' && (
          <p className="text-[11px] sm:text-xs text-cyan-200/80 mb-2 shrink-0">
            🕒 直近で検索・確認した最大20件の単語です。ホーム画面でペットがこれらの単語の意味を定期的に呟きます！
          </p>
        )}

        {/* メインコンテンツ領域 */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[220px]">
          {activeTab === 'custom' ? (
            /* 未知単語の品詞別カスタム追加フォーム */
            <form onSubmit={handleCreateCustomWord} className="space-y-3 bg-[#08061a]/70 p-3.5 sm:p-4 rounded-2xl border border-pink-500/40">
              <div className="text-xs sm:text-sm font-bold text-pink-300 mb-1">
                ➕ 未知の英単語を品詞ごとに意味を分けてDBへ追加
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-cyan-300 mb-1">英単語スペル (必須) *</label>
                  <input
                    type="text"
                    required
                    value={customSpell}
                    onChange={(e) => setCustomSpell(e.target.value)}
                    placeholder="例:综合 / resilience / paradigm"
                    className="w-full bg-[#0d0a24] border border-cyan-600/60 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-cyan-300 mb-1">レベル分類</label>
                  <select
                    value={customLevel}
                    onChange={(e) => setCustomLevel(e.target.value)}
                    className="w-full bg-[#0d0a24] border border-cyan-600/60 rounded-xl px-3 py-2 text-xs sm:text-sm text-cyan-200"
                  >
                    <option value="custom">カスタム</option>
                    <option value="basic">基礎</option>
                    <option value="advanced">応用</option>
                    <option value="toeic">TOEIC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-emerald-300 mb-1">【名詞 (Noun)】の意味</label>
                  <input
                    type="text"
                    value={nounMeaning}
                    onChange={(e) => setNounMeaning(e.target.value)}
                    placeholder="例: 回復力、弾力"
                    className="w-full bg-[#0d0a24] border border-emerald-600/50 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-cyan-300 mb-1">【動詞 (Verb)】の意味</label>
                  <input
                    type="text"
                    value={verbMeaning}
                    onChange={(e) => setVerbMeaning(e.target.value)}
                    placeholder="動詞の意味があれば入力"
                    className="w-full bg-[#0d0a24] border border-cyan-600/50 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-amber-300 mb-1">【形容詞 (Adjective)】の意味</label>
                  <input
                    type="text"
                    value={adjMeaning}
                    onChange={(e) => setAdjMeaning(e.target.value)}
                    placeholder="形容詞の意味があれば入力"
                    className="w-full bg-[#0d0a24] border border-amber-600/50 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-purple-300 mb-1">【副詞 (Adverb)】の意味</label>
                  <input
                    type="text"
                    value={advMeaning}
                    onChange={(e) => setAdvMeaning(e.target.value)}
                    placeholder="副詞の意味があれば入力"
                    className="w-full bg-[#0d0a24] border border-purple-600/50 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-cyan-200 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={addToMyBook}
                  onChange={(e) => setAddToMyBook(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span>登録と同時に「マイ単語帳」に追加し、ペットの復習リストに入れる</span>
              </label>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-[0_0_15px_rgba(255,0,127,0.4)] transition-all"
              >
                ＋ データベースに登録する
              </button>
            </form>
          ) : loading ? (
            <div className="text-center py-10 text-cyan-400 text-xs animate-pulse">
              &gt; LOADING_VOCABULARY_DATA...
            </div>
          ) : words.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              該当する単語が見つかりません。「➕ 単語追加」タブから新しい単語を登録できます！
            </div>
          ) : (
            words.map((w) => {
              const lv = LEVEL_LABELS[w.level] || LEVEL_LABELS.custom;
              return (
                <div
                  key={w.id}
                  onClick={() => handleLogSearch(w)}
                  className="bg-[#09071e]/80 hover:bg-[#0e0b2e]/90 border border-cyan-800/60 hover:border-cyan-400/70 rounded-xl p-3 transition-all cursor-pointer"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-black text-white tracking-wide">
                        {w.word_spell}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${lv.color}`}>
                        {lv.label}
                      </span>
                      {(w.correct_count > 0 || w.wrong_count > 0) && (
                        <span className="text-[10px] text-slate-400">
                          (⭕{w.correct_count} / ❌{w.wrong_count})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleLogSearch(w)}
                        className="px-2 py-1 rounded-lg text-[10px] bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300"
                        title="ペットの直近復習リストに記録"
                      >
                        📢 復習記録
                      </button>
                      <button
                        onClick={() => handleToggleBook(w.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${
                          w.in_my_book
                            ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                            : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-amber-400/50 hover:text-amber-200'
                        }`}
                      >
                        {w.in_my_book ? '★ マイ単語帳済' : '☆ マイ単語帳へ'}
                      </button>
                    </div>
                  </div>

                  {/* 品詞ごとの意味表示（品詞混同を防ぐ明確なバッジ分け） */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {w.noun_meaning && (
                      <div className="flex items-start gap-1.5 bg-emerald-950/25 border border-emerald-800/40 rounded-lg px-2 py-1">
                        <span className="text-[10px] font-black text-emerald-400 shrink-0 mt-0.5">【名】</span>
                        <span className="text-slate-200">{w.noun_meaning}</span>
                      </div>
                    )}
                    {w.verb_meaning && (
                      <div className="flex items-start gap-1.5 bg-cyan-950/25 border border-cyan-800/40 rounded-lg px-2 py-1">
                        <span className="text-[10px] font-black text-cyan-400 shrink-0 mt-0.5">【動】</span>
                        <span className="text-slate-200">{w.verb_meaning}</span>
                      </div>
                    )}
                    {w.adj_meaning && (
                      <div className="flex items-start gap-1.5 bg-amber-950/25 border border-amber-800/40 rounded-lg px-2 py-1">
                        <span className="text-[10px] font-black text-amber-400 shrink-0 mt-0.5">【形】</span>
                        <span className="text-slate-200">{w.adj_meaning}</span>
                      </div>
                    )}
                    {w.adv_meaning && (
                      <div className="flex items-start gap-1.5 bg-purple-950/25 border border-purple-800/40 rounded-lg px-2 py-1">
                        <span className="text-[10px] font-black text-purple-400 shrink-0 mt-0.5">【副】</span>
                        <span className="text-slate-200">{w.adv_meaning}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. 単語テスト・弱点克服クイズモーダル
// ============================================================================
export function QuizModal({ onClose, onQuizComplete }) {
  const [step, setStep] = useState('select'); // 'select' | 'playing' | 'result'
  const [category, setCategory] = useState('basic');
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const startQuiz = async (cat) => {
    setErrorMsg('');
    setLoading(true);
    setCategory(cat);
    try {
      const qs = await quizApi.getQuestions(cat, 5);
      setQuestions(qs);
      setCurrentIdx(0);
      setSelectedIdx(null);
      setAnswers([]);
      setStep('playing');
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail ||
          '該当する出題範囲に単語がありません。別の範囲を選択してください。'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (idx) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);
    const currentQ = questions[currentIdx];
    const isCorrect = idx === currentQ.correct_index;
    setAnswers((prev) => [
      ...prev,
      { word_id: currentQ.word_id, is_correct: isCorrect },
    ]);
  };

  const handleNext = async () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedIdx(null);
    } else {
      setLoading(true);
      try {
        const res = await quizApi.submitQuiz(category, answers);
        setResultData(res);
        setStep('result');
        if (onQuizComplete) {
          onQuizComplete(res);
        }
      } catch (err) {
        setErrorMsg('テスト結果の送信に失敗しました。');
      } finally {
        setLoading(false);
      }
    }
  };

  const currentQ = questions[currentIdx];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="glass-card border-2 border-[#00ff88] rounded-2xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-lg shadow-[0_0_40px_rgba(0,255,136,0.3)] relative font-mono max-h-[90dvh] overflow-y-auto text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cyan-400 hover:text-white font-black text-xl transition-colors"
        >
          ✕
        </button>

        {step === 'select' && (
          <div>
            <h3 className="text-base sm:text-xl font-black text-[#00ff88] mb-1.5 flex items-center gap-2">
              <span>&gt; EXECUTE_WORD_TEST</span>
            </h3>
            <p className="text-xs text-cyan-200/80 mb-4">
              品詞ごとの意味を問う4択テストです。正解して生物育成用のポイント(CR)を獲得しましょう！
            </p>

            {errorMsg && (
              <div className="mb-3 p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="space-y-2.5">
              <button
                disabled={loading}
                onClick={() => startQuiz('basic')}
                className="w-full py-2.5 px-3.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-[#00ff88] text-[#00ff88] rounded-xl font-bold text-xs sm:text-sm transition-all text-left flex justify-between items-center"
              >
                <span>[基礎] 共通テスト・必須単語</span>
                <span className="text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded">+10 CR/問</span>
              </button>

              <button
                disabled={loading}
                onClick={() => startQuiz('advanced')}
                className="w-full py-2.5 px-3.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-[#00f2fe] text-[#00f2fe] rounded-xl font-bold text-xs sm:text-sm transition-all text-left flex justify-between items-center"
              >
                <span>[応用] 難関大・英検準1級レベル</span>
                <span className="text-[11px] bg-cyan-500/20 px-2 py-0.5 rounded">+15 CR/問</span>
              </button>

              <button
                disabled={loading}
                onClick={() => startQuiz('toeic')}
                className="w-full py-2.5 px-3.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-400 text-amber-300 rounded-xl font-bold text-xs sm:text-sm transition-all text-left flex justify-between items-center"
              >
                <span>[TOEIC] ビジネス頻出語彙</span>
                <span className="text-[11px] bg-amber-500/20 px-2 py-0.5 rounded">+15 CR/問</span>
              </button>

              <button
                disabled={loading}
                onClick={() => startQuiz('recent')}
                className="w-full py-2.5 px-3.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-400 text-purple-300 rounded-xl font-bold text-xs sm:text-sm transition-all text-left flex justify-between items-center"
              >
                <span>🕒 [直近検索] 最近調べた単語から出題</span>
                <span className="text-[11px] bg-purple-500/20 px-2 py-0.5 rounded">+15 CR/問</span>
              </button>

              <button
                disabled={loading}
                onClick={() => startQuiz('my_book')}
                className="w-full py-2.5 px-3.5 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-400 text-blue-300 rounded-xl font-bold text-xs sm:text-sm transition-all text-left flex justify-between items-center"
              >
                <span>⭐ [マイ単語帳] 登録した単語から出題</span>
                <span className="text-[11px] bg-blue-500/20 px-2 py-0.5 rounded">+15 CR/問</span>
              </button>

              <button
                disabled={loading}
                onClick={() => startQuiz('weak')}
                className="w-full py-2.5 px-3.5 bg-pink-950/40 hover:bg-pink-900/60 border border-[#ff007f] text-[#ff80bf] rounded-xl font-bold text-xs sm:text-sm transition-all text-left flex justify-between items-center"
              >
                <span>🔥 [弱点克服] 間違えた単語のみ徹底復習</span>
                <span className="text-[11px] bg-pink-500/20 px-2 py-0.5 rounded">+20 CR/問</span>
              </button>
            </div>
          </div>
        )}

        {step === 'playing' && currentQ && (
          <div>
            <div className="flex items-center justify-between text-xs text-cyan-300 mb-3 border-b border-cyan-800/60 pb-2">
              <span className="font-bold">
                QUESTION {currentIdx + 1} / {questions.length}
              </span>
              <span className="text-[11px] text-slate-400">
                履歴: ⭕{currentQ.correct_count} / ❌{currentQ.wrong_count}
              </span>
            </div>

            <div className="text-center my-4 p-4 rounded-2xl bg-[#070516] border border-cyan-500/40">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-wider mb-2">
                {currentQ.word_spell}
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 border border-[#00f2fe] text-[#00f2fe] text-xs font-black">
                【{currentQ.pos_label}】としての意味を選べ
              </div>
            </div>

            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                let btnStyle =
                  'bg-slate-900/70 hover:bg-cyan-950/60 border-cyan-700/60 text-slate-200';
                if (selectedIdx !== null) {
                  if (idx === currentQ.correct_index) {
                    btnStyle =
                      'bg-emerald-900/70 border-[#00ff88] text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.3)]';
                  } else if (idx === selectedIdx) {
                    btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-300';
                  } else {
                    btnStyle = 'bg-slate-950/40 border-slate-800 text-slate-500';
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={selectedIdx !== null}
                    className={`w-full py-3 px-4 rounded-xl border text-left text-xs sm:text-sm font-bold transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>
                      {idx + 1}. {opt}
                    </span>
                    {selectedIdx !== null && idx === currentQ.correct_index && (
                      <span>⭕</span>
                    )}
                    {selectedIdx === idx && idx !== currentQ.correct_index && (
                      <span>❌</span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedIdx !== null && (
              <div className="mt-4 p-3 rounded-xl bg-[#08061c] border border-cyan-500/40 text-xs">
                <div className="font-black mb-1">
                  {selectedIdx === currentQ.correct_index ? (
                    <span className="text-[#00ff88]">⭕ 正解！ナイス！</span>
                  ) : (
                    <span className="text-rose-400">
                      ❌ 不正解… 正解は「{currentQ.correct_meaning}」
                    </span>
                  )}
                </div>
                <div className="text-cyan-200/80 text-[11px]">
                  全品詞まとめ: {currentQ.all_meanings_summary}
                </div>
                <button
                  onClick={handleNext}
                  className="mt-3 w-full py-2.5 bg-[#00ff88] hover:bg-emerald-400 text-[#050311] font-black rounded-xl text-xs sm:text-sm transition-all"
                >
                  {currentIdx + 1 < questions.length ? '次の問題へ &gt;' : '結果を見る &gt;'}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'result' && resultData && (
          <div className="text-center py-4">
            <h3 className="text-xl sm:text-2xl font-black text-[#00ff88] mb-2">
              &gt; TEST_COMPLETED! 🎉
            </h3>
            <p className="text-sm text-cyan-200 mb-4">
              {resultData.question_total}問中{' '}
              <span className="text-xl font-black text-white">
                {resultData.correct_total}
              </span>{' '}
              問正解！
            </p>
            <div className="inline-block px-6 py-3 rounded-2xl bg-pink-950/50 border-2 border-[#ff007f] shadow-[0_0_20px_rgba(255,0,127,0.4)] mb-5">
              <div className="text-xs text-pink-300">獲得クレジット</div>
              <div className="text-2xl font-black text-[#ff80bf]">
                +{resultData.earned_points} CR
              </div>
            </div>
            <p className="text-xs text-cyan-100 mb-5">{resultData.speech}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-2.5 bg-cyan-950/60 hover:bg-cyan-900 border border-[#00f2fe] text-[#00f2fe] rounded-xl text-xs font-bold"
              >
                別の範囲を解く
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-[#00ff88] hover:bg-emerald-400 text-[#050311] rounded-xl text-xs font-black"
              >
                ペットの画面へ戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. システム設定 ＆ アカウント認証(JWT Cookie) ＆ エネルギー状態シミュレーター
// ============================================================================
export function SystemConfigModal({ user, onClose, onUserUpdated, onUserChange }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const notifyUser = (data) => {
    if (onUserUpdated) onUserUpdated(data);
    if (onUserChange) onUserChange(data);
    window.dispatchEvent(new CustomEvent('pet-auth-changed', { detail: data }));
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    try {
      const data =
        authMode === 'login'
          ? await authApi.login(username, password)
          : await authApi.register(username, password);
      setStatusMsg(`✅ ユーザー「${data.username}」で認証しました！`);
      setUsername('');
      setPassword('');
      notifyUser(data);
    } catch (err) {
      setStatusMsg(
        '⚠️ ' + (err.response?.data?.detail || '認証エラーが発生しました。')
      );
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      notifyUser(null);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateEnergy = async (targetEnergy) => {
    try {
      const res = await petApi.performAction('set_energy', targetEnergy);
      setStatusMsg(`⚡ ${res.speech}`);
      notifyUser({
        ...user,
        energy: res.energy,
        points: res.points,
        energy_status: res.energy_status,
        lastSpeech: res.speech,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="glass-card border-2 border-[#00f2fe] rounded-2xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-md shadow-[0_0_40px_rgba(0,242,254,0.3)] relative font-mono max-h-[90dvh] overflow-y-auto text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cyan-400 hover:text-white font-black text-xl transition-colors"
        >
          ✕
        </button>

        <h3 className="text-base sm:text-lg font-black text-cyan-300 mb-3 border-b border-cyan-800 pb-2">
          &gt; SYSTEM_CONFIG &amp; AUTH
        </h3>

        {statusMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-400 text-cyan-200 text-xs font-bold">
            {statusMsg}
          </div>
        )}

        {/* 現在のユーザーステータス */}
        <div className="bg-[#08061a] border border-cyan-800/60 rounded-xl p-3 mb-4 text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">ログイン中ユーザー:</span>
            <span className="font-black text-[#00f2fe]">{user?.username || '未認証'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">学習エージェント:</span>
            <span className="font-black text-cyan-200">
              {user?.character_type === 'jinbei'
                ? '🦈 ジンベイザメ'
                : user?.character_type === 'slime'
                ? '🔮 スライム'
                : '🪼 クラゲ'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">ペット状態 (エネルギー):</span>
            <span className="font-black text-emerald-300">
              {user?.energy ?? 100}% ({user?.energy_status || '元気'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">保有ポイント (CR):</span>
            <span className="font-black text-pink-400">{user?.points ?? 0} CR</span>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500 text-rose-300 font-black text-xs transition-all"
            >
              🚪 ログアウトしてログイン画面へ戻る
            </button>
          </div>
        </div>

        {/* 放置減衰・エネルギー別トーン確認用シミュレーター */}
        <div className="mb-4 pb-4 border-b border-cyan-900">
          <div className="text-xs font-bold text-cyan-300 mb-1.5">
            &gt; エネルギー状態シミュレート (復習口調の変化テスト)
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            最終アクセスからの経過時間によりエネルギーが減衰します。残量に応じたペットの復習コメント口調（元気・普通・衰弱）を即座にテストできます：
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSimulateEnergy(95)}
              className="py-2 px-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-[#00ff88] text-[#00ff88] text-xs font-bold"
            >
              元気 (95%)
            </button>
            <button
              onClick={() => handleSimulateEnergy(50)}
              className="py-2 px-2 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-400 text-amber-300 text-xs font-bold"
            >
              普通 (50%)
            </button>
            <button
              onClick={() => handleSimulateEnergy(15)}
              className="py-2 px-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500 text-rose-300 text-xs font-bold"
            >
              衰弱 (15%)
            </button>
          </div>
        </div>

        {/* JWT (HttpOnly Cookie) アカウント切り替え・新規登録フォーム */}
        <form onSubmit={handleAuthSubmit} className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300">
              &gt; {authMode === 'login' ? 'アカウント切替ログイン' : '新規ユーザー登録'}
            </span>
            <button
              type="button"
              onClick={() =>
                setAuthMode((m) => (m === 'login' ? 'register' : 'login'))
              }
              className="text-[11px] text-pink-400 underline"
            >
              {authMode === 'login' ? '新規登録へ切替' : 'ログインへ切替'}
            </button>
          </div>

          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ユーザー名 (例: testuser_a / testuser_b)"
            className="w-full bg-[#08061a] border border-cyan-700/60 rounded-xl px-3 py-2 text-xs text-white"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード (testuser_a: password123)"
            className="w-full bg-[#08061a] border border-cyan-700/60 rounded-xl px-3 py-2 text-xs text-white"
          />
          <button
            type="submit"
            className="w-full py-2 bg-cyan-500/25 hover:bg-cyan-500/40 border border-[#00f2fe] text-[#00f2fe] font-black rounded-xl text-xs transition-all"
          >
            {authMode === 'login' ? 'ログイン (HttpOnly Cookie)' : '新規登録して開始'}
          </button>
        </form>
      </div>
    </div>
  );
}
