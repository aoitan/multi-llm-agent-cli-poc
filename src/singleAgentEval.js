"use strict";
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
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const args = process.argv.slice(2);
        const userPrompt = args[0];
        const model = args[1] || 'llama3:8b'; // Default to llama3:8b if not provided
        if (!userPrompt) {
            console.error('Usage: ts-node src/singleAgentEval.ts <your_prompt> [model]');
            process.exit(1);
        }
        console.log(`Running single agent evaluation for prompt: "${userPrompt}"`);
        console.log(`Using model: ${model}`);
        try {
            const results = yield (0, agent_1.runEnsemble)(userPrompt, [model]);
            console.log('\n--- Single Agent Result ---');
            if (results.length > 0) {
                console.log(`Model ${model}:\n${results[0]}\n`);
            }
            else {
                console.log('No response from the model.');
            }
        }
        catch (error) {
            console.error('An error occurred during single agent evaluation:', error);
        }
    });
}
main();
