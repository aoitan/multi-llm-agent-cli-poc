import { chatWithOllama } from './ollamaApi';

interface Message {
  role: string;
  content: string;
}

export async function conductConsultation(
  userPrompt: string,
  model1: string,
  model2: string,
  cycles: number = 2 // Number of full cycles (Thinker -> Reviewer -> Improver)
): Promise<string> {
  let fullConversationHistory: Message[] = []; // Stores all messages for the entire consultation

  // Agent 1's internal message history
  let agent1Messages: Message[] = [];
  // Agent 2's internal message history
  let agent2Messages: Message[] = [];

  console.log('--- Consultation Start ---');

  // Add initial user prompt to full history
  fullConversationHistory.push({ role: 'user', content: `ユーザープロンプト: ${userPrompt}` });

  let lastAgent1Response = ''; // Stores the last output from Agent 1
  let lastAgent2Response = ''; // Stores the last output from Agent 2

  // --- Initial Turn: Agent 1 (思考者) ---
  console.log(`\n--- ターン 1 (思考者) ---`);
  const agent1InitialPrompt = `ユーザーのプロンプトに対して、あなたの素の思考で回答してください。`;
  agent1Messages.push({ role: 'user', content: agent1InitialPrompt + `\n\nユーザープロンプト:\n${userPrompt}` });

  console.log(`Agent 1 (${model1}) thinking...`);
  const res1_initial = await chatWithOllama(model1, agent1Messages);
  lastAgent1Response = res1_initial.message.content;
  console.log(`Agent 1 (${model1}): ${lastAgent1Response}`);
  agent1Messages.push({ role: 'assistant', content: lastAgent1Response });
  fullConversationHistory.push({ role: 'assistant', content: `Agent 1 (${model1}): ${lastAgent1Response}` });

  // --- Main Cycles (Reviewer -> Improver) ---
  for (let cycle = 0; cycle < cycles; cycle++) {
    console.log(`\n--- サイクル ${cycle + 1} (レビューと改善) ---`);

    // Turn for Agent 2 (批判的レビュアー)
    const agent2ReviewPrompt = `以下のAgent 1の回答を批判的にレビューし、改善点を見つけてください。`;
    agent2Messages.push({ role: 'user', content: agent2ReviewPrompt + `\n\nAgent 1の回答:\n${lastAgent1Response}` });

    console.log(`Agent 2 (${model2}) thinking... (役割: 批判的レビュアー)`);
    const res2 = await chatWithOllama(model2, agent2Messages);
    lastAgent2Response = res2.message.content;
    console.log(`Agent 2 (${model2}): ${lastAgent2Response}`);
    agent2Messages.push({ role: 'assistant', content: lastAgent2Response });
    fullConversationHistory.push({ role: 'assistant', content: `Agent 2 (${model2}): ${lastAgent2Response}` });

    // Turn for Agent 1 (指摘改善者)
    const agent1ImprovePrompt = `以下のレビューを参考に、あなたの以前の回答を改善してください。`;
    agent1Messages.push({ role: 'user', content: agent1ImprovePrompt + `\n\nレビュー:\n${lastAgent2Response}` + `\n\nあなたの以前の回答:\n${lastAgent1Response}` });

    console.log(`Agent 1 (${model1}) thinking... (役割: 指摘改善者)`);
    const res1_improved = await chatWithOllama(model1, agent1Messages);
    lastAgent1Response = res1_improved.message.content;
    console.log(`Agent 1 (${model1}): ${lastAgent1Response}`);
    agent1Messages.push({ role: 'assistant', content: lastAgent1Response });
    fullConversationHistory.push({ role: 'assistant', content: `Agent 1 (${model1}): ${lastAgent1Response}` });
  }

  console.log('--- Consultation End ---');

  // Final summarization
  console.log('--- 最終要約の生成 ---');
  const summaryPrompt = `以下の会話は、ユーザーのプロンプト「${userPrompt}」に対する議論です。この会話全体を要約し、最終的な結論や重要なポイントをまとめてください。`;

  const summaryInputMessages: Message[] = [
    { role: 'user', content: summaryPrompt },
    ...fullConversationHistory // Pass the entire conversation history for summarization
  ];

  const finalSummaryResponse = await chatWithOllama(model1, summaryInputMessages);
  const finalSummary = finalSummaryResponse.message.content;

  return `相談完了。最終要約:\n${finalSummary}`;
}