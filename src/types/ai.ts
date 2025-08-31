export type VendorType = 'Rockwell' | 'Siemens' | 'Beckhoff' | 'Generic';

export type TaskType = 'qna' | 'code_gen' | 'code_edit' | 'debug' | 'optimize' | 'calc' | 'checklist' | 'report';

export interface CodeArtifact {
  language: 'ST';
  vendor: VendorType;
  compilable: boolean;
  filename: string;
  content: string;
}

export interface TableArtifact {
  title: string;
  schema: string[];
  rows: string[][];
}

export interface WrapperAResponse {
  status: 'ok' | 'needs_input' | 'error';
  task_type: TaskType;
  assumptions: string[];
  answer_md: string;
  artifacts: {
    code: CodeArtifact[];
    tables: TableArtifact[];
    citations: string[];
    diff?: string;
  };
  next_actions: string[];
  errors: string[];
}

export interface WrapperARequest {
  prompt: string;
  projectId?: string;
  vendor_selection?: VendorType;
  sessionId?: string;
  stream?: boolean;
}

// Health check response
export interface HealthResponse {
  status: string;
  model_name: string;
  memory_sessions: number;
  image_support?: boolean;
  vision_model?: string;
  document_support?: boolean;
  supported_formats?: string[];
}

// Streaming response types
export interface StreamChunk {
  type: 'chunk' | 'end' | 'error' | 'complete' | 'status' | 'start';
  content?: string;
  fullResponse?: string | WrapperAResponse;
  answer?: string;
  error?: string;
}

// Document upload types
export interface DocumentUploadRequest {
  prompt: string;
  projectId?: string;
  sessionId?: string;
  files: File[];
}

export interface DocumentAnalysisResponse extends WrapperAResponse {
  document_count?: number;
  processed_documents?: string[];
}

// Image upload types
export interface ImageUploadRequest {
  prompt: string;
  projectId?: string;
  sessionId?: string;
  images: File[];
}

export interface ImageAnalysisResponse extends WrapperAResponse {
  image_count?: number;
  processed_images?: string[];
}

// Chat and conversation types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  artifacts?: {
    code: CodeArtifact[];
    tables: TableArtifact[];
    citations: string[];
    diff?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
}

// Alias for WrapperAResponse to match the import
export type AIResponse = WrapperAResponse;