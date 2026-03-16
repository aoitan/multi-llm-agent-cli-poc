export interface LanguageGuardConfig {
  agentId: string;
  threshold: number;
  maxAttempts: number;
}

export const DEFAULT_JAPANESE_THRESHOLD = 0.3;
export const DEFAULT_RETRY_ATTEMPTS = 2;

export const LANGUAGE_GUARD_CONFIGS: LanguageGuardConfig[] = [
  { agentId: 'reviewer_agent', threshold: DEFAULT_JAPANESE_THRESHOLD, maxAttempts: DEFAULT_RETRY_ATTEMPTS },
  { agentId: 'thinker_improver_agent', threshold: DEFAULT_JAPANESE_THRESHOLD, maxAttempts: 1 },
  { agentId: 'summarizer_agent', threshold: DEFAULT_JAPANESE_THRESHOLD, maxAttempts: 1 },
];

export function getLanguageGuardConfig(agentId: string): LanguageGuardConfig | undefined {
  return LANGUAGE_GUARD_CONFIGS.find(config => config.agentId === agentId);
}

export function requiresJapaneseOutput(...sources: Array<string | undefined>): boolean {
  const combined = sources.filter(Boolean).join(' ').toLowerCase();
  if (!combined) {
    return false;
  }
  if (combined.includes('日本語')) {
    return true;
  }
  return combined.includes('in japanese');
}

export function buildJapaneseRewritePrompt(attempt: number): string {
  return [
    '直前の応答には日本語以外の要素が含まれています。',
    '直前に返した内容と同じ意味を保ちながら、英語の単語や文章を含めずに完全に日本語で書き直してください。',
    '必要に応じて語彙や表現を調整しても構いませんが、回答全体を日本語で提示してください。',
    `再試行回数: ${attempt}`,
  ].join('\n');
}
