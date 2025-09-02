export type VendorType = 'Rockwell' | 'Siemens' | 'Beckhoff' | 'Generic';

export type TaskType = 'qna' | 'code_gen' | 'code_edit' | 'debug' | 'optimize' | 'calc' | 'checklist' | 'report' | 'safety_analysis' | 'compliance_check' | 'risk_assessment' | 'safety_code_gen' | 'audit_report' | 'sil_assessment' | 'project_planning' | 'integration_design' | 'schedule_management' | 'resource_planning' | 'stakeholder_coordination';

export type WrapperType = 'A' | 'B' | 'C';

export interface CodeArtifact {
  language: 'ST' | string; // Allow both specific 'ST' and generic string for flexibility
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
  // Pandaura AS specific field
  wrapperType?: WrapperType;
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
  // Pandaura AS specific field
  wrapperType?: WrapperType;
}

export interface WrapperBRequest {
  prompt: string;
  projectId?: string;
  sessionId?: string;
  vendor_selection?: VendorType;
  textInput?: string;
  files?: File[];
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
  type: 'chunk' | 'end' | 'error' | 'complete' | 'status' | 'start' | 'artifacts';
  content?: string;
  fullResponse?: string | WrapperAResponse;
  answer?: string;
  error?: string;
  artifacts?: {
    code?: any[];
  };
  chunkIndex?: number;
  totalChunks?: number;
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
  task_type?: string; // Preserve task_type from backend response
  artifacts?: {
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
  uploadedFiles?: Array<{
    filename: string;
    type: string;
    size: number;
    uploadedAt: Date;
    processedData?: any;
  }>;
}

// Wrapper C Response (General Assistant)
export interface WrapperCResponse {
  status: 'ok' | 'needs_input' | 'error';
  task_type: TaskType;
  assumptions: string[];
  answer_md: string;
  artifacts: {
    code: CodeArtifact[];
    tables: TableArtifact[];
    citations: string[];
  };
  next_actions: string[];
  errors: string[];
  wrapperType?: WrapperType;
}

export interface WrapperCRequest {
  prompt: string;
  projectId?: string;
  sessionId?: string;
  stream?: boolean;
  files?: File[];
}

// Wrapper D Response (Multi-Perspective Role Check)
export interface WrapperDResponse {
  status: 'ok' | 'needs_input' | 'error';
  task_type: TaskType;
  assumptions: string[];
  answer_md: string;
  artifacts: {
    code: CodeArtifact[];
    tables: TableArtifact[];
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
  expert_perspectives: {
    automation_engineer: string;
    technical_writer: string;
    quality_inspector: string;
  };
  next_actions: string[];
  errors: string[];
}

// Alias for WrapperAResponse to match the import
export type AIResponse = WrapperAResponse;