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
  ollamaUrl: string = 'http://localhost:11434/api/chat'
): Promise<ChatResponse> {
  try {
    const response = await axios.post<ChatResponse>(ollamaUrl, {
      model: model,
      messages: messages,
      stream: false,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Ollama API Error:', error.response?.data || error.message);
    } else {
      console.error('Unexpected Error:', error);
    }
    throw error;
  }
}
