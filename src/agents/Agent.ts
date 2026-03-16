import { chatWithOllama } from '../ollamaApi';

export interface Message {
  role: string;
  content: string;
}

export interface DiscussionTurn {
  turn: string;
  agent_role: string;
  prompt_sent: string;
  response_received: string;
}

export class Agent {
  private model: string;
  private systemPrompt: string;
  private messages: Message[];
  private temperature?: number;
  private jsonOutput: boolean;

  constructor(
    model: string,
    systemPrompt: string,
    temperature?: number,
    jsonOutput: boolean = false
  ) {
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.messages = [{ role: 'system', content: systemPrompt }];
    this.temperature = temperature;
    this.jsonOutput = jsonOutput;
  }

  public async sendMessage(
    userMessage: string,
    onContent: (content: string) => void
  ): Promise<string> {
    this.messages.push({ role: 'user', content: userMessage });
    let agentResponse = '';

    await new Promise<void>((resolve, reject) => {
      chatWithOllama(
        this.model,
        this.messages,
        contentChunk => {
          agentResponse += contentChunk;
          onContent(contentChunk);
        },
        () => {
          resolve();
        },
        error => {
          reject(error);
        },
        this.temperature,
        this.jsonOutput
      );
    });

    this.messages.push({ role: 'assistant', content: agentResponse });
    return agentResponse;
  }

  public getModel(): string {
    return this.model;
  }

  public getMessages(): Message[] {
    return this.messages.map(msg => ({ ...msg }));
  }
}
