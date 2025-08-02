import { chatWithOllama } from './ollamaApi';

interface Message {
  role: string;
  content: string;
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

  public async sendMessage(userMessage: string): Promise<string> {
    this.messages.push({ role: 'user', content: userMessage });
    const response = await chatWithOllama(this.model, this.messages);
    const agentResponse = response.message.content;
    this.messages.push({ role: 'assistant', content: agentResponse });
    return agentResponse;
  }

  public getModel(): string {
    return this.model;
  }

  public getMessages(): Message[] {
    return this.messages;
  }
}

export async function conductConsultation(
  userPrompt: string,
  model1: string,
  model2: string,
  cycles: number = 2 // Number of full cycles (Thinker -> Reviewer -> Improver)
): Promise<string> {
  let fullConversationHistory: Message[] = []; // Stores all messages for the entire consultation

  // Define agent roles and create agents
  const thinkerImproverAgent = new Agent(
    model1,
    "あなたは思考者であり、指摘改善者です。ユーザーのプロンプトに対して深く思考し、回答を生成します。また、批判的レビュアーからの指摘を受けて、自身の回答を改善する役割も担います。"
  );
  const reviewerAgent = new Agent(
    model2,
    "あなたは批判的レビュアーです。思考者の回答を客観的かつ批判的に分析し、改善点や問題点を明確に指摘します。"
  );

  console.log('--- Consultation Start ---');

  // Add initial user prompt to full history
  fullConversationHistory.push({ role: 'user', content: `ユーザープロンプト: ${userPrompt}` });

  let lastThinkerImproverResponse = '';
  let lastReviewerResponse = '';

  // --- Initial Turn: Thinker (思考者) ---
  console.log(`\n--- ターン 1 (思考者) ---`);
  const thinkerInitialPrompt = `ユーザーのプロンプトに対して、あなたの素の思考で回答してください。

ユーザープロンプト:
${userPrompt}`;

  console.log(`Agent 1 (${thinkerImproverAgent.getModel()}) thinking...`);
  lastThinkerImproverResponse = await thinkerImproverAgent.sendMessage(thinkerInitialPrompt);
  console.log(`Agent 1 (${thinkerImproverAgent.getModel()}): ${lastThinkerImproverResponse}`);
  fullConversationHistory.push({ role: 'assistant', content: `Agent 1 (${thinkerImproverAgent.getModel()}): ${lastThinkerImproverResponse}` });

  // --- Main Cycles (Reviewer -> Improver) ---
  for (let cycle = 0; cycle < cycles; cycle++) {
    console.log(`\n--- サイクル ${cycle + 1} (レビューと改善) ---`);

    // Turn for Reviewer (批判的レビュアー)
    const reviewerPrompt = `以下の思考者の回答を批判的にレビューし、改善点を見つけてください。

思考者の回答:
${lastThinkerImproverResponse}`;

    console.log(`Agent 2 (${reviewerAgent.getModel()}) thinking... (役割: 批判的レビュアー)`);
    lastReviewerResponse = await reviewerAgent.sendMessage(reviewerPrompt);
    console.log(`Agent 2 (${reviewerAgent.getModel()}): ${lastReviewerResponse}`);
    fullConversationHistory.push({ role: 'assistant', content: `Agent 2 (${reviewerAgent.getModel()}): ${lastReviewerResponse}` });

    // Turn for Thinker/Improver (指摘改善者)
    const improverPrompt = `以下のレビューを参考に、あなたの以前の回答を改善してください。

レビュー:
${lastReviewerResponse}

あなたの以前の回答:
${lastThinkerImproverResponse}`;

    console.log(`Agent 1 (${thinkerImproverAgent.getModel()}) thinking... (役割: 指摘改善者)`);
    lastThinkerImproverResponse = await thinkerImproverAgent.sendMessage(improverPrompt);
    console.log(`Agent 1 (${thinkerImproverAgent.getModel()}): ${lastThinkerImproverResponse}`);
    fullConversationHistory.push({ role: 'assistant', content: `Agent 1 (${thinkerImproverAgent.getModel()}): ${lastThinkerImproverResponse}` });
  }

  console.log('--- Consultation End ---');

  // Final summarization
  console.log('--- 最終要約の生成 ---');
  const summaryPrompt = `以下の会話は、ユーザーのプロンプト「${userPrompt}」に対する議論です。この会話全体を要約し、最終的な結論や重要なポイントをまとめてください。`;

  // Create a temporary agent for summarization, or use one of the existing agents
  // For simplicity, let's use the thinkerImproverAgent for summarization
  const summarizerAgent = new Agent(
    model1,
    "あなたは会話の要約者です。与えられた会話履歴とユーザープロンプトに基づき、会話全体を要約し、最終的な結論や重要なポイントをまとめてください。"
  );

  const finalSummary = await summarizerAgent.sendMessage(summaryPrompt + '\n\n会話履歴:\n' + fullConversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n'));

  return `相談完了。最終要約:
${finalSummary}`; 
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
    const response = await chatWithOllama(model, messages);
    ensembleResponses.push(response.message.content);
  }
  return ensembleResponses;
}