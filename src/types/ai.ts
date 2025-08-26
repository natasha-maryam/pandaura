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
}

// Chat and conversation types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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