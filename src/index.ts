import { conductConsultation } from './agent';

async function main() {
  const args = process.argv.slice(2);
  const userPrompt = args[0];
  const model1 = args[1] || 'llama3:8b'; // Default to llama3:8b if not provided
  const model2 = args[2] || 'llama3:8b'; // Default to llama3:8b if not provided

  if (!userPrompt) {
    console.error('Usage: ts-node src/index.ts <your_prompt> [model1] [model2]');
    process.exit(1);
  }

  console.log(`Starting consultation for prompt: "${userPrompt}"`);
  console.log(`Using Agent 1: ${model1}, Agent 2: ${model2}`);

  try {
    const result = await conductConsultation(userPrompt, model1, model2);
    console.log('\n--- Final Consultation Result ---');
    console.log(result);
  } catch (error) {
    console.error('An error occurred during consultation:', error);
  }
}

main();
