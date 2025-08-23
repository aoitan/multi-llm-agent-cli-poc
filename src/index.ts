import { orchestrateWorkflow } from './agent';
import { loadPromptFile, PromptFileContent, loadPromptSetByScenarioId } from './utils/promptLoader';
import { loadWorkflowFile, WorkflowConfigFileContent, WorkflowDefinition } from './utils/workflowLoader';
import { loadConfigFile, ConfigContent } from './utils/configLoader';
import { getErrorMessage } from './utils/errorUtils';
import { identifyScenario, Scenario } from './utils/scenarioIdentifier';
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
    .option('json', {
      alias: 'j',
      type: 'boolean',
      description: 'Output results in JSON format',
      default: false,
    })
    .parse();

  const userPrompt = argv['user-prompt'] as string;
  const model1 = (argv._[0] as string) || 'llama3:8b';
  const model2 = (argv._[1] as string) || 'llama3:8b';
  const workflowId = argv['workflow'] as string;
  const jsonOutput = argv['json'] as boolean;

  if (!userPrompt) {
    console.error('Usage: npm start --user-prompt "<your_prompt>" [--workflow <workflow_id>]');
    process.exit(1);
  }

  let prompts: PromptFileContent;
  let workflows: WorkflowConfigFileContent;
  let actualWorkflowId: string;

  try {
    // シナリオを識別
    const scenario = await identifyScenario(userPrompt); // 戻り値が Scenario オブジェクトに
    console.log(`Identified scenario: ${scenario.id}`); // デバッグ用

    // 識別されたシナリオに基づいてプロンプトセットをロード
    prompts = await loadPromptSetByScenarioId(scenario.id);

    const workflowFilePath = path.resolve(process.cwd(), 'config', 'workflow_config.json');
    workflows = await loadWorkflowFile(workflowFilePath);

    // ワークフローIDの決定ロジック
    if (argv['workflow']) {
      actualWorkflowId = argv['workflow'] as string; // CLIオプションが優先
    } else if (scenario.default_workflow_id) {
      actualWorkflowId = scenario.default_workflow_id; // シナリオに紐づくデフォルトワークフロー
    } else {
      actualWorkflowId = 'code_review_and_refactor'; // フォールバック
    }

  } catch (error) {
    console.error(`Error loading configuration or prompt file: ${getErrorMessage(error)}`);
    process.exit(1);
  }

  const selectedWorkflow = workflows.workflows[actualWorkflowId]; // actualWorkflowId を使用
  if (!selectedWorkflow) {
    console.error(`Workflow with ID '${actualWorkflowId}' not found in workflow_config.json.`); // actualWorkflowId を使用
    process.exit(1);
  }

  try {
    const initialInput = { "user_input": userPrompt };
    // orchestrateWorkflow にロードされたプロンプトセットを渡す
    const result = await orchestrateWorkflow(selectedWorkflow, initialInput, prompts, jsonOutput);
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(JSON.stringify(result.finalOutput, null, 2));
    }
  } catch (error) {
    console.error('An error occurred during workflow execution:', getErrorMessage(error));
  }
}

main();
