import { WrapperARequest, WrapperAResponse } from '../types/ai';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export class AIService {
  private static instance: AIService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `${API_BASE_URL}/api/assistant`;
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  public async checkHealth(): Promise<{ status: string; model_name: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    return this.handleResponse(response);
  }

  public async warmupModel(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/warmup`, {
      method: 'POST',
    });
    return this.handleResponse(response);
  }

  public async queryWrapperA(request: WrapperARequest): Promise<WrapperAResponse> {
    const response = await fetch(`${this.baseUrl}/wrapperA`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return this.handleResponse(response);
  }

  public async testFormat(prompt: string): Promise<WrapperAResponse> {
    const response = await fetch(`${this.baseUrl}/test-format`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    return this.handleResponse(response);
  }

  public async sendMessage(request: WrapperARequest): Promise<WrapperAResponse> {
    const response = await fetch(`${this.baseUrl}/wrapperA`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return this.handleResponse(response);
  }

  public formatResponse(response: WrapperAResponse): string {
    let formattedResponse = response.answer_md;

    // Add assumptions if any
    if (response.assumptions && response.assumptions.length > 0) {
      formattedResponse = `**Assumptions:**\n${response.assumptions.map(a => `- ${a}`).join('\n')}\n\n${formattedResponse}`;
    }

    // Add next actions if any
    if (response.next_actions && response.next_actions.length > 0) {
      formattedResponse += `\n\n**Next Steps:**\n${response.next_actions.map(a => `- ${a}`).join('\n')}`;
    }

    // Add errors if any
    if (response.errors && response.errors.length > 0) {
      formattedResponse += `\n\n**Errors:**\n${response.errors.map(e => `- ${e}`).join('\n')}`;
    }

    return formattedResponse;
  }

  public generateConversationTitle(firstMessage: string): string {
    // Truncate and clean the message to create a title
    const maxLength = 50;
    let title = firstMessage
      .trim()
      .split('\n')[0] // Take first line only
      .slice(0, maxLength); // Limit length
    
    // Add ellipsis if truncated
    if (firstMessage.length > maxLength) {
      title += '...';
    }

    return title;
  }
}

// Export a singleton instance
export const aiService = AIService.getInstance();