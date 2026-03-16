import {
  requiresJapaneseOutput,
  buildJapaneseRewritePrompt,
  getLanguageGuardConfig,
  LANGUAGE_GUARD_CONFIGS,
} from '../../guards/languageGuard';

describe('languageGuard', () => {
  describe('LANGUAGE_GUARD_CONFIGS', () => {
    it('should contain reviewer_agent config', () => {
      const config = LANGUAGE_GUARD_CONFIGS.find((c: { agentId: string }) => c.agentId === 'reviewer_agent');
      expect(config).toBeDefined();
      expect(config?.threshold).toBeGreaterThan(0);
      expect(config?.maxAttempts).toBeGreaterThan(0);
    });
  });

  describe('getLanguageGuardConfig', () => {
    it('should return config for known agentId', () => {
      const config = getLanguageGuardConfig('reviewer_agent');
      expect(config).toBeDefined();
      expect(config?.agentId).toBe('reviewer_agent');
    });

    it('should return undefined for unknown agentId', () => {
      const config = getLanguageGuardConfig('unknown_agent');
      expect(config).toBeUndefined();
    });
  });

  describe('requiresJapaneseOutput', () => {
    it('should return true when "日本語" is in sources', () => {
      expect(requiresJapaneseOutput('日本語で回答してください')).toBe(true);
    });

    it('should return true when "in japanese" is in sources (case-insensitive)', () => {
      expect(requiresJapaneseOutput('Please answer In Japanese')).toBe(true);
    });

    it('should return false when sources have no Japanese requirement', () => {
      expect(requiresJapaneseOutput('Please answer in English')).toBe(false);
    });

    it('should return false when all sources are undefined or empty', () => {
      expect(requiresJapaneseOutput(undefined, undefined)).toBe(false);
    });

    it('should handle multiple sources and return true if any contains "日本語"', () => {
      expect(requiresJapaneseOutput('Answer this:', '日本語で')).toBe(true);
    });
  });

  describe('buildJapaneseRewritePrompt', () => {
    it('should include retry count in the prompt', () => {
      const prompt = buildJapaneseRewritePrompt(1);
      expect(prompt).toContain('1');
    });

    it('should include Japanese instruction', () => {
      const prompt = buildJapaneseRewritePrompt(2);
      expect(prompt).toContain('日本語');
    });
  });
});
