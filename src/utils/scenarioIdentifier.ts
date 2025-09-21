import * as fs from 'fs';
import * as path from 'path';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  default_workflow_id?: string;
}

interface ScenarioConfig {
  scenarios: Scenario[];
  default_scenario_id: string;
}

let scenarioConfigCache: ScenarioConfig | null = null; // キャッシュ用の変数名を変更

async function loadScenarioConfig(): Promise<ScenarioConfig> {
  if (scenarioConfigCache) {
    return scenarioConfigCache;
  }

  const configPath = path.join(__dirname, '../../config/scenario_config.json');
  const data = await fs.promises.readFile(configPath, 'utf8');
  const parsedConfig: ScenarioConfig = JSON.parse(data); // 明示的に型をアサーション
  scenarioConfigCache = parsedConfig;
  return parsedConfig;
}

export async function identifyScenario(userPrompt: string): Promise<Scenario> {
  const config = await loadScenarioConfig();
  const lowerCasePrompt = userPrompt.toLowerCase();

  for (const scenario of config.scenarios) {
    if (scenario.keywords.some(keyword => lowerCasePrompt.includes(keyword.toLowerCase()))) {
      return scenario;
    }
  }

  // デフォルトシナリオのオブジェクトを検索して返す
  const defaultScenario = config.scenarios.find(s => s.id === config.default_scenario_id);
  if (!defaultScenario) {
    throw new Error(`Default scenario with ID '${config.default_scenario_id}' not found in config.`);
  }
  return defaultScenario;
}