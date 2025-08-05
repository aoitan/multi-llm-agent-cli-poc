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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const agent_1 = require("./agent");
const promptLoader_1 = require("./utils/promptLoader");
const configLoader_1 = require("./utils/configLoader");
const errorUtils_1 = require("./utils/errorUtils");
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const path = __importStar(require("path"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const argv = yield (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
            .option('config', {
            alias: 'c',
            type: 'string',
            description: 'Path to the configuration file',
        })
            .parse();
        const userPrompt = argv._[0];
        const model1 = argv._[1] || 'llama3:8b'; // Default to llama3:8b if not provided
        const model2 = argv._[2] || 'llama3:8b'; // Default to llama3:8b if not provided
        if (!userPrompt) {
            console.error('Usage: npm start "<your_prompt>" [model1] [model2] [--config <config_file_path>]');
            process.exit(1);
        }
        console.log(`Starting consultation for prompt: "${userPrompt}"`);
        console.log(`Using Agent 1: ${model1}, Agent 2: ${model2}`);
        let prompts;
        if (argv.config) {
            const configFilePath = path.resolve(process.cwd(), argv.config);
            try {
                const config = yield (0, configLoader_1.loadConfigFile)(configFilePath);
                const promptFilePath = path.resolve(path.dirname(configFilePath), config.prompt_file_path);
                prompts = yield (0, promptLoader_1.loadPromptFile)(promptFilePath);
                console.log(`Loaded prompts from config file: ${configFilePath}`);
            }
            catch (error) {
                console.error(`Error loading configuration or prompt file: ${(0, errorUtils_1.getErrorMessage)(error)}`);
                process.exit(1);
            }
        }
        else {
            // デフォルトプロンプトのロード
            const defaultPromptFilePath = path.resolve(process.cwd(), 'prompts', 'default_prompts.json');
            try {
                prompts = yield (0, promptLoader_1.loadPromptFile)(defaultPromptFilePath);
                console.log(`No config file specified. Loaded default prompts from: ${defaultPromptFilePath}`);
            }
            catch (error) {
                console.error(`Error loading default prompt file: ${(0, errorUtils_1.getErrorMessage)(error)}`);
                process.exit(1);
            }
        }
        try {
            // conductConsultation のシグネチャ変更が必要
            const result = yield (0, agent_1.conductConsultation)(userPrompt, model1, model2, prompts);
            console.log('\n--- Final Consultation Result ---');
            console.log(result);
        }
        catch (error) {
            console.error('An error occurred during consultation:', (0, errorUtils_1.getErrorMessage)(error));
        }
    });
}
main();
