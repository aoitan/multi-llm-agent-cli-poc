import { runEnsemble } from './agent';

async function main() {
  const args = process.argv.slice(2);
  const userPrompt = args[0];
  const model = args[1] || 'llama3:8b'; // Default to llama3:8b if not provided

  if (!userPrompt) {
    console.error('Usage: ts-node src/singleAgentEval.ts <your_prompt> [model]');
    process.exit(1);
  }

  console.log(`Running single agent evaluation for prompt: "${userPrompt}"`);
  console.log(`Using model: ${model}`);

  try {
    const results = await runEnsemble(userPrompt, [model]);
    console.log('\n--- Single Agent Result ---');
    if (results.length > 0) {
      console.log(`Model ${model}:\n${results[0]}\n`);
    } else {
      console.log('No response from the model.');
    }
  } catch (error) {
    console.error('An error occurred during single agent evaluation:', error);
  }
}

main();
