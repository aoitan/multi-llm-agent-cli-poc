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
exports.conductConsultation = conductConsultation;
exports.runEnsemble = runEnsemble;
const ollamaApi_1 = require("./ollamaApi");
const promptLoader_1 = require("./utils/promptLoader");
class Agent {
    constructor(model, systemPrompt) {
        this.model = model;
        this.systemPrompt = systemPrompt;
        this.messages = [{ role: 'system', content: systemPrompt }];
    }
    sendMessage(userMessage, onContent) {
        return __awaiter(this, void 0, void 0, function* () {
            this.messages.push({ role: 'user', content: userMessage });
            let agentResponse = '';
            yield new Promise((resolve, reject) => {
                (0, ollamaApi_1.chatWithOllama)(this.model, this.messages, (contentChunk) => {
                    agentResponse += contentChunk;
                    onContent(contentChunk);
                }, () => {
                    resolve();
                }, (error) => {
                    reject(error);
                });
            });
            this.messages.push({ role: 'assistant', content: agentResponse });
            return agentResponse;
        });
    }
    getModel() {
        return this.model;
    }
    getMessages() {
        // Return a deep copy to prevent external mutation
        return this.messages.map(msg => (Object.assign({}, msg)));
    }
}
function conductConsultation(userPrompt_1, model1_1, model2_1, prompts_1) {
    return __awaiter(this, arguments, void 0, function* (userPrompt, model1, model2, prompts, cycles = 2) {
        var _a, _b, _c, _d, _e, _f, _g;
        let fullConversationHistory = [];
        const discussionLog = []; // To store structured discussion
        // Define agent roles and create agents
        const thinkerImproverSystemPrompt = (_a = (0, promptLoader_1.getPromptById)(prompts.prompts, 'THINKER_IMPROVER_SYSTEM_PROMPT')) === null || _a === void 0 ? void 0 : _a.content;
        const reviewerSystemPrompt = (_b = (0, promptLoader_1.getPromptById)(prompts.prompts, 'REVIEWER_SYSTEM_PROMPT')) === null || _b === void 0 ? void 0 : _b.content;
        if (!thinkerImproverSystemPrompt || !reviewerSystemPrompt) {
            throw new Error('Required system prompts not found in the provided prompt file.');
        }
        const thinkerImproverAgent = new Agent(model1, thinkerImproverSystemPrompt);
        const reviewerAgent = new Agent(model2, reviewerSystemPrompt);
        console.log('--- Consultation Start ---');
        // Add initial user prompt to full history
        fullConversationHistory.push({ role: 'user', content: `ユーザープロンプト: ${userPrompt}` });
        let lastThinkerImproverResponse = '';
        let lastReviewerResponse = '';
        // --- Initial Turn: Thinker (思考者) ---
        console.log(`\n--- ターン 1 (思考者) ---`);
        const thinkerInitialPromptTemplate = (_c = (0, promptLoader_1.getPromptById)(prompts.prompts, 'THINKER_INITIAL_PROMPT_TEMPLATE')) === null || _c === void 0 ? void 0 : _c.content;
        if (!thinkerInitialPromptTemplate) {
            throw new Error('THINKER_INITIAL_PROMPT_TEMPLATE not found in the provided prompt file.');
        }
        const thinkerInitialPrompt = thinkerInitialPromptTemplate.replace('${userPrompt}', userPrompt);
        lastThinkerImproverResponse = yield thinkerImproverAgent.sendMessage(thinkerInitialPrompt, (content) => {
            process.stdout.write(content);
        });
        process.stdout.write('\n');
        discussionLog.push({
            turn: "ターン 1 (思考者)",
            agent_role: "思考者",
            prompt_sent: thinkerInitialPrompt,
            response_received: lastThinkerImproverResponse,
        });
        fullConversationHistory.push({ role: 'assistant', content: `Agent 1 (${thinkerImproverAgent.getModel()}): ${lastThinkerImproverResponse}` });
        // --- Main Cycles (Reviewer -> Improver) ---
        for (let cycle = 0; cycle < cycles; cycle++) {
            console.log(`\n--- サイクル ${cycle + 1} (レビューと改善) ---`);
            // Turn for Reviewer (批判的レビュアー)
            const reviewerPromptTemplate = (_d = (0, promptLoader_1.getPromptById)(prompts.prompts, 'REVIEWER_PROMPT_TEMPLATE')) === null || _d === void 0 ? void 0 : _d.content;
            if (!reviewerPromptTemplate) {
                throw new Error('REVIEWER_PROMPT_TEMPLATE not found in the provided prompt file.');
            }
            const reviewerPrompt = reviewerPromptTemplate
                .replace('${userPrompt}', userPrompt)
                .replace('${lastThinkerImproverResponse}', lastThinkerImproverResponse);
            console.log(`Agent 2 (${reviewerAgent.getModel()}) thinking... (役割: 批判的レビュアー)`);
            lastReviewerResponse = yield reviewerAgent.sendMessage(reviewerPrompt, (content) => {
                process.stdout.write(content);
            });
            process.stdout.write('\n');
            discussionLog.push({
                turn: `サイクル ${cycle + 1} (レビュアー)`,
                agent_role: "批判的レビュアー",
                prompt_sent: reviewerPrompt,
                response_received: lastReviewerResponse,
            });
            fullConversationHistory.push({ role: 'assistant', content: `Agent 2 (${reviewerAgent.getModel()}): ${lastReviewerResponse}` });
            // Turn for Thinker/Improver (指摘改善者)
            const improverPromptTemplate = (_e = (0, promptLoader_1.getPromptById)(prompts.prompts, 'IMPROVER_PROMPT_TEMPLATE')) === null || _e === void 0 ? void 0 : _e.content;
            if (!improverPromptTemplate) {
                throw new Error('IMPROVER_PROMPT_TEMPLATE not found in the provided prompt file.');
            }
            const improverPrompt = improverPromptTemplate
                .replace('${userPrompt}', userPrompt)
                .replace('${lastReviewerResponse}', lastReviewerResponse)
                .replace('${lastThinkerImproverResponse}', lastThinkerImproverResponse);
            console.log(`Agent 1 (${thinkerImproverAgent.getModel()}) thinking... (役割: 指摘改善者)`);
            lastThinkerImproverResponse = yield thinkerImproverAgent.sendMessage(improverPrompt, (content) => {
                process.stdout.write(content);
            });
            process.stdout.write('\n');
            discussionLog.push({
                turn: `サイクル ${cycle + 1} (改善者)`,
                agent_role: "指摘改善者",
                prompt_sent: improverPrompt,
                response_received: lastThinkerImproverResponse,
            });
            fullConversationHistory.push({ role: 'assistant', content: `Agent 1 (${thinkerImproverAgent.getModel()}): ${lastThinkerImproverResponse}` });
        }
        console.log('--- Consultation End ---');
        // Final summarization
        console.log('--- 最終要約の生成 ---');
        const summarizerSystemPrompt = (_f = (0, promptLoader_1.getPromptById)(prompts.prompts, 'SUMMARIZER_SYSTEM_PROMPT')) === null || _f === void 0 ? void 0 : _f.content;
        const finalReportTemplate = (_g = (0, promptLoader_1.getPromptById)(prompts.prompts, 'FINAL_REPORT_TEMPLATE')) === null || _g === void 0 ? void 0 : _g.content;
        if (!summarizerSystemPrompt || !finalReportTemplate) {
            throw new Error('Required summarizer prompts not found in the provided prompt file.');
        }
        const summaryPrompt = finalReportTemplate
            .replace('${userPrompt}', userPrompt)
            .replace('${finalAnswer}', lastThinkerImproverResponse);
        const summarizerAgent = new Agent(model1, summarizerSystemPrompt);
        const finalSummary = yield summarizerAgent.sendMessage(summaryPrompt, (content) => {
            process.stdout.write(content);
        });
        process.stdout.write('\n');
        discussionLog.push({
            turn: "最終要約",
            agent_role: "要約者",
            prompt_sent: summaryPrompt,
            response_received: finalSummary,
        });
        return { finalSummary, discussionLog };
    });
}
function runEnsemble(prompt, models) {
    return __awaiter(this, void 0, void 0, function* () {
        if (models.length === 0) {
            return [];
        }
        const ensembleResponses = [];
        for (const model of models) {
            const messages = [{ role: 'user', content: prompt }];
            let fullResponse = '';
            yield new Promise((resolve, reject) => {
                (0, ollamaApi_1.chatWithOllama)(model, messages, (contentChunk) => {
                    fullResponse += contentChunk;
                }, () => {
                    resolve();
                }, (error) => {
                    reject(error);
                });
            });
            ensembleResponses.push(fullResponse);
        }
        return ensembleResponses;
    });
}
