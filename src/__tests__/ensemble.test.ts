import { runEnsemble } from '../agent';
import { chatWithOllama } from '../ollamaApi';

jest.mock('../ollamaApi', () => ({
  chatWithOllama: jest.fn((model, messages, onContent, onDone, onError) => {
    process.nextTick(() => {
      const lastMessage = messages[messages.length - 1];
      let responseContent = '';
      if (model === 'model-a') {
        responseContent = 'Paris (from model-a)';
      } else if (model === 'model-b') {
        responseContent = 'Paris (from model-b)';
      } else if (model === 'model-c') {
        responseContent = 'Paris (from model-c)';
      }
      onContent(responseContent);
      onDone();
    });
  }),
}));

describe('runEnsemble', () => {
  const mockChatWithOllama = chatWithOllama as jest.MockedFunction<typeof chatWithOllama>;

  beforeEach(() => {
    mockChatWithOllama.mockClear();
  });

  test('should send the same prompt to multiple models and return their responses', async () => {
    const models = ['model-a', 'model-b', 'model-c'];
    const prompt = 'What is the capital of France?';

    const responses = await runEnsemble(prompt, models);

    expect(responses).toHaveLength(3);
    expect(responses[0]).toBe('Paris (from model-a)');
    expect(responses[1]).toBe('Paris (from model-b)');
    expect(responses[2]).toBe('Paris (from model-c)');

    expect(mockChatWithOllama).toHaveBeenCalledTimes(3);
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      'model-a',
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: prompt })
      ]),
      expect.any(Function), // onContent
      expect.any(Function), // onDone
      expect.any(Function)  // onError
    );
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      'model-b',
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: prompt })
      ]),
      expect.any(Function), // onContent
      expect.any(Function), // onDone
      expect.any(Function)  // onError
    );
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      'model-c',
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: prompt })
      ]),
      expect.any(Function), // onContent
      expect.any(Function), // onDone
      expect.any(Function)  // onError
    );
  });

  test('should return an empty array if no models are provided', async () => {
    const models: string[] = [];
    const prompt = 'Test prompt';

    const responses = await runEnsemble(prompt, models);

    expect(responses).toHaveLength(0);
    expect(mockChatWithOllama).not.toHaveBeenCalled();
  });
});
