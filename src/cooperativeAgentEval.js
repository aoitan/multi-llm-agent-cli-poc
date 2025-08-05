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
const agent_1 = require("./agent");
const promptLoader_1 = require("./utils/promptLoader");
const path = __importStar(require("path"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const args = process.argv.slice(2);
        const userPrompt = args[0];
        const model1 = args[1] || 'llama3:8b'; // Default to llama3:8b if not provided
        const model2 = args[2] || 'llama3:8b'; // Default to llama3:8b if not provided
        const cycles = parseInt(args[3] || '2', 10); // Default to 2 cycles if not provided
        if (!userPrompt) {
            console.error('Usage: ts-node src/cooperativeAgentEval.ts <your_prompt> [model1] [model2] [cycles]');
            process.exit(1);
        }
        console.log(`Starting cooperative agent evaluation for prompt: "${userPrompt}"`);
        console.log(`Using Agent 1: ${model1}, Agent 2: ${model2}, Cycles: ${cycles}`);
        let prompts;
        const defaultPromptFilePath = path.resolve(process.cwd(), 'prompts', 'default_prompts.json');
        try {
            prompts = yield (0, promptLoader_1.loadPromptFile)(defaultPromptFilePath);
            console.log(`Loaded default prompts from: ${defaultPromptFilePath}`);
        }
        catch (error) {
            console.error(`Error loading default prompt file: ${error}`);
            process.exit(1);
        }
        try {
            const { finalSummary, discussionLog } = yield (0, agent_1.conductConsultation)(userPrompt, model1, model2, prompts, cycles);
            console.log('\n--- Cooperative Agent Result ---');
            console.log(finalSummary);
            console.log('\n--- Cooperative Agent Discussion Log Start ---');
            console.log(JSON.stringify(discussionLog, null, 2));
            console.log('--- Cooperative Agent Discussion Log End ---');
        }
        catch (error) {
            console.error('An error occurred during cooperative agent evaluation:', error);
        }
    });
}
main();
