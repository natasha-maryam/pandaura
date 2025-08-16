// API client for tags endpoints
import { config, debugConfig } from '../../config/environment';

// Debug the API configuration on load
debugConfig();

const API_BASE_URL = `${config.apiBaseUrl}/api/v1`;
console.log('🔗 TagsAPI initialized with base URL:', API_BASE_URL);

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

  // Export tags in vendor-specific format
  static async exportVendorTags(
    projectId: number,
    vendor: 'rockwell' | 'siemens' | 'beckhoff',
    format: 'csv' | 'xlsx' | 'xml' | 'json' | 'l5x' = 'json'
  ): Promise<Blob> {
    // Use specific vendor endpoints that exist in backend
    let endpoint: string;
    
    if (vendor === 'beckhoff') {
      // Use Beckhoff-specific endpoints
      if (format === 'csv' || format === 'xlsx') {
        endpoint = `${API_BASE_URL}/tags/projects/${projectId}/export/beckhoff/csv`;
      } else if (format === 'xml') {
        endpoint = `${API_BASE_URL}/tags/projects/${projectId}/export/beckhoff/xml`;
      } else {
        // Default to CSV for other formats until xlsx is implemented
        endpoint = `${API_BASE_URL}/tags/projects/${projectId}/export/beckhoff/csv`;
      }
    } else {
      // For other vendors, use the formatted endpoint (may need implementation)
      endpoint = `${API_BASE_URL}/tags/projects/${projectId}/export/${vendor}/formatted`;
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to export vendor-specific tags');
    }

    return response.blob();
  }

  // Beckhoff-specific export functions
  static async exportBeckhoffCsv(projectId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}/export/beckhoff/csv`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to export Beckhoff CSV');
    }

    return response.blob();
  }

  static async exportBeckhoffXml(projectId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}/export/beckhoff/xml`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to export Beckhoff XML');
    }

    return response.blob();
  }

  // Rockwell-specific export functions
  static async exportRockwellCsv(projectId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}/export/rockwell/csv`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to export Rockwell CSV');
    }

    return response.blob();
  }

  static async exportRockwellL5X(projectId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}/export/rockwell/l5x`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to export Rockwell L5X');
    }

    return response.blob();
  }

  // Siemens-specific export functions
  static async exportSiemensCsv(projectId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}/export/siemens/csv`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to export Siemens CSV');
    }

    return response.blob();
  }

  static async exportSiemensXml(projectId: number): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}/export/siemens/xml`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to export Siemens XML');
    }

    return response.blob();
  }

  static async importBeckhoffCsv(projectId: number, file: File): Promise<{
    success: boolean;
    inserted?: number;
    errors?: Array<{ row: number; errors: string[]; raw: any }>;
    processed?: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}/import/beckhoff/csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to import Beckhoff CSV');
    }

    return response.json();
  }

  static async importBeckhoffXml(projectId: number, file: File): Promise<{
    success: boolean;
    inserted?: number;
    errors?: Array<{ row: number; errors: string[]; raw: any }>;
    processed?: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}/import/beckhoff/xml`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to import Beckhoff XML');
    }

    return response.json();
  }

  // Rockwell import methods
  static async importRockwellCsv(projectId: number, file: File): Promise<{
    success: boolean;
    inserted?: number;
    errors?: Array<{ row: number; errors: string[]; raw: any }>;
    processed?: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}/import/rockwell/csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to import Rockwell CSV');
    }

    return response.json();
  }

  static async importRockwellL5X(projectId: number, file: File): Promise<{
    success: boolean;
    inserted?: number;
    errors?: Array<{ row: number; errors: string[]; raw: any }>;
    processed?: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}/import/rockwell/l5x`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to import Rockwell L5X');
    }

    return response.json();
  }

  // Siemens import methods
  static async importSiemensCsv(projectId: number, file: File): Promise<{
    success: boolean;
    inserted?: number;
    errors?: Array<{ row: number; errors: string[]; raw: any }>;
    processed?: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/tags/projects/${projectId}/import/siemens/csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to import Siemens CSV');
    }

    return response.json();
  }

  // Format tags for specific vendor
  static async formatTagsForVendor(
    projectId: number,
    vendor: 'rockwell' | 'siemens' | 'beckhoff',
    tags: Tag[]
  ): Promise<{
    success: boolean;
    data: {
      vendor: string;
      originalCount: number;
      formattedCount: number;
      tags: any[];
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/tags/format/${vendor}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        projectId,
        tags
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to format tags for vendor');
    }

    return response.json();
  }

  // Validate addresses for specific vendor
  static async validateAddressesForVendor(
    vendor: 'rockwell' | 'siemens' | 'beckhoff',
    addresses: string[]
  ): Promise<{
    success: boolean;
    data: {
      vendor: string;
      totalAddresses: number;
      validAddresses: number;
      invalidAddresses: number;
      results: Array<{
        address: string;
        isValid: boolean;
        vendor: string;
      }>;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/tags/validate-addresses/${vendor}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ addresses }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Failed to validate addresses');
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
