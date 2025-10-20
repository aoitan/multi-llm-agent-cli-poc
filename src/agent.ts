import { chatWithOllama } from './ollamaApi';
import { PromptFileContent, getPromptById, getAgentRoleById } from './utils/promptLoader';
import { calculateJapaneseCharacterRatio, isLikelyJapanese } from './utils/languageUtils';

interface Message {
  role: string;
  content: string;
}

interface DiscussionTurn {
  turn: string;
  agent_role: string;
  prompt_sent: string;
  response_received: string;
}

interface LanguageGuardConfig {
  agentId: string;
  threshold: number;
  maxAttempts: number;
}

const DEFAULT_JAPANESE_THRESHOLD = 0.3;
const DEFAULT_RETRY_ATTEMPTS = 2;

const LANGUAGE_GUARD_CONFIGS: LanguageGuardConfig[] = [
  { agentId: 'reviewer_agent', threshold: 0.3, maxAttempts: 2 },
  { agentId: 'thinker_improver_agent', threshold: 0.3, maxAttempts: 1 },
  { agentId: 'summarizer_agent', threshold: 0.3, maxAttempts: 1 },
];

function getLanguageGuardConfig(agentId: string): LanguageGuardConfig | undefined {
  return LANGUAGE_GUARD_CONFIGS.find(config => config.agentId === agentId);
}

function requiresJapaneseOutput(...sources: Array<string | undefined>): boolean {
  const combined = sources.filter(Boolean).join(' ').toLowerCase();
  if (!combined) {
    return false;
  }

  if (combined.includes('日本語')) {
    return true;
  }

  return combined.includes('in japanese');
}

function buildJapaneseRewritePrompt(attempt: number): string {
  return [
    '直前の応答には日本語以外の要素が含まれています。',
    '直前に返した内容と同じ意味を保ちながら、英語の単語や文章を含めずに完全に日本語で書き直してください。',
    '必要に応じて語彙や表現を調整しても構いませんが、回答全体を日本語で提示してください。',
    `再試行回数: ${attempt}`,
  ].join('\n');
}

class Agent {
  private model: string;
  private systemPrompt: string;
  private messages: Message[];
  private temperature?: number;
  private jsonOutput: boolean; // Add jsonOutput property

  constructor(
    model: string,
    systemPrompt: string,
    temperature?: number,
    jsonOutput: boolean = false
  ) {
    // Add jsonOutput to constructor
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.messages = [{ role: 'system', content: systemPrompt }];
    this.temperature = temperature;
    this.jsonOutput = jsonOutput; // Store jsonOutput
  }

  public async sendMessage(
    userMessage: string,
    onContent: (content: string) => void
  ): Promise<string> {
    this.messages.push({ role: 'user', content: userMessage });
    let agentResponse = '';

    await new Promise<void>((resolve, reject) => {
      chatWithOllama(
        this.model,
        this.messages,
        contentChunk => {
          agentResponse += contentChunk;
          onContent(contentChunk);
        },
        () => {
          resolve();
        },
        error => {
          reject(error);
        },
        this.temperature,
        this.jsonOutput // Pass jsonOutput to chatWithOllama
      );
    });

    this.messages.push({ role: 'assistant', content: agentResponse });
    return agentResponse;
  }

  public getModel(): string {
    return this.model;
  }

  public getMessages(): Message[] {
    // Return a deep copy to prevent external mutation
    return this.messages.map(msg => ({ ...msg }));
  }
}

import {
  WorkflowDefinition,
  WorkflowStep,
  AgentInteractionStep,
  MultiAgentInteractionStep,
  InputVariable,
} from './utils/workflowLoader';

export async function orchestrateWorkflow(
  workflow: WorkflowDefinition,
  initialInput: { [key: string]: string },
  prompts: PromptFileContent,
  jsonOutput: boolean
): Promise<{ finalOutput: { [key: string]: string }; discussionLog: DiscussionTurn[] }> {
  const discussionLog: DiscussionTurn[] = [];
  const context: { [key: string]: string } = { ...initialInput }; // ステップ間で共有されるコンテキスト

  let currentStepId: string | undefined = workflow.initial_step;
  let stepCounter = 0;

  while (currentStepId && currentStepId !== 'end') {
    stepCounter++;
    const currentStep = workflow.steps.find(step => step.id === currentStepId);

    if (!currentStep) {
      throw new Error(`Workflow error: Step with ID '${currentStepId}' not found.`);
    }

    if (!jsonOutput) {
      process.stdout.write(
        `
## Step ${stepCounter}: ${currentStep.id} (${currentStep.type})
`
      );
    }

    if (currentStep.type === 'agent_interaction') {
      const step = currentStep as AgentInteractionStep;
      const agentRole = getAgentRoleById(prompts.agent_roles, step.agent_id);
      if (!agentRole) {
        throw new Error(`Agent role '${step.agent_id}' not found.`);
      }
      const systemPromptContent = getPromptById(
        prompts.prompts,
        agentRole.system_prompt_id
      )?.content;
      if (!systemPromptContent) {
        throw new Error(
          `System prompt '${agentRole.system_prompt_id}' not found for agent '${step.agent_id}'.`
        );
      }
      const agent = new Agent(
        agentRole.model,
        systemPromptContent,
        agentRole.temperature,
        jsonOutput
      ); // Pass jsonOutput to Agent constructor

      const promptTemplate = getPromptById(prompts.prompts, step.prompt_id)?.content;
      if (!promptTemplate) {
        throw new Error(`Prompt template '${step.prompt_id}' not found.`);
      }

      const filledPrompt = fillTemplate(
        promptTemplate,
        resolveInputVariables(step.input_variables, context)
      );

      const sendAgentPrompt = async (prompt: string, logLabel?: string): Promise<string> => {
        if (!jsonOutput) {
          process.stdout.write(`Agent (${step.agent_id}) prompt:
${prompt}
`);
          const labelSuffix = logLabel ? ` ${logLabel}` : '';
          process.stdout.write(
            `
### LLM Response (${agentRole.model})${labelSuffix}:
`
          );
        }
        const result = await agent.sendMessage(prompt, content => {
          if (!jsonOutput) {
            process.stdout.write(content);
          }
        });
        if (!jsonOutput) {
          process.stdout.write(
            `

--- End of LLM Response (${agentRole.model}) ---
`
          );
          process.stdout.write(`Timestamp: ${new Date().toISOString()}
`);
        }
        return result;
      };

      const initialResponse = await sendAgentPrompt(filledPrompt);
      let finalResponse = initialResponse;

      discussionLog.push({
        turn: `Step ${stepCounter} (${step.id})`,
        agent_role: agentRole.description,
        prompt_sent: filledPrompt,
        response_received: initialResponse,
      });

      const languageGuardConfig = getLanguageGuardConfig(step.agent_id);
      const shouldEnforceJapanese =
        languageGuardConfig && requiresJapaneseOutput(systemPromptContent, promptTemplate);

      if (languageGuardConfig && shouldEnforceJapanese) {
        const threshold = languageGuardConfig.threshold ?? DEFAULT_JAPANESE_THRESHOLD;
        const maxAttempts = languageGuardConfig.maxAttempts ?? DEFAULT_RETRY_ATTEMPTS;

        let attempt = 0;
        let ratio = calculateJapaneseCharacterRatio(finalResponse);
        let judgedJapanese = isLikelyJapanese(finalResponse, { threshold });

        const appendLanguageLog = (label: string, currentRatio: number, isJapanese: boolean) => {
          const suffix = label ? ` ${label}` : '';
          discussionLog.push({
            turn: `Step ${stepCounter} (${step.id}) language_check${suffix}`,
            agent_role: '日本語判定ガード',
            prompt_sent: `日本語判定: 比率=${currentRatio.toFixed(3)}, 閾値=${threshold}`,
            response_received: isJapanese ? '日本語と判定' : '日本語以外と判定',
          });
        };

        appendLanguageLog('', ratio, judgedJapanese);

        while (!judgedJapanese && attempt < maxAttempts) {
          attempt += 1;
          const rewritePrompt = buildJapaneseRewritePrompt(attempt);
          const retryResponse = await sendAgentPrompt(rewritePrompt, `(retry ${attempt})`);
          finalResponse = retryResponse;

          discussionLog.push({
            turn: `Step ${stepCounter} (${step.id}) retry ${attempt}`,
            agent_role: `${agentRole.description} (再指示)`,
            prompt_sent: rewritePrompt,
            response_received: retryResponse,
          });

          ratio = calculateJapaneseCharacterRatio(finalResponse);
          judgedJapanese = isLikelyJapanese(finalResponse, { threshold });
          appendLanguageLog(`retry ${attempt}`, ratio, judgedJapanese);
        }

        if (!judgedJapanese) {
          discussionLog.push({
            turn: `Step ${stepCounter} (${step.id}) language_check final`,
            agent_role: '日本語判定ガード',
            prompt_sent: `日本語判定: 比率=${ratio.toFixed(3)}, 閾値=${threshold}`,
            response_received: '最終的に日本語として判定できませんでした',
          });
        }
      }

      if (step.output_variable) {
        context[step.output_variable] = finalResponse;
      }

      currentStepId = step.next_step;
    } else if (currentStep.type === 'multi_agent_interaction') {
      const step = currentStep as MultiAgentInteractionStep;
      const parallelResponses: { [key: string]: string } = {};

      for (const branch of step.agents_to_run) {
        if (!jsonOutput) {
          process.stdout.write(
            `
## Running parallel branch for agent: ${branch.agent_id}
`
          );
        }
        const agentRole = getAgentRoleById(prompts.agent_roles, branch.agent_id);
        if (!agentRole) {
          throw new Error(`Agent role '${branch.agent_id}' not found.`);
        }
        const systemPromptContent = getPromptById(
          prompts.prompts,
          agentRole.system_prompt_id
        )?.content;
        if (!systemPromptContent) {
          throw new Error(
            `System prompt '${agentRole.system_prompt_id}' not found for agent '${branch.agent_id}'.`
          );
        }
        const agent = new Agent(
          agentRole.model,
          systemPromptContent,
          agentRole.temperature,
          jsonOutput
        ); // Pass jsonOutput to Agent constructor

        const promptTemplate = getPromptById(prompts.prompts, branch.prompt_id)?.content;
        if (!promptTemplate) {
          throw new Error(`Prompt template '${branch.prompt_id}' not found.`);
        }

        const filledPrompt = fillTemplate(
          promptTemplate,
          resolveInputVariables(branch.input_variables, context)
        );

        if (!jsonOutput) {
          process.stdout.write(`Agent (${branch.agent_id}) prompt:
${filledPrompt}
`);
          process.stdout.write(
            `
### LLM Response (${agentRole.model}):
`
          );
        }
        const response = await agent.sendMessage(filledPrompt, content => {
          if (!jsonOutput) {
            process.stdout.write(content);
          }
        });
        if (!jsonOutput) {
          process.stdout.write(
            `

--- End of LLM Response (${agentRole.model}) ---
`
          );
          process.stdout.write(`Timestamp: ${new Date().toISOString()}
`);
        }

        if (branch.output_variable) {
          parallelResponses[branch.output_variable] = response;
        }

        discussionLog.push({
          turn: `Step ${stepCounter} (Parallel: ${branch.agent_id})`,
          agent_role: agentRole.description,
          prompt_sent: filledPrompt,
          response_received: response,
        });
      }
      // Collect all parallel responses into context
      Object.assign(context, parallelResponses);
      currentStepId = step.next_step;
    } else {
      throw new Error(`Unknown step type: ${(currentStep as WorkflowStep).type}`);
    }
  }

  return { finalOutput: context, discussionLog };
}

function resolveInputVariables(
  inputVariables: InputVariable,
  context: { [key: string]: string }
): { [key: string]: string } {
  const resolved: { [key: string]: string } = {};
  for (const key in inputVariables) {
    if (Object.prototype.hasOwnProperty.call(inputVariables, key)) {
      const source = inputVariables[key];
      if (Array.isArray(source)) {
        resolved[key] = source
          .map(s => {
            if (s === 'user_input') {
              if (!context['user_input']) {
                throw new Error(
                  `Input variable '${key}' expects 'user_input' but it's not provided in initial context.`
                );
              }
              return context['user_input'];
            } else if (context[s] !== undefined) {
              return context[s];
            } else {
              throw new Error(`Input variable '${key}' source '${s}' not found in context.`);
            }
          })
          .join('\n\n');
      } else if (source === 'user_input') {
        if (!context['user_input']) {
          throw new Error(
            `Input variable '${key}' expects 'user_input' but it's not provided in initial context.`
          );
        }
        resolved[key] = context['user_input'];
      } else if (context[source] !== undefined) {
        resolved[key] = context[source];
      } else {
        throw new Error(`Input variable '${key}' source '${source}' not found in context.`);
      }
    }
  }
  return resolved;
}

export async function runEnsemble(prompt: string, models: string[]): Promise<string[]> {
  if (models.length === 0) {
    return [];
  }

  const ensembleResponses: string[] = [];
  for (const model of models) {
    const messages = [{ role: 'user', content: prompt }];
    let fullResponse = '';
    await new Promise<void>((resolve, reject) => {
      chatWithOllama(
        model,
        messages,
        contentChunk => {
          fullResponse += contentChunk;
        },
        () => {
          resolve();
        },
        error => {
          reject(error);
        }
        // jsonOutput は runEnsemble では使用しないため渡さない
      );
    });
    ensembleResponses.push(fullResponse);
  }
  return ensembleResponses;
}

export function fillTemplate(template: string, variables: { [key: string]: string }): string {
  let result = template;
  for (const key in variables) {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      const placeholder = `\\$\\{${key}\\}`;
      result = result.replace(new RegExp(placeholder, 'g'), variables[key]);
    }
  }
  return result;
}
