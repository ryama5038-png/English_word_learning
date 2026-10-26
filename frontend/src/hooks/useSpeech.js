import { useState, useCallback, useEffect } from 'react';

/**
 * ブラウザ標準の Web Speech API (SpeechSynthesis) を利用した英単語音声読み上げカスタムフック
 */
export function useSpeech(defaultLang = 'en-US') {
  const [isSupported, setIsSupported] = useState(true);
  const [speakingText, setSpeakingText] = useState(null);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof window.SpeechSynthesisUtterance === 'undefined'
    ) {
      setIsSupported(false);
    }
  }, []);

  /**
   * 指定した英単語（テキスト）を音声読み上げする
   * @param {string} text - 読み上げる英単語・英文
   * @param {object} [options] - オプション ({ lang, rate, pitch, volume })
   * @returns {boolean} 再生を開始できたかどうか
   */
  const speak = useCallback(
    (text, options = {}) => {
      if (!text || typeof text !== 'string') return false;

      if (
        typeof window === 'undefined' ||
        !('speechSynthesis' in window) ||
        typeof window.SpeechSynthesisUtterance === 'undefined'
      ) {
        console.error(
          '[useSpeech] お使いのブラウザは Web Speech API (SpeechSynthesis) をサポートしていません。'
        );
        setIsSupported(false);
        return false;
      }

      try {
        const synth = window.speechSynthesis;

        // 連打対策（必須）: キューに溜まって遅延再生されるのを防ぐため、直前に必ず再生中の音声を停止
        synth.cancel();

        const utterance = new window.SpeechSynthesisUtterance(text.trim());
        const targetLang = options.lang || defaultLang || 'en-US';
        utterance.lang = targetLang;
        utterance.rate = options.rate ?? 0.95; // リスニング学習向けにわずかに聴き取りやすい速度
        utterance.pitch = options.pitch ?? 1.0;
        utterance.volume = options.volume ?? 1.0;

        // 英語ボイスが利用可能な場合は優先的に割り当て
        const voices = synth.getVoices ? synth.getVoices() : [];
        if (voices.length > 0) {
          const matchedVoice =
            voices.find((v) => v.lang === targetLang) ||
            voices.find((v) => v.lang && v.lang.startsWith('en-US')) ||
            voices.find((v) => v.lang && v.lang.startsWith('en'));
          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }
        }

        utterance.onstart = () => {
          setSpeakingText(text);
        };
        utterance.onend = () => {
          setSpeakingText((prev) => (prev === text ? null : prev));
        };
        utterance.onerror = (err) => {
          // cancel() による中断 ('interrupted' / 'canceled') は正常動作のためエラーログから除外
          if (err?.error !== 'interrupted' && err?.error !== 'canceled') {
            console.error('[useSpeech] SpeechSynthesis error:', err);
          }
          setSpeakingText(null);
        };

        synth.speak(utterance);
        return true;
      } catch (err) {
        console.error('[useSpeech] 音声の再生中にエラーが発生しました:', err);
        setSpeakingText(null);
        return false;
      }
    },
    [defaultLang]
  );

  /**
   * 再生中の音声を手動で停止する
   */
  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingText(null);
    }
  }, []);

  // コンポーネントのアンマウント時に再生中の音声をクリーンアップ
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    cancel,
    isSupported,
    speakingText,
  };
}

export default useSpeech;
