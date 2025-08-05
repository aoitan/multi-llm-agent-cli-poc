import { conductConsultation } from './agent';

async function main() {
  const args = process.argv.slice(2);
  const userPrompt = args[0];
  const model1 = args[1] || 'llama3:8b'; // Default to llama3:8b if not provided
  const model2 = args[2] || 'llama3:8b'; // Default to llama3:8b if not provided
  const cycles = parseInt(args[3] || '2', 10); // Default to 2 cycles if not provided

  if (!userPrompt) {
    console.error('Usage: ts-node src/cooperativeAgentEval.ts <your_prompt> [model1] [model2] [cycles]');
    process.exit(1);
  }

  console.log(`Starting cooperative agent evaluation for prompt: "${userPrompt}"`);
  console.log(`Using Agent 1: ${model1}, Agent 2: ${model2}, Cycles: ${cycles}`);

  try {
    const { finalSummary, discussionLog } = await conductConsultation(userPrompt, model1, model2, cycles);
    console.log('\n--- Cooperative Agent Result ---');
    console.log(finalSummary);
    console.log('\n--- Cooperative Agent Discussion Log Start ---');
    console.log(JSON.stringify(discussionLog, null, 2));
    console.log('--- Cooperative Agent Discussion Log End ---');
  } catch (error) {
    console.error('An error occurred during cooperative agent evaluation:', error);
  }
}

main();
