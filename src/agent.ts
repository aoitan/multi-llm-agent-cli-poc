import { chatWithOllama } from './ollamaApi';
import { PromptFileContent, getPromptById } from './utils/promptLoader';

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

  constructor(model: string, systemPrompt: string) {
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.messages = [{ role: 'system', content: systemPrompt }];
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
        }
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

export async function conductConsultation(
  userPrompt: string,
  model1: string,
  model2: string,
  prompts: PromptFileContent,
  cycles: number = 2
): Promise<{ finalSummary: string; discussionLog: DiscussionTurn[] }> {
  let fullConversationHistory: Message[] = [];
  const discussionLog: DiscussionTurn[] = []; // To store structured discussion

  // Define agent roles and create agents
  const thinkerImproverSystemPrompt = getPromptById(prompts.prompts, 'THINKER_IMPROVER_SYSTEM_PROMPT')?.content;
  const reviewerSystemPrompt = getPromptById(prompts.prompts, 'REVIEWER_SYSTEM_PROMPT')?.content;

  if (!thinkerImproverSystemPrompt || !reviewerSystemPrompt) {
    throw new Error('Required system prompts not found in the provided prompt file.');
  }

  const thinkerImproverAgent = new Agent(
    model1,
    thinkerImproverSystemPrompt
  );
  const reviewerAgent = new Agent(
    model2,
    reviewerSystemPrompt
  );

  console.log('--- Consultation Start ---');

  // Add initial user prompt to full history
  fullConversationHistory.push({ role: 'user', content: `ユーザープロンプト: ${userPrompt}` });

  let lastThinkerImproverResponse = '';
  let lastReviewerResponse = '';

  // --- Initial Turn: Thinker (思考者) ---
  console.log(`\n--- ターン 1 (思考者) ---`);
  const thinkerInitialPromptTemplate = getPromptById(prompts.prompts, 'THINKER_INITIAL_PROMPT_TEMPLATE')?.content;
  if (!thinkerInitialPromptTemplate) {
    throw new Error('THINKER_INITIAL_PROMPT_TEMPLATE not found in the provided prompt file.');
  }
  const thinkerInitialPrompt = thinkerInitialPromptTemplate.replace('${userPrompt}', userPrompt);
  lastThinkerImproverResponse = await thinkerImproverAgent.sendMessage(thinkerInitialPrompt, (content) => {
    process.stdout.write(content);
  });
  process.stdout.write('\n');
  discussionLog.push({
    turn: "ターン 1 (思考者)",
    agent_role: "思考者",
    prompt_sent: thinkerInitialPrompt,
    response_received: lastThinkerImproverResponse,
  });
  fullConversationHistory.push({ role: 'assistant', content: `Agent 1 (${thinkerImproverAgent.getModel()}): ${lastThinkerImproverResponse}` });

  // --- Main Cycles (Reviewer -> Improver) ---
  for (let cycle = 0; cycle < cycles; cycle++) {
    console.log(`\n--- サイクル ${cycle + 1} (レビューと改善) ---`);

    // Turn for Reviewer (批判的レビュアー)
    const reviewerPromptTemplate = getPromptById(prompts.prompts, 'REVIEWER_PROMPT_TEMPLATE')?.content;
    if (!reviewerPromptTemplate) {
      throw new Error('REVIEWER_PROMPT_TEMPLATE not found in the provided prompt file.');
    }
    const reviewerPrompt = reviewerPromptTemplate
      .replace('${userPrompt}', userPrompt)
      .replace('${lastThinkerImproverResponse}', lastThinkerImproverResponse);
    console.log(`Agent 2 (${reviewerAgent.getModel()}) thinking... (役割: 批判的レビュアー)`);
    lastReviewerResponse = await reviewerAgent.sendMessage(reviewerPrompt, (content) => {
      process.stdout.write(content);
    });
    process.stdout.write('\n');
    discussionLog.push({
      turn: `サイクル ${cycle + 1} (レビュアー)`,
      agent_role: "批判的レビュアー",
      prompt_sent: reviewerPrompt,
      response_received: lastReviewerResponse,
    });
    fullConversationHistory.push({ role: 'assistant', content: `Agent 2 (${reviewerAgent.getModel()}): ${lastReviewerResponse}` });
    

    // Turn for Thinker/Improver (指摘改善者)
    const improverPromptTemplate = getPromptById(prompts.prompts, 'IMPROVER_PROMPT_TEMPLATE')?.content;
    if (!improverPromptTemplate) {
      throw new Error('IMPROVER_PROMPT_TEMPLATE not found in the provided prompt file.');
    }
    const improverPrompt = improverPromptTemplate
      .replace('${userPrompt}', userPrompt)
      .replace('${lastReviewerResponse}', lastReviewerResponse)
      .replace('${lastThinkerImproverResponse}', lastThinkerImproverResponse);
    console.log(`Agent 1 (${thinkerImproverAgent.getModel()}) thinking... (役割: 指摘改善者)`);
    lastThinkerImproverResponse = await thinkerImproverAgent.sendMessage(improverPrompt, (content) => {
      process.stdout.write(content);
    });
    process.stdout.write('\n');
    discussionLog.push({
      turn: `サイクル ${cycle + 1} (改善者)`,
      agent_role: "指摘改善者",
      prompt_sent: improverPrompt,
      response_received: lastThinkerImproverResponse,
    });
    fullConversationHistory.push({ role: 'assistant', content: `Agent 1 (${thinkerImproverAgent.getModel()}): ${lastThinkerImproverResponse}` });
  }

  console.log('--- Consultation End ---');

  // Final summarization
  console.log('--- 最終要約の生成 ---');
  const summarizerSystemPrompt = getPromptById(prompts.prompts, 'SUMMARIZER_SYSTEM_PROMPT')?.content;
  const finalReportTemplate = getPromptById(prompts.prompts, 'FINAL_REPORT_TEMPLATE')?.content;

  if (!summarizerSystemPrompt || !finalReportTemplate) {
    throw new Error('Required summarizer prompts not found in the provided prompt file.');
  }

  const summaryPrompt = finalReportTemplate
    .replace('${userPrompt}', userPrompt)
    .replace('${finalAnswer}', lastThinkerImproverResponse);

  const summarizerAgent = new Agent(
    model1,
    summarizerSystemPrompt
  );

  const finalSummary = await summarizerAgent.sendMessage(summaryPrompt, (content) => {
    process.stdout.write(content);
  });
  process.stdout.write('\n');
  discussionLog.push({
    turn: "最終要約",
    agent_role: "要約者",
    prompt_sent: summaryPrompt,
    response_received: finalSummary,
  });

  return { finalSummary, discussionLog };
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