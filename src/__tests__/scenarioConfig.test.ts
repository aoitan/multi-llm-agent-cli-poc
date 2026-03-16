import * as fs from 'fs';
import * as path from 'path';
import { loadScenarioConfig, clearScenarioConfigCache } from '../utils/scenarioConfig';

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
  const tempConfigPath = path.resolve(__dirname, '../../config/scenario_config.json');
  let originalConfig: string | null = null;

  beforeAll(() => {
    // 既存の設定ファイルがあればバックアップ
    if (fs.existsSync(tempConfigPath)) {
      originalConfig = fs.readFileSync(tempConfigPath, 'utf8');
    }
    fs.mkdirSync(path.dirname(tempConfigPath), { recursive: true });
    fs.writeFileSync(tempConfigPath, mockConfigContent);
  });

  afterAll(() => {
    // 元に戻す
    if (originalConfig !== null) {
      fs.writeFileSync(tempConfigPath, originalConfig);
    } else if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  });

  beforeEach(() => {
    clearScenarioConfigCache();
    delete process.env.SCENARIO_CONFIG_PATH;
  });

  afterEach(() => {
    delete process.env.SCENARIO_CONFIG_PATH;
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

  it('should use SCENARIO_CONFIG_PATH env var when set', async () => {
    // 別パスに別のモック設定ファイルを用意
    const altPath = path.resolve(__dirname, 'test_prompts/alt_scenario_config.json');
    fs.mkdirSync(path.dirname(altPath), { recursive: true });
    const altContent = JSON.stringify({
      scenarios: [{ id: 'alt_scenario', name: 'Alt', description: 'Alt', keywords: [] }],
      default_scenario_id: 'alt_scenario',
    });
    fs.writeFileSync(altPath, altContent);

    process.env.SCENARIO_CONFIG_PATH = altPath;
    const config = await loadScenarioConfig();
    expect(config.default_scenario_id).toBe('alt_scenario');

    fs.unlinkSync(altPath);
  });

  it('should throw an error if config file does not exist', async () => {
    process.env.SCENARIO_CONFIG_PATH = '/nonexistent/path/scenario_config.json';
    await expect(loadScenarioConfig()).rejects.toThrow();
  });
});
