import { 
  WrapperARequest, 
  WrapperAResponse, 
  HealthResponse, 
  StreamChunk, 
  DocumentUploadRequest, 
  DocumentAnalysisResponse,
  ImageUploadRequest,
  ImageAnalysisResponse 
} from '../types/ai';

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

  public async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    return this.handleResponse(response);
  }

  public async ping(): Promise<{ status: string; response_time: number; model_name: string }> {
    const response = await fetch(`${this.baseUrl}/health/ping`);
    return this.handleResponse(response);
  }

  public async warmupModel(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/warmup`, {
      method: 'POST',
    });
    return this.handleResponse(response);
  }

  public async testConnection(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/test`, {
      method: 'POST',
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

  public async clearMemory(sessionId: string): Promise<{ status: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/clear-memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });
    return this.handleResponse(response);
  }

  public async sendMessage(request: WrapperARequest): Promise<WrapperAResponse> {
    if (request.stream) {
      throw new Error('Use sendStreamingMessage for streaming requests');
    }

    const response = await fetch(`${this.baseUrl}/wrapperA`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return this.handleResponse(response);
  }

  public async sendStreamingMessage(
    request: WrapperARequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/wrapperA`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data: StreamChunk = JSON.parse(line.slice(6));
            onChunk(data);
            
            if (data.type === 'chunk' && data.content) {
              fullResponse += data.content;
            } else if (data.type === 'complete' && data.answer) {
              // Use the complete answer from the parsed response
              fullResponse = data.answer;
            } else if (data.type === 'end') {
              // Streaming completed
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Streaming error');
            }
          } catch (e) {
            // Ignore parsing errors for non-JSON lines
          }
        }
      }
    }

    return fullResponse;
  }

  public async uploadAndAnalyzeDocuments(request: DocumentUploadRequest): Promise<DocumentAnalysisResponse> {
    const formData = new FormData();
    formData.append('prompt', request.prompt);
    
    if (request.projectId) {
      formData.append('projectId', request.projectId);
    }
    
    if (request.sessionId) {
      formData.append('sessionId', request.sessionId);
    }

    // Add all files to the FormData
    request.files.forEach((file) => {
      formData.append('document', file);
    });

    const response = await fetch(`${this.baseUrl}/wrapperA`, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse(response);
  }

  public async analyzeDocument(file: File, prompt: string): Promise<DocumentAnalysisResponse> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('prompt', prompt);

    const response = await fetch(`${this.baseUrl}/analyze-document`, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse(response);
  }

  public async uploadAndAnalyzeImages(request: ImageUploadRequest): Promise<ImageAnalysisResponse> {
    const formData = new FormData();
    formData.append('prompt', request.prompt);
    
    if (request.projectId) {
      formData.append('projectId', request.projectId);
    }
    
    if (request.sessionId) {
      formData.append('sessionId', request.sessionId);
    }

    // Add all images to the FormData
    request.images.forEach((image) => {
      formData.append('image', image);
    });

    const response = await fetch(`${this.baseUrl}/wrapperA`, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse(response);
  }

  public async analyzeImage(file: File, prompt: string): Promise<ImageAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('prompt', prompt);

    const response = await fetch(`${this.baseUrl}/analyze-image`, {
      method: 'POST',
      body: formData,
    });

    return this.handleResponse(response);
  }

  public async uploadImage(file: File): Promise<{ status: string; image_url: string; image_info: any }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${this.baseUrl}/upload-image`, {
      method: 'POST',
      body: formData,
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

  public generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public isFileSupported(file: File): boolean {
    const supportedTypes = [
      // Images
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    return supportedTypes.includes(file.type);
  }

  public getFileTypeCategory(file: File): 'image' | 'document' | 'unsupported' {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (imageTypes.includes(file.type)) {
      return 'image';
    } else if (documentTypes.includes(file.type)) {
      return 'document';
    } else {
      return 'unsupported';
    }
  }
}

// Export a singleton instance
export const aiService = AIService.getInstance();