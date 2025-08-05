/**
 * エラーオブジェクトから安全にエラーメッセージを取得する。
 * errorがErrorインスタンスでない場合でも、ランタイムエラーが発生しないようにする。
 *
 * @param error エラーオブジェクト
 * @returns エラーメッセージ文字列
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && typeof (error as any).message === 'string') {
    return (error as any).message;
  }
  return String(error);
}