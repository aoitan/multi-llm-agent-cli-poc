import * as fs from 'fs';
import * as path from 'path';

// 設定ファイル全体の型
export interface ConfigContent {
  prompt_file_path: string;
}

/**
 * 指定されたパスのJSON形式の設定ファイルを読み込み、パースして返す。
 *
 * @param filePath 設定ファイルの絶対パス
 * @returns Promise<ConfigContent> 設定ファイルの内容
 * @throws Error ファイルが見つからない、JSON形式が不正、スキーマが不正な場合
 */
export async function loadConfigFile(filePath: string): Promise<ConfigContent> {
  try {
    // ファイルの存在チェック
    if (!fs.existsSync(filePath)) {
      throw new Error(`Config file not found: ${filePath}`);
    }

    // ファイルの読み込み
    const fileContent = await fs.promises.readFile(filePath, 'utf8');

    // JSONパース
    let parsedContent: any;
    try {
      parsedContent = JSON.parse(fileContent);
    } catch (jsonError: unknown) {
      throw new Error(
        `Invalid JSON format in ${filePath}: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`
      );
    }

    // スキーマ検証
    if (typeof parsedContent.prompt_file_path !== 'string') {
      throw new Error(`Invalid schema in ${filePath}: Missing prompt_file_path.`);
    }

    return parsedContent as ConfigContent;
  } catch (error) {
    // エラーを再スロー
    throw error;
  }
}
