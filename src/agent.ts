import { chatWithOllama } from './ollamaApi';
import { PromptFileContent, getPromptById, getAgentRoleById, AgentRoleDefinition } from './utils/promptLoader';

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

class Agent {
  private model: string;
  private systemPrompt: string;
  private messages: Message[];
  private temperature?: number; // Add temperature property

  constructor(model: string, systemPrompt: string, temperature?: number) {
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.messages = [{ role: 'system', content: systemPrompt }];
    this.temperature = temperature; // Store temperature
  }

  public async sendMessage(userMessage: string, onContent: (content: string) => void): Promise<string> {
    this.messages.push({ role: 'user', content: userMessage });
    let agentResponse = '';

    await new Promise<void>((resolve, reject) => {
      chatWithOllama(
        this.model,
        this.messages,
        (contentChunk) => {
          agentResponse += contentChunk;
          onContent(contentChunk);
        },
        () => {
          resolve();
        },
        (error) => {
          reject(error);
        },
        this.temperature // Pass temperature to chatWithOllama
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



import { WorkflowDefinition, WorkflowStep, AgentInteractionStep, MultiAgentInteractionStep, InputVariable } from './utils/workflowLoader';

export async function orchestrateWorkflow(
  workflow: WorkflowDefinition,
  initialInput: { [key: string]: string },
  prompts: PromptFileContent
): Promise<{ finalOutput: { [key: string]: string }; discussionLog: DiscussionTurn[] }> {
  const discussionLog: DiscussionTurn[] = [];
  const context: { [key: string]: string } = { ...initialInput }; // ステップ間で共有されるコンテキスト

  let currentStepId: string | undefined = workflow.initial_step;
  let stepCounter = 0;

  while (currentStepId && currentStepId !== "end") {
    stepCounter++;
    const currentStep = workflow.steps.find(step => step.id === currentStepId);

    if (!currentStep) {
      throw new Error(`Workflow error: Step with ID '${currentStepId}' not found.`);
    }

    process.stdout.write(`\n--- Step ${stepCounter}: ${currentStep.id} (${currentStep.type}) ---\n`);

    if (currentStep.type === "agent_interaction") {
      const step = currentStep as AgentInteractionStep;
      const agentRole = getAgentRoleById(prompts.agent_roles, step.agent_id);
      if (!agentRole) {
        throw new Error(`Agent role '${step.agent_id}' not found.`);
      }
      const systemPromptContent = getPromptById(prompts.prompts, agentRole.system_prompt_id)?.content;
      if (!systemPromptContent) {
        throw new Error(`System prompt '${agentRole.system_prompt_id}' not found for agent '${step.agent_id}'.`);
      }
      const agent = new Agent(agentRole.model, systemPromptContent, agentRole.temperature);

      const promptTemplate = getPromptById(prompts.prompts, step.prompt_id)?.content;
      if (!promptTemplate) {
        throw new Error(`Prompt template '${step.prompt_id}' not found.`);
      }

      const filledPrompt = fillTemplate(promptTemplate, resolveInputVariables(step.input_variables, context));

      process.stdout.write(`Agent (${step.agent_id}) prompt:\n${filledPrompt}\n`);
      const response = await agent.sendMessage(filledPrompt, (content) => {
        process.stdout.write(content);
      });
      process.stdout.write('\n');

      if (step.output_variable) {
        context[step.output_variable] = response;
      }

      discussionLog.push({
        turn: `Step ${stepCounter} (${step.id})`,
        agent_role: agentRole.description,
        prompt_sent: filledPrompt,
        response_received: response,
      });

      currentStepId = step.next_step;

    } else if (currentStep.type === "multi_agent_interaction") {
      const step = currentStep as MultiAgentInteractionStep;
      const parallelResponses: { [key: string]: string } = {};

      for (const branch of step.agents_to_run) {
        process.stdout.write(`\n--- Running parallel branch for agent: ${branch.agent_id} ---\n`);
        const agentRole = getAgentRoleById(prompts.agent_roles, branch.agent_id);
        if (!agentRole) {
          throw new Error(`Agent role '${branch.agent_id}' not found.`);
        }
        const systemPromptContent = getPromptById(prompts.prompts, agentRole.system_prompt_id)?.content;
        if (!systemPromptContent) {
          throw new Error(`System prompt '${agentRole.system_prompt_id}' not found for agent '${branch.agent_id}'.`);
        }
        const agent = new Agent(agentRole.model, systemPromptContent, agentRole.temperature);

        const promptTemplate = getPromptById(prompts.prompts, branch.prompt_id)?.content;
        if (!promptTemplate) {
          throw new Error(`Prompt template '${branch.prompt_id}' not found.`);
        }

        const filledPrompt = fillTemplate(promptTemplate, resolveInputVariables(branch.input_variables, context));

        process.stdout.write(`Agent (${branch.agent_id}) prompt:\n${filledPrompt}\n`);
        const response = await agent.sendMessage(filledPrompt, (content) => {
          process.stdout.write(content);
        });
        process.stdout.write('\n');

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

function resolveInputVariables(inputVariables: InputVariable, context: { [key: string]: string }): { [key: string]: string } {
  const resolved: { [key: string]: string } = {};
  for (const key in inputVariables) {
    if (Object.prototype.hasOwnProperty.call(inputVariables, key)) {
      const source = inputVariables[key];
      if (Array.isArray(source)) {
        resolved[key] = source.map(s => {
          if (s === "user_input") {
            if (!context["user_input"]) {
              throw new Error(`Input variable '${key}' expects 'user_input' but it's not provided in initial context.`);
            }
            return context["user_input"];
          } else if (context[s] !== undefined) {
            return context[s];
          } else {
            throw new Error(`Input variable '${key}' source '${s}' not found in context.`);
          }
        }).join('\n\n');
      } else if (source === "user_input") {
        if (!context["user_input"]) {
          throw new Error(`Input variable '${key}' expects 'user_input' but it's not provided in initial context.`);
        }
        resolved[key] = context["user_input"];
      } else if (context[source] !== undefined) {
        resolved[key] = context[source];
      } else {
        throw new Error(`Input variable '${key}' source '${source}' not found in context.`);
      }
    }
  }
  return resolved;
}

export async function runEnsemble(

  prompt: string,
  models: string[]
): Promise<string[]> {
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
        (contentChunk) => {
          fullResponse += contentChunk;
        },
        () => {
          resolve();
        },
        (error) => {
          reject(error);
        }
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
