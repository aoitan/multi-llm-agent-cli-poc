import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('ab_test_runner.py language support', () => {
  const configPath = path.join(__dirname, '../../config/ab_test_config.json');
  const originalConfigContent = fs.readFileSync(configPath, 'utf8');

  // 共通のコマンドラインオプションを変数として定義
  const commonCliOptions = `"テストプロンプト" --config ${configPath} --runs 0`;

  beforeEach(() => {
    // テストごとにab_test_config.jsonをリセット
    fs.writeFileSync(configPath, originalConfigContent);
  });

  afterAll(() => {
    // テスト後にab_test_config.jsonを元の内容に戻す
    fs.writeFileSync(configPath, originalConfigContent);
  });

  it('should load japanese prompts for control group when prompt_language is japanese', () => {
    // ab_test_config.jsonを一時的に変更
    const tempConfig = JSON.parse(originalConfigContent);
    tempConfig.test_groups[0].prompt_language = 'japanese';
    fs.writeFileSync(configPath, JSON.stringify(tempConfig, null, 2));

    try {
      const output = execSync(`python3 scripts/ab_test_runner.py ${commonCliOptions}`, { encoding: 'utf8' });
      expect(output).toContain('--- Running A/B Test for Prompt: PROMPT_1_SOCIAL_ISSUES ---');
      expect(output).toContain('--- Running Test Group: control (Type: static) for Prompt PROMPT_1_SOCIAL_ISSUES ---');
    } catch (error: any) {
      console.error('Test failed:', error.stdout, error.stderr);
      fail(error.message);
    }
  });

  it('should load english prompts for dynamic group when prompt_language is english', () => {
    // ab_test_config.jsonを一時的に変更
    const tempConfig = JSON.parse(originalConfigContent);
    tempConfig.test_groups[1].prompt_language = 'english';
    fs.writeFileSync(configPath, JSON.stringify(tempConfig, null, 2));

    try {
      const output = execSync(`python3 scripts/ab_test_runner.py ${commonCliOptions}`, { encoding: 'utf8' });
      expect(output).toContain('--- Running A/B Test for Prompt: PROMPT_1_SOCIAL_ISSUES ---');
      expect(output).toContain('--- Running Test Group: dynamic_prompt_group (Type: dynamic) for Prompt PROMPT_1_SOCIAL_ISSUES ---');
    } catch (error: any) {
      console.error('Test failed:', error.stdout, error.stderr);
      fail(error.message);
    }
  });

  it('should return JSON output when --json flag is used', () => {
    const output = execSync(
      `python3 scripts/ab_test_runner.py --json ${commonCliOptions}`,
      { encoding: 'utf8' }
    );

    const trimmed = output.trim();
    expect(trimmed.startsWith('{')).toBe(true);

    const parsed = JSON.parse(trimmed);
    expect(parsed).toHaveProperty('PROMPT_1_SOCIAL_ISSUES');
    expect(parsed.PROMPT_1_SOCIAL_ISSUES).toHaveProperty('control');
    expect(parsed.PROMPT_1_SOCIAL_ISSUES).toHaveProperty('dynamic_prompt_group');
  });
});
