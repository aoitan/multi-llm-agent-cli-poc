import * as fs from 'fs';
import * as path from 'path';
import { identifyScenario } from '../utils/scenarioIdentifier';
import { cleanupTestTempDir, createTestTempDir } from '../testHelpers/testTempDir';

const mockScenarioConfigContent = `
{
  "scenarios": [
    {
      "id": "social_issues",
      "name": "社会問題",
      "description": "社会問題に関する議論",
      "keywords": ["少子高齢化", "環境問題", "貧困"]
    },
    {
      "id": "technology",
      "name": "技術",
      "description": "技術に関する議論",
      "keywords": ["プログラミング", "AI", "機械学習"]
    },
    {
      "id": "temporary_only",
      "name": "一時設定専用",
      "description": "一時設定でのみ使うシナリオ",
      "keywords": ["一時設定専用キーワード"]
    },
    {
      "id": "general",
      "name": "一般",
      "description": "上記以外の一般的な議論",
      "keywords": []
    }
  ],
  "default_scenario_id": "general"
}`;

describe('identifyScenario', () => {
  let tempDir: string;
  let tempConfigPath: string;
  const productionConfigPath = path.resolve(
    process.cwd(),
    'config/scenario_config.json'
  );
  let productionConfigExistedBeforeTest: boolean;
  let productionConfigContentBeforeTest: string | null;
  let originalScenarioConfigPath: string | undefined;

  beforeEach(() => {
    productionConfigExistedBeforeTest = fs.existsSync(productionConfigPath);
    productionConfigContentBeforeTest = productionConfigExistedBeforeTest
      ? fs.readFileSync(productionConfigPath, 'utf8')
      : null;
    originalScenarioConfigPath = process.env.SCENARIO_CONFIG_PATH;
    tempDir = createTestTempDir('scenario-identifier-test-');
    tempConfigPath = path.join(tempDir, 'scenario_config.json');
    fs.writeFileSync(tempConfigPath, mockScenarioConfigContent);
    process.env.SCENARIO_CONFIG_PATH = tempConfigPath;
  });

  afterEach(() => {
    if (originalScenarioConfigPath === undefined) {
      delete process.env.SCENARIO_CONFIG_PATH;
    } else {
      process.env.SCENARIO_CONFIG_PATH = originalScenarioConfigPath;
    }

    cleanupTestTempDir(tempDir);
  });

  it('should identify "social_issues" scenario for a matching prompt', async () => {
    const scenario = await identifyScenario('日本の少子高齢化問題について議論してください');
    expect(scenario.id).toBe('social_issues');
  });

  it('should identify "technology" scenario for a matching prompt', async () => {
    const scenario = await identifyScenario('AIの最新動向について教えてください');
    expect(scenario.id).toBe('technology');
  });

  it('should return default scenario if no keywords match', async () => {
    const scenario = await identifyScenario('今日の天気について');
    expect(scenario.id).toBe('general');
  });

  it('should be case-insensitive', async () => {
    const scenario = await identifyScenario('プログラミングの学習方法');
    expect(scenario.id).toBe('technology');
  });

  it('should identify the first matching scenario if multiple keywords match different scenarios', async () => {
    const scenario = await identifyScenario('貧困問題とAIの活用について');
    expect(scenario.id).toBe('social_issues');
  });

  it('should use the temporary config file during the test run', async () => {
    const scenario = await identifyScenario('一時設定専用キーワードについて議論してください');

    expect(scenario.id).toBe('temporary_only');
    expect(fs.existsSync(tempConfigPath)).toBe(true);
    expect(fs.existsSync(productionConfigPath)).toBe(productionConfigExistedBeforeTest);

    if (productionConfigExistedBeforeTest) {
      expect(fs.readFileSync(productionConfigPath, 'utf8')).toBe(
        productionConfigContentBeforeTest
      );
    }
  });
});
