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

const defaultScenarioConfigPath = path.join(__dirname, '../../config/scenario_config.json');

let scenarioConfigCache: ScenarioConfig | null = null;

function getScenarioConfigPath(): string {
  return process.env.SCENARIO_CONFIG_PATH ?? defaultScenarioConfigPath;
}

async function loadScenarioConfig(): Promise<ScenarioConfig> {
  const configPath = getScenarioConfigPath();
  const shouldUseCache = configPath === defaultScenarioConfigPath;

  if (shouldUseCache && scenarioConfigCache) {
    return scenarioConfigCache;
  }

  const data = await fs.promises.readFile(configPath, 'utf8');
  const parsedConfig: ScenarioConfig = JSON.parse(data);

  if (shouldUseCache) {
    scenarioConfigCache = parsedConfig;
  }

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
    throw new Error(
      `Default scenario with ID '${config.default_scenario_id}' not found in config.`
    );
  }
  return defaultScenario;
}
