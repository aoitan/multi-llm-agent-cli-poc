import { orchestrateWorkflow } from './agent';
import { loadPromptSetByScenarioId } from './utils/promptLoader';
import { loadWorkflowFile } from './utils/workflowLoader';
import { identifyScenario } from './utils/scenarioIdentifier';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);
  const userPrompt = args[0];
  const workflowId = args[1] || 'code_review_and_refactor';

  if (!userPrompt) {
    console.error(
      'Usage: ts-node src/cooperativeAgentEval.ts <your_prompt> [workflowId]'
    );
    process.exit(1);
  }

  console.log(`Starting cooperative agent evaluation for prompt: "${userPrompt}"`);
  console.log(`Using workflow: ${workflowId}`);

  try {
    const scenario = await identifyScenario(userPrompt);
    const prompts = await loadPromptSetByScenarioId(scenario.id);

    const workflowFilePath = path.resolve(process.cwd(), 'config', 'workflow_config.json');
    const workflowConfig = await loadWorkflowFile(workflowFilePath);
    if (!Object.prototype.hasOwnProperty.call(workflowConfig.workflows, workflowId)) {
      throw new Error(`Workflow '${workflowId}' not found in workflow_config.json.`);
    }
    const workflow = workflowConfig.workflows[workflowId];

    const { finalOutput, discussionLog } = await orchestrateWorkflow(
      workflow,
      { user_input: userPrompt },
      prompts,
      false
    );

    console.log('\n--- Cooperative Agent Result ---');
    console.log(JSON.stringify(finalOutput, null, 2));
    console.log('\n--- Discussion Log ---');
    console.log(JSON.stringify(discussionLog, null, 2));
  } catch (error) {
    console.error('An error occurred during cooperative agent evaluation:', error);
  }
}

main();
