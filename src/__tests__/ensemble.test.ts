import { runEnsemble } from '../agent';
import { chatWithOllama } from '../ollamaApi';

jest.mock('../ollamaApi', () => ({
  chatWithOllama: jest.fn(),
}));

describe('runEnsemble', () => {
  const mockChatWithOllama = chatWithOllama as jest.MockedFunction<typeof chatWithOllama>;

  beforeEach(() => {
    mockChatWithOllama.mockReset();
  });

  test('should send the same prompt to multiple models and return their responses', async () => {
    const models = ['model-a', 'model-b', 'model-c'];
    const prompt = 'What is the capital of France?';

    mockChatWithOllama
      .mockResolvedValueOnce({ model: 'model-a', created_at: '', done: true, message: { role: 'assistant', content: 'Paris (from model-a)' } })
      .mockResolvedValueOnce({ model: 'model-b', created_at: '', done: true, message: { role: 'assistant', content: 'Paris (from model-b)' } })
      .mockResolvedValueOnce({ model: 'model-c', created_at: '', done: true, message: { role: 'assistant', content: 'Paris (from model-c)' } });

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
      ])
    );
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      'model-b',
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: prompt })
      ])
    );
    expect(mockChatWithOllama).toHaveBeenCalledWith(
      'model-c',
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: prompt })
      ])
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
