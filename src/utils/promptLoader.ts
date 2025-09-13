import * as fs from 'fs';
import * as path from 'path';

// プロンプト定義の型
export interface PromptDefinition {
  id: string;
  description: string;
  content: string;
}

// プロンプトファイル全体の型
export interface AgentRoleDefinition {
  system_prompt_id: string;
  description: string;
  model: string;
  temperature?: number;
}

// プロンプトファイル全体の型
export interface PromptFileContent {
  format_version: string;
  prompts: PromptDefinition[];
  agent_roles?: { [key: string]: AgentRoleDefinition }; // agent_rolesを追加
}

// シナリオ設定の型
interface ScenarioConfig {
  scenarios: {
    id: string;
    name: string;
    description: string;
    keywords: string[];
    default_workflow_id: string;
    prompt_file_path: string; // 追加
  }[];
  default_scenario_id: string;
}

let cachedScenarioConfig: ScenarioConfig | null = null;

async function loadScenarioConfig(): Promise<ScenarioConfig> {
  if (cachedScenarioConfig) {
    return cachedScenarioConfig;
  }
  const configPath = path.resolve(process.cwd(), 'config/scenario_config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('scenario_config.json not found');
  }
  const data = await fs.promises.readFile(configPath, 'utf8');
  let config: ScenarioConfig;
  try {
    config = JSON.parse(data);
  } catch (jsonError) {
    throw new Error('Invalid scenario_config.json format');
  }
  cachedScenarioConfig = config;
  return config;
}

/**
 * 指定されたパスのJSON形式のプロンプトファイルを読み込み、パースして返す。
 *
 * @param filePath プロンプトファイルの絶対パス
 * @returns Promise<PromptFileContent> プロンプトファイルの内容
 * @throws Error ファイルが見つからない、JSON形式が不正、スキーマが不正な場合
 */
export async function loadPromptFile(filePath: string): Promise<PromptFileContent> {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error('Prompt file not found');
  }
  try {
    const data = await fs.promises.readFile(absolutePath, 'utf8');
    let content: PromptFileContent;
    try {
      content = JSON.parse(data);
    } catch (jsonError) {
      throw new Error('Invalid JSON format');
    }

    // スキーマ検証 (簡易版)
    if (
      !content ||
      typeof content.format_version !== 'string' || // typeof を追加
      content.format_version !== '1.0' ||
      !Array.isArray(content.prompts)
    ) {
      throw new Error('Invalid schema');
    }

    // プロンプト定義のバリデーション
    for (const prompt of content.prompts) {
      if (typeof prompt.id !== 'string' || typeof prompt.description !== 'string' || typeof prompt.content !== 'string') {
        throw new Error('Invalid prompt definition');
      }
    }
    return content;
  } catch (error) {
    console.error(`Error loading prompt file ${filePath}:`, error);
    throw error;
  }
}

export async function loadPromptSetByScenarioId(scenarioId: string): Promise<PromptFileContent> {
  const scenarioConfig = await loadScenarioConfig();
  const promptFilePath =
    scenarioConfig.scenarios.find(s => s.id === scenarioId)?.prompt_file_path ||
    scenarioConfig.scenarios.find(s => s.id === scenarioConfig.default_scenario_id)?.prompt_file_path;

  if (!promptFilePath) {
    throw new Error(`Prompt file path not found for scenario: ${scenarioId}`);
  }
  return loadPromptFile(promptFilePath);
}

/**
 * プロンプトIDに基づいて特定のプロンプト定義を検索する。
 *
 * @param prompts プロンプト定義の配列
 * @param id 検索するプロンプトのID
 * @returns PromptDefinition | undefined 見つかったプロンプト定義、またはundefined
 */
export function getPromptById(prompts: PromptDefinition[], id: string): PromptDefinition | undefined {
  return prompts.find(prompt => prompt.id === id);
}

/**
 * エージェントロールIDに基づいて特定のエージェントロール定義を検索する。
 *
 * @param agentRoles エージェントロール定義のマップ
 * @param id 検索するエージェントロールのID
 * @returns AgentRoleDefinition | undefined 見つかったエージェントロール定義、またはundefined
 */
export function getAgentRoleById(
  agentRoles: { [key: string]: AgentRoleDefinition } | undefined,
  id: string
): AgentRoleDefinition | undefined {
  if (!agentRoles) {
    return undefined;
  }
  return agentRoles[id];
}