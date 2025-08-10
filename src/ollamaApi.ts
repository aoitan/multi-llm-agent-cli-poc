interface Message {
  role: string;
  content: string;
}

interface ChatResponseChunk {
  model: string;
  created_at: string;
  message?: Message; // message might be partial or absent in chunks
  done: boolean;
  // Other fields like 'total_duration', 'load_duration', 'prompt_eval_count', 'eval_count', 'eval_count', 'eval_duration' might be present in the final chunk
}

export async function chatWithOllama(
  model: string,
  messages: Message[],
  onContent: (content: string) => void,
  onDone: () => void,
  onError: (error: Error) => void,
  temperature?: number, // Add temperature parameter
): Promise<void> {
  const baseUrl = (process.env.APP_OLLAMA_URL || 'http://localhost:11434').trim().replace(/\/$/, '');
  const chatEndpoint = `${baseUrl}/api/chat`;

  const startTime = process.hrtime.bigint();

  try {
    const requestBody: any = {
      model: model,
      messages: messages,
      stream: true,
    };

    if (temperature !== undefined) {
      requestBody.options = { temperature: temperature };
    }

    const response = await fetch(chatEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorData.error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get readable stream from Ollama response.');
    }

    const decoder = new TextDecoder('utf-8');
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // Each chunk might contain multiple JSON objects or partial ones.
      // We need to split by newline and parse each complete JSON object.
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const data: ChatResponseChunk = JSON.parse(line);
          if (data.message?.content) {
            fullContent += data.message.content;
            onContent(data.message.content);
          }
          if (data.done) {
            onDone();
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000;
            console.log(`Ollama API call to ${model} took ${durationMs.toFixed(2)} ms`);
            return;
          }
        } catch (parseError) {
          console.warn('Failed to parse JSON chunk:', line, parseError);
          // This can happen if a chunk is a partial JSON object. 
          // We'll just wait for the next chunk to complete it.
        }
      }
    }
  } catch (error: any) {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    console.error(`Ollama API call to ${model} failed after ${durationMs.toFixed(2)} ms`);
    onError(error);
  }
}