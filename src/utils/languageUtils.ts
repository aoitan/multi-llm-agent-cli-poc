export interface LanguageDetectionOptions {
  threshold?: number;
}

const JAPANESE_CHAR_PATTERN = /[\u3041-\u309F\u30A0-\u30FF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\u3001-\u303F]/g;

/**
 * Calculates the ratio of characters that belong to typical Japanese ranges
 * (Hiragana, Katakana, CJK ideographs, Japanese punctuation) compared to all
 * non-whitespace characters in the input.
 */
export function calculateJapaneseCharacterRatio(input: string): number {
  if (!input) {
    return 0;
  }

  const normalized = input.normalize("NFKC");
  const characters = normalized.replace(/\s+/g, "");
  if (!characters) {
    return 0;
  }

  const matches = characters.match(JAPANESE_CHAR_PATTERN);
  const japaneseCount = matches ? matches.join("").length : 0;

  if (japaneseCount === 0) {
    return 0;
  }

  const ratio = japaneseCount / characters.length;
  return Math.max(0, Math.min(1, ratio));
}

export function isLikelyJapanese(input: string, options: LanguageDetectionOptions = {}): boolean {
  if (!input || input.trim().length === 0) {
    return false;
  }

  const threshold = options.threshold ?? 0.3;
  return calculateJapaneseCharacterRatio(input) >= threshold;
}
