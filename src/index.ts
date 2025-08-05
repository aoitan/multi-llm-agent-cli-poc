import { conductConsultation } from './agent';
import { loadPromptFile, PromptFileContent } from './utils/promptLoader';
import { loadConfigFile, ConfigContent } from './utils/configLoader';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as path from 'path';

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('config', {
      alias: 'c',
      type: 'string',
      description: 'Path to the configuration file',
    })
    .parse();

  const userPrompt = argv._[0] as string;
  const model1 = (argv._[1] as string) || 'llama3:8b'; // Default to llama3:8b if not provided
  const model2 = (argv._[2] as string) || 'llama3:8b'; // Default to llama3:8b if not provided

  if (!userPrompt) {
    console.error('Usage: npm start "<your_prompt>" [model1] [model2] [--config <config_file_path>]');
    process.exit(1);
  }

  console.log(`Starting consultation for prompt: "${userPrompt}"`);
  console.log(`Using Agent 1: ${model1}, Agent 2: ${model2}`);

  let prompts: PromptFileContent;
  if (argv.config) {
    const configFilePath = path.resolve(process.cwd(), argv.config);
    try {
      const config: ConfigContent = await loadConfigFile(configFilePath);
      const promptFilePath = path.resolve(path.dirname(configFilePath), config.prompt_file_path);
      prompts = await loadPromptFile(promptFilePath);
      console.log(`Loaded prompts from config file: ${configFilePath}`);
    } catch (error) {
      console.error(`Error loading configuration or prompt file: ${error.message}`);
      process.exit(1);
    }
  } else {
    // デフォルトプロンプトのロードはタスク4.5で実装
    console.warn('No config file specified. Default prompts will be used (once implemented in task 4.5).');
    // 仮のプロンプトを設定 (後で削除)
    prompts = {
      format_version: '1.0',
      prompts: [
        { id: 'thought_improver_agent_default', description: 'Default Thinker/Improver', content: 'Default Thinker/Improver Prompt' },
        { id: 'reviewer_agent_default', description: 'Default Reviewer', content: 'Default Reviewer Prompt' },
        { id: 'summarizer_agent_default', description: 'Default Summarizer', content: 'Default Summarizer Prompt' },
      ],
    };
  }

  try {
    // conductConsultation のシグネチャ変更が必要
    const result = await conductConsultation(userPrompt, model1, model2 /*, prompts */);
    console.log('\n--- Final Consultation Result ---');
    console.log(result);
  } catch (error) {
    console.error('An error occurred during consultation:', error);
  }
}

main();