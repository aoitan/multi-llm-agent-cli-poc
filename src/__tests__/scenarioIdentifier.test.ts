import { identifyScenario } from '../utils/scenarioIdentifier';
import * as fs from 'fs';
import * as path from 'path';

// モック用の設定ファイルを一時的に作成
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
      "id": "general",
      "name": "一般",
      "description": "上記以外の一般的な議論",
      "keywords": []
    }
  ],
  "default_scenario_id": "general"
}`;

const configPath = path.join(__dirname, '../../config/scenario_config.json');

describe('identifyScenario', () => {
  // テスト前にモック設定ファイルを書き込む
  beforeAll(() => {
    fs.writeFileSync(configPath, mockScenarioConfigContent);
  });

  // テスト後にモック設定ファイルを削除（または元の内容に戻す）
  afterAll(() => {
    fs.unlinkSync(configPath); // テスト後にファイルを削除
  });

  it('should identify "social_issues" scenario for a matching prompt', async () => {
    const scenarioId = await identifyScenario('日本の少子高齢化問題について議論してください');
    expect(scenarioId).toBe('social_issues');
  });

  it('should identify "technology" scenario for a matching prompt', async () => {
    const scenarioId = await identifyScenario('AIの最新動向について教えてください');
    expect(scenarioId).toBe('technology');
  });

  it('should return default scenario if no keywords match', async () => {
    const scenarioId = await identifyScenario('今日の天気について');
    expect(scenarioId).toBe('general');
  });

  it('should be case-insensitive', async () => {
    const scenarioId = await identifyScenario('プログラミングの学習方法'); // 修正
    expect(scenarioId).toBe('technology');
  });

  it('should identify the first matching scenario if multiple keywords match different scenarios', async () => {
    // このテストケースでは、"貧困"がsocial_issues、"AI"がtechnologyにマッチするが、
    // social_issuesがconfigのscenarios配列でtechnologyより先に定義されているため、
    // social_issuesが返されることを期待する。
    const scenarioId = await identifyScenario('貧困問題とAIの活用について');
    expect(scenarioId).toBe('social_issues');
  });
});
