import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit,
  Trash2,
  Plus,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Upload,
  Download,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";

import { TagsProvider, useTags } from "./context";
import { TagsAPI, Tag, CreateTagData, TagFilters } from "./api";
import { ProjectsAPI, Project } from "../projects/api";
import VendorExportModal from "./VendorExportModal";
import VendorImportModal from "./VendorImportModal";
import CreateTagModal from "./CreateTagModal";
import { useToast } from "../ui/Toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useTagSyncOnly } from "../../contexts/ProjectSyncContext";
import { TagSyncResponse } from "../../hooks/useTagSync";
import {
  validateTagTypeForVendor,
  validateAddressForVendor,
  getAvailableTagTypes,
  getInvalidTypeMessage,
  getInvalidAddressMessage,
  type Vendor,
  type TagType,
} from "../../utils/vendorValidation";

interface TagDatabaseManagerProps {
  sessionMode?: boolean;
}

const TagDatabaseManagerContent: React.FC<TagDatabaseManagerProps> = ({
  sessionMode = false,
}) => {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // // Tag sync functionality - safely handle when not in ProjectSyncProvider
  // const {
  //   isConnected,
  //   isConnecting,
  //   lastError: syncError,
  //   lastSyncTime,
  //   queuedSyncs,
  //   latestTags,
  //   onTagsUpdated,
  //   offTagsUpdated,
  // } = useTagSyncOnly();

  // Check if we're in project workspace mode
  const isProjectWorkspace = window.location.pathname.startsWith("/workspace/");

  const {
    isConnected,
    isConnecting,
    lastError: syncError,
    lastSyncTime,
    queuedSyncs,
    latestTags,
    onTagsUpdated,
    offTagsUpdated,
  } = useTagSyncOnly();

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
    refreshTags,
  } = useTags();

  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Record<string, Partial<Tag>>>({});
  const pendingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
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
  const [showReloadButton, setShowReloadButton] = useState(false);
  
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  const handleRealTimeTagUpdate = useCallback(
    (response: TagSyncResponse) => {
      if (
        response.type === "tags_updated" &&
        response.success &&
        response.tags
      ) {
        console.log(
          `📡 Received real-time tag update: ${response.tags.length} tags`
        );
        setLastRealTimeUpdate(Date.now());

        // Avoid race conditions by using a ref for the latest project ID
        if (currentProjectId) {
          // Debounce tag refresh to prevent multiple rapid updates
          const timeoutId = setTimeout(() => {
            refreshTags().catch((error) => {
              console.error("Failed to refresh tags:", error);
              showToast({
                variant: "error",
                title: "Sync Error",
                message: "Failed to refresh tags. Please try again.",
              });
            });
          }, 500);

          // Cleanup timeout if component unmounts
          return () => clearTimeout(timeoutId);
        }

        showToast({
          variant: "success",
          title: "Tags Updated",
          message: `${
            response.parsedCount || response.tags.length
          } tags synced from Logic Studio`,
          duration: 3000,
        });
      } else if (response.type === "tags_updated" && !response.success) {
        console.error("Tag sync failed:", response.error);
        showToast({
          variant: "error",
          title: "Sync Failed",
          message: response.error || "Failed to sync tags from Logic Studio",
          duration: 5000,
        });
      }
    },
    [currentProjectId, refreshTags, showToast]
  );

  // Subscribe to real-time tag updates and handle cleanup
  useEffect(() => {
    let isMounted = true;
    let syncTimeoutId: ReturnType<typeof setInterval>;

    const handleSync = async () => {
      if (!isMounted) return;

      try {
        onTagsUpdated(handleRealTimeTagUpdate);
        
        // Set up periodic sync health check
        syncTimeoutId = setInterval(() => {
          if (!isConnected && !isConnecting && isMounted) {
            showToast({
              variant: "warning",
              title: "Sync Disconnected",
              message: "Tag sync connection lost. Attempting to reconnect...",
              duration: 5000,
            });
            setShowReloadButton(true);
          }
        }, 30000); // Check every 30 seconds
      } catch (error) {
        console.error("Failed to initialize tag sync:", error);
        if (isMounted) {
          showToast({
            variant: "error",
            title: "Sync Error",
            message: "Failed to initialize tag sync. Please try again.",
            duration: 5000,
          });
        }
      }
    };

    handleSync();

    // Cleanup subscriptions and intervals
    return () => {
      isMounted = false;
      if (syncTimeoutId) clearInterval(syncTimeoutId);
      offTagsUpdated(handleRealTimeTagUpdate);
    };
  }, [handleRealTimeTagUpdate, onTagsUpdated, offTagsUpdated, isConnected, isConnecting, showToast]);

  const loadCurrentProject = async (projectId: number) => {
    try {
      const projects = await ProjectsAPI.getProjects();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      }
    } catch (error) {
      console.error("Failed to load current project:", error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        vendorDropdownRef.current &&
        !vendorDropdownRef.current.contains(event.target as Node)
      ) {
        setShowVendorDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get current project ID from URL params, localStorage, or prompt user
  useEffect(() => {
    let selectedProjectId: number | null = null;

    // Priority 1: URL parameter
    if (urlProjectId) {
      selectedProjectId = parseInt(urlProjectId);
      localStorage.setItem("currentProjectId", selectedProjectId.toString());
    }
    // Priority 2: localStorage
    else {
      const savedProjectId = localStorage.getItem("currentProjectId");
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
      console.error("Failed to load projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Handle project selection
  const handleProjectSelect = (project: Project) => {
    setCurrentProjectId(project.id);
    setCurrentProject(project);
    localStorage.setItem("currentProjectId", project.id.toString());
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
      if (!currentProject) {
        loadCurrentProject(currentProjectId);
      }
    }
  }, [currentProjectId]);

  // Listen for tag import events
  useEffect(() => {
    const handleTagsImported = (event: CustomEvent) => {
      const { projectId, importedCount } = event.detail;
      if (projectId === currentProjectId) {
        setShowReloadButton(true);
      }
    };

    window.addEventListener('pandaura:tags-imported', handleTagsImported as EventListener);
    return () => {
      window.removeEventListener('pandaura:tags-imported', handleTagsImported as EventListener);
    };
  }, [currentProjectId]);

  const handleReloadTags = async () => {
    try {
      if (currentProjectId !== null) {
        await fetchTags({ projectId: currentProjectId });
      }
      // Trigger real-time sync with Logic Studio
      if (currentProjectId && currentProject?.target_plc_vendor) {
        // Only sync if there's an active project and vendor
        try {
          await fetchTags({ 
            projectId: currentProjectId, 
            vendor: currentProject.target_plc_vendor 
          });
        } catch (error) {
          console.error("Failed to sync tags:", error);
          showToast({
            variant: "error",
            title: "Sync Error",
            message: "Failed to sync tags with PLC. Please try again.",
            duration: 5000,
          });
        }
      }
      setShowReloadButton(false);
      showToast({
        variant: "success",
        title: "Tags Reloaded",
        message: "Tags have been reloaded and synced with Logic Studio"
      });
    } catch (error) {
      console.error('Error reloading tags:', error);
      showToast({
        variant: "error",
        title: "Reload Failed",
        message: "Failed to reload tags. Please try again."
      });
    }
  }; // Remove fetchTags from dependencies to prevent infinite loop

  const filteredTags = tags.filter((tag) => {
    if (
      filters.search &&
      !tag.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      !tag.description.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    if (
      filters.vendor &&
      filters.vendor !== "all" &&
      tag.vendor !== filters.vendor
    )
      return false;
    if (filters.type && filters.type !== "all" && tag.type !== filters.type)
      return false;
    if (
      filters.dataType &&
      filters.dataType !== "all" &&
      tag.data_type !== filters.dataType
    )
      return false;
    if (filters.scope && filters.scope !== "all" && tag.scope !== filters.scope)
      return false;
    if (
      filters.tagType &&
      filters.tagType !== "all" &&
      tag.tag_type !== filters.tagType
    )
      return false;
    if (filters.isAIGenerated && !tag.is_ai_generated) return false;
    return true;
  });

  const flushUpdate = async (tagId: string) => {
    const buffered = editBuffer[tagId];
    if (!buffered || Object.keys(buffered).length === 0) return;

    // Clear pending timer
    const timer = pendingTimersRef.current[tagId];
    if (timer) {
      clearTimeout(timer);
      delete pendingTimersRef.current[tagId];
    }

    try {
      await updateTag(tagId, buffered as any);
      // Show success toast once per flushed update
      showToast({
        variant: "success",
        title: "Tag Updated",
        message: `Changes saved`,
        duration: 3000,
      });
      // Clear buffer for this tag after successful save
      setEditBuffer((prev) => {
        const copy = { ...prev };
        delete copy[tagId];
        return copy;
      });
    } catch (error) {
      console.error("Error flushing tag update:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update tag";
      showToast({
        variant: "error",
        title: "Update Failed",
        message: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleEditTag = (tagId: string, field: keyof Tag, value: any) => {
    try {
      const tag = tags.find((t) => t.id === tagId);
      if (!tag) {
        throw new Error("Tag not found");
      }

      // Validate vendor-specific constraints early for immediate feedback
      if (field === "type") {
        const isValidType = validateTagTypeForVendor(
          value as TagType,
          tag.vendor as Vendor
        );
        if (!isValidType) {
          const errorMessage = getInvalidTypeMessage(
            value as TagType,
            tag.vendor as Vendor
          );
          showToast({ variant: "error", title: "Invalid Data Type", message: errorMessage, duration: 5000 });
          return;
        }
      }

      if (field === "address") {
        const isValidAddress = validateAddressForVendor(value, tag.vendor as Vendor);
        if (!isValidAddress) {
          const errorMessage = getInvalidAddressMessage(value, tag.vendor as Vendor);
          showToast({ variant: "error", title: "Invalid Address Format", message: errorMessage, duration: 5000 });
          return;
        }
      }

      // Update local buffer so input reflects immediately without server round trips
      setEditBuffer((prev) => ({
        ...prev,
        [tagId]: {
          ...(prev[tagId] || {}),
          [field]: value,
        },
      }));

      // Debounce per-tag: reset existing timer and start a new one
      if (pendingTimersRef.current[tagId]) {
        clearTimeout(pendingTimersRef.current[tagId]);
      }
      pendingTimersRef.current[tagId] = setTimeout(() => flushUpdate(tagId), 800);
    } catch (error) {
      console.error("Error scheduling tag update:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to schedule tag update";
      showToast({ variant: "error", title: "Update Failed", message: errorMessage, duration: 5000 });
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
        variant: "success",
        title: "Tag Deleted",
        message: `Tag "${tagToDelete.name}" has been successfully deleted.`,
        duration: 4000,
      });
      setShowDeleteModal(false);
      setTagToDelete(null);
    } catch (error) {
      console.error("Error deleting tag:", error);
      showToast({
        variant: "error",
        title: "Delete Failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete tag. Please try again.",
        duration: 5000,
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
      console.log("✅ Tag saved successfully:", tagId);
      setEditingTag(null);
    } catch (error) {
      console.error("Error saving tag:", error);
      alert("Failed to save tag changes");
    }
  };

  const handleCancelEdit = (tagId: string) => {
    // TODO: Implement reverting changes if needed
    setEditingTag(null);
  };

  const handleAddTag = () => {
    if (!currentProjectId) {
      showToast({
        variant: "error",
        title: "No Project Selected",
        message: "Please select a project first before adding tags.",
        duration: 4000,
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
      console.error("Error creating tag:", error);
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  const handleExportButtonClick = () => {
    if (!currentProjectId) {
      showToast({
        variant: "error",
        message: "Please select a project first",
      });
      return;
    }
    setShowVendorExportModal(true);
    setShowVendorDropdown(false);
  };

  const handleImportButtonClick = () => {
    if (!currentProjectId) {
      showToast({
        variant: "error",
        title: "No Project Selected",
        message: "Please select a project first before importing tags.",
        duration: 3000,
      });
      return;
    }
    setShowVendorImportModal(true);
  };

  const handleImportSuccess = (importedCount: number) => {
    showToast({
      variant: "success",
      title: "Import Successful",
      message: `Successfully imported ${importedCount} tags.`,
      duration: 5000,
    });
    // Refresh the tags list to show newly imported tags
    refreshTags();
  };

  const handleExport = async (format: string) => {
    if (!currentProjectId) {
      alert("Please select a project first");
      showToast({
        variant: "error",
        message: "Please select a project first",
      });
      return;
    }
    try {
      const result = await TagsAPI.exportTags({
        project_id: currentProjectId,
        format,
      });
      showToast({
        variant: "success",
        message: result.message,
      });
      setShowVendorDropdown(false);
    } catch (error) {
      console.error("Error exporting tags:", error);
      showToast({
        variant: "error",
        message:
          "Failed to export tags: " +
          (error instanceof Error ? error.message : "Unknown error"),
      });
    }
  };

  const handleAutoGenerate = async () => {
    if (!currentProjectId) {
      alert("Please select a project first");
      return;
    }

    try {
      const result = await TagsAPI.autoGenerateTags({
        project_id: currentProjectId,
        logic_data: "Sample logic data",
        vendor: "rockwell",
        tag_prefix: "AUTO_",
      });

      alert(`Successfully generated ${result.data.count} tags!`);
      await refreshTags();
    } catch (error) {
      console.error("Error auto-generating tags:", error);
      alert(
        "Failed to generate tags: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  // Type-safe filter handling
  // Type-safe filter handling using TagFilters interface
  const handleFilterChange = (
    key: keyof TagFilters,
    value: string
  ) => {
    const filterValue = value === "all" || value === "" ? undefined : value;
    
    // Type guard for boolean isAIGenerated
    if (key === 'isAIGenerated') {
      const boolValue = filterValue === 'true' ? true : filterValue === 'false' ? false : undefined;
      
      setFilters({
        isAIGenerated: boolValue
      });
      return;
    }

    // Handle data type separately
    if (key === 'dataType') {
      setFilters({
        dataType: filterValue
      });
      return;
    }

    // Handle tag type separately
    if (key === 'tagType') {
      setFilters({
        tagType: filterValue
      });
      return;
    }

    // All other string filters
    setFilters({
      [key]: filterValue
    });
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
      isAIGenerated: undefined,
    });
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-6 mt-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <>
        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-light px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-primary">
                Tag Database Manager
              </h1>
              {currentProjectId && (
                <div className="text-sm text-secondary mt-1">
                  Project ID: {currentProjectId}
                  {availableProjects.length > 0 && (
                    <span className="ml-2">
                      -{" "}
                      {availableProjects.find((p) => p.id === currentProjectId)
                        ?.project_name || "Unknown Project"}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Real-time Sync Status */}
            {!sessionMode && (
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
                        (Updated{" "}
                        {Math.round((Date.now() - lastRealTimeUpdate) / 1000)}s
                        ago)
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
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={handleImportButtonClick}
              disabled={loading || !currentProjectId}
              className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm hover:bg-primary transition-colors cursor-pointer disabled:opacity-50"
              title="Import Beckhoff tags from CSV or XML files"
            >
              <Upload className="w-4 h-4" />
              Import Tags
            </button>

            <div className="relative" ref={vendorDropdownRef}>
              {showVendorDropdown && (
                <div className="absolute right-0 mt-2 bg-white border border-light rounded-md shadow-md w-56 z-50">
                  {["Rockwell CSV", "TIA XML", "Beckhoff XLS"].map((item) => (
                    <div
                      key={item}
                      onClick={() => handleExport(item.toLowerCase())}
                      className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer transition"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleExportButtonClick}
              disabled={loading || !currentProjectId || tags.length === 0}
              className="bg-primary border border-light px-4 py-2 rounded-md flex items-center gap-2 text-sm hover:bg-primary transition-colors cursor-pointer disabled:opacity-50 text-white hover:text-white"
              title={
                tags.length === 0
                  ? "No tags to export. Please add tags first."
                  : "Export tags in vendor-specific formats"
              }
            >
              <Download className="w-4 h-4" />
              Export your tags
            </button>

            {/* <button
            onClick={handleAutoGenerate}
            disabled={loading}
            className="bg-white border border-light px-4 py-2 rounded-md text-sm hover:bg-accent-light transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Bot className="w-4 h-4" />
            Auto-Generate Tags
          </button> */}

            <button
              onClick={refreshTags}
              disabled={loading}
              className="bg-white border border-light px-2 py-2 rounded-md text-sm hover:bg-accent-light transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Sticky Filter/Search Panel */}
        <div className="sticky top-[64px] z-20 bg-white border-b border-light px-6 py-3 flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="Search tags..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="border border-light rounded px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-accent"
          />

          <select
            value={filters.vendor || "all"}
            onChange={(e) => handleFilterChange("vendor", e.target.value)}
            className="border border-light rounded px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Vendors</option>
            <option value="rockwell">Rockwell</option>
            <option value="siemens">Siemens</option>
            <option value="beckhoff">Beckhoff</option>
          </select>

          <select
            value={filters.tagType || "all"}
            onChange={(e) => handleFilterChange("tagType", e.target.value)}
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
            value={filters.type || "all"}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="border border-light rounded px-3 py-2 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Data Types</option>
            <option value="BOOL">BOOL</option>
            <option value="INT">INT</option>
            <option value="REAL">REAL</option>
            <option value="DINT">DINT</option>
            <option value="STRING">STRING</option>
          </select>

          <select
            value={filters.scope || "all"}
            onChange={(e) => handleFilterChange("scope", e.target.value)}
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
              onChange={(e) =>
                setFilters({
                  isAIGenerated: e.target.checked ? true : undefined,
                })
              }
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
                  <th className="text-left p-3 text-sm font-medium text-primary">
                    Tag Name
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-primary">
                    Description
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-primary">
                    Type
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-primary">
                    Data Type
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-primary">
                    Address
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-primary">
                    Default
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-primary">
                    Vendor
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-primary">
                    Scope
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-primary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTags.map((tag) => (
                  <tr
                    key={tag.id}
                    className="border-b border-light hover:bg-gray-50"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {editingTag === tag.id ? (
                          <input
                            type="text"
                            value={(editBuffer[tag.id]?.name as string) ?? tag.name}
                            onChange={(e) =>
                              handleEditTag(tag.id, "name", e.target.value)
                            }
                            onBlur={() => flushUpdate(tag.id)}
                            className="border border-light rounded px-2 py-1 text-sm w-full font-mono"
                            autoFocus
                          />
                        ) : (
                          <span className="font-mono text-sm">{tag.name}</span>
                        )}
                        {tag.is_ai_generated && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">
                            AI
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                        {editingTag === tag.id ? (
                        <input
                          type="text"
                          value={(editBuffer[tag.id]?.description as string) ?? tag.description}
                          onChange={(e) =>
                            handleEditTag(tag.id, "description", e.target.value)
                          }
                          onBlur={() => flushUpdate(tag.id)}
                          className="border border-light rounded px-2 py-1 text-sm w-full"
                        />
                      ) : (
                        <span className="text-sm text-muted">
                          {tag.description}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                        {editingTag === tag.id ? (
                        <select
                          value={(editBuffer[tag.id]?.tag_type as string) ?? tag.tag_type}
                          onChange={(e) =>
                            handleEditTag(tag.id, "tag_type", e.target.value)
                          }
                          onBlur={() => flushUpdate(tag.id)}
                          className="border border-light rounded px-2 py-1 text-sm"
                        >
                          <option value="input">Input</option>
                          <option value="output">Output</option>
                          <option value="memory">Memory</option>
                          <option value="temp">Temp</option>
                          <option value="constant">Constant</option>
                        </select>
                      ) : (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            tag.tag_type === "input"
                              ? "bg-blue-100 text-blue-700"
                              : tag.tag_type === "output"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {tag.tag_type.charAt(0).toUpperCase() +
                            tag.tag_type.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                        {editingTag === tag.id ? (
                        <select
                          value={(editBuffer[tag.id]?.type as string) ?? tag.type}
                          onChange={(e) =>
                            handleEditTag(tag.id, "type", e.target.value)
                          }
                          onBlur={() => flushUpdate(tag.id)}
                          className="border border-light rounded px-2 py-1 text-sm"
                        >
                          {getAvailableTagTypes(tag.vendor as Vendor).map(
                            (tagType) => (
                              <option key={tagType} value={tagType}>
                                {tagType}
                              </option>
                            )
                          )}
                        </select>
                      ) : (
                        <span className="text-sm font-mono">{tag.type}</span>
                      )}
                    </td>
                    <td className="p-3">
                        {editingTag === tag.id ? (
                        <input
                          type="text"
                          value={(editBuffer[tag.id]?.address as string) ?? tag.address}
                          onChange={(e) =>
                            handleEditTag(tag.id, "address", e.target.value)
                          }
                          onBlur={() => flushUpdate(tag.id)}
                          className="border border-light rounded px-2 py-1 text-sm font-mono w-20"
                        />
                      ) : (
                        <span className="text-sm font-mono text-muted">
                          {tag.address}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                        {editingTag === tag.id ? (
                          <input
                            type="text"
                            value={(editBuffer[tag.id]?.default_value as string) ?? tag.default_value}
                            onChange={(e) =>
                              handleEditTag(
                                tag.id,
                                "default_value",
                                e.target.value
                              )
                            }
                            onBlur={() => flushUpdate(tag.id)}
                            className="border border-light rounded px-2 py-1 text-sm font-mono w-16"
                          />
                        ) : (
                          <span className="text-sm font-mono text-muted">
                            {tag.default_value}
                          </span>
                        )}
                    </td>
                    <td className="p-3">
                        {editingTag === tag.id ? (
                        <select
                          value={(editBuffer[tag.id]?.vendor as string) ?? tag.vendor}
                          onChange={(e) =>
                            handleEditTag(tag.id, "vendor", e.target.value)
                          }
                          onBlur={() => flushUpdate(tag.id)}
                          className="border border-light rounded px-2 py-1 text-sm"
                        >
                          <option value="rockwell">Rockwell</option>
                          <option value="siemens">Siemens</option>
                          <option value="beckhoff">Beckhoff</option>
                        </select>
                      ) : (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            tag.vendor === "rockwell"
                              ? "bg-red-100 text-red-700"
                              : tag.vendor === "siemens"
                              ? "bg-teal-100 text-teal-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {tag.vendor.charAt(0).toUpperCase() +
                            tag.vendor.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                        {editingTag === tag.id ? (
                        <select
                          value={(editBuffer[tag.id]?.scope as string) ?? tag.scope}
                          onChange={(e) =>
                            handleEditTag(tag.id, "scope", e.target.value)
                          }
                          onBlur={() => flushUpdate(tag.id)}
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
                              onClick={async () => {
                                await flushUpdate(tag.id);
                                setEditingTag(null);
                              }}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                // Discard buffered changes for this tag and exit edit mode
                                setEditBuffer((prev) => {
                                  const copy = { ...prev };
                                  delete copy[tag.id];
                                  return copy;
                                });
                                setEditingTag(null);
                              }}
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
              Showing {filteredTags.length} of {pagination.total} tags (Page{" "}
              {pagination.page} of {pagination.totalPages})
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
                {isDeleting ? "Deleting..." : "Delete Tag"}
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
                Are you sure you want to delete the tag{" "}
                <strong>"{tagToDelete?.name}"</strong>?
              </p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. The tag will be permanently
                removed from the database.
              </p>
              {tagToDelete && (
                <div className="mt-3 p-3 bg-gray-50 rounded border text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <strong>Type:</strong> {tagToDelete.type}
                    </div>
                    <div>
                      <strong>Address:</strong> {tagToDelete.address}
                    </div>
                    <div>
                      <strong>Vendor:</strong> {tagToDelete.vendor}
                    </div>
                    <div>
                      <strong>Scope:</strong> {tagToDelete.scope}
                    </div>
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
