import * as fs from 'fs';
import * as path from 'path';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  default_workflow_id?: string;
  prompt_file_path?: string;
}

export interface ScenarioConfig {
  scenarios: Scenario[];
  default_scenario_id: string;
}

let cachedConfigPath: string | null = null;
let scenarioConfigCache: ScenarioConfig | null = null;

function resolveConfigPath(): string {
  if (process.env.SCENARIO_CONFIG_PATH) {
    return process.env.SCENARIO_CONFIG_PATH;
  }
  return path.resolve(process.cwd(), 'config/scenario_config.json');
}

export async function loadScenarioConfig(): Promise<ScenarioConfig> {
  const configPath = resolveConfigPath();
  if (scenarioConfigCache && cachedConfigPath === configPath) {
    return scenarioConfigCache;
  }
  try {
    const data = await fs.promises.readFile(configPath, 'utf8');
    const parsed: ScenarioConfig = JSON.parse(data);
    scenarioConfigCache = parsed;
    cachedConfigPath = configPath;
    return parsed;
  } catch (err) {
    throw new Error(
      `Failed to load scenario config from '${configPath}': ${(err as Error).message}`
    );
  }
}

export function clearScenarioConfigCache(): void {
  scenarioConfigCache = null;
  cachedConfigPath = null;
}
