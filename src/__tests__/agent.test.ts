import { conductConsultation } from '../agent';
import { chatWithOllama } from '../ollamaApi';

// chatWithOllamaをモック化
jest.mock('../ollamaApi', () => ({
  chatWithOllama: jest.fn(),
}));

describe('conductConsultation', () => {
  const mockChatWithOllama = chatWithOllama as jest.MockedFunction<typeof chatWithOllama>;
  const model1 = 'test-model-1';
  const model2 = 'test-model-2';

  beforeEach(() => {
    // 各テストの前にモックをリセット
    mockChatWithOllama.mockReset();
  });

  test('should conduct a consultation with specified cycles and return a summary', async () => {
    // モックの応答を設定
    mockChatWithOllama
      .mockResolvedValueOnce({ model: model1, created_at: '', done: true, message: { role: 'assistant', content: '思考者の最初の回答' } }) // 思考者の初期応答
      .mockResolvedValueOnce({ model: model2, created_at: '', done: true, message: { role: 'assistant', content: 'レビュアーのレビュー' } }) // レビュアーの応答 (1サイクル目)
      .mockResolvedValueOnce({ model: model1, created_at: '', done: true, message: { role: 'assistant', content: '思考者の改善された回答 (1回目)' } }) // 思考者の改善応答 (1サイクル目)
      .mockResolvedValueOnce({ model: model2, created_at: '', done: true, message: { role: 'assistant', content: 'レビュアーの2回目のレビュー' } }) // レビュアーの応答 (2サイクル目)
      .mockResolvedValueOnce({ model: model1, created_at: '', done: true, message: { role: 'assistant', content: '思考者の改善された回答 (2回目)' } }) // 思考者の改善応答 (2サイクル目)
      .mockResolvedValueOnce({ model: model1, created_at: '', done: true, message: { role: 'assistant', content: '最終要約' } }); // 最終要約

    const userPrompt = 'テストプロンプト';
    const cycles = 2;

    const result = await conductConsultation(userPrompt, model1, model2, cycles);

    // 最終要約が返されることを確認
    expect(result).toContain('最終要約');

    // chatWithOllamaが正しい引数で呼び出されたことを確認
    // 思考者の初期プロンプト
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      model1,
      expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: expect.any(String) }),
        expect.objectContaining({ role: 'user', content: expect.stringContaining(userPrompt) })
      ])
    );

    // レビュアーのプロンプト (1サイクル目)
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      model2,
      expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: expect.any(String) }),
        expect.objectContaining({ role: 'user', content: expect.stringContaining('思考者の最初の回答') })
      ])
    );

    // 思考者の改善プロンプト (1サイクル目)
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      model1,
      expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: expect.any(String) }),
        expect.objectContaining({ role: 'user', content: expect.stringContaining('レビュアーのレビュー') })
      ])
    );

    // レビュアーのプロンプト (2サイクル目)
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      model2,
      expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: expect.any(String) }),
        expect.objectContaining({ role: 'user', content: expect.stringContaining('思考者の改善された回答 (1回目)') })
      ])
    );

    // 思考者の改善プロンプト (2サイクル目)
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      model1,
      expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: expect.any(String) }),
        expect.objectContaining({ role: 'user', content: expect.stringContaining('レビュアーの2回目のレビュー') })
      ])
    );

    // 最終要約のプロンプト
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      model1,
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: expect.stringContaining('以下の会話は、ユーザーのプロンプト「テストプロンプト」に対する議論です。この会話全体を要約し、最終的な結論や重要なポイントをまとめてください。') }), // Summarizer agent's user prompt
        expect.objectContaining({ role: 'user', content: expect.stringContaining(`ユーザープロンプト: ${userPrompt}`) }), // Initial user prompt from fullConversationHistory
        expect.objectContaining({ role: 'assistant', content: expect.stringContaining(`Agent 1 (${model1}): 思考者の最初の回答`) }), // Thinker's first response from fullConversationHistory
        expect.objectContaining({ role: 'assistant', content: expect.stringContaining(`Agent 2 (${model2}): レビュアーのレビュー`) }), // Reviewer's first response from fullConversationHistory
        expect.objectContaining({ role: 'assistant', content: expect.stringContaining(`Agent 1 (${model1}): 思考者の改善された回答 (1回目)`) }), // Thinker's first improved response from fullConversationHistory
        expect.objectContaining({ role: 'assistant', content: expect.stringContaining(`Agent 2 (${model2}): レビュアーの2回目のレビュー`) }), // Reviewer's second response from fullConversationHistory
        expect.objectContaining({ role: 'assistant', content: expect.stringContaining(`Agent 1 (${model1}): 思考者の改善された回答 (2回目)`) }), // Thinker's second improved response from fullConversationHistory
      ])
    );

    // chatWithOllamaが合計6回呼び出されたことを確認 (初期思考者 + 2サイクル * 2エージェント + 要約)
    expect(mockChatWithOllama).toHaveBeenCalledTimes(6);
  });

  test('should handle 0 cycles correctly', async () => {
    mockChatWithOllama
      .mockResolvedValueOnce({ model: model1, created_at: '', done: true, message: { role: 'assistant', content: '思考者の最初の回答' } }) // 思考者の初期応答
      .mockResolvedValueOnce({ model: model1, created_at: '', done: true, message: { role: 'assistant', content: '最終要約' } }); // 最終要約

    const userPrompt = 'テストプロンプト';
    const cycles = 0;

    const result = await conductConsultation(userPrompt, model1, model2, cycles);

    expect(result).toContain('最終要約');
    expect(mockChatWithOllama).toHaveBeenCalledTimes(2); // 初期思考者 + 要約
  });
});