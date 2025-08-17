import { orchestrateWorkflow } from './agent';
import { loadPromptFile, PromptFileContent } from './utils/promptLoader';
import { loadWorkflowFile, WorkflowConfigFileContent, WorkflowDefinition } from './utils/workflowLoader';
import { loadConfigFile, ConfigContent } from './utils/configLoader';
import { getErrorMessage } from './utils/errorUtils';
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
    .option('user-prompt', {
      type: 'string',
      description: 'The user prompt for the LLM.',
    })
    .option('workflow', {
      alias: 'w',
      type: 'string',
      description: 'ID of the workflow to execute from workflow_config.json',
      default: 'code_review_and_refactor',
    })
    .parse();

  const userPrompt = argv['user-prompt'] as string;
  const model1 = (argv._[0] as string) || 'llama3:8b';
  const model2 = (argv._[1] as string) || 'llama3:8b';
  const workflowId = argv['workflow'] as string;

  if (!userPrompt) {
    console.error('Usage: npm start --user-prompt "<your_prompt>" [--workflow <workflow_id>]');
    process.exit(1);
  }

  let prompts: PromptFileContent;
  let workflows: WorkflowConfigFileContent;

  try {
    const defaultPromptFilePath = path.resolve(process.cwd(), 'prompts', 'default_prompts.json');
    prompts = await loadPromptFile(defaultPromptFilePath);

    const workflowFilePath = path.resolve(process.cwd(), 'config', 'workflow_config.json');
    workflows = await loadWorkflowFile(workflowFilePath);

  } catch (error) {
    console.error(`Error loading configuration or prompt file: ${getErrorMessage(error)}`);
    process.exit(1);
  }

  const selectedWorkflow = workflows.workflows[workflowId];
  if (!selectedWorkflow) {
    console.error(`Workflow with ID '${workflowId}' not found in workflow_config.json.`);
    process.exit(1);
  }

  try {
    const initialInput = { "user_input": userPrompt };
    const result = await orchestrateWorkflow(selectedWorkflow, initialInput, prompts);
    console.log(JSON.stringify(result.finalOutput, null, 2));
  } catch (error) {
    console.error('An error occurred during workflow execution:', getErrorMessage(error));
  }
}

main();
