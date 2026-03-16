import { orchestrateWorkflow } from '../agent';
import { chatWithOllama } from '../ollamaApi';
import { PromptFileContent } from '../utils/promptLoader';
import { WorkflowDefinition } from '../utils/workflowLoader';

jest.mock('../ollamaApi', () => ({
  chatWithOllama: jest.fn(),
}));

function createReviewerWorkflow(): WorkflowDefinition {
  return {
    description: 'review workflow',
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
}

function createJapaneseReviewerPrompts(): PromptFileContent {
  return {
    format_version: '1.0',
    prompts: [
      {
        id: 'REVIEWER_SYSTEM_PROMPT',
        description: '',
        content: 'あなたは批判的なレビュアーです。必ず日本語で回答してください。',
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
}

function createEnglishReviewerPrompts(): PromptFileContent {
  return {
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
}

function mockStreamingResponse(
  mockChat: jest.MockedFunction<typeof chatWithOllama>,
  expectedPrompt: string,
  response: string
): void {
  mockChat.mockImplementationOnce((model, messages, onContent, onDone, onError) => {
    expect(model).toBe('mock-model');
    expect(messages[messages.length - 1].content).toContain(expectedPrompt);

    return new Promise<void>(resolve => {
      process.nextTick(() => {
        try {
          onContent(response);
          onDone();
        } catch (error) {
          onError(error as Error);
        }
        resolve();
      });
    });
  });
}

describe('orchestrateWorkflow', () => {
  const mockChat = chatWithOllama as jest.MockedFunction<typeof chatWithOllama>;

  beforeEach(() => {
    mockChat.mockReset();
  });

  // These tests describe the workflow contract so refactors preserve retry and guard behavior.
  it('completes successfully without retry when the first response is already Japanese', async () => {
    mockStreamingResponse(mockChat, 'レビューしてください', '完全に日本語の応答です。');

    const result = await orchestrateWorkflow(
      createReviewerWorkflow(),
      { user_input: 'テスト' },
      createJapaneseReviewerPrompts(),
      true
    );

    expect(result.finalOutput.review_feedback).toBe('完全に日本語の応答です。');
    expect(mockChat).toHaveBeenCalledTimes(1);

    const languageLogs = result.discussionLog.filter(entry =>
      entry.turn.includes('language_check')
    );
    expect(languageLogs).toHaveLength(1);
    expect(languageLogs[0].response_received).toBe('日本語と判定');
    expect(result.discussionLog.find(entry => entry.turn.includes('retry'))).toBeUndefined();
  });

  it('retries once when the first reviewer response is not Japanese', async () => {
    mockStreamingResponse(mockChat, 'レビューしてください', 'This response is in English.');
    mockStreamingResponse(mockChat, '書き直してください', '完全に日本語で書き直した応答です。');

    const result = await orchestrateWorkflow(
      createReviewerWorkflow(),
      { user_input: 'テスト' },
      createJapaneseReviewerPrompts(),
      true
    );

    expect(result.finalOutput.review_feedback).toBe('完全に日本語で書き直した応答です。');
    expect(mockChat).toHaveBeenCalledTimes(2);

    const languageLogs = result.discussionLog.filter(entry =>
      entry.turn.includes('language_check')
    );
    expect(languageLogs).toHaveLength(2);
    expect(languageLogs[0].response_received).toBe('日本語以外と判定');
    expect(languageLogs[1].response_received).toBe('日本語と判定');

    const retryEntries = result.discussionLog.filter(
      entry => entry.turn === 'Step 1 (review_step) retry 1'
    );
    expect(retryEntries).toHaveLength(1);
    expect(retryEntries[0].response_received).toBe('完全に日本語で書き直した応答です。');
  });

  it('skips the Japanese guard when the prompts explicitly require English output', async () => {
    mockStreamingResponse(mockChat, 'Review in English', 'This response stays in English.');

    const result = await orchestrateWorkflow(
      createReviewerWorkflow(),
      { user_input: 'テスト' },
      createEnglishReviewerPrompts(),
      true
    );

    expect(result.finalOutput.review_feedback).toBe('This response stays in English.');
    expect(mockChat).toHaveBeenCalledTimes(1);
    expect(
      result.discussionLog.filter(entry => entry.turn.includes('language_check'))
    ).toHaveLength(0);
    expect(result.discussionLog.find(entry => entry.turn.includes('retry'))).toBeUndefined();
  });

  it('fails fast when required initial input is missing', async () => {
    await expect(
      orchestrateWorkflow(
        createReviewerWorkflow(),
        {},
        createJapaneseReviewerPrompts(),
        true
      )
    ).rejects.toThrow(
      "Input variable 'userPrompt' expects 'user_input' but it's not provided in initial context."
    );

    expect(mockChat).not.toHaveBeenCalled();
  });

  it('propagates error when the LLM API fails', async () => {
    mockChat.mockImplementationOnce((_model, _messages, _onContent, _onDone, onError) => {
      return new Promise<void>(resolve => {
        process.nextTick(() => {
          onError(new Error('Ollama connection refused'));
          resolve();
        });
      });
    });

    await expect(
      orchestrateWorkflow(
        createReviewerWorkflow(),
        { user_input: 'テスト' },
        createJapaneseReviewerPrompts(),
        false
      )
    ).rejects.toThrow('Ollama connection refused');
  });

  it('throws when a required agent role is not configured', async () => {
    const brokenWorkflow: WorkflowDefinition = {
      description: 'broken workflow',
      initial_step: 'broken_step',
      steps: [
        {
          id: 'broken_step',
          type: 'agent_interaction',
          agent_id: 'nonexistent_agent',
          prompt_id: 'REVIEWER_PROMPT_TEMPLATE',
          input_variables: { userPrompt: 'user_input' },
          output_variable: 'result',
          next_step: 'end',
        },
      ],
    };

    await expect(
      orchestrateWorkflow(
        brokenWorkflow,
        { user_input: 'テスト' },
        createJapaneseReviewerPrompts(),
        false
      )
    ).rejects.toThrow("Agent role 'nonexistent_agent' not found.");

    expect(mockChat).not.toHaveBeenCalled();
  });
});
