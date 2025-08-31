export type VendorType = 'Rockwell' | 'Siemens' | 'Beckhoff' | 'Generic';

export type TaskType = 'qna' | 'code_gen' | 'code_edit' | 'debug' | 'optimize' | 'calc' | 'checklist' | 'report';

export type WrapperType = 'A' | 'B';

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

// Wrapper A Response (Code & Logic Generator) - Extended to support Wrapper B fields
export interface WrapperAResponse {
  status: 'ok' | 'needs_input' | 'error';
  task_type: TaskType | "doc_qa" | "doc_summary" | "tag_extract" | "code_gen" | "code_edit" | "report" | "table_extract";
  assumptions: string[];
  answer_md: string;
  artifacts: {
    code: CodeArtifact[];
    tables: TableArtifact[];
    citations: string[];
    diff?: string;
    // Wrapper B specific fields
    reports?: Array<{
      title: string;
      content_md: string;
    }>;
    anchors?: Array<{
      id: string;
      file: string;
      page?: number;
      note: string;
    }>;
  };
  next_actions: string[];
  errors: string[];
  // Wrapper B specific field
  processed_files?: Array<{
    filename: string;
    type: string;
    size: number;
    extracted_data_available: boolean;
  }>;
}

export interface WrapperARequest {
  prompt: string;
  projectId?: string;
  vendor_selection?: VendorType;
  sessionId?: string;
  stream?: boolean;
}

// Wrapper B Response (Document & Logic Analyst) - Updated to match backend schema
export interface WrapperBResponse {
  status: "ok" | "needs_input" | "error";
  task_type: "doc_qa" | "doc_summary" | "tag_extract" | "code_gen" | "code_edit" | "report" | "table_extract";
  assumptions: string[];
  answer_md: string;
  artifacts: {
    code: Array<{
      language: string;
      vendor: "Rockwell" | "Siemens" | "Beckhoff" | "Generic";
      compilable: boolean;
      filename: string;
      content: string;
    }>;
    diff?: string;
    tables: Array<{
      title: string;
      schema: string[];
      rows: string[][];
    }>;
    reports: Array<{
      title: string;
      content_md: string;
    }>;
    anchors: Array<{
      id: string;
      file: string;
      page?: number;
      note: string;
    }>;
    citations: string[];
  };
  next_actions: string[];
  errors: string[];
  processed_files?: Array<{
    filename: string;
    type: string;
    size: number;
    extracted_data_available: boolean;
  }>;
}

export interface WrapperBRequest {
  prompt: string;
  projectId?: string;
  sessionId?: string;
  files: File[];
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
  wrapperType?: WrapperType;
  artifacts?: {
    code: CodeArtifact[];
    tables: TableArtifact[];
    citations: string[];
    diff?: string;
  };
  processedFiles?: Array<{
    filename: string;
    type: string;
    tags?: any[];
    routines?: any[];
    safetyData?: any[];
  }>;
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