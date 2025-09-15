import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('ab_test_runner.py language support', () => {
  const configPath = path.join(__dirname, '../../config/ab_test_config.json');
  const originalConfigContent = fs.readFileSync(configPath, 'utf8');

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
      const output = execSync('python3 scripts/ab_test_runner.py --json "テストプロンプト" --config ' + configPath, { encoding: 'utf8' });
      // ここでab_test_runner.pyの出力（JSON）をパースし、
      // node dist/index.jsに渡された引数を確認するロジックを追加する
      // ただし、ab_test_runner.pyがnode dist/index.jsのコマンドライン引数を
      // 出力するようにはなっていないため、直接検証は難しい。
      // ここでは、ab_test_runner.pyがエラーなく実行されることを確認するにとどめる。
      expect(output).toContain('--- Running A/B Test for Prompt: PROMPT_1_SOCIAL_ISSUES ---');
      expect(output).toContain('--- Running Test Group: control (Type: static) for Prompt PROMPT_1_SOCIAL_ISSUES ---');
      // 実際には、node dist/index.jsに渡された --prompt-file の値を確認したい
      // これはab_test_runner.pyのstdoutを解析する必要がある
    } catch (error) {
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
      const output = execSync('python3 scripts/ab_test_runner.py --json "テストプロンプト" --config ' + configPath, { encoding: 'utf8' });
      expect(output).toContain('--- Running A/B Test for Prompt: PROMPT_1_SOCIAL_ISSUES ---');
      expect(output).toContain('--- Running Test Group: dynamic_prompt_group (Type: dynamic) for Prompt PROMPT_1_SOCIAL_ISSUES ---');
      // 実際には、node dist/index.jsに渡された --prompt-file の値を確認したい
    } catch (error) {
      console.error('Test failed:', error.stdout, error.stderr);
      fail(error.message);
    }
  });
});
