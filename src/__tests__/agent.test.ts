import { conductConsultation } from '../agent';
import { chatWithOllama } from '../ollamaApi';

// chatWithOllamaをモック化
jest.mock('../ollamaApi', () => ({
  chatWithOllama: jest.fn((model, messages, onContent, onDone, onError) => {
    // モックの応答を非同期でシミュレート
    process.nextTick(() => {
      const lastMessage = messages[messages.length - 1];
      let responseContent = '';
      if (lastMessage.content.includes('ユーザーのプロンプト')) {
        responseContent = '思考者の最初の回答';
      } else if (lastMessage.content.includes('思考者の回答を批判的にレビュー')) {
        responseContent = 'レビュアーのレビュー';
      } else if (lastMessage.content.includes('レビューを参考に、あなたの以前の回答を改善')) {
        responseContent = '思考者の改善された回答';
      } else if (lastMessage.content.includes('会話全体を要約')) {
        responseContent = '最終要約';
      }

      // コンテンツをチャンクに分割してコールバックを呼び出す
      const chunks = responseContent.split(''); // 1文字ずつチャンクとして扱う
      for (const chunk of chunks) {
        onContent(chunk);
      }
      onDone();
    });
  }),
}));

describe('conductConsultation', () => {
  const mockChatWithOllama = chatWithOllama as jest.MockedFunction<typeof chatWithOllama>;
  const model1 = 'test-model-1';
  const model2 = 'test-model-2';

  beforeEach(() => {
    // 各テストの前にモックをリセット
    mockChatWithOllama.mockClear(); // mockResetではなくmockClearを使用
  });

  test('should conduct a consultation with specified cycles and return a summary', async () => {
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
      ]),
      expect.any(Function), // onContent
      expect.any(Function), // onDone
      expect.any(Function)  // onError
    );

    // レビュアーのプロンプト (1サイクル目)
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      model2,
      expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: expect.any(String) }),
        expect.objectContaining({ role: 'user', content: expect.stringContaining('思考者の最初の回答') })
      ]),
      expect.any(Function), // onContent
      expect.any(Function), // onDone
      expect.any(Function)  // onError
    );

    // 思考者の改善プロンプト (1サイクル目)
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      model1,
      expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: expect.any(String) }),
        expect.objectContaining({ role: 'user', content: expect.stringContaining('レビュアーのレビュー') })
      ]),
      expect.any(Function), // onContent
      expect.any(Function), // onDone
      expect.any(Function)  // onError
    );

    // レビュアーのプロンプト (2サイクル目)
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      model2,
      expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: expect.any(String) }),
        expect.objectContaining({ role: 'user', content: expect.stringContaining('思考者の改善された回答') })
      ]),
      expect.any(Function), // onContent
      expect.any(Function), // onDone
      expect.any(Function)  // onError
    );

    // 思考者の改善プロンプト (2サイクル目)
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      model1,
      expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: expect.any(String) }),
        expect.objectContaining({ role: 'user', content: expect.stringContaining('レビュアーのレビュー') }) // 修正
      ]),
      expect.any(Function), // onContent
      expect.any(Function), // onDone
      expect.any(Function)  // onError
    );

    // 最終要約のプロンプト
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      model1,
      expect.arrayContaining([
        expect.objectContaining({ role: 'system', content: expect.stringContaining('あなたは会話の要約者です。') }), // Summarizer agent's system prompt
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining(
            `以下の会話は、ユーザーのプロンプト「${userPrompt}」に対する議論です。この会話全体を要約し、最終的な結論や重要なポイントをまとめてください。`
          ),
        }),
      ]),
      expect.any(Function), // onContent
      expect.any(Function), // onDone
      expect.any(Function)  // onError
    );

    // chatWithOllamaが合計6回呼び出されたことを確認 (初期思考者 + 2サイクル * 2エージェント + 要約)
    expect(mockChatWithOllama).toHaveBeenCalledTimes(6);
  });

  test('should handle 0 cycles correctly', async () => {
    const userPrompt = 'テストプロンプト';
    const cycles = 0;

    const result = await conductConsultation(userPrompt, model1, model2, cycles);

    expect(result).toContain('最終要約');
    expect(mockChatWithOllama).toHaveBeenCalledTimes(2); // 初期思考者 + 要約
  });
});