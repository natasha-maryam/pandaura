import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {  ChevronDown, Bot, Edit, Trash2, Plus, Check, X, RefreshCw, AlertTriangle, Upload, Download, Wifi, WifiOff, Clock } from "lucide-react";

import { TagsProvider, useTags } from "./context";
import { TagsAPI, Tag, CreateTagData } from "./api";
import { ProjectsAPI, Project } from "../projects/api";
import CreateTagModal from "./CreateTagModal";
import VendorExportModal from "./VendorExportModal";
import VendorImportModal from "./VendorImportModal";
import { useToast } from "../ui/Toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useTagSyncOnly } from "../../contexts/ProjectSyncContext";
import { TagSyncResponse } from "../../hooks/useTagSync";
import { useProjectAutosave } from "../projects/hooks";
import AutosaveStatus from "../ui/AutosaveStatus";
import { 
  validateTagTypeForVendor, 
  validateAddressForVendor, 
  getAvailableTagTypes, 
  getInvalidTypeMessage, 
  getInvalidAddressMessage,
  type Vendor,
  type TagType 
} from "../../utils/vendorValidation";

interface TagDatabaseManagerProps {
  sessionMode?: boolean;
}

const TagDatabaseManagerContent: React.FC<TagDatabaseManagerProps> = ({ sessionMode = false }) => {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Check if we're in project workspace mode
  const isProjectWorkspace = window.location.pathname.startsWith('/workspace/');
  
  const {
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
  } = useTags();

  // Real-time tag sync
  const {
    isConnected,
    isConnecting,
    lastError: syncError,
    lastSyncTime,
    queuedSyncs,
    latestTags,
    onTagsUpdated,
    offTagsUpdated
  } = useTagSyncOnly();

  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showVendorExportModal, setShowVendorExportModal] = useState(false);
  const [showVendorImportModal, setShowVendorImportModal] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [lastRealTimeUpdate, setLastRealTimeUpdate] = useState<number | null>(null);

  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  // Enhanced autosave for tag management state
  const {
    projectState: tagManagerState,
    updateProjectState: updateTagManagerState,
    isSaving: isAutosaving,
    lastSaved: lastAutosaved,
    saveError: autosaveError,
    hasUnsavedChanges: hasUnsavedTagChanges,
    saveNow: saveTagManagerState
  } = useProjectAutosave(currentProjectId || 0, {
    module: 'TagManager',
    filters,
    editingTag,
    lastActivity: new Date().toISOString(),
    lastRealTimeUpdate
  });

  // Handle real-time tag updates from WebSocket
  const handleRealTimeTagUpdate = useCallback((response: TagSyncResponse) => {
    if (response.type === 'tags_updated' && response.success && response.tags) {
      console.log(`📡 Received real-time tag update: ${response.tags.length} tags`);
      setLastRealTimeUpdate(Date.now());

      // Refresh tags to get the latest data
      if (currentProjectId) {
        refreshTags();
      }

      // Update autosave state
      updateTagManagerState({
        module: 'TagManager',
        filters,
        editingTag,
        lastActivity: new Date().toISOString(),
        lastRealTimeUpdate: Date.now(),
        tagsCount: response.tags.length
      });

      showToast({
        variant: 'success',
        title: 'Tags Updated',
        message: `${response.parsedCount || response.tags.length} tags synced from Logic Studio`
      });
    }
  }, [currentProjectId, refreshTags, showToast, updateTagManagerState, filters, editingTag]);

  // Update autosave state when filters or editing state changes
  useEffect(() => {
    if (currentProjectId) {
      updateTagManagerState({
        module: 'TagManager',
        filters,
        editingTag,
        lastActivity: new Date().toISOString(),
        lastRealTimeUpdate
      });
    }
  }, [currentProjectId, updateTagManagerState, filters, editingTag, lastRealTimeUpdate]);

  // Subscribe to real-time tag updates
  useEffect(() => {
    onTagsUpdated(handleRealTimeTagUpdate);
    return () => {
      offTagsUpdated(handleRealTimeTagUpdate);
    };
  }, [handleRealTimeTagUpdate, onTagsUpdated, offTagsUpdated]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setShowVendorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current project ID from URL params, localStorage, or prompt user
  useEffect(() => {
    let selectedProjectId: number | null = null;
    
    // Priority 1: URL parameter
    if (urlProjectId) {
      selectedProjectId = parseInt(urlProjectId);
      localStorage.setItem('currentProjectId', selectedProjectId.toString());
    }
    // Priority 2: localStorage 
    else {
      const savedProjectId = localStorage.getItem('currentProjectId');
      if (savedProjectId) {
        selectedProjectId = parseInt(savedProjectId);
      }
    }
    
    if (selectedProjectId && !isNaN(selectedProjectId)) {
      setCurrentProjectId(selectedProjectId);
      setFilters({ projectId: selectedProjectId });
      
      // Update URL if we're using localStorage value and URL doesn't have project ID
      if (!urlProjectId && !sessionMode && !isProjectWorkspace) {
        navigate(`/tag-database/${selectedProjectId}`, { replace: true });
      }
    } else if (!sessionMode && !isProjectWorkspace) {
      // If no project ID is available and not in session mode or workspace mode, 
      // load available projects for selection
      setCurrentProjectId(null);
      loadAvailableProjects();
    }
  }, [urlProjectId, setFilters, navigate, sessionMode, isProjectWorkspace]);

  // Load available projects for selection
  const loadAvailableProjects = async () => {
    try {
      setLoadingProjects(true);
      const projects = await ProjectsAPI.getProjects();
      setAvailableProjects(projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Load current project details
  const loadCurrentProject = async (projectId: number) => {
    try {
      const projects = await ProjectsAPI.getProjects();
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      }
    } catch (error) {
      console.error('Failed to load current project:', error);
    }
  };

  // Handle project selection
  const handleProjectSelect = (project: Project) => {
    setCurrentProjectId(project.id);
    setCurrentProject(project);
    localStorage.setItem('currentProjectId', project.id.toString());
    setFilters({ projectId: project.id });
    
    // Update URL to include project ID
    if (!sessionMode && !isProjectWorkspace) {
      navigate(`/tag-database/${project.id}`, { replace: true });
    }
  };

  // Fetch tags when component mounts or project changes
  useEffect(() => {
    if (currentProjectId) {
      fetchTags({ projectId: currentProjectId });
      // Also load project details if we don't have them
      if (!currentProject) {
        loadCurrentProject(currentProjectId);
      }
    }
  }, [currentProjectId]); // Remove fetchTags from dependencies to prevent infinite loop

  const filteredTags = tags.filter(tag => {
    if (filters.search && !tag.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !tag.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.vendor && filters.vendor !== "all" && tag.vendor !== filters.vendor) return false;
    if (filters.type && filters.type !== "all" && tag.type !== filters.type) return false;
    if (filters.dataType && filters.dataType !== "all" && tag.data_type !== filters.dataType) return false;
    if (filters.scope && filters.scope !== "all" && tag.scope !== filters.scope) return false;
    if (filters.tagType && filters.tagType !== "all" && tag.tag_type !== filters.tagType) return false;
    if (filters.isAIGenerated && !tag.is_ai_generated) return false;
    return true;
  });

  const handleEditTag = async (tagId: string, field: keyof Tag, value: any) => {
    try {
      // Get the current tag to access vendor information
      const tag = tags.find(t => t.id === tagId);
      if (!tag) {
        throw new Error('Tag not found');
      }

      // Validate vendor-specific constraints
      if (field === 'type') {
        const isValidType = validateTagTypeForVendor(value as TagType, tag.vendor as Vendor);
        if (!isValidType) {
          const errorMessage = getInvalidTypeMessage(value as TagType, tag.vendor as Vendor);
          showToast({
            variant: 'error',
            title: 'Invalid Data Type',
            message: errorMessage,
            duration: 5000
          });
          return; // Don't proceed with the update
        }
      }
      
      if (field === 'address') {
        const isValidAddress = validateAddressForVendor(value, tag.vendor as Vendor);
        if (!isValidAddress) {
          const errorMessage = getInvalidAddressMessage(value, tag.vendor as Vendor);
          showToast({
            variant: 'error',
            title: 'Invalid Address Format',
            message: errorMessage,
            duration: 5000
          });
          return; // Don't proceed with the update
        }
      }
      
      await updateTag(tagId, { [field]: value });
      
      // Show success message for successful updates
      showToast({
        variant: 'success',
        title: 'Tag Updated',
        message: `${field} updated successfully`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error updating tag:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tag';
      showToast({
        variant: 'error',
        title: 'Update Failed',
        message: errorMessage,
        duration: 5000
      });
    }
  };

  const handleDeleteTag = (tag: Tag) => {
    setTagToDelete(tag);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteTag(tagToDelete.id);
      showToast({
        variant: 'success',
        title: 'Tag Deleted',
        message: `Tag "${tagToDelete.name}" has been successfully deleted.`,
        duration: 4000
      });
      setShowDeleteModal(false);
      setTagToDelete(null);
    } catch (error) {
      console.error('Error deleting tag:', error);
      showToast({
        variant: 'error',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete tag. Please try again.',
        duration: 5000
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTagToDelete(null);
  };

  const handleSaveTag = async (tagId: string) => {
    try {
      // The individual field updates are already handled by handleEditTag
      // This function is called when user clicks the tick icon to confirm save
      console.log('✅ Tag saved successfully:', tagId);
      setEditingTag(null);
    } catch (error) {
      console.error('Error saving tag:', error);
      alert('Failed to save tag changes');
    }
  };

  const handleCancelEdit = (tagId: string) => {
    // TODO: Implement reverting changes if needed
    setEditingTag(null);
  };

  const handleAddTag = () => {
    if (!currentProjectId) {
      showToast({
        variant: 'error',
        title: 'No Project Selected',
        message: 'Please select a project first before adding tags.',
        duration: 4000
      });
      return;
    }
    setShowCreateTagModal(true);
  };

  const handleCreateTag = async (tagData: CreateTagData) => {
    try {
      await createTag(tagData);
      // The success toast and modal closing will be handled by the modal component
      // Refresh the tags list
      await refreshTags();
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  const handleAutoGenerate = async () => {
    if (!currentProjectId) {
      alert('Please select a project first');
      return;
    }

    try {
      const result = await TagsAPI.autoGenerateTags({
        project_id: currentProjectId,
        logic_data: "Sample logic data",
        vendor: "rockwell",
        tag_prefix: "AUTO_"
      });
      
      alert(`Successfully generated ${result.data.count} tags!`);
      await refreshTags();
    } catch (error) {
      console.error('Error auto-generating tags:', error);
      alert('Failed to generate tags: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleExportButtonClick = () => {
    if (!currentProjectId) {
      showToast({
        variant: 'error',
        message: 'Please select a project first'
      });
      return;
    }

    setShowVendorExportModal(true);
    setShowVendorDropdown(false);
  };

  const handleImportButtonClick = () => {
    if (!currentProjectId) {
      showToast({
        variant: 'error',
        title: 'No Project Selected',
        message: 'Please select a project first before importing tags.',
        duration: 3000
      });
      return;
    }
    setShowVendorImportModal(true);
  };

  const handleImportSuccess = (importedCount: number) => {
    showToast({
      variant: 'success',
      title: 'Import Successful',
      message: `Successfully imported ${importedCount} tags.`,
      duration: 5000
    });
    // Refresh the tags list to show newly imported tags
    refreshTags();
  };

  const handleExport = async (format: string) => {
    if (!currentProjectId) {
      showToast({
        variant: 'error',
        message: 'Please select a project first'
      });
      return;
    }

    try {
      const result = await TagsAPI.exportTags({
        project_id: currentProjectId,
        format
      });
      
      showToast({
        variant: 'success',
        message: result.message
      });
      setShowVendorDropdown(false);
    } catch (error) {
      console.error('Error exporting tags:', error);
      showToast({
        variant: 'error',
        message: 'Failed to export tags: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ [key]: value === "all" || value === "" ? undefined : value });
  };

  const clearAllFilters = () => {
    setFilters({
      projectId: currentProjectId || undefined,
      search: undefined,
      vendor: undefined,
      type: undefined,
      dataType: undefined,
      scope: undefined,
      tagType: undefined,
      isAIGenerated: undefined
    });
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-6 mt-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Project Selection UI */}
      {!currentProjectId && !sessionMode && !isProjectWorkspace ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-primary mb-2">Select a Project</h2>
              <p className="text-secondary">Choose a project to manage its tags</p>
            </div>
            
            {loadingProjects ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-accent mx-auto mb-4 animate-spin" />
                <p className="text-secondary">Loading projects...</p>
              </div>
            ) : availableProjects.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted mb-4">No projects found</div>
                <button 
                  onClick={() => navigate('/pandaura-as')}
                  className="text-accent hover:text-accent-dark underline"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {availableProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className="w-full p-4 bg-surface border border-light rounded-lg hover:border-accent hover:shadow-sm transition-all text-left"
                  >
                    <div className="font-medium text-primary">{project.project_name}</div>
                    {project.client_name && (
                      <div className="text-sm text-secondary mt-1">Client: {project.client_name}</div>
                    )}
                    {project.target_plc_vendor && (
                      <div className="text-xs text-muted mt-1 capitalize">
                        Target: {project.target_plc_vendor}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Sticky Top Bar */}
          <div className="sticky top-0 z-30 bg-white border-b border-light px-6 py-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-primary">Tag Database Manager</h1>
                {currentProjectId && (
                  <div className="text-sm text-secondary mt-1">
                    Project ID: {currentProjectId}
                    {availableProjects.length > 0 && (
                      <span className="ml-2">
                        - {availableProjects.find(p => p.id === currentProjectId)?.project_name || 'Unknown Project'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Real-time Sync Status */}
              {!sessionMode && currentProjectId && (
                <div className="flex items-center gap-2">
                  {isConnecting ? (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Clock className="w-4 h-4 animate-pulse" />
                      <span className="text-xs">Connecting...</span>
                    </div>
                  ) : isConnected ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Wifi className="w-4 h-4" />
                      <span className="text-xs">Live Sync</span>
                      {lastRealTimeUpdate && (
                        <span className="text-xs text-gray-500">
                          (Updated {Math.round((Date.now() - lastRealTimeUpdate) / 1000)}s ago)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <WifiOff className="w-4 h-4" />
                      <span className="text-xs">Offline</span>
                    </div>
                  )}
                </div>
              )}

              {/* Autosave Status */}
              {!sessionMode && currentProjectId && (
                <AutosaveStatus
                  isSaving={isAutosaving}
                  lastSaved={lastAutosaved}
                  saveError={autosaveError}
                  hasUnsavedChanges={hasUnsavedTagChanges}
                  onManualSave={saveTagManagerState}
                  className="text-xs"
                />
              )}
            </div>

        <div className="flex gap-3 items-center">
          {!isProjectWorkspace && (
            <button 
              onClick={() => {
                setCurrentProjectId(null);
                localStorage.removeItem('currentProjectId');
                if (!sessionMode) navigate('/tag-database', { replace: true });
                loadAvailableProjects();
              }}
              className="bg-surface text-primary px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors border border-light"
            >
              Change Project
            </button>
          )}
          
          <button
            onClick={handleImportButtonClick}
            disabled={loading || !currentProjectId}
            className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm hover:bg-primary transition-colors cursor-pointer disabled:opacity-50"
            title="Import Beckhoff tags from CSV or XML files"
          >
            <Upload className="w-4 h-4" />
            Import Tags
          </button>
          
          {/* <button 
            onClick={() => handleExport('excel')}
            disabled={loading || !currentProjectId}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
          >
            Export to Excel (.xlsx)
          </button> */}
          
          <button
            onClick={handleExportButtonClick}
            disabled={loading || !currentProjectId || tags.length === 0}
            className="bg-primary border border-light px-4 py-2 rounded-md flex items-center gap-2 text-sm hover:bg-primary transition-colors cursor-pointer disabled:opacity-50 text-white hover:text-white"
            title={tags.length === 0 ? "No tags to export. Please add tags first." : "Export tags in vendor-specific formats"}
          >
            <Download className="w-4 h-4" />
            Export your tags
          </button>

          <button
            onClick={handleAutoGenerate}
            disabled={loading || !currentProjectId}
            className="bg-white border border-light px-4 py-2 rounded-md text-sm hover:bg-accent-light transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Bot className="w-4 h-4" />
            Auto-Generate Tags
          </button>

          <button
            onClick={refreshTags}
            disabled={loading}
            className="bg-white border border-light px-2 py-2 rounded-md text-sm hover:bg-accent-light transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sticky Filter/Search Panel */}
      <div className="sticky top-[64px] z-20 bg-white border-b border-light px-6 py-3 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search tags..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="border border-light rounded px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <select
          value={filters.vendor || 'all'}
          onChange={(e) => handleFilterChange('vendor', e.target.value)}
          className="border border-light rounded px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All Vendors</option>
          <option value="rockwell">Rockwell</option>
          <option value="siemens">Siemens</option>
          <option value="beckhoff">Beckhoff</option>
        </select>

        <select
          value={filters.tagType || 'all'}
          onChange={(e) => handleFilterChange('tagType', e.target.value)}
          className="border border-light rounded px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All Tag Types</option>
          <option value="input">Input</option>
          <option value="output">Output</option>
          <option value="memory">Memory</option>
          <option value="temp">Temp</option>
          <option value="constant">Constant</option>
        </select>

        <select
          value={filters.type || 'all'}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="border border-light rounded px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All Data Types</option>
          <option value="BOOL">BOOL</option>
          <option value="INT">INT</option>
          <option value="REAL">REAL</option>
          <option value="DINT">DINT</option>
          <option value="STRING">STRING</option>
          <option value="TIMER">TIMER</option>
          <option value="COUNTER">COUNTER</option>
        </select>

        <select
          value={filters.scope || 'all'}
          onChange={(e) => handleFilterChange('scope', e.target.value)}
          className="border border-light rounded px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All Scopes</option>
          <option value="global">Global</option>
          <option value="local">Local</option>
          <option value="input">Input</option>
          <option value="output">Output</option>
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input 
            type="checkbox" 
            checked={filters.isAIGenerated || false}
            onChange={(e) => setFilters({ isAIGenerated: e.target.checked ? true : undefined })}
            className="accent-primary cursor-pointer" 
          />
          Show AI-generated only
        </label>

        <button
          onClick={handleAddTag}
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded text-sm hover:bg-secondary transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-primary">Loading tags...</span>
        </div>
      )}

      {/* Scrollable Table Area */}
      <div className="flex-1 px-6 py-4 pb-32 overflow-auto">
        <div className="bg-white border border-light rounded-md shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-light">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-primary">Tag Name</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Description</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Type</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Data Type</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Address</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Default</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Vendor</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Scope</th>
                <th className="text-left p-3 text-sm font-medium text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.map((tag) => (
                <tr key={tag.id} className="border-b border-light hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {editingTag === tag.id ? (
                        <input
                          type="text"
                          value={tag.name}
                          onChange={(e) => handleEditTag(tag.id, 'name', e.target.value)}
                          className="border border-light rounded px-2 py-1 text-sm w-full font-mono"
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono text-sm">{tag.name}</span>
                      )}
                      {tag.is_ai_generated && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">AI</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <input
                        type="text"
                        value={tag.description}
                        onChange={(e) => handleEditTag(tag.id, 'description', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      <span className="text-sm text-muted">{tag.description}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <select
                        value={tag.tag_type}
                        onChange={(e) => handleEditTag(tag.id, 'tag_type', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm"
                      >
                        <option value="input">Input</option>
                        <option value="output">Output</option>
                        <option value="memory">Memory</option>
                        <option value="temp">Temp</option>
                        <option value="constant">Constant</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded ${
                        tag.tag_type === 'input' ? 'bg-blue-100 text-blue-700' :
                        tag.tag_type === 'output' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {tag.tag_type.charAt(0).toUpperCase() + tag.tag_type.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <select
                        value={tag.type}
                        onChange={(e) => handleEditTag(tag.id, 'type', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm"
                      >
                        {getAvailableTagTypes(tag.vendor as Vendor).map((tagType) => (
                          <option key={tagType} value={tagType}>{tagType}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm font-mono">{tag.type}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <input
                        type="text"
                        value={tag.address}
                        onChange={(e) => handleEditTag(tag.id, 'address', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm font-mono w-20"
                      />
                    ) : (
                      <span className="text-sm font-mono text-muted">{tag.address}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <input
                        type="text"
                        value={tag.default_value}
                        onChange={(e) => handleEditTag(tag.id, 'default_value', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm font-mono w-16"
                      />
                    ) : (
                      <span className="text-sm font-mono text-muted">{tag.default_value}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <select
                        value={tag.vendor}
                        onChange={(e) => handleEditTag(tag.id, 'vendor', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm"
                      >
                        <option value="rockwell">Rockwell</option>
                        <option value="siemens">Siemens</option>
                        <option value="beckhoff">Beckhoff</option>
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded ${
                        tag.vendor === 'rockwell' ? 'bg-red-100 text-red-700' :
                        tag.vendor === 'siemens' ? 'bg-teal-100 text-teal-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {tag.vendor.charAt(0).toUpperCase() + tag.vendor.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingTag === tag.id ? (
                      <select
                        value={tag.scope}
                        onChange={(e) => handleEditTag(tag.id, 'scope', e.target.value)}
                        className="border border-light rounded px-2 py-1 text-sm"
                      >
                        <option value="global">Global</option>
                        <option value="local">Local</option>
                        <option value="input">Input</option>
                        <option value="output">Output</option>
                      </select>
                    ) : (
                      <span className="text-sm">{tag.scope}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {editingTag === tag.id ? (
                        <>
                          <button
                            onClick={() => handleSaveTag(tag.id)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancelEdit(tag.id)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingTag(tag.id)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTags.length === 0 && !loading && (
            <div className="text-center py-8 text-muted">
              <div className="mb-2">No tags match your current filters</div>
              <button
                onClick={clearAllFilters}
                className="text-accent hover:underline text-sm"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination Info */}
        {pagination.total > 0 && (
          <div className="mt-4 text-center text-sm text-muted">
            Showing {filteredTags.length} of {pagination.total} tags
            (Page {pagination.page} of {pagination.totalPages})
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Confirm Delete"
        size="md"
        actions={
          <>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmDelete}
              loading={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Tag'}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-gray-900 mb-2">
              Are you sure you want to delete the tag <strong>"{tagToDelete?.name}"</strong>?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. The tag will be permanently removed from the database.
            </p>
            {tagToDelete && (
              <div className="mt-3 p-3 bg-gray-50 rounded border text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Type:</strong> {tagToDelete.type}</div>
                  <div><strong>Address:</strong> {tagToDelete.address}</div>
                  <div><strong>Vendor:</strong> {tagToDelete.vendor}</div>
                  <div><strong>Scope:</strong> {tagToDelete.scope}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Create Tag Modal */}
      {currentProjectId && (
        <CreateTagModal
          isOpen={showCreateTagModal}
          onClose={() => setShowCreateTagModal(false)}
          onSuccess={() => setShowCreateTagModal(false)}
          projectId={currentProjectId}
          onCreate={handleCreateTag}
        />
      )}

      {/* Vendor Export Modal */}
      {currentProjectId && currentProject && (
        <VendorExportModal
          isOpen={showVendorExportModal}
          onClose={() => setShowVendorExportModal(false)}
          projectId={currentProjectId}
          projectName={currentProject.project_name}
          tags={tags}
        />
      )}

      {/* Vendor Import Modal */}
      {currentProjectId && currentProject && (
        <VendorImportModal
          isOpen={showVendorImportModal}
          onClose={() => setShowVendorImportModal(false)}
          projectId={currentProjectId}
          projectName={currentProject.project_name}
          onSuccess={handleImportSuccess}
        />
      )}
      </>
      )}
    </div>
  );
};

const TagDatabaseManager: React.FC<TagDatabaseManagerProps> = (props) => {
  return (
    <TagsProvider>
      <TagDatabaseManagerContent {...props} />
    </TagsProvider>
  );
};

export default TagDatabaseManager;
