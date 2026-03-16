import { loadScenarioConfig, Scenario } from './scenarioConfig';

export type { Scenario };

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
