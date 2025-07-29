import axios from 'axios';

interface Message {
  role: string;
  content: string;
}

interface ChatResponse {
  model: string;
  created_at: string;
  message: Message;
  done: boolean;
}

export async function chatWithOllama(
  model: string,
  messages: Message[],
): Promise<ChatResponse> {
  const baseUrl = (process.env.APP_OLLAMA_URL || 'http://localhost:11434').trim().replace(/\/$/, ''); // Remove trailing slash and trim whitespace
  const chatEndpoint = `${baseUrl}/api/chat`;

  const startTime = process.hrtime.bigint();

  try {
    const response = await axios.post<ChatResponse>(chatEndpoint, {
      model: model,
      messages: messages,
      stream: false,
    });
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    console.log(`Ollama API call to ${model} took ${durationMs.toFixed(2)} ms`);
    return response.data;
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    console.error(`Ollama API call to ${model} failed after ${durationMs.toFixed(2)} ms`);
    if (axios.isAxiosError(error)) {
      console.error('Ollama API Error:', error.response?.data || error.message);
    } else {
      console.error('Unexpected Error:', error);
    }
    throw error;
  }
}