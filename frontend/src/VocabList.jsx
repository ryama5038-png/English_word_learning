import React, { useState, useEffect, useRef, useCallback } from 'react';
import { wordsApi } from './api';
import { useSpeech } from './hooks/useSpeech';

const LEVEL_LABELS = {
  basic: {
    label: '基礎',
    color: 'text-emerald-300 border-emerald-500/50 bg-emerald-950/40',
  },
  advanced: {
    label: '応用',
    color: 'text-cyan-300 border-cyan-500/50 bg-cyan-950/40',
  },
  toeic: {
    label: 'TOEIC',
    color: 'text-amber-300 border-amber-500/50 bg-amber-950/40',
  },
  custom: {
    label: 'カスタム',
    color: 'text-pink-300 border-pink-500/50 bg-pink-950/40',
  },
};

const MASK_MODE_LABELS = {
  all: { short: 'すべて表示', badge: '👁️ 全表示', color: 'text-cyan-300 border-cyan-500/50' },
  hide_en: { short: '英語を隠す', badge: '🙈 英語マスク中', color: 'text-pink-200 border-[#ff007f] bg-rose-950/80' },
  hide_ja: { short: '意味を隠す', badge: '🙊 意味マスク中', color: 'text-emerald-200 border-[#00ff88] bg-emerald-950/80' },
};

/**
 * 単語帳モード（一覧学習機能）メインコンポーネント
 * 1. モバイルファーストな開閉式ボトムシート設定パネル（デフォルト非表示・右下FABで開閉）
 * 2. ページ番号直接入力によるページジャンプ機能（1〜総ページ数への自動クランプ＆バリデーション）
 * 3. 赤シート暗記マスキング・しおり自動スクロール・付箋機能
 */
export function VocabList({
  onWordSearched,
  embedded = false,
  isSettingsOpen: externalSettingsOpen,
  onSettingsOpenChange,
}) {
  // ボトムシート（設定ドロワー）開閉状態（デフォルトで非表示・親モーダルからの制御にも対応）
  const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);
  const isSettingsOpen =
    externalSettingsOpen !== undefined ? externalSettingsOpen : internalSettingsOpen;
  const setIsSettingsOpen = onSettingsOpenChange || setInternalSettingsOpen;

  // 表示対象・フィルター・レイアウト状態
  const [bookMode, setBookMode] = useState('all'); // 'all' | 'my_book'
  const [levelFilter, setLevelFilter] = useState('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [viewLayout, setViewLayout] = useState('list'); // 'list' | 'card'

  // 赤シート（暗記用マスキング）状態: 'all' | 'hide_en' | 'hide_ja'
  const [maskMode, setMaskMode] = useState('all');
  const [revealedEnIds, setRevealedEnIds] = useState({});
  const [revealedJaIds, setRevealedJaIds] = useState({});

  // ページネーション＆ページジャンプ入力状態
  const [limit, setLimit] = useState(30);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [pageInput, setPageInput] = useState('1');
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialPositionLoaded, setInitialPositionLoaded] = useState(false);

  // しおり（前回学習位置）状態
  const [studyPos, setStudyPos] = useState({
    last_studied_word_id: null,
    last_studied_offset: 0,
    last_studied_word_spell: null,
  });
  const [pendingScrollWordId, setPendingScrollWordId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // スクロール用Ref
  const wordItemRefs = useRef({});
  const listContainerRef = useRef(null);

  // 音声読み上げカスタムフック (en-US)
  const { speak, isSupported: isSpeechSupported, speakingText } = useSpeech('en-US');

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // 現在のページ番号が変わったらページ入力欄も同期する
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const showToast = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev === msg ? '' : prev));
    }, 2600);
  };

  // 英単語の発音を読み上げるハンドラ（マスク中でもイベント伝播を止めて発音のみ再生可能）
  const handleSpeakWord = (wordSpell, e) => {
    if (e) e.stopPropagation();
    const ok = speak(wordSpell);
    if (!ok && !isSpeechSupported) {
      showToast('⚠️ お使いのブラウザは音声読み上げ機能(Web Speech API)に対応していません。');
    }
  };

  // マスクモード変更時は個別解除状態をリセット
  const handleMaskModeChange = (mode) => {
    setMaskMode(mode);
    setRevealedEnIds({});
    setRevealedJaIds({});
  };

  const toggleRevealEn = (wordId, e) => {
    if (maskMode !== 'hide_en') return;
    e.stopPropagation();
    setRevealedEnIds((prev) => ({ ...prev, [wordId]: !prev[wordId] }));
  };

  const toggleRevealJa = (wordId, e) => {
    if (maskMode !== 'hide_ja') return;
    e.stopPropagation();
    setRevealedJaIds((prev) => ({ ...prev, [wordId]: !prev[wordId] }));
  };

  const resetAllRevealed = () => {
    setRevealedEnIds({});
    setRevealedJaIds({});
  };

  // 1. 初回マウント時：前回のしおり位置をAPIから取得し、初期ページ(offset)とスクロール対象を設定
  useEffect(() => {
    let mounted = true;
    wordsApi
      .getStudyPosition()
      .then((pos) => {
        if (!mounted) return;
        const savedOffset = Math.max(0, pos.last_studied_offset || 0);
        const alignedOffset = Math.floor(savedOffset / limit) * limit;
        setStudyPos({
          last_studied_word_id: pos.last_studied_word_id || null,
          last_studied_offset: alignedOffset,
          last_studied_word_spell: pos.last_studied_word_spell || null,
        });
        setOffset(alignedOffset);
        if (pos.last_studied_word_id) {
          setPendingScrollWordId(pos.last_studied_word_id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setInitialPositionLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. 単語一覧データの取得（ページネーション＆フィルター対応）
  const fetchVocabPage = useCallback(async () => {
    if (!initialPositionLoaded) return;
    setLoading(true);
    try {
      const data = await wordsApi.getVocabBook({
        mode: bookMode,
        level: levelFilter,
        bookmarkedOnly,
        limit,
        offset,
      });
      setWords(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [initialPositionLoaded, bookMode, levelFilter, bookmarkedOnly, limit, offset]);

  useEffect(() => {
    fetchVocabPage();
  }, [fetchVocabPage]);

  // 3. しおり位置の単語カードへのオートスクロール処理
  useEffect(() => {
    if (!loading && pendingScrollWordId && words.length > 0) {
      const targetEl = wordItemRefs.current[pendingScrollWordId];
      if (targetEl) {
        const timer = setTimeout(() => {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setPendingScrollWordId(null);
        }, 120);
        return () => clearTimeout(timer);
      } else {
        setPendingScrollWordId(null);
      }
    }
  }, [loading, pendingScrollWordId, words]);

  // ページ変更ヘルパー（リスト先頭へスクロール）
  const goToOffset = (newOffset) => {
    setOffset(newOffset);
    if (listContainerRef.current) {
      listContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ★ ページジャンプ処理（バリデーション＆クランプ付き）
  const handlePageJumpSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = String(pageInput).trim();
    if (!trimmed || !/^-?\d+$/.test(trimmed)) {
      // 数字以外の無効な入力は元のページ番号に戻す
      setPageInput(String(currentPage));
      return;
    }

    const parsed = parseInt(trimmed, 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(currentPage));
      return;
    }

    // 1未満は1ページ目、総ページ数超過は最終ページにクランプ
    const clampedPage = Math.max(1, Math.min(totalPages, parsed));
    setPageInput(String(clampedPage));

    const targetOffset = (clampedPage - 1) * limit;
    if (targetOffset !== offset) {
      goToOffset(targetOffset);
    }
  };

  // フィルター変更時は1ページ目(offset=0)へ戻す
  const handleFilterChange = (updater) => {
    setOffset(0);
    updater();
  };

  // しおり（進捗位置）を保存／解除（トグル）する
  const handleSaveStudyPosition = async (word, e) => {
    if (e) e.stopPropagation();
    const isAlreadyStudyPos = studyPos.last_studied_word_id === word.id;
    try {
      if (isAlreadyStudyPos) {
        await wordsApi.saveStudyPosition({
          lastStudiedWordId: null,
          lastStudiedOffset: 0,
        });
        setStudyPos({
          last_studied_word_id: null,
          last_studied_offset: 0,
          last_studied_word_spell: null,
        });
        showToast(`「${word.word_spell}」のしおりを外しました。`);
      } else {
        const saved = await wordsApi.saveStudyPosition({
          lastStudiedWordId: word.id,
          lastStudiedOffset: offset,
        });
        setStudyPos({
          last_studied_word_id: saved.last_studied_word_id,
          last_studied_offset: saved.last_studied_offset,
          last_studied_word_spell: saved.last_studied_word_spell || word.word_spell,
        });
        showToast(`🔖 No.${word.id}「${word.word_spell}」にしおりを挟みました！`);
        if (onWordSearched) {
          onWordSearched(word);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('⚠️ しおりの保存に失敗しました。');
    }
  };

  // 保存されているしおり位置へジャンプ
  const handleJumpToStudyPosition = () => {
    const targetOffset =
      Math.floor((studyPos.last_studied_offset || 0) / limit) * limit;
    setBookMode('all');
    setLevelFilter('all');
    setBookmarkedOnly(false);
    setOffset(targetOffset);
    setIsSettingsOpen(false);
    if (studyPos.last_studied_word_id) {
      setPendingScrollWordId(studyPos.last_studied_word_id);
      const existingEl = wordItemRefs.current[studyPos.last_studied_word_id];
      if (existingEl && offset === targetOffset) {
        existingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    showToast('🔖 前回のしおり位置へ移動しました！');
  };

  // 付箋（ブックマーク: is_bookmarked）のON/OFF切り替え
  const handleToggleBookmark = async (word, e) => {
    if (e) e.stopPropagation();
    try {
      const updated = await wordsApi.toggleBookmark(word.id);
      setWords((prev) => {
        const mapped = prev.map((w) => (w.id === word.id ? updated : w));
        return bookmarkedOnly ? mapped.filter((w) => w.is_bookmarked) : mapped;
      });
      if (bookmarkedOnly && !updated.is_bookmarked) {
        setTotal((t) => Math.max(0, t - 1));
      }
      showToast(
        updated.is_bookmarked
          ? `🏷️ No.${updated.id}「${updated.word_spell}」に付箋を貼りました！`
          : `「${updated.word_spell}」の付箋を外しました。`
      );
    } catch (err) {
      console.error(err);
    }
  };

  // マイ単語帳（in_my_book）のON/OFF切り替え
  const handleToggleMyBook = async (word, e) => {
    if (e) e.stopPropagation();
    try {
      const updated = await wordsApi.toggleBook(word.id);
      setWords((prev) => {
        const mapped = prev.map((w) => (w.id === word.id ? updated : w));
        return bookMode === 'my_book'
          ? mapped.filter((w) => w.in_my_book)
          : mapped;
      });
      if (bookMode === 'my_book' && !updated.in_my_book) {
        setTotal((t) => Math.max(0, t - 1));
      }
      showToast(
        updated.in_my_book
          ? `⭐ 「${updated.word_spell}」をマイ単語帳に追加しました！`
          : `「${updated.word_spell}」をマイ単語帳から解除しました。`
      );
    } catch (err) {
      console.error(err);
    }
  };

  const revealedCount =
    Object.values(revealedEnIds).filter(Boolean).length +
    Object.values(revealedJaIds).filter(Boolean).length;
  const activeMaskMeta = MASK_MODE_LABELS[maskMode] || MASK_MODE_LABELS.all;

  return (
    <div className="relative flex flex-col flex-1 h-full min-h-0 text-slate-100 font-mono overflow-hidden">
      {/* =================================================================== */}
      {/* 1. 極薄ステータスバー（現在のフィルター状況・しおり移動・再マスク） */}
      {/* =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 mb-1.5 border-b border-cyan-900/60 shrink-0 text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full border font-bold ${activeMaskMeta.color}`}>
            {activeMaskMeta.badge}
          </span>
          {bookMode === 'my_book' && (
            <span className="px-2 py-0.5 rounded-full border border-amber-400 bg-amber-950/60 text-amber-200 font-bold">
              ⭐ マイ単語帳
            </span>
          )}
          {bookmarkedOnly && (
            <span className="px-2 py-0.5 rounded-full border border-[#ff007f] bg-pink-950/60 text-pink-200 font-bold">
              🏷️ 付箋のみ
            </span>
          )}
          {levelFilter !== 'all' && (
            <span className="px-2 py-0.5 rounded-full border border-cyan-400/60 bg-cyan-950/60 text-cyan-200 font-bold">
              Lv:{LEVEL_LABELS[levelFilter]?.label || levelFilter}
            </span>
          )}
          {maskMode !== 'all' && revealedCount > 0 && (
            <button
              type="button"
              onClick={resetAllRevealed}
              className="px-2 py-0.5 rounded-full bg-rose-950/90 hover:bg-rose-900 border border-pink-400 text-pink-200 font-bold transition-all"
            >
              🔄 再マスク({revealedCount})
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {studyPos.last_studied_word_id && (
            <button
              type="button"
              onClick={handleJumpToStudyPosition}
              className="px-2 py-0.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-[#00ff88]/70 text-[#00ff88] font-bold transition-all flex items-center gap-1"
              title="前回のしおり位置へジャンプ"
            >
              <span>🔖 しおり:</span>
              <span className="underline truncate max-w-[85px] sm:max-w-[130px]">
                No.{studyPos.last_studied_word_id}
              </span>
            </button>
          )}
          <span className="text-cyan-300/80 font-bold">
            {total === 0 ? '0語' : `${offset + 1}〜${Math.min(offset + limit, total)} / ${total}語`}
          </span>
        </div>
      </div>

      {/* フィードバックトースト */}
      {feedbackMsg && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-[#00ff88] text-[#00ff88] text-[11px] sm:text-xs font-bold shrink-0">
          {feedbackMsg}
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. 単語一覧メインリスト領域（flex-1 h-full で画面高さを最大限活用） */}
      {/* =================================================================== */}
      <div
        ref={listContainerRef}
        className="flex-1 h-full overflow-y-auto pr-0.5 sm:pr-1 pb-4 min-h-0"
      >
        {loading ? (
          <div className="text-center py-16 text-cyan-400 text-xs animate-pulse">
            &gt; LOADING_VOCABULARY_BOOK...
          </div>
        ) : words.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs space-y-2">
            <div>条件に一致する単語がありません。</div>
            {(bookmarkedOnly || bookMode === 'my_book' || levelFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setBookmarkedOnly(false);
                  setBookMode('all');
                  setLevelFilter('all');
                  setOffset(0);
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 text-xs font-bold"
              >
                フィルターをすべて解除する
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewLayout === 'card'
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5'
                : 'space-y-2'
            }
          >
            {words.map((w) => {
              const lv = LEVEL_LABELS[w.level] || LEVEL_LABELS.custom;
              const isStudyBookmarkPos = studyPos.last_studied_word_id === w.id;
              const isEnMasked = maskMode === 'hide_en' && !revealedEnIds[w.id];
              const isJaMasked = maskMode === 'hide_ja' && !revealedJaIds[w.id];

              return (
                <div
                  key={w.id}
                  ref={(el) => {
                    if (el) wordItemRefs.current[w.id] = el;
                  }}
                  data-word-id={w.id}
                  className={`relative rounded-xl p-2.5 sm:p-3.5 transition-all border ${
                    isStudyBookmarkPos
                      ? 'bg-emerald-950/35 border-2 border-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.25)]'
                      : w.is_bookmarked
                      ? 'bg-[#14092a]/85 border-pink-500/60 hover:border-pink-400'
                      : 'bg-[#09071e]/85 hover:bg-[#0e0b2e]/90 border-cyan-800/60 hover:border-cyan-400/70'
                  }`}
                >
                  {/* しおり位置リボン */}
                  {isStudyBookmarkPos && (
                    <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00ff88]/20 border border-[#00ff88] text-[#00ff88] text-[10px] font-black tracking-wide">
                      <span>🔖 前回のしおり位置（ここから再開）</span>
                    </div>
                  )}

                  {/* 1段目：単語番号(No.ID)・レベル・正誤履歴 ＋ 付箋/しおり/マイ単語帳ボタン */}
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-700/60 text-[10px] sm:text-[11px] font-black text-[#00f2fe] shrink-0">
                        No.{w.id}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-bold shrink-0 ${lv.color}`}
                      >
                        {lv.label}
                      </span>
                      {(w.correct_count > 0 || w.wrong_count > 0) && (
                        <span className="text-[10px] text-slate-400 truncate">
                          ⭕{w.correct_count}/❌{w.wrong_count}
                        </span>
                      )}
                    </div>

                    {/* 右側アクションボタン群 */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleBookmark(w, e)}
                        className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all flex items-center gap-0.5 ${
                          w.is_bookmarked
                            ? 'bg-pink-500/30 border-[#ff007f] text-pink-200 shadow-[0_0_8px_rgba(255,0,127,0.35)]'
                            : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-pink-400/60 hover:text-pink-200'
                        }`}
                        title="気になる単語に付箋（目印）を貼る / 外す"
                      >
                        <span>🏷️</span>
                        <span>{w.is_bookmarked ? '付箋中' : '付箋'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleSaveStudyPosition(w, e)}
                        className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all flex items-center gap-0.5 ${
                          isStudyBookmarkPos
                            ? 'bg-emerald-500/30 border-[#00ff88] text-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.35)]'
                            : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-[#00ff88]/60 hover:text-emerald-200'
                        }`}
                        title="ここまで学習した目印として「しおり」を挟む / 外す"
                      >
                        <span>🔖</span>
                        <span>{isStudyBookmarkPos ? 'しおり中' : 'しおり'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleMyBook(w, e)}
                        className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${
                          w.in_my_book
                            ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                            : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:border-amber-400/50 hover:text-amber-200'
                        }`}
                        title="マイ単語帳へ登録 / 解除"
                      >
                        {w.in_my_book ? '★' : '☆'}
                      </button>
                    </div>
                  </div>

                  {/* 2段目：英単語スペル（赤シートマスク対応 ＋ 音声読み上げスピーカーボタン） */}
                  <div
                    onClick={(e) => toggleRevealEn(w.id, e)}
                    className={`relative px-3 py-1.5 mb-2 rounded-xl transition-all select-none flex items-center justify-between gap-2 ${
                      maskMode === 'hide_en' ? 'cursor-pointer' : ''
                    } ${
                      isEnMasked
                        ? 'bg-rose-950/90 border border-[#ff007f] shadow-[0_0_12px_rgba(255,0,127,0.3)] hover:bg-rose-900/90'
                        : maskMode === 'hide_en' && revealedEnIds[w.id]
                        ? 'bg-rose-950/30 border border-pink-500/50'
                        : 'bg-[#060414]/70 border border-cyan-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className={`text-base sm:text-xl font-black tracking-wide break-all transition-all duration-200 ${
                          isEnMasked
                            ? 'blur-md opacity-10 text-pink-300 select-none'
                            : 'text-white'
                        }`}
                      >
                        {w.word_spell}
                      </span>

                      {!isEnMasked &&
                        maskMode === 'hide_en' &&
                        revealedEnIds[w.id] && (
                          <span className="text-[10px] text-pink-300/80 font-bold shrink-0">
                            (タップで隠す)
                          </span>
                        )}
                    </div>

                    {isEnMasked && (
                      <span className="absolute inset-0 right-11 flex items-center justify-center text-[11px] sm:text-xs font-black text-pink-200 tracking-wider pointer-events-none">
                        🟥 タップして英単語を表示
                      </span>
                    )}

                    {/* スピーカーアイコン（🔊）SVGボタン：英語マスク中でも押下して発音リスニング可能 */}
                    <button
                      type="button"
                      onClick={(e) => handleSpeakWord(w.word_spell, e)}
                      aria-label={`${w.word_spell} の発音を聴く`}
                      title={
                        isEnMasked
                          ? '発音だけ聴いて英単語を当てる (en-US)'
                          : `${w.word_spell} の発音を聴く (en-US)`
                      }
                      className={`relative z-10 p-2 rounded-xl border transition-all shrink-0 flex items-center justify-center active:scale-95 ${
                        speakingText === w.word_spell
                          ? 'bg-cyan-500/30 border-[#00f2fe] text-cyan-300 drop-shadow-[0_0_10px_rgba(0,242,254,0.9)]'
                          : isEnMasked
                          ? 'bg-rose-950/90 hover:bg-cyan-950/90 border-pink-400/70 hover:border-[#00f2fe] text-pink-200 hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(0,242,254,0.85)]'
                          : 'bg-cyan-950/50 hover:bg-cyan-900/70 border-cyan-700/60 hover:border-[#00f2fe] text-cyan-300 hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(0,242,254,0.85)]'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 sm:w-5 sm:h-5"
                      >
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    </button>
                  </div>

                  {/* 3段目：日本語の意味領域（赤シートマスク対応） */}
                  <div
                    onClick={(e) => toggleRevealJa(w.id, e)}
                    className={`relative rounded-xl transition-all ${
                      maskMode === 'hide_ja' ? 'cursor-pointer p-1.5' : ''
                    } ${
                      isJaMasked
                        ? 'bg-emerald-950/75 border border-[#00ff88]/70 shadow-[0_0_12px_rgba(0,255,136,0.2)] hover:bg-emerald-900/60 min-h-[42px]'
                        : maskMode === 'hide_ja' && revealedJaIds[w.id]
                        ? 'bg-emerald-950/20 border border-emerald-500/40 p-1.5'
                        : ''
                    }`}
                  >
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs transition-all duration-200 ${
                        isJaMasked ? 'blur-md opacity-10 select-none' : ''
                      }`}
                    >
                      {w.noun_meaning && (
                        <div className="flex items-start gap-1.5 bg-emerald-950/25 border border-emerald-800/40 rounded-lg px-2 py-1">
                          <span className="text-[10px] font-black text-emerald-400 shrink-0 mt-0.5">
                            【名】
                          </span>
                          <span className="text-slate-200 break-words">
                            {w.noun_meaning}
                          </span>
                        </div>
                      )}
                      {w.verb_meaning && (
                        <div className="flex items-start gap-1.5 bg-cyan-950/25 border border-cyan-800/40 rounded-lg px-2 py-1">
                          <span className="text-[10px] font-black text-cyan-400 shrink-0 mt-0.5">
                            【動】
                          </span>
                          <span className="text-slate-200 break-words">
                            {w.verb_meaning}
                          </span>
                        </div>
                      )}
                      {w.adj_meaning && (
                        <div className="flex items-start gap-1.5 bg-amber-950/25 border border-amber-800/40 rounded-lg px-2 py-1">
                          <span className="text-[10px] font-black text-amber-400 shrink-0 mt-0.5">
                            【形】
                          </span>
                          <span className="text-slate-200 break-words">
                            {w.adj_meaning}
                          </span>
                        </div>
                      )}
                      {w.adv_meaning && (
                        <div className="flex items-start gap-1.5 bg-purple-950/25 border border-purple-800/40 rounded-lg px-2 py-1">
                          <span className="text-[10px] font-black text-purple-400 shrink-0 mt-0.5">
                            【副】
                          </span>
                          <span className="text-slate-200 break-words">
                            {w.adv_meaning}
                          </span>
                        </div>
                      )}
                    </div>

                    {isJaMasked && (
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] sm:text-xs font-black text-emerald-200 tracking-wider pointer-events-none px-2 text-center">
                        🟦 タップして意味（日本語）を確認
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 3. フッター：ページネーション ＆ ページ番号直接ジャンプ機能         */}
      {/* =================================================================== */}
      <div className="pt-2 border-t border-cyan-800/70 bg-[#08061a]/95 z-20 flex flex-wrap items-center justify-between gap-1.5 text-xs shrink-0">
        {/* 前へ・最初へボタン */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={offset === 0 || loading}
            onClick={() => goToOffset(0)}
            className="py-1.5 px-2 rounded-lg bg-slate-900 border border-cyan-800/70 text-cyan-300 disabled:opacity-35 hover:bg-cyan-950/60 text-[10px] sm:text-xs font-bold"
            title="最初のページへ"
          >
            ≪
          </button>
          <button
            type="button"
            disabled={offset === 0 || loading}
            onClick={() => goToOffset(Math.max(0, offset - limit))}
            className="py-1.5 px-2.5 rounded-lg bg-slate-900 border border-cyan-600/70 text-cyan-200 disabled:opacity-35 hover:bg-cyan-950/60 text-[10px] sm:text-xs font-bold"
          >
            ＜ 前へ
          </button>
        </div>

        {/* ★ ページ番号直接入力 ＆ 移動(Go)フォーム */}
        <form
          onSubmit={handlePageJumpSubmit}
          className="flex items-center gap-1 bg-[#0c0924] border border-cyan-500/50 rounded-xl px-2 py-1"
        >
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            aria-label="ページ番号入力"
            className="w-11 sm:w-14 bg-[#060414] border border-cyan-600/70 focus:border-[#00f2fe] rounded-lg px-1.5 py-0.5 text-center text-xs sm:text-sm font-black text-[#00f2fe] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[11px] sm:text-xs text-cyan-200/90 font-bold whitespace-nowrap">
            / {totalPages}頁
          </span>
          <button
            type="submit"
            disabled={loading}
            className="ml-0.5 px-2 py-0.5 rounded-lg bg-cyan-500/25 hover:bg-cyan-500/40 border border-[#00f2fe] text-[#00f2fe] text-[10px] sm:text-xs font-black transition-all active:scale-95"
          >
            移動
          </button>
        </form>

        {/* 次へ・最後へボタン */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={offset + limit >= total || loading}
            onClick={() => goToOffset(offset + limit)}
            className="py-1.5 px-2.5 rounded-lg bg-slate-900 border border-cyan-600/70 text-cyan-200 disabled:opacity-35 hover:bg-cyan-950/60 text-[10px] sm:text-xs font-bold"
          >
            次へ ＞
          </button>
          <button
            type="button"
            disabled={offset + limit >= total || loading}
            onClick={() => goToOffset((totalPages - 1) * limit)}
            className="py-1.5 px-2 rounded-lg bg-slate-900 border border-cyan-800/70 text-cyan-300 disabled:opacity-35 hover:bg-cyan-950/60 text-[10px] sm:text-xs font-bold"
            title="最後のページへ"
          >
            ≫
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 5. ボトムシート（スライドアップ式表示設定ドロワー）                 */}
      {/* =================================================================== */}
      {/* 背景オーバーレイ（タップで閉じる） */}
      <div
        onClick={() => setIsSettingsOpen(false)}
        className={`fixed inset-0 z-40 bg-black/65 backdrop-blur-xs transition-opacity duration-300 ${
          isSettingsOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* スライドアップするボトムシート本体 */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-2xl glass-card bg-[#0b0822]/95 border-t-2 border-x border-[#00f2fe] rounded-t-3xl p-4 sm:p-6 shadow-[0_-10px_40px_rgba(0,242,254,0.35)] transform transition-transform duration-300 ease-out max-h-[85dvh] overflow-y-auto ${
          isSettingsOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* ドラッグハンドル風バー ＆ ヘッダー */}
        <div className="w-12 h-1.5 bg-cyan-500/40 rounded-full mx-auto mb-3" />
        <div className="flex items-center justify-between border-b border-cyan-800/70 pb-2.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-black text-[#00f2fe]">
              ⚙️ 単語帳 表示・暗記設定
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-900/90 hover:bg-rose-950 border border-cyan-500/50 hover:border-rose-400 text-cyan-300 hover:text-white font-black text-base flex items-center justify-center transition-all"
            aria-label="設定パネルを閉じる"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* 1. 赤シート暗記マスキング設定 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-black text-pink-300 text-xs sm:text-sm flex items-center gap-1.5">
                <span>🟥 赤シート暗記マスキング</span>
              </label>
              {maskMode !== 'all' && revealedCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllRevealed}
                  className="px-2.5 py-1 rounded-lg bg-rose-950 border border-pink-500 text-pink-200 text-[11px] font-bold"
                >
                  🔄 タップ解除済({revealedCount})を再マスク
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'all',
                  label: '👁️ すべて表示',
                  activeStyle:
                    'bg-cyan-500/30 border-[#00f2fe] text-white shadow-[0_0_12px_rgba(0,242,254,0.35)]',
                },
                {
                  id: 'hide_en',
                  label: '🙈 英語を隠す',
                  activeStyle:
                    'bg-rose-500/30 border-[#ff007f] text-pink-200 shadow-[0_0_12px_rgba(255,0,127,0.4)]',
                },
                {
                  id: 'hide_ja',
                  label: '🙊 意味を隠す',
                  activeStyle:
                    'bg-emerald-500/30 border-[#00ff88] text-emerald-200 shadow-[0_0_12px_rgba(0,255,136,0.35)]',
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMaskModeChange(m.id)}
                  className={`py-2.5 px-2 rounded-xl font-bold border transition-all text-center ${
                    maskMode === m.id
                      ? m.activeStyle
                      : 'bg-slate-900/70 border-cyan-900/60 text-slate-400 hover:text-cyan-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 単語帳ソース ＆ 付箋フィルター */}
          <div>
            <label className="block font-black text-cyan-300 text-xs sm:text-sm mb-2">
              📚 表示する単語帳・付箋フィルター
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFilterChange(() => setBookMode('all'))}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all text-center ${
                  bookMode === 'all'
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400'
                }`}
              >
                📚 デフォルト＋全単語
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange(() => setBookMode('my_book'))}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all text-center ${
                  bookMode === 'my_book'
                    ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400'
                }`}
              >
                ⭐ マイ単語帳のみ
              </button>
              <button
                type="button"
                onClick={() =>
                  handleFilterChange(() => setBookmarkedOnly((prev) => !prev))
                }
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all text-center ${
                  bookmarkedOnly
                    ? 'bg-pink-500/30 border-[#ff007f] text-pink-200 shadow-[0_0_12px_rgba(255,0,127,0.35)]'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400'
                }`}
              >
                🏷️ 付箋のみ絞り込み {bookmarkedOnly ? '(ON)' : '(OFF)'}
              </button>
            </div>
          </div>

          {/* 3. レベル絞り込み・1ページの表示件数・レイアウト切替 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                難易度レベル
              </label>
              <select
                value={levelFilter}
                onChange={(e) =>
                  handleFilterChange(() => setLevelFilter(e.target.value))
                }
                className="w-full bg-[#08061a] border border-cyan-700/70 rounded-xl px-2.5 py-2 text-xs text-cyan-200 focus:outline-none"
              >
                <option value="all">全レベル</option>
                <option value="basic">基礎 (共通テスト)</option>
                <option value="advanced">応用 (難関大)</option>
                <option value="toeic">TOEIC頻出</option>
                <option value="custom">カスタム</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                1ページの表示数
              </label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setOffset(0);
                }}
                className="w-full bg-[#08061a] border border-cyan-700/70 rounded-xl px-2.5 py-2 text-xs text-cyan-200 focus:outline-none"
              >
                <option value={20}>20語 / ページ</option>
                <option value={30}>30語 / ページ</option>
                <option value={50}>50語 / ページ</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                レイアウト形式
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#08061a] p-1 rounded-xl border border-cyan-800/60">
                <button
                  type="button"
                  onClick={() => setViewLayout('list')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewLayout === 'list'
                      ? 'bg-cyan-500/25 text-[#00f2fe] border border-[#00f2fe]/60'
                      : 'text-slate-400'
                  }`}
                >
                  📋 リスト
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('card')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewLayout === 'card'
                      ? 'bg-cyan-500/25 text-[#00f2fe] border border-[#00f2fe]/60'
                      : 'text-slate-400'
                  }`}
                >
                  🃏 カード
                </button>
              </div>
            </div>
          </div>

          {/* 4. しおりジャンプ＆完了ボタン */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-cyan-900/60">
            {studyPos.last_studied_word_id && (
              <button
                type="button"
                onClick={handleJumpToStudyPosition}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-[#00ff88] text-[#00ff88] font-bold text-xs transition-all"
              >
                🔖 前回のしおり位置 (No.{studyPos.last_studied_word_id}{' '}
                {studyPos.last_studied_word_spell || ''}) へ移動
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#00ff88] text-[#050311] font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(0,242,254,0.3)]"
            >
              設定を閉じて単語帳へ戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 専用モーダル版ラッパー（ホーム画面から直接「単語帳モード」を開く場合に使用）
 * 右上の「✕」ボタンのすぐ左側に「⚙️ 表示設定」ボタンを配置し、下部ページネーションと干渉しない設計
 */
export function VocabBookModal({ onClose, onWordSearched }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-4">
      <div className="glass-card border-2 border-[#ff007f] rounded-2xl sm:rounded-3xl p-3 sm:p-5 w-full max-w-4xl shadow-[0_0_45px_rgba(255,0,127,0.3)] relative font-mono h-[94dvh] sm:h-[90dvh] flex flex-col text-slate-100 overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-pink-800/60 pb-2 mb-2 shrink-0">
          <h3 className="text-xs sm:text-lg font-black text-[#ff80bf] flex items-center gap-1.5 sm:gap-2 truncate">
            <span>&gt; VOCAB_BOOK_MODE</span>
            <span className="text-[10px] sm:text-xs font-normal text-pink-200/80 hidden sm:inline">
              (赤シート・しおり・付箋付き単語帳)
            </span>
          </h3>

          {/* 右上アクション領域：✕ボタンの左側に「⚙️ 表示設定」ボタンを配置 */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSettingsOpen((prev) => !prev)}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-pink-950/80 hover:bg-pink-900 border border-[#ff007f] text-pink-200 hover:text-white shadow-[0_0_12px_rgba(255,0,127,0.35)] active:scale-95 transition-all flex items-center gap-1 text-[11px] sm:text-xs font-black"
              title="赤シート暗記・フィルター・表示設定を開く"
            >
              <span>⚙️</span>
              <span>表示設定</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-pink-400 hover:text-white font-black text-lg sm:text-xl px-2 py-0.5 transition-colors"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        </div>

        <VocabList
          onWordSearched={onWordSearched}
          embedded
          isSettingsOpen={isSettingsOpen}
          onSettingsOpenChange={setIsSettingsOpen}
        />
      </div>
    </div>
  );
}

export default VocabList;
