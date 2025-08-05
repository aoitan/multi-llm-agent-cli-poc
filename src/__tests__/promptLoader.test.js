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
const promptLoader_1 = require("../utils/promptLoader");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
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
        fs.writeFileSync(validPromptFilePath, JSON.stringify({
            format_version: '1.0',
            prompts: [
                { id: 'test1', description: 'Test Prompt 1', content: 'Content 1' },
                { id: 'test2', description: 'Test Prompt 2', content: 'Content 2' },
            ],
        }, null, 2));
        // 不正なJSON形式のファイル
        fs.writeFileSync(invalidJsonPath, '{ "format_version": "1.0", "prompts": [ }');
        // スキーマが不正なファイル (promptsが配列ではない)
        fs.writeFileSync(invalidSchemaPath, JSON.stringify({
            format_version: '1.0',
            prompts: 'not_an_array',
        }, null, 2));
        // プロンプト定義が不正なファイル (idがない)
        fs.writeFileSync(invalidPromptDefPath, JSON.stringify({
            format_version: '1.0',
            prompts: [
                { description: 'Invalid Prompt', content: 'Content' },
            ],
        }, null, 2));
    });
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // テスト用ディレクトリの削除
        yield fs.promises.rm(testPromptsDir, { recursive: true, force: true });
    }));
    it('should load a valid prompt file successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        const content = yield (0, promptLoader_1.loadPromptFile)(validPromptFilePath);
        expect(content.format_version).toBe('1.0');
        expect(content.prompts).toHaveLength(2);
        expect(content.prompts[0]).toEqual({ id: 'test1', description: 'Test Prompt 1', content: 'Content 1' });
    }));
    it('should throw an error if the file does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect((0, promptLoader_1.loadPromptFile)(notFoundFilePath)).rejects.toThrow('Prompt file not found');
    }));
    it('should throw an error if the JSON format is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect((0, promptLoader_1.loadPromptFile)(invalidJsonPath)).rejects.toThrow('Invalid JSON format');
    }));
    it('should throw an error if the schema is invalid (prompts not array)', () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect((0, promptLoader_1.loadPromptFile)(invalidSchemaPath)).rejects.toThrow('Invalid schema');
    }));
    it('should throw an error if a prompt definition is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect((0, promptLoader_1.loadPromptFile)(invalidPromptDefPath)).rejects.toThrow('Invalid prompt definition');
    }));
});
