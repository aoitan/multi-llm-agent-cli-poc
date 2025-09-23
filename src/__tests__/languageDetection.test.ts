import { calculateJapaneseCharacterRatio, isLikelyJapanese } from "../utils/languageUtils";

describe("language detection heuristics", () => {
  const japaneseText = "介護人材不足を解決する方法を説明してください。";
  const englishText = "Please describe solutions for caregiver shortages in Japan.";
  const mixedMostlyJapanese = "介護人材不足を解決する3つのアイデアを整理し、Plan A,Bを比較してください。";
  const mixedMostlyEnglish = "Summarize the report in English: 介護人材不足と政策対応についての要点を整理。";

  describe("calculateJapaneseCharacterRatio", () => {
    it("returns 1 for Japanese-only text", () => {
      expect(calculateJapaneseCharacterRatio(japaneseText)).toBeGreaterThan(0.9);
    });

    it("returns 0 for English-only text", () => {
      expect(calculateJapaneseCharacterRatio(englishText)).toBe(0);
    });

    it("returns higher ratio when Japanese characters dominate", () => {
      const ratio = calculateJapaneseCharacterRatio(mixedMostlyJapanese);
      expect(ratio).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(1);
    });

    it("handles empty or whitespace inputs", () => {
      expect(calculateJapaneseCharacterRatio("")).toBe(0);
      expect(calculateJapaneseCharacterRatio("   ")).toBe(0);
    });
  });

  describe("isLikelyJapanese", () => {
    it("recognizes Japanese text", () => {
      expect(isLikelyJapanese(japaneseText)).toBe(true);
    });

    it("rejects clearly English text", () => {
      expect(isLikelyJapanese(englishText)).toBe(false);
    });

    it("supports configurable thresholds", () => {
      expect(isLikelyJapanese(mixedMostlyEnglish, { threshold: 0.5 })).toBe(false);
      expect(isLikelyJapanese(mixedMostlyEnglish, { threshold: 0.2 })).toBe(true);
    });

    it("defaults to false for empty strings", () => {
      expect(isLikelyJapanese("")).toBe(false);
    });
  });
});
