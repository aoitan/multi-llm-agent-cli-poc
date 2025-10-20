import { orchestrateWorkflow } from '../agent';
import { chatWithOllama } from '../ollamaApi';
import { PromptFileContent } from '../utils/promptLoader';
import { WorkflowDefinition } from '../utils/workflowLoader';

jest.mock('../ollamaApi', () => ({
  chatWithOllama: jest.fn(),
}));

describe('language guard integration', () => {
  const mockChat = chatWithOllama as jest.MockedFunction<typeof chatWithOllama>;

  const prompts: PromptFileContent = {
    format_version: '1.0',
    prompts: [
      {
        id: 'REVIEWER_SYSTEM_PROMPT',
        description: '',
        content: 'あなたは批判的なレビュアーです。常に日本語で回答してください。',
      },
      {
        id: 'REVIEWER_PROMPT_TEMPLATE',
        description: '',
        content: 'レビューしてください。${userPrompt}',
      },
    ],
    agent_roles: {
      reviewer_agent: {
        system_prompt_id: 'REVIEWER_SYSTEM_PROMPT',
        description: 'レビュアー',
        model: 'mock-model',
      },
    },
  };

  const workflow: WorkflowDefinition = {
    description: 'test',
    initial_step: 'review_step',
    steps: [
      {
        id: 'review_step',
        type: 'agent_interaction',
        agent_id: 'reviewer_agent',
        prompt_id: 'REVIEWER_PROMPT_TEMPLATE',
        input_variables: { userPrompt: 'user_input' },
        output_variable: 'review_feedback',
        next_step: 'end',
      },
    ],
  };

  beforeEach(() => {
    mockChat.mockReset();
  });

  it('rescues non-Japanese reviewer responses by requesting a rewrite', async () => {
    mockChat.mockImplementationOnce((model, messages, onContent, onDone, onError) => {
      expect(model).toBe('mock-model');
      expect(messages[messages.length - 1].content).toContain('レビューしてください');
      return new Promise<void>(resolve => {
        process.nextTick(() => {
          try {
            onContent('This response is in English.');
            onDone();
          } catch (error) {
            onError(error as Error);
          }
          resolve();
        });
      });
    });

    mockChat.mockImplementationOnce((model, messages, onContent, onDone, onError) => {
      expect(model).toBe('mock-model');
      expect(messages[messages.length - 1].content).toContain('書き直してください');
      return new Promise<void>(resolve => {
        process.nextTick(() => {
          try {
            onContent('完全に日本語の応答です。');
            onDone();
          } catch (error) {
            onError(error as Error);
          }
          resolve();
        });
      });
    });

    const result = await orchestrateWorkflow(workflow, { user_input: 'テスト' }, prompts, true);

    expect(result.finalOutput.review_feedback).toBe('完全に日本語の応答です。');
    expect(mockChat).toHaveBeenCalledTimes(2);

    const languageLogs = result.discussionLog.filter(entry =>
      entry.turn.includes('language_check')
    );
    expect(languageLogs).toHaveLength(2);
    expect(languageLogs[0].response_received).toBe('日本語以外と判定');
    expect(languageLogs[1].response_received).toBe('日本語と判定');

    const retryEntry = result.discussionLog.find(entry => entry.turn.includes('retry 1'));
    expect(retryEntry?.response_received).toBe('完全に日本語の応答です。');
  });

  it('skips language guard when prompts request English output', async () => {
    const englishPrompts: PromptFileContent = {
      format_version: '1.0',
      prompts: [
        {
          id: 'REVIEWER_SYSTEM_PROMPT',
          description: '',
          content: 'You are a reviewer. Always respond in English.',
        },
        {
          id: 'REVIEWER_PROMPT_TEMPLATE',
          description: '',
          content: 'Review in English: ${userPrompt}',
        },
      ],
      agent_roles: {
        reviewer_agent: {
          system_prompt_id: 'REVIEWER_SYSTEM_PROMPT',
          description: 'レビュアー',
          model: 'mock-model',
        },
      },
    };

    mockChat.mockImplementationOnce((model, messages, onContent, onDone, onError) => {
      expect(model).toBe('mock-model');
      expect(messages[messages.length - 1].content).toContain('Review in English');
      return new Promise<void>(resolve => {
        process.nextTick(() => {
          try {
            onContent('This response stays in English.');
            onDone();
          } catch (error) {
            onError(error as Error);
          }
          resolve();
        });
      });
    });

    const result = await orchestrateWorkflow(
      workflow,
      { user_input: 'テスト' },
      englishPrompts,
      true
    );

    expect(result.finalOutput.review_feedback).toBe('This response stays in English.');
    expect(mockChat).toHaveBeenCalledTimes(1);
    const languageLogs = result.discussionLog.filter(entry =>
      entry.turn.includes('language_check')
    );
    expect(languageLogs).toHaveLength(0);
  });

  it('enforces Japanese rewrite for thinker when required', async () => {
    const thinkerPrompts: PromptFileContent = {
      format_version: '1.0',
      prompts: [
        {
          id: 'THINKER_SYSTEM_PROMPT',
          description: '',
          content:
            'あなたは日本語で回答することが義務付けられた思考者です。必ず日本語で回答してください。',
        },
        {
          id: 'THINKER_PROMPT_TEMPLATE',
          description: '',
          content: '日本語で回答: ${userPrompt}',
        },
      ],
      agent_roles: {
        thinker_improver_agent: {
          system_prompt_id: 'THINKER_SYSTEM_PROMPT',
          description: '思考者',
          model: 'mock-model',
        },
      },
    };

    const thinkerWorkflow: WorkflowDefinition = {
      description: 'thinker only',
      initial_step: 'thinker_step',
      steps: [
        {
          id: 'thinker_step',
          type: 'agent_interaction',
          agent_id: 'thinker_improver_agent',
          prompt_id: 'THINKER_PROMPT_TEMPLATE',
          input_variables: { userPrompt: 'user_input' },
          output_variable: 'thinker_output',
          next_step: 'end',
        },
      ],
    };

    mockChat.mockImplementationOnce((model, messages, onContent, onDone, onError) => {
      expect(model).toBe('mock-model');
      expect(messages[messages.length - 1].content).toContain('日本語で回答');
      return new Promise<void>(resolve => {
        process.nextTick(() => {
          try {
            onContent('Initial response in English.');
            onDone();
          } catch (error) {
            onError(error as Error);
          }
          resolve();
        });
      });
    });

    mockChat.mockImplementationOnce((model, messages, onContent, onDone, onError) => {
      expect(messages[messages.length - 1].content).toContain('書き直してください');
      return new Promise<void>(resolve => {
        process.nextTick(() => {
          try {
            onContent('完全に日本語で書き直した回答です。');
            onDone();
          } catch (error) {
            onError(error as Error);
          }
          resolve();
        });
      });
    });

    const result = await orchestrateWorkflow(
      thinkerWorkflow,
      { user_input: 'テスト' },
      thinkerPrompts,
      true
    );

    expect(result.finalOutput.thinker_output).toBe('完全に日本語で書き直した回答です。');
    expect(mockChat).toHaveBeenCalledTimes(2);
    const languageLogs = result.discussionLog.filter(entry =>
      entry.turn.includes('language_check')
    );
    expect(languageLogs).toHaveLength(2);
    expect(languageLogs[0].response_received).toBe('日本語以外と判定');
    expect(languageLogs[1].response_received).toBe('日本語と判定');
  });
});
