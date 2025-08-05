import { chatWithOllama } from './ollamaApi';
import {
  THINKER_IMPROVER_SYSTEM_PROMPT,
  REVIEWER_SYSTEM_PROMPT,
  THINKER_INITIAL_PROMPT_TEMPLATE,
  REVIEWER_PROMPT_TEMPLATE,
  IMPROVER_PROMPT_TEMPLATE,
  SUMMARIZER_SYSTEM_PROMPT,
  FINAL_REPORT_TEMPLATE,
} from './prompts';

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
  cycles: number = 2
): Promise<{ finalSummary: string; discussionLog: DiscussionTurn[] }> {
  let fullConversationHistory: Message[] = [];
  const discussionLog: DiscussionTurn[] = []; // To store structured discussion

  // Define agent roles and create agents
  const thinkerImproverAgent = new Agent(
    model1,
    THINKER_IMPROVER_SYSTEM_PROMPT
  );
  const reviewerAgent = new Agent(
    model2,
    REVIEWER_SYSTEM_PROMPT
  );

  console.log('--- Consultation Start ---');

  // Add initial user prompt to full history
  fullConversationHistory.push({ role: 'user', content: `ユーザープロンプト: ${userPrompt}` });

  let lastThinkerImproverResponse = '';
  let lastReviewerResponse = '';

  // --- Initial Turn: Thinker (思考者) ---
  console.log(`\n--- ターン 1 (思考者) ---`);
  const thinkerInitialPrompt = THINKER_INITIAL_PROMPT_TEMPLATE(userPrompt);
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
    const reviewerPrompt = REVIEWER_PROMPT_TEMPLATE(userPrompt, lastThinkerImproverResponse);
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
    const improverPrompt = IMPROVER_PROMPT_TEMPLATE(
      userPrompt,
      lastReviewerResponse,
      lastThinkerImproverResponse
    );
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
  const summaryPrompt = FINAL_REPORT_TEMPLATE(
    userPrompt,
    lastThinkerImproverResponse
  );
  const summarizerAgent = new Agent(
    model1,
    SUMMARIZER_SYSTEM_PROMPT
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