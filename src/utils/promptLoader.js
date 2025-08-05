"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPromptFile = loadPromptFile;
exports.getPromptById = getPromptById;
const fs = __importStar(require("fs"));
/**
 * 指定されたパスのJSON形式のプロンプトファイルを読み込み、パースして返す。
 *
 * @param filePath プロンプトファイルの絶対パス
 * @returns Promise<PromptFileContent> プロンプトファイルの内容
 * @throws Error ファイルが見つからない、JSON形式が不正、スキーマが不正な場合
 */
function loadPromptFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // ファイルの存在チェック
            if (!fs.existsSync(filePath)) {
                throw new Error(`Prompt file not found: ${filePath}`);
            }
            // ファイルの読み込み
            const fileContent = yield fs.promises.readFile(filePath, 'utf8');
            // JSONパース
            let parsedContent;
            try {
                parsedContent = JSON.parse(fileContent);
            }
            catch (jsonError) {
                throw new Error(`Invalid JSON format in ${filePath}: ${String(jsonError)}`);
            }
            // スキーマ検証
            if (typeof parsedContent.format_version !== 'string' ||
                !Array.isArray(parsedContent.prompts)) {
                throw new Error(`Invalid schema in ${filePath}: Missing format_version or prompts array.`);
            }
            for (const prompt of parsedContent.prompts) {
                if (typeof prompt.id !== 'string' ||
                    typeof prompt.description !== 'string' ||
                    typeof prompt.content !== 'string') {
                    throw new Error(`Invalid prompt definition in ${filePath}: Each prompt must have id, description, and content as strings.`);
                }
            }
            return parsedContent;
        }
        catch (error) {
            // エラーを再スロー
            throw error;
        }
    });
}
/**
 * プロンプトIDに基づいて特定のプロンプト定義を検索する。
 *
 * @param prompts プロンプト定義の配列
 * @param id 検索するプロンプトのID
 * @returns PromptDefinition | undefined 見つかったプロンプト定義、またはundefined
 */
function getPromptById(prompts, id) {
    return prompts.find(prompt => prompt.id === id);
}
