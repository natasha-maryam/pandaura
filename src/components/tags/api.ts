// API client for tags endpoints

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface Tag {
  id: string;
  project_id: number;
  user_id: string;
  name: string;
  description: string;
  type: 'BOOL' | 'INT' | 'DINT' | 'REAL' | 'STRING' | 'TIMER' | 'COUNTER';
  data_type: string;
  address: string;
  default_value: string;
  vendor: 'rockwell' | 'siemens' | 'beckhoff';
  scope: 'global' | 'local' | 'input' | 'output';
  tag_type: 'input' | 'output' | 'memory' | 'temp' | 'constant';
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTagData {
  project_id: number;
  name: string;
  description: string;
  type: 'BOOL' | 'INT' | 'DINT' | 'REAL' | 'STRING' | 'TIMER' | 'COUNTER';
  data_type?: string;
  address: string;
  default_value?: string;
  vendor: 'rockwell' | 'siemens' | 'beckhoff';
  scope: 'global' | 'local' | 'input' | 'output';
  tag_type: 'input' | 'output' | 'memory' | 'temp' | 'constant';
  is_ai_generated?: boolean;
}

export interface UpdateTagData {
  name?: string;
  description?: string;
  type?: 'BOOL' | 'INT' | 'DINT' | 'REAL' | 'STRING' | 'TIMER' | 'COUNTER';
  data_type?: string;
  address?: string;
  default_value?: string;
  vendor?: 'rockwell' | 'siemens' | 'beckhoff';
  scope?: 'global' | 'local' | 'input' | 'output';
  tag_type?: 'input' | 'output' | 'memory' | 'temp' | 'constant';
  is_ai_generated?: boolean;
}

export interface TagFilters {
  projectId?: number;
  vendor?: string;
  type?: string;
  dataType?: string;
  scope?: string;
  tagType?: string;
  isAIGenerated?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface TagsResponse {
  success: boolean;
  data: {
    tags: Tag[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface TagResponse {
  success: boolean;
  data: Tag;
}

export interface TagStatsResponse {
  success: boolean;
  data: {
    total_tags: number;
    ai_generated_tags: number;
    rockwell_tags: number;
    siemens_tags: number;
    beckhoff_tags: number;
    bool_tags: number;
    int_tags: number;
    real_tags: number;
    input_tags: number;
    output_tags: number;
    memory_tags: number;
  };
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export class TagsAPI {
  // Get tags with filters
  static async getTags(filters: TagFilters = {}): Promise<TagsResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/tags${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to fetch tags');
    }

    return response.json();
  }

  // Create a new tag
  static async createTag(tagData: CreateTagData): Promise<TagResponse> {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tagData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to create tag');
    }

    return response.json();
  }

  // Get tag by ID
  static async getTag(tagId: string): Promise<TagResponse> {
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to fetch tag');
    }

    return response.json();
  }

  // Update tag
  static async updateTag(tagId: string, updateData: UpdateTagData): Promise<TagResponse> {
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to update tag');
    }

    return response.json();
  }

  // Delete tag
  static async deleteTag(tagId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/tags/${tagId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to delete tag');
    }

    return response.json();
  }

  // Auto-generate tags
  static async autoGenerateTags(data: {
    project_id: number;
    logic_data: string;
    vendor: string;
    tag_prefix?: string;
    overwrite_existing?: boolean;
  }): Promise<{
    success: boolean;
    data: {
      generated_tags: Tag[];
      count: number;
    };
    message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/tags/autogenerate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to generate tags');
    }

    return response.json();
  }

  // Export tags
  static async exportTags(data: {
    project_id: number;
    vendor?: string;
    format?: string;
  }): Promise<{
    success: boolean;
    data: any;
    message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/tags/export`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to export tags');
    }

    return response.json();
  }

  // Get tag statistics
  static async getTagStats(projectId: number): Promise<TagStatsResponse> {
    const response = await fetch(`${API_BASE_URL}/tags/stats/${projectId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to fetch tag statistics');
    }

    return response.json();
  }
}
