import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { TagsAPI, Tag, CreateTagData, UpdateTagData, TagFilters } from './api';

interface TagsContextType {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  filters: TagFilters;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  
  // Actions
  fetchTags: (newFilters?: TagFilters) => Promise<void>;
  createTag: (tagData: CreateTagData) => Promise<Tag>;
  updateTag: (tagId: number | string, updateData: UpdateTagData) => Promise<Tag>;
  deleteTag: (tagId: number | string) => Promise<void>;
  setFilters: (filters: TagFilters) => void;
  clearError: () => void;
  refreshTags: () => Promise<void>;
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

interface TagsProviderProps {
  children: ReactNode;
}

export const TagsProvider: React.FC<TagsProviderProps> = ({ children }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TagFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  });

  const setFilters = useCallback((newFilters: TagFilters) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const fetchTags = useCallback(async (newFilters?: TagFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const filtersToUse = newFilters || filters;
      const response = await TagsAPI.getTags(filtersToUse);
      
      setTags(response.data.tags);
      setPagination(response.data.pagination);
      
      if (newFilters) {
        setFiltersState(prev => ({ ...prev, ...newFilters }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tags';
      setError(errorMessage);
      console.error('Error fetching tags:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createTag = useCallback(async (tagData: CreateTagData): Promise<Tag> => {
    setError(null);
    
    try {
      const response = await TagsAPI.createTag(tagData);
      const newTag = response.data;
      
      // Add the new tag to the current list
      setTags(prev => [newTag, ...prev]);
      
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: prev.total + 1
      }));
      
      return newTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tag';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateTag = useCallback(async (tagId: number | string, updateData: UpdateTagData): Promise<Tag> => {
    setError(null);
    
    try {
      const response = await TagsAPI.updateTag(tagId, updateData);
      const updatedTag = response.data;
      
      // Update the tag in the current list
      setTags(prev => prev.map(tag => 
        tag.id === tagId ? updatedTag : tag
      ));
      
      return updatedTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tag';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteTag = useCallback(async (tagId: number | string): Promise<void> => {
    setError(null);
    
    try {
      await TagsAPI.deleteTag(tagId);
      
      // Remove the tag from the current list
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tag';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshTags = useCallback(async () => {
    await fetchTags(filters);
  }, [fetchTags, filters]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: TagsContextType = {
    tags,
    loading,
    error,
    filters,
    pagination,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    setFilters,
    clearError,
    refreshTags
  };

  return (
    <TagsContext.Provider value={value}>
      {children}
    </TagsContext.Provider>
  );
};

export const useTags = (): TagsContextType => {
  const context = useContext(TagsContext);
  if (!context) {
    throw new Error('useTags must be used within a TagsProvider');
  }
  return context;
};
