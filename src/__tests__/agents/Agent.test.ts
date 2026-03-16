import { Agent } from '../../agents/Agent';

// chatWithOllama をモック化
jest.mock('../../ollamaApi', () => ({
  chatWithOllama: jest.fn((_model, _messages, onContent, onDone, _onError) => {
    process.nextTick(() => {
      onContent('Hello');
      onDone();
    });
  }),
}));

describe('Agent', () => {
  describe('constructor', () => {
    it('should initialize with model and systemPrompt', () => {
      const agent = new Agent('llama3:8b', 'You are a helper.');
      expect(agent.getModel()).toBe('llama3:8b');
    });

    it('should add system message to messages on init', () => {
      const agent = new Agent('llama3:8b', 'You are a helper.');
      const messages = agent.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({ role: 'system', content: 'You are a helper.' });
    });
  });

  describe('getModel', () => {
    it('should return the model name', () => {
      const agent = new Agent('mistral:7b', 'System');
      expect(agent.getModel()).toBe('mistral:7b');
    });
  });

  describe('getMessages', () => {
    it('should return a copy of messages (immutable)', () => {
      const agent = new Agent('llama3:8b', 'System');
      const messages = agent.getMessages();
      messages[0].content = 'tampered';
      // 内部状態が変わっていないこと
      expect(agent.getMessages()[0].content).toBe('System');
    });
  });

  describe('sendMessage', () => {
    it('should append user and assistant messages after sendMessage', async () => {
      const agent = new Agent('llama3:8b', 'You are a helper.');
      const chunks: string[] = [];
      const response = await agent.sendMessage('Hello agent', (chunk: string) => chunks.push(chunk));

      expect(response).toBe('Hello');
      expect(chunks).toEqual(['Hello']);

      const messages = agent.getMessages();
      // system + user + assistant
      expect(messages).toHaveLength(3);
      expect(messages[1]).toEqual({ role: 'user', content: 'Hello agent' });
      expect(messages[2]).toEqual({ role: 'assistant', content: 'Hello' });
    });
  });
});
