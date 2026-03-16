import * as fs from 'fs';
import * as path from 'path';
import { loadScenarioConfig, clearScenarioConfigCache } from '../utils/scenarioConfig';
import { cleanupTestTempDir, createTestTempDir } from '../testHelpers/testTempDir';

const mockConfigContent = JSON.stringify({
  scenarios: [
    {
      id: 'test_scenario',
      name: 'テスト',
      description: 'テスト用シナリオ',
      keywords: ['テスト'],
      default_workflow_id: 'test_workflow',
    },
    {
      id: 'default_scenario',
      name: 'デフォルト',
      description: 'デフォルトシナリオ',
      keywords: [],
    },
  ],
  default_scenario_id: 'default_scenario',
});

describe('scenarioConfig', () => {
  let tempDir: string;
  let tempConfigPath: string;
  let originalScenarioConfigPath: string | undefined;

  beforeEach(() => {
    originalScenarioConfigPath = process.env.SCENARIO_CONFIG_PATH;
    tempDir = createTestTempDir('scenario-config-test-');
    tempConfigPath = path.join(tempDir, 'scenario_config.json');
    fs.writeFileSync(tempConfigPath, mockConfigContent);
    process.env.SCENARIO_CONFIG_PATH = tempConfigPath;
    clearScenarioConfigCache();
  });

  afterEach(() => {
    if (originalScenarioConfigPath === undefined) {
      delete process.env.SCENARIO_CONFIG_PATH;
    } else {
      process.env.SCENARIO_CONFIG_PATH = originalScenarioConfigPath;
    }
    cleanupTestTempDir(tempDir);
    clearScenarioConfigCache();
  });

  it('should load scenario config from default path', async () => {
    const config = await loadScenarioConfig();
    expect(config.default_scenario_id).toBe('default_scenario');
    expect(config.scenarios).toHaveLength(2);
    expect(config.scenarios[0].id).toBe('test_scenario');
  });

  it('should return the same cached object on second call', async () => {
    const first = await loadScenarioConfig();
    const second = await loadScenarioConfig();
    expect(first).toBe(second); // 同一参照であること
  });

  it('should clear cache and reload after clearScenarioConfigCache()', async () => {
    const first = await loadScenarioConfig();
    clearScenarioConfigCache();
    const second = await loadScenarioConfig();
    // キャッシュクリア後は新たに読み込むため別オブジェクト
    expect(first).not.toBe(second);
    expect(second.default_scenario_id).toBe('default_scenario');
  });

  it('should reload when SCENARIO_CONFIG_PATH changes to a different file', async () => {
    const altDir = createTestTempDir('scenario-config-alt-');
    const altPath = path.join(altDir, 'alt_scenario_config.json');
    const altContent = JSON.stringify({
      scenarios: [{ id: 'alt_scenario', name: 'Alt', description: 'Alt', keywords: [] }],
      default_scenario_id: 'alt_scenario',
    });
    fs.writeFileSync(altPath, altContent);

    try {
      const first = await loadScenarioConfig();
      expect(first.default_scenario_id).toBe('default_scenario');

      process.env.SCENARIO_CONFIG_PATH = altPath;
      const second = await loadScenarioConfig();
      expect(second.default_scenario_id).toBe('alt_scenario');
    } finally {
      cleanupTestTempDir(altDir);
    }
  });

  it('should throw an error with file path when config file does not exist', async () => {
    process.env.SCENARIO_CONFIG_PATH = '/nonexistent/path/scenario_config.json';
    await expect(loadScenarioConfig()).rejects.toThrow(
      "Failed to load scenario config from '/nonexistent/path/scenario_config.json'"
    );
  });
});
