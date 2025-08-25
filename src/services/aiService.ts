import { config } from '../config/environment';
import { AIRequestPayload, AIApiResponse, AIResponse, AIError } from '../types/ai';

class AIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${config.apiBaseUrl}/api/assistant`;
  }

  async sendMessage(payload: AIRequestPayload): Promise<AIResponse> {
    try {
      console.log('🚀 Sending AI request:', payload);
      
      // Create an abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${this.baseUrl}/wrapperA`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('❌ API Error:', errorData);
        throw new Error(
          errorData?.error || `HTTP error! status: ${response.status}`
        );
      }

      const data: AIApiResponse = await response.json();
      console.log('✅ AI Response received:', data);

      // Check if the response is an error
      if ('error' in data) {
        console.error('❌ AI Service returned error:', data.error);
        throw new Error(data.error);
      }

      return data as AIResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('AI is taking longer than expected. The model may be processing a complex request. Please try a simpler question or try again later.');
      }
      console.error('💥 AI Service Error:', error);
      throw error;
    }
  }

  /**
   * Utility method to check if the response is an error
   */
  isErrorResponse(response: AIApiResponse): response is AIError {
    return 'error' in response;
  }

  /**
   * Generate a conversation title from the user's message
   */
  generateConversationTitle(message: string): string {
    // Take first 50 characters and add ellipsis if longer
    const title = message.length > 50 ? message.substring(0, 47) + '...' : message;
    return title;
  }

  /**
   * Format AI response for display
   */
  formatResponse(response: AIResponse): string {
    let formatted = response.answer_md;

    // Add assumptions if present
    if (response.assumptions.length > 0) {
      formatted += '\n\n**Assumptions:**\n';
      response.assumptions.forEach(assumption => {
        formatted += `- ${assumption}\n`;
      });
    }

    // Add next actions if present
    if (response.next_actions.length > 0) {
      formatted += '\n\n**Next Actions:**\n';
      response.next_actions.forEach(action => {
        formatted += `- ${action}\n`;
      });
    }

    // Add errors if present
    if (response.errors.length > 0) {
      formatted += '\n\n**⚠️ Issues:**\n';
      response.errors.forEach(error => {
        formatted += `- ${error}\n`;
      });
    }

    return formatted;
  }
}

export const aiService = new AIService();
export default aiService;
