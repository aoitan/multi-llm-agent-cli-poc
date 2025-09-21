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
    .option('prompt-file', { // 新しいオプションを追加
      type: 'string',
      description: 'Path to a specific prompt file to use, bypassing scenario identification.',
    })
    .showHelpOnFail(false) // エラー時にヘルプメッセージを表示しない
    .exitProcess(false)   // エラー時にプロセスを終了しない
    .scriptName('')       // スクリプト名を出力しない
    .version(false)       // バージョンを出力しない
    .help(false)          // ヘルプメッセージを出力しない
    .parse();

  const userPrompt = argv['user-prompt'] as string;
  const model1 = (argv._[0] as string) || 'llama3:8b';
  const model2 = (argv._[1] as string) || 'llama3:8b';
  const workflowId = argv['workflow'] as string;
  const jsonOutput = argv['json'] as boolean;
  const specificPromptFile = argv['prompt-file'] as string; // 新しいオプションの値を取得

  if (!userPrompt) {
    console.error('Usage: npm start --user-prompt "<your_prompt>" [--workflow <workflow_id>]');
    process.exit(1);
  }

  let prompts: PromptFileContent;
  let workflows: WorkflowConfigFileContent;
  let actualWorkflowId: string;

  try {
    if (specificPromptFile) { // --prompt-file が指定された場合
      if (!jsonOutput) { // JSON出力でない場合のみログを出力
        console.log(`Using specific prompt file: ${specificPromptFile}, bypassing scenario identification.`);
      }
      prompts = await loadPromptFile(specificPromptFile);
      // specificPromptFile が指定された場合、workflowId は CLI オプションまたはデフォルト値を使用
      actualWorkflowId = workflowId;
    } else { // --prompt-file が指定されない場合、既存のシナリオ識別ロジックを使用
      // シナリオを識別
      const scenario = await identifyScenario(userPrompt); // 戻り値が Scenario オブジェクトに
      if (!jsonOutput) { // JSON出力でない場合のみログを出力
        console.log(`Identified scenario: ${scenario.id}`); // デバッグ用
      }

      // 識別されたシナリオに基づいてプロンプトセットをロード
      prompts = await loadPromptSetByScenarioId(scenario.id);

      // ワークフローIDの決定ロジック
      if (argv['workflow']) {
        actualWorkflowId = argv['workflow'] as string; // CLIオプションが優先
      } else if (scenario.default_workflow_id) {
        actualWorkflowId = scenario.default_workflow_id; // シナリオに紐づくデフォルトワークフロー
      } else {
        actualWorkflowId = 'code_review_and_refactor'; // フォールバック
      }
    }

    const workflowFilePath = path.resolve(process.cwd(), 'config', 'workflow_config.json');
    workflows = await loadWorkflowFile(workflowFilePath);

    const selectedWorkflow = workflows.workflows[actualWorkflowId];
    if (!selectedWorkflow) {
      throw new Error(`Workflow with ID '${actualWorkflowId}' not found in workflow_config.json.`);
    }

    const initialInput = { "user_input": userPrompt };

    // デバッグ用: APP_OLLAMA_URL の値を出力
    if (!jsonOutput) {
      console.log(`DEBUG: APP_OLLAMA_URL = ${process.env.APP_OLLAMA_URL}`);
    }

    // orchestrateWorkflow にロードされたプロンプトセットを渡す
    const result = await orchestrateWorkflow(selectedWorkflow, initialInput, prompts, jsonOutput);
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      // JSON出力でない場合の処理をここに記述 (例: console.log(result.finalOutput);)
      // 現在は何も出力しない設定なので、このままで良い
    }
  } catch (error) {
    console.error('An error occurred during workflow execution:', getErrorMessage(error));
    process.exit(1); // エラー発生時はプロセスを終了
  }
}

main();
