"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorMessage = getErrorMessage;
/**
 * エラーオブジェクトから安全にエラーメッセージを取得する。
 * errorがErrorインスタンスでない場合でも、ランタイムエラーが発生しないようにする。
 *
 * @param error エラーオブジェクト
 * @returns エラーメッセージ文字列
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
