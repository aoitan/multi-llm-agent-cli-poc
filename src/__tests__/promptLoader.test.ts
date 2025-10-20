import { loadPromptFile } from '../utils/promptLoader';
import * as path from 'path';
import * as fs from 'fs';

describe('loadPromptFile', () => {
  const testPromptsDir = path.join(__dirname, 'test_prompts');
  const validPromptFilePath = path.join(testPromptsDir, 'valid_prompts.json');
  const notFoundFilePath = path.join(testPromptsDir, 'not_found.json');
  const invalidJsonPath = path.join(testPromptsDir, 'invalid_json.json');
  const invalidSchemaPath = path.join(testPromptsDir, 'invalid_schema.json');
  const invalidPromptDefPath = path.join(testPromptsDir, 'invalid_prompt_def.json');

  beforeAll(() => {
    // テスト用ディレクトリの作成
    fs.mkdirSync(testPromptsDir, { recursive: true });

    // 有効なプロンプトファイル
    fs.writeFileSync(
      validPromptFilePath,
      JSON.stringify(
        {
          format_version: '1.0',
          prompts: [
            { id: 'test1', description: 'Test Prompt 1', content: 'Content 1' },
            { id: 'test2', description: 'Test Prompt 2', content: 'Content 2' },
          ],
        },
        null,
        2
      )
    );

    // 不正なJSON形式のファイル
    fs.writeFileSync(invalidJsonPath, '{ "format_version": "1.0", "prompts": [ }');

    // スキーマが不正なファイル (promptsが配列ではない)
    fs.writeFileSync(
      invalidSchemaPath,
      JSON.stringify(
        {
          format_version: '1.0',
          prompts: 'not_an_array',
        },
        null,
        2
      )
    );

    // プロンプト定義が不正なファイル (idがない)
    fs.writeFileSync(
      invalidPromptDefPath,
      JSON.stringify(
        {
          format_version: '1.0',
          prompts: [{ description: 'Invalid Prompt', content: 'Content' }],
        },
        null,
        2
      )
    );
  });

  afterAll(async () => {
    // テスト用ディレクトリの削除
    await fs.promises.rm(testPromptsDir, { recursive: true, force: true });
  });

  it('should load a valid prompt file successfully', async () => {
    const content = await loadPromptFile(validPromptFilePath);
    expect(content.format_version).toBe('1.0');
    expect(content.prompts).toHaveLength(2);
    expect(content.prompts[0]).toEqual({
      id: 'test1',
      description: 'Test Prompt 1',
      content: 'Content 1',
    });
  });

  it('should throw an error if the file does not exist', async () => {
    await expect(loadPromptFile(notFoundFilePath)).rejects.toThrow('Prompt file not found');
  });

  it('should throw an error if the JSON format is invalid', async () => {
    await expect(loadPromptFile(invalidJsonPath)).rejects.toThrow('Invalid JSON format');
  });

  it('should throw an error if the schema is invalid (prompts not array)', async () => {
    await expect(loadPromptFile(invalidSchemaPath)).rejects.toThrow('Invalid schema');
  });

  it('should throw an error if a prompt definition is invalid', async () => {
    await expect(loadPromptFile(invalidPromptDefPath)).rejects.toThrow('Invalid prompt definition');
  });
});
