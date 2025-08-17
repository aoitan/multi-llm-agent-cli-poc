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

/**
 * 指定されたパスのJSON形式のプロンプトファイルを読み込み、パースして返す。
 *
 * @param filePath プロンプトファイルの絶対パス
 * @returns Promise<PromptFileContent> プロンプトファイルの内容
 * @throws Error ファイルが見つからない、JSON形式が不正、スキーマが不正な場合
 */
export async function loadPromptFile(filePath: string): Promise<PromptFileContent> {
  try {
    // ファイルの存在チェック
    if (!fs.existsSync(filePath)) {
      throw new Error(`Prompt file not found: ${filePath}`);
    }

    // ファイルの読み込み
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // JSONパース
    let parsedContent: any;
    try {
      parsedContent = JSON.parse(fileContent);
    } catch (jsonError) {
      throw new Error(`Invalid JSON format in ${filePath}: ${String(jsonError)}`);
    }

    // スキーマ検証
    if (
      typeof parsedContent.format_version !== 'string' ||
      !Array.isArray(parsedContent.prompts)
    ) {
      throw new Error(`Invalid schema in ${filePath}: Missing format_version or prompts array.`);
    }

    for (const prompt of parsedContent.prompts) {
      if (
        typeof prompt.id !== 'string' ||
        typeof prompt.description !== 'string' ||
        typeof prompt.content !== 'string'
      ) {
        throw new Error(`Invalid prompt definition in ${filePath}: Each prompt must have id, description, and content as strings.`);
      }
    }

    return parsedContent as PromptFileContent;

  } catch (error) {
    // エラーを再スロー
    throw error;
  }
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