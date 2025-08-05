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
exports.chatWithOllama = chatWithOllama;
function chatWithOllama(model, messages, onContent, onDone, onError) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const baseUrl = (process.env.APP_OLLAMA_URL || 'http://localhost:11434').trim().replace(/\/$/, '');
        const chatEndpoint = `${baseUrl}/api/chat`;
        const startTime = process.hrtime.bigint();
        try {
            const response = yield fetch(chatEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    stream: true,
                }),
            });
            if (!response.ok) {
                const errorData = yield response.json();
                throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorData.error}`);
            }
            const reader = (_a = response.body) === null || _a === void 0 ? void 0 : _a.getReader();
            if (!reader) {
                throw new Error('Failed to get readable stream from Ollama response.');
            }
            const decoder = new TextDecoder('utf-8');
            let fullContent = '';
            while (true) {
                const { done, value } = yield reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value, { stream: true });
                // Each chunk might contain multiple JSON objects or partial ones.
                // We need to split by newline and parse each complete JSON object.
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.trim() === '')
                        continue;
                    try {
                        const data = JSON.parse(line);
                        if ((_b = data.message) === null || _b === void 0 ? void 0 : _b.content) {
                            fullContent += data.message.content;
                            onContent(data.message.content);
                        }
                        if (data.done) {
                            onDone();
                            const endTime = process.hrtime.bigint();
                            const durationMs = Number(endTime - startTime) / 1000000;
                            console.log(`Ollama API call to ${model} took ${durationMs.toFixed(2)} ms`);
                            return;
                        }
                    }
                    catch (parseError) {
                        console.warn('Failed to parse JSON chunk:', line, parseError);
                        // This can happen if a chunk is a partial JSON object. 
                        // We'll just wait for the next chunk to complete it.
                    }
                }
            }
        }
        catch (error) {
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1000000;
            console.error(`Ollama API call to ${model} failed after ${durationMs.toFixed(2)} ms`);
            onError(error);
        }
    });
}
