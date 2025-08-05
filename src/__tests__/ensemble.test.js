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
jest.mock('../ollamaApi', () => ({
    chatWithOllama: jest.fn((model, messages, onContent, onDone, onError) => {
        process.nextTick(() => {
            const lastMessage = messages[messages.length - 1];
            let responseContent = '';
            if (model === 'model-a') {
                responseContent = 'Paris (from model-a)';
            }
            else if (model === 'model-b') {
                responseContent = 'Paris (from model-b)';
            }
            else if (model === 'model-c') {
                responseContent = 'Paris (from model-c)';
            }
            onContent(responseContent);
            onDone();
        });
    }),
}));
describe('runEnsemble', () => {
    const mockChatWithOllama = ollamaApi_1.chatWithOllama;
    beforeEach(() => {
        mockChatWithOllama.mockClear();
    });
    test('should send the same prompt to multiple models and return their responses', () => __awaiter(void 0, void 0, void 0, function* () {
        const models = ['model-a', 'model-b', 'model-c'];
        const prompt = 'What is the capital of France?';
        const responses = yield (0, agent_1.runEnsemble)(prompt, models);
        expect(responses).toHaveLength(3);
        expect(responses[0]).toBe('Paris (from model-a)');
        expect(responses[1]).toBe('Paris (from model-b)');
        expect(responses[2]).toBe('Paris (from model-c)');
        expect(mockChatWithOllama).toHaveBeenCalledTimes(3);
        expect(mockChatWithOllama).toHaveBeenCalledWith('model-a', expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: prompt })
        ]), expect.any(Function), // onContent
        expect.any(Function), // onDone
        expect.any(Function) // onError
        );
        expect(mockChatWithOllama).toHaveBeenCalledWith('model-b', expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: prompt })
        ]), expect.any(Function), // onContent
        expect.any(Function), // onDone
        expect.any(Function) // onError
        );
        expect(mockChatWithOllama).toHaveBeenCalledWith('model-c', expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: prompt })
        ]), expect.any(Function), // onContent
        expect.any(Function), // onDone
        expect.any(Function) // onError
        );
    }));
    test('should return an empty array if no models are provided', () => __awaiter(void 0, void 0, void 0, function* () {
        const models = [];
        const prompt = 'Test prompt';
        const responses = yield (0, agent_1.runEnsemble)(prompt, models);
        expect(responses).toHaveLength(0);
        expect(mockChatWithOllama).not.toHaveBeenCalled();
    }));
});
