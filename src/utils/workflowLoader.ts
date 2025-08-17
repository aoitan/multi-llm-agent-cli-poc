import * as fs from 'fs';
import * as path from 'path';

export interface InputVariable {
  [key: string]: string | string[];
}

export interface AgentInteractionStep {
  id: string;
  type: "agent_interaction";
  agent_id: string;
  prompt_id: string;
  input_variables: InputVariable;
  output_variable?: string;
  next_step: string; // ステップID または "end"
}

export interface MultiAgentInteractionBranch {
  agent_id: string;
  prompt_id: string;
  input_variables: InputVariable;
  output_variable?: string;
}

export interface MultiAgentInteractionStep {
  id: string;
  type: "multi_agent_interaction";
  agents_to_run: MultiAgentInteractionBranch[];
  next_step: string; // ステップID または "end"
}

export type WorkflowStep = AgentInteractionStep | MultiAgentInteractionStep;

export interface WorkflowDefinition {
  description: string;
  initial_step: string;
  steps: WorkflowStep[];
}

export interface WorkflowConfigFileContent {
  workflows: {
    [key: string]: WorkflowDefinition;
  };
}

export async function loadWorkflowFile(filePath: string): Promise<WorkflowConfigFileContent> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Workflow file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    let parsedContent: any;
    try {
      parsedContent = JSON.parse(fileContent);
    } catch (jsonError) {
      throw new Error(`Invalid JSON format in ${filePath}: ${String(jsonError)}`);
    }

    // 基本的なスキーマ検証 (拡張可能)
    if (typeof parsedContent.workflows !== 'object' || parsedContent.workflows === null) {
      throw new Error(`Invalid schema in ${filePath}: Missing 'workflows' object.`);
    }

    return parsedContent as WorkflowConfigFileContent;

  } catch (error) {
    throw error;
  }
}
