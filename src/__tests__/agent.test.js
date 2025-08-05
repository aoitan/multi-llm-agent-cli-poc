"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const agent_1 = require("../agent");
const ollamaApi_1 = require("../ollamaApi");
// chatWithOllamaをモック化
jest.mock('../ollamaApi', () => ({
    chatWithOllama: jest.fn((model, messages, onContent, onDone, onError) => {
        // モックの応答を非同期でシミュレート
        process.nextTick(() => {
            const lastMessage = messages[messages.length - 1];
            let responseContent = '';
            if (lastMessage.content.includes('ユーザーのプロンプト')) {
                responseContent = '思考者の最初の回答';
            }
            else if (lastMessage.content.includes('思考者の回答を批判的にレビュー')) {
                responseContent = 'レビュアーのレビュー';
            }
            else if (lastMessage.content.includes('レビューを参考に、あなたの以前の回答を改善')) {
                responseContent = '思考者の改善された回答';
            }
            else if (lastMessage.content.includes('会話全体を要約')) {
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
    const mockChatWithOllama = ollamaApi_1.chatWithOllama;
    const model1 = 'test-model-1';
    const model2 = 'test-model-2';
    // モックのPromptFileContentを作成
    const mockPrompts = {
        format_version: '1.0',
        prompts: [
            { id: 'THINKER_IMPROVER_SYSTEM_PROMPT', description: '', content: 'あなたは思考者であり、指摘改善者です。' },
            { id: 'REVIEWER_SYSTEM_PROMPT', description: '', content: 'あなたは批判的レビュアーです。' },
            { id: 'THINKER_INITIAL_PROMPT_TEMPLATE', description: '', content: 'ユーザーのプロンプトに対して、あなたの素の思考で回答してください。\n--- 元のユーザープロンプト ---\n${userPrompt}\n---\n\nあなたの回答:' },
            { id: 'REVIEWER_PROMPT_TEMPLATE', description: '', content: '以下の思考者の回答を批判的にレビューし、改善点を見つけてください。\n--- 元のユーザープロンプト ---\n${userPrompt}\n---\n\n思考者の回答:\n${lastThinkerImproverResponse}' },
            { id: 'IMPROVER_PROMPT_TEMPLATE', description: '', content: '以下のレビューを参考に、あなたの以前の回答を改善してください。\n--- 元のユーザープロンプト ---\n${userPrompt}\n---\n\nレビュー:\n${lastReviewerResponse}\n\nあなたの以前の回答:\n${lastThinkerImproverResponse}' },
            { id: 'SUMMARIZER_SYSTEM_PROMPT', description: '', content: 'あなたは議論の結論を構造化して出力する専門家です。' },
            { id: 'FINAL_REPORT_TEMPLATE', description: '', content: '以下のレポートテンプレートの各セクションを、提供された「最終改善案」の内容に基づいて埋めてください。\nユーザープロンプト: ${userPrompt}\n最終改善案: ${finalAnswer}' },
        ],
    };
    beforeEach(() => {
        // 各テストの前にモックをリセット
        mockChatWithOllama.mockClear(); // mockResetではなくmockClearを使用
    });
    test('should conduct a consultation with specified cycles and return a summary', () => __awaiter(void 0, void 0, void 0, function* () {
        const userPrompt = 'テストプロンプト';
        const cycles = 2;
        const result = yield (0, agent_1.conductConsultation)(userPrompt, model1, model2, mockPrompts, cycles);
        // 最終要約が返されることを確認
        expect(result.finalSummary).toContain('最終要約');
        // chatWithOllamaが正しい引数で呼び出されたことを確認
        // 思考者の初期プロンプト
        expect(mockChatWithOllama).toHaveBeenCalledWith(model1, expect.arrayContaining([
            expect.objectContaining({ role: 'system', content: expect.any(String) }),
            expect.objectContaining({ role: 'user', content: expect.stringContaining(userPrompt) })
        ]), expect.any(Function), // onContent
        expect.any(Function), // onDone
        expect.any(Function) // onError
        );
        // レビュアーのプロンプト (1サイクル目)
        expect(mockChatWithOllama).toHaveBeenCalledWith(model2, expect.arrayContaining([
            expect.objectContaining({ role: 'system', content: expect.any(String) }),
            expect.objectContaining({ role: 'user', content: expect.stringContaining('思考者の最初の回答') })
        ]), expect.any(Function), // onContent
        expect.any(Function), // onDone
        expect.any(Function) // onError
        );
        // 思考者の改善プロンプト (1サイクル目)
        expect(mockChatWithOllama).toHaveBeenCalledWith(model1, expect.arrayContaining([
            expect.objectContaining({ role: 'system', content: expect.any(String) }),
            expect.objectContaining({ role: 'user', content: expect.stringContaining('レビュアーのレビュー') })
        ]), expect.any(Function), // onContent
        expect.any(Function), // onDone
        expect.any(Function) // onError
        );
        // レビュアーのプロンプト (2サイクル目)
        expect(mockChatWithOllama).toHaveBeenCalledWith(model2, expect.arrayContaining([
            expect.objectContaining({ role: 'system', content: expect.any(String) }),
            expect.objectContaining({ role: 'user', content: expect.stringContaining('思考者の改善された回答') })
        ]), expect.any(Function), // onContent
        expect.any(Function), // onDone
        expect.any(Function) // onError
        );
        // 思考者の改善プロンプト (2サイクル目)
        expect(mockChatWithOllama).toHaveBeenCalledWith(model1, expect.arrayContaining([
            expect.objectContaining({ role: 'system', content: expect.any(String) }),
            expect.objectContaining({ role: 'user', content: expect.stringContaining('レビュアーのレビュー') }) // 修正
        ]), expect.any(Function), // onContent
        expect.any(Function), // onDone
        expect.any(Function) // onError
        );
        // 最終要約のプロンプト
        expect(mockChatWithOllama).toHaveBeenCalledWith(model1, expect.arrayContaining([
            expect.objectContaining({ role: 'system', content: expect.stringContaining('あなたは会話の要約者です。') }), // Summarizer agent's system prompt
            expect.objectContaining({
                role: 'user',
                content: expect.stringContaining(`以下の会話は、ユーザーのプロンプト「${userPrompt}」に対する議論です。この会話全体を要約し、最終的な結論や重要なポイントをまとめてください。`),
            }),
        ]), expect.any(Function), // onContent
        expect.any(Function), // onDone
        expect.any(Function) // onError
        );
        // chatWithOllamaが合計6回呼び出されたことを確認 (初期思考者 + 2サイクル * 2エージェント + 要約)
        expect(mockChatWithOllama).toHaveBeenCalledTimes(6);
    }));
    test('should handle 0 cycles correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const userPrompt = 'テストプロンプト';
        const cycles = 0;
        const result = yield (0, agent_1.conductConsultation)(userPrompt, model1, model2, mockPrompts, cycles);
        expect(result.finalSummary).toContain('最終要約');
        expect(mockChatWithOllama).toHaveBeenCalledTimes(2); // 初期思考者 + 要約
    }));
});
