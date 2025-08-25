// AI API Types for Wrapper A Route

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  artifacts?: AIArtifacts;
}

export interface AIRequestPayload {
  prompt: string;
  projectId?: string;
}

export interface AICodeArtifact {
  language: 'ST';
  vendor: 'Rockwell' | 'Siemens' | 'Beckhoff' | 'Generic';
  compilable: boolean;
  filename: string;
  content: string;
}

export interface AITableArtifact {
  title: string;
  schema: string[];
  rows: string[][];
}

export interface AIArtifacts {
  code: AICodeArtifact[];
  diff: string;
  tables: AITableArtifact[];
  citations: string[];
}

export interface AIResponse {
  status: 'ok' | 'needs_input' | 'error';
  task_type: 'qna' | 'code_gen' | 'code_edit' | 'debug' | 'optimize' | 'calc' | 'checklist' | 'report';
  assumptions: string[];
  answer_md: string;
  artifacts: AIArtifacts;
  next_actions: string[];
  errors: string[];
}

export interface AIError {
  error: string;
  raw?: string;
}

export type AIApiResponse = AIResponse | AIError;

export interface Conversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
}
