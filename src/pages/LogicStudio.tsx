import React, { useState, useEffect, useRef, useCallback } from "react";
import STEditor from "../pages/STEditor/STEditor";
import AIActionButtons from "../pages/AIActionButtons";
import AISuggestedAutocomplete from "../pages/AISuggestedAutocomplete";
import PendingChangesPanel from "../pages/STEditor/PendingChangesPanel";
import RoutineSearchbar from "../pages/STEditor/RoutineSearchbar";
import { useModuleState } from "../contexts/ModuleStateContext";
import { useTagSyncOnly, useProjectSyncSafe } from "../contexts/ProjectSyncContext";
import { useProjectAutosave } from "../components/projects/hooks";
import { useProjectNavigationProtection } from "../hooks/useNavigationProtection";
import { useVersionControl } from "../hooks/useVersionControl";
import { ProjectsAPI } from "../components/projects/api";
import AutosaveStatus from "../components/ui/AutosaveStatus";
import VersionControlToolbar from "../components/ui/VersionControlToolbar";
import VersionControlDebug from "../components/debug/VersionControlDebug";
import { tagsToSTCodeWithScopes } from "../utils/tagToSTConverter";
import { RefreshCw } from "lucide-react";

import {
  UploadCloud,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";

const vendorOptions = ["Rockwell", "Siemens", "Beckhoff"];

interface LogicStudioProps {
  sessionMode?: boolean;
}

export default function LogicStudio({ sessionMode = false }: LogicStudioProps) {
  // One-time cleanup of localStorage containing unwanted template variables
  useEffect(() => {
    try {
      const keys = Object.keys(localStorage);
      const logicStudioKeys = keys.filter(key => key.includes('LogicStudio') || key.includes('moduleState'));
      
      logicStudioKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value && (value.includes('from_model') || value.includes('second_one') || value.includes('test_debug'))) {
          console.log('🧹 Clearing localStorage key with unwanted content:', key);
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error during localStorage cleanup:', error);
    }
  }, []);

  const { getModuleState, saveModuleState } = useModuleState();

  // Real-time tag sync
  const {
    isConnected,
    isConnecting,
    lastError,
    lastSyncTime,
    queuedSyncs,
    syncTags,
    connectionAttempts
  } = useTagSyncOnly();

  // Get full project sync context (safely)
  const projectSyncContext = useProjectSyncSafe();
  const currentProjectId = projectSyncContext?.currentProjectId || null;
  const loadExistingTags = projectSyncContext?.loadExistingTags || (() => Promise.resolve([]));
  const latestTags = projectSyncContext?.latestTags || [];

  // Debug connection state
  useEffect(() => {
    console.log(`🔍 LogicStudio: Connection state changed - connected: ${isConnected}, connecting: ${isConnecting}, error: ${lastError}`);
    console.log(`🔍 LogicStudio: Project ID: ${currentProjectId}`);
  }, [isConnected, isConnecting, lastError, currentProjectId]);

  // Track which project we've loaded tags for to prevent infinite loading
  const loadedProjectRef = useRef<string | null>(null);

  // Load existing tags when component mounts and project is available
  useEffect(() => {
    if (currentProjectId && isConnected && loadedProjectRef.current !== currentProjectId) {
      console.log(`📂 Loading existing tags for project ${currentProjectId}`);
      console.log(`📂 Current URL:`, window.location.href);
      loadedProjectRef.current = currentProjectId;

      loadExistingTags().then((tags: any[]) => {
        console.log(`📂 Raw tags loaded from API:`, tags);
        console.log(`📂 Number of tags loaded:`, tags.length);
        
        if (tags.length > 0) {
          console.log(`📂 Found ${tags.length} existing tags:`, tags);
          console.log(`📂 Tag details:`);
          tags.forEach((tag, index) => {
            console.log(`📂   Tag ${index + 1}: name="${tag.name}", scope="${tag.scope}", data_type="${tag.data_type}", address="${tag.address}"`);
          });

          // Generate ST code from existing tags and populate editor
          const generatedSTCode = tagsToSTCodeWithScopes(tags);
          console.log(`📂 Generated ST code from existing tags:`, generatedSTCode);
          console.log(`📂 Current editor code:`, editorCode.substring(0, 100) + '...');
          console.log(`📂 Editor code length:`, editorCode.length);

          // Replace the editor content with existing tags
          setEditorCode(generatedSTCode);
          lastSyncedCodeRef.current = generatedSTCode; // Prevent immediate sync
          console.log(`📂 Populated editor with ${tags.length} existing tags`);
        } else {
          console.log(`📂 No existing tags found for project ${currentProjectId}`);
          console.log(`📂 Setting editor to empty`);

          // Set completely empty editor when no tags exist
          const emptyContent = ``;

          setEditorCode(emptyContent);
          lastSyncedCodeRef.current = emptyContent; // Prevent immediate sync
          console.log(`📂 Set editor to empty content`);
        }
      }).catch((error: any) => {
        console.error('Failed to load existing tags:', error);
        // Reset on error so we can try again
        loadedProjectRef.current = null;
      });
    }
  }, [currentProjectId, isConnected, loadExistingTags]);


  
  // Get persisted state or use defaults - but clear if it contains unwanted content
  const moduleState = getModuleState('LogicStudio');
  
  // Check if saved editor code contains unwanted template variables and clear it
  const unwantedVariables = ['from_model', 'second_one', 'test_debug'];
  const hasSavedUnwantedVars = moduleState.editorCode && 
    unwantedVariables.some(varName => moduleState.editorCode.includes(varName));
  
  if (hasSavedUnwantedVars) {
    console.log('🧹 Clearing saved editor state with unwanted template variables');
    moduleState.editorCode = '';
  }
  
  const [prompt, setPrompt] = useState(moduleState.prompt || "");
  
  // Start with completely empty editor for new projects
  const emptyProgramCode = ``;

  const [editorCode, setEditorCode] = useState(moduleState.editorCode || emptyProgramCode);
  
  const [vendor, setVendor] = useState((moduleState.vendor as "Rockwell" | "Siemens" | "Beckhoff") || "Siemens");
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showPendingChanges, setShowPendingChanges] = useState(moduleState.showPendingChanges || false);
  const [showAISuggestions, setShowAISuggestions] = useState(moduleState.showAISuggestions !== undefined ? moduleState.showAISuggestions : true);
  const [vendorContextEnabled, setVendorContextEnabled] = useState(moduleState.vendorContextEnabled || false);

  // Note: Vendor selection removed - now uses project vendor automatically
  
  // Collapse state
  const [isCollapsed, setIsCollapsed] = useState(moduleState.isCollapsed || false);
  const [showCollapseSlider, setShowCollapseSlider] = useState(false);
  const [collapseLevel, setCollapseLevel] = useState(moduleState.collapseLevel || 0); // 0 = full, 1 = medium, 2 = minimal
  
  const vendorDropdownRef = useRef<HTMLDivElement>(null);
  const vendorContextRef = useRef<HTMLDivElement>(null);
  const collapseSliderRef = useRef<HTMLDivElement>(null);

  // Mock data for AI components
  const mockDiffs = [
    {
      line: 15,
      original: "MotorStart := TRUE;",
      modified: "MotorStart := Start_Button AND NOT E_Stop;",
      type: 'changed' as const
    },
    {
      line: 23,
      original: "",
      modified: "// Added safety interlock for conveyor",
      type: 'added' as const
    }
  ];

  // Handle tag sync - now uses project vendor automatically
  const handleTagSyncWithVendorCheck = useCallback(async (code: string) => {
    try {
      console.log('🔍 DEBUG: Full code being parsed:', code);
      
      // Block any code that contains these unwanted template variables
      const unwantedVariables = ['from_model', 'second_one', 'test_debug'];
      const hasUnwantedVars = unwantedVariables.some(varName => code.includes(varName));
      
      if (hasUnwantedVars) {
        console.log('🚫 BLOCKED: Code contains unwanted template variables, skipping sync');
        console.log('🚫 Unwanted variables detected:', unwantedVariables.filter(v => code.includes(v)));
        return;
      }
      
      // Parse the code to extract variable declarations for logging
      const variablePattern = /^\s*(\w+)\s*:\s*(\w+)(?:\s*:=\s*[^;]+)?;/gm;
      const matches = [...code.matchAll(variablePattern)];
      const codeVariables = matches.map(match => match[1]);

      console.log('🔍 DEBUG: Regex matches found:', matches.map(m => ({ 
        fullMatch: m[0], 
        variableName: m[1], 
        dataType: m[2] 
      })));
      console.log('🔍 DEBUG: Extracted variable names:', codeVariables);

      // Check if any variables in code don't exist in current tags
      const existingTagNames = latestTags.map((tag: any) => tag.name);
      const newVariables = codeVariables.filter(varName => !existingTagNames.includes(varName));

      console.log('🔍 DEBUG: Existing tag names:', existingTagNames);
      console.log('🔍 DEBUG: New variables detected:', newVariables);

      // Skip sync if no new variables found (prevents syncing existing tags)
      if (newVariables.length === 0) {
        console.log('🔄 Skipping sync - no new variables found in code');
        return;
      }

      if (newVariables.length > 0) {
        console.log(`🔍 Found ${newVariables.length} new variables: ${newVariables.join(', ')}`);
        console.log('🔄 Syncing with project vendor (no manual selection needed)');
      }

      // Sync tags - backend will automatically use project vendor
      console.log(`🔄 Syncing tags with project vendor for project ${currentProjectId}`);
      syncTags(vendor.toLowerCase(), code); // ProjectSyncContext wrapper handles projectId automatically

    } catch (error) {
      console.error('Error in tag sync:', error);
      // Fallback to direct sync
      syncTags(vendor.toLowerCase(), code);
    }
  }, [vendor, syncTags, latestTags, currentProjectId]);

  // Enhanced autosave for project state (only in non-session mode)
  const projectId = currentProjectId ? parseInt(currentProjectId) : null;
  const {
    projectState,
    updateProjectState,
    isSaving,
    lastSaved,
    saveError,
    hasUnsavedChanges,
    saveNow
  } = useProjectAutosave(projectId || 0, {
    module: 'LogicStudio',
    prompt,
    editorCode,
    showPendingChanges,
    showAISuggestions,
    vendorContextEnabled,
    isCollapsed,
    collapseLevel,
    lastActivity: new Date().toISOString()
  });

  // Navigation protection
  const { handleNavigation } = useProjectNavigationProtection(
    hasUnsavedChanges && !sessionMode,
    saveNow
  );

  // Update project state when local state changes (only in non-session mode)
  useEffect(() => {
    if (!sessionMode && projectId) {
      updateProjectState({
        module: 'LogicStudio',
        prompt,
        editorCode,
        showPendingChanges,
        showAISuggestions,
        vendorContextEnabled,
        isCollapsed,
        collapseLevel,
        lastActivity: new Date().toISOString()
      });
    }
  }, [sessionMode, projectId, updateProjectState, prompt, editorCode, showPendingChanges, showAISuggestions, vendorContextEnabled, isCollapsed, collapseLevel]);

  // Version control for rollback functionality
  const { getVersionData } = useVersionControl({
    projectId: projectId || 0,
    autoCreateVersions: false
  });

  // Listen for enhanced rollback events and restore state
  useEffect(() => {
    const handleRollback = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { projectId: rolledProjectId, targetVersion, rolledBackTo } = customEvent.detail;

      if (rolledProjectId === projectId && projectId) {
        console.log('Logic Studio: Handling enhanced rollback to version', rolledBackTo);

        try {
          // Get the version snapshot data using new API
          const versionSnapshot = await ProjectsAPI.getVersionSnapshot(projectId, rolledBackTo);

          if (versionSnapshot && versionSnapshot.autosaveState) {
            const autosaveState = versionSnapshot.autosaveState;
            
            // Check if this autosave state contains LogicStudio data
            if (autosaveState.module === 'LogicStudio') {
              // Restore Logic Studio state from the enhanced snapshot
              setPrompt(autosaveState.prompt || '');
              setEditorCode(autosaveState.editorCode || '');
              setShowPendingChanges(autosaveState.showPendingChanges || false);
              setShowAISuggestions(autosaveState.showAISuggestions || false);
              setVendorContextEnabled(autosaveState.vendorContextEnabled || false);
              setIsCollapsed(autosaveState.isCollapsed || false);
              setCollapseLevel(autosaveState.collapseLevel || 0);

              console.log('Logic Studio state restored from enhanced version snapshot', rolledBackTo);
            }
          }

          // Also check if there are module-specific states in the snapshot
          if (versionSnapshot && versionSnapshot.moduleStates && versionSnapshot.moduleStates.LogicStudio) {
            const moduleState = versionSnapshot.moduleStates.LogicStudio;
            
            setPrompt(moduleState.prompt || '');
            setEditorCode(moduleState.editorCode || '');
            setShowPendingChanges(moduleState.showPendingChanges || false);
            setShowAISuggestions(moduleState.showAISuggestions || false);
            setVendorContextEnabled(moduleState.vendorContextEnabled || false);
            setIsCollapsed(moduleState.isCollapsed || false);
            setCollapseLevel(moduleState.collapseLevel || 0);

            console.log('Logic Studio state restored from module-specific state in version', rolledBackTo);
          }

        } catch (error) {
          console.error('Failed to restore Logic Studio state from enhanced version:', error);
          // Fallback to legacy method
          try {
            const versionData = await getVersionData(rolledBackTo);
            if (versionData && versionData.module === 'LogicStudio') {
              setPrompt(versionData.prompt || '');
              setEditorCode(versionData.editorCode || '');
              setShowPendingChanges(versionData.showPendingChanges || false);
              setShowAISuggestions(versionData.showAISuggestions || false);
              setVendorContextEnabled(versionData.vendorContextEnabled || false);
              setIsCollapsed(versionData.isCollapsed || false);
              setCollapseLevel(versionData.collapseLevel || 0);
              console.log('Logic Studio state restored using legacy method');
            }
          } catch (legacyError) {
            console.error('Legacy restore method also failed:', legacyError);
          }
        }
      }
    };

    // Also listen for general project state changes
    const handleProjectStateChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { projectId: changedProjectId, action } = customEvent.detail;

      if (changedProjectId === projectId && action === 'rollback') {
        console.log('Logic Studio: Project state changed due to rollback, refreshing...');
        // Force a refresh of the current state
        window.location.reload();
      }
    };

    window.addEventListener('pandaura:project-rollback', handleRollback);
    window.addEventListener('pandaura:project-state-changed', handleProjectStateChange);
    
    // Listen for current state requests from version control
    const handleCurrentStateRequest = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { projectId: requestedProjectId } = customEvent.detail;
      
      if (requestedProjectId === projectId) {
        console.log('Logic Studio: Current state requested for version control');
        // Emit current state for version control to capture
        window.dispatchEvent(new CustomEvent('pandaura:current-state-response', {
          detail: {
            projectId,
            module: 'LogicStudio',
            state: {
              prompt,
              editorCode,
              showPendingChanges,
              showAISuggestions,
              vendorContextEnabled,
              isCollapsed,
              collapseLevel,
              lastActivity: new Date().toISOString()
            }
          }
        }));
      }
    };
    
    window.addEventListener('pandaura:get-current-state', handleCurrentStateRequest);
    
    return () => {
      window.removeEventListener('pandaura:project-rollback', handleRollback);
      window.removeEventListener('pandaura:project-state-changed', handleProjectStateChange);
      window.removeEventListener('pandaura:get-current-state', handleCurrentStateRequest);
    };
  }, [projectId, getVersionData]);

  // Listen for manual tag updates from Tag Database Manager
  useEffect(() => {
    const handleTagUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { projectId: updatedProjectId, action, tags } = customEvent.detail;

      // Only handle updates for the current project
      if (updatedProjectId === currentProjectId) {
        console.log(`🏷️ Logic Studio: Received tag update for project ${updatedProjectId}, action: ${action}`);
        
        try {
          // Reload tags and regenerate editor content
          const updatedTags = await loadExistingTags();
          
          if (updatedTags && updatedTags.length > 0) {
            console.log(`🏷️ Logic Studio: Regenerating editor with ${updatedTags.length} tags after manual update`);
            const generatedSTCode = tagsToSTCodeWithScopes(updatedTags);
            
            // Only update if the code would actually change (avoid overwriting user edits)
            if (generatedSTCode !== editorCode) {
              setEditorCode(generatedSTCode);
              lastSyncedCodeRef.current = generatedSTCode;
            }
          } else if (action === 'delete_all' || (action === 'delete' && !updatedTags.length)) {
            // If all tags were deleted, reset to empty
            console.log(`🏷️ Logic Studio: All tags deleted, resetting to empty`);
            setEditorCode('');
            lastSyncedCodeRef.current = '';
          }
        } catch (error) {
          console.error('Failed to update Logic Studio after tag changes:', error);
        }
      }
    };

    // Listen for tag database changes
    window.addEventListener('pandaura:tags-updated', handleTagUpdate);
    
    return () => {
      window.removeEventListener('pandaura:tags-updated', handleTagUpdate);
    };
  }, [currentProjectId, loadExistingTags, editorCode, emptyProgramCode]);

  // Fallback to module state for session mode
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: number;
      return () => {
        if (sessionMode) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            saveModuleState('LogicStudio', {
              prompt,
              editorCode,
              showPendingChanges,
              showAISuggestions,
              vendorContextEnabled,
              isCollapsed,
              collapseLevel
            });
          }, 1000);
        }
      };
    })(),
    [sessionMode, saveModuleState, prompt, editorCode, showPendingChanges, showAISuggestions, vendorContextEnabled, isCollapsed, collapseLevel]
  );

  // Track last synced code to prevent unnecessary syncs
  const lastSyncedCodeRef = useRef<string>('');

  // Debounced tag sync for real-time updates - only sync when code actually changes
  const debouncedTagSync = useCallback(
    (() => {
      let timeoutId: number;
      return () => {
        if (!sessionMode && isConnected && editorCode.trim()) {
          // Only sync if code has actually changed AND is not generated from existing tags
          if (editorCode !== lastSyncedCodeRef.current) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              console.log('🔄 Syncing tags from Logic Studio - code changed');
              console.log('🔄 Previous code length:', lastSyncedCodeRef.current.length);
              console.log('🔄 New code length:', editorCode.length);
              
              // Only skip sync if the editor is completely empty or contains only whitespace/comments
              const codeWithoutComments = editorCode.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
              
              if (!codeWithoutComments) {
                console.log('🔄 Skipping sync - editor is empty or contains only comments');
                lastSyncedCodeRef.current = editorCode;
                return;
              }

              console.log('🔄 Code contains actual content, proceeding with sync');
              lastSyncedCodeRef.current = editorCode;

              // Check if we need to prompt for vendor selection
              handleTagSyncWithVendorCheck(editorCode);
            }, 1500); // Slightly longer delay for tag sync to avoid excessive parsing
          } else {
            console.log('🔄 Skipping tag sync - code unchanged');
          }
        }
      };
    })(),
    [sessionMode, isConnected, editorCode, vendor, syncTags]
  );

  useEffect(() => {
    debouncedSave();
  }, [debouncedSave]);

  // Trigger tag sync when editor code changes
  useEffect(() => {
    console.log(`🔄 Editor code changed, triggering debounced sync...`);
    console.log(`🔄 Current code length: ${editorCode.length}`);
    console.log(`🔄 Session mode: ${sessionMode}, Connected: ${isConnected}`);
    debouncedTagSync();
  }, [editorCode, debouncedTagSync]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setShowVendorDropdown(false);
      }
      if (collapseSliderRef.current && !collapseSliderRef.current.contains(event.target as Node)) {
        setShowCollapseSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerateLogic = useCallback(() => {
    // Functionality disabled to prevent unwanted tag generation
    console.log("Generate Logic functionality disabled");
    alert("Generate Logic functionality has been disabled to prevent unwanted tag creation.");
  }, []);

  const handlePromptKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateLogic();
    }
  }, [handleGenerateLogic]);

  return (
    <div className="flex flex-col h-full bg-background text-primary">
      {/* Header */}
      <header className="flex items-center justify-between bg-surface px-6 py-4 border-b border-light shadow">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-primary">Logic Studio</h1>

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
                  {queuedSyncs > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-1 rounded">
                      {queuedSyncs}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-xs">Offline</span>
                  {connectionAttempts > 0 && (
                    <span className="text-xs">({connectionAttempts})</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Autosave Status */}
          {!sessionMode && projectId && (
            <AutosaveStatus
              isSaving={isSaving}
              lastSaved={lastSaved}
              saveError={saveError}
              hasUnsavedChanges={hasUnsavedChanges}
              onManualSave={saveNow}
              className="text-xs"
            />
          )}

          {/* Version Control Toolbar */}
          {!sessionMode && projectId && (
            <VersionControlToolbar
              projectId={projectId}
              currentState={{
                module: 'LogicStudio',
                prompt,
                editorCode,
                showPendingChanges,
                showAISuggestions,
                vendorContextEnabled,
                isCollapsed,
                collapseLevel,
                lastActivity: new Date().toISOString()
              }}
              onVersionCreated={(versionNumber) => {
                console.log('Version created in Logic Studio:', versionNumber);
              }}
              onRollback={(versionNumber) => {
                console.log('Rollback completed in Logic Studio:', versionNumber);
                // The rollback event listener will handle state restoration
                // No need to reload the page as the event system handles it
              }}
              className="border-l border-gray-200 pl-3"
            />
          )}

          {/* Refresh Tags Button */}
          {!sessionMode && (
            <button
              onClick={() => {
                console.log('🔄 Refreshing tags from database...');
                loadExistingTags().then((tags: any[]) => {
                  if (tags.length > 0) {
                    const generatedSTCode = tagsToSTCodeWithScopes(tags);
                    setEditorCode(generatedSTCode);
                    lastSyncedCodeRef.current = generatedSTCode;
                    console.log(`🔄 Refreshed editor with ${tags.length} tags`);
                  } else {
                    const emptyContent = ``;
                    setEditorCode(emptyContent);
                    lastSyncedCodeRef.current = emptyContent;
                    console.log('🔄 No tags found, set empty content');
                  }
                }).catch((error: any) => {
                  console.error('Failed to refresh tags:', error);
                });
              }}
              className="bg-white border border-light px-2 py-2 rounded-md text-sm hover:bg-accent-light transition-colors cursor-pointer"
              title="Refresh tags from database"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Collapse Button */}
          <div className="relative" ref={collapseSliderRef}>
            <button
              onClick={() => setShowCollapseSlider(!showCollapseSlider)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm text-gray-600"
              title="Collapse Interface"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs">Layout</span>
              {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
            
            {/* Collapse Slider */}
            {showCollapseSlider && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-light rounded-lg shadow-lg p-4 z-20 w-64">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-primary mb-2">Interface Layout</h4>
                  <p className="text-xs text-gray-600 mb-3">Adjust the interface to your workflow needs</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center text-sm">
                      <input
                        type="radio"
                        name="layout"
                        checked={collapseLevel === 0}
                        onChange={() => {
                          setCollapseLevel(0);
                          setIsCollapsed(false);
                        }}
                        className="mr-2"
                      />
                      Full Interface
                    </label>
                    <p className="text-xs text-gray-500 ml-6">All panels and features visible</p>
                  </div>
                  
                  <div>
                    <label className="flex items-center text-sm">
                      <input
                        type="radio"
                        name="layout"
                        checked={collapseLevel === 1}
                        onChange={() => {
                          setCollapseLevel(1);
                          setIsCollapsed(true);
                        }}
                        className="mr-2"
                      />
                      Compact
                    </label>
                    <p className="text-xs text-gray-500 ml-6">Hide side panels, keep core features</p>
                  </div>
                  
                  <div>
                    <label className="flex items-center text-sm">
                      <input
                        type="radio"
                        name="layout"
                        checked={collapseLevel === 2}
                        onChange={() => {
                          setCollapseLevel(2);
                          setIsCollapsed(true);
                        }}
                        className="mr-2"
                      />
                      Minimal
                    </label>
                    <p className="text-xs text-gray-500 ml-6">Editor-focused, minimal UI</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowCollapseSlider(false)}
                    className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-secondary transition-colors"
                  >
                    Apply Layout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-secondary">Project: Motor_Auto.ap14</div>
      </header>

      {/* Main Workspace */}
      <main className={`flex-1 flex flex-col ${collapseLevel === 2 ? 'gap-3 p-3' : 'gap-6 p-6'} will-change-scroll`} style={{ scrollBehavior: 'smooth' }}>
        {/* Top Section - Search Bar - Hidden in minimal mode */}
        {collapseLevel < 2 && (
          <div className="flex justify-end">
            <RoutineSearchbar
              onSearch={(query) => {
                console.log("Searching for:", query);
                return [];
              }}
              onSelectResult={(result) => {
                console.log("Selected result:", result);
              }}
            />
          </div>
        )}

        {/* Main ST Editor - Scrollable Output Area */}
        <div className="flex-1 min-h-[400px]">
          <div className="h-full border border-light rounded-md overflow-hidden shadow-sm">
            <STEditor
              initialCode={editorCode}
              vendorType={vendor}
              onChange={(code) => setEditorCode(code)}
            />
          </div>
        </div>

        {/* Pending Changes Panel - Hidden in compact+ modes */}
        {collapseLevel === 0 && (
          <PendingChangesPanel
            isEnabled={showPendingChanges}
            onToggle={setShowPendingChanges}
            diffs={mockDiffs}
            originalCode="PROGRAM Main\n  VAR\n    MotorStart : BOOL;\n  END_VAR\n  MotorStart := TRUE;\nEND_PROGRAM"
            modifiedCode="PROGRAM Main\n  VAR\n    MotorStart : BOOL;\n  END_VAR\n  // Added safety interlock for conveyor\n  MotorStart := Start_Button AND NOT E_Stop;\nEND_PROGRAM"
            aiSummary="User added safety interlock logic and documentation. Changes improve safety compliance by checking emergency stop conditions."
            onReintegrate={() => console.log("Reintegrating changes with AI...")}
            onRevert={() => {
              console.log("Reverting changes...");
              setShowPendingChanges(false);
            }}
          />
        )}

        {/* Bottom Input Section */}
        <div className={`bg-white border border-light rounded-lg shadow-sm ${collapseLevel === 2 ? 'p-2' : 'p-4'}`}>
          <div className={`flex ${collapseLevel === 2 ? 'gap-2' : 'gap-3'} items-end`}>
            {/* Prompt Input Field */}
            <textarea
              className={`flex-1 border border-light rounded-md px-4 py-3 bg-surface shadow-sm text-sm text-primary placeholder-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all ${
                collapseLevel === 2 ? 'min-h-[40px] max-h-[80px]' : 'min-h-[60px] max-h-[120px]'
              }`}
              placeholder={collapseLevel === 2 ? "Describe logic..." : "Describe your logic requirements in natural language..."}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handlePromptKeyPress}
            />
            
            {/* Vendor Style Dropdown - Simplified in minimal mode */}
            {collapseLevel < 2 ? (
              <div className="relative" ref={vendorDropdownRef}>
                <button
                  onClick={() => setShowVendorDropdown(!showVendorDropdown)}
                  className="flex items-center gap-2 border border-light bg-white px-4 py-3 rounded-md shadow-sm text-sm text-primary hover:bg-accent-light transition-all min-h-[60px] whitespace-nowrap"
                >
                  Vendor: {vendor}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showVendorDropdown && (
                  <div className="absolute bottom-full mb-1 w-48 bg-surface border border-light rounded-md shadow-lg z-10">
                    {vendorOptions.map((option) => (
                      <div
                        key={option}
                        onClick={() => {
                          setVendor(option as "Rockwell" | "Siemens" | "Beckhoff");
                          setShowVendorDropdown(false);
                        }}
                        className="px-4 py-2 text-sm hover:bg-accent-light cursor-pointer"
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <select
                value={vendor}
                onChange={(e) => setVendor(e.target.value as "Rockwell" | "Siemens" | "Beckhoff")}
                className="border border-light bg-white px-3 py-2 rounded-md shadow-sm text-sm text-primary min-h-[40px]"
              >
                {vendorOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}

            {/* Export Button - Hidden in minimal mode */}
            {collapseLevel < 2 && (
              <button
                onClick={() => {
                  console.log(`Exporting logic to ${vendor} format`);
                  alert(`✅ Exporting logic to ${vendor} format...\n\nYour structured text will be downloaded shortly in ${vendor}-compatible format.`);
                }}
                className="bg-primary text-white px-4 py-3 rounded-md shadow-sm text-sm hover:bg-secondary transition-all min-h-[60px] whitespace-nowrap"
                title="Export current logic to vendor-specific format"
              >
                📤 Export Logic
              </button>
            )}

            {/* Smart Document Uploader - Compact in minimal mode */}
            <button
              onClick={() => {
                console.log("Opening document uploader...");
                // Trigger file upload dialog
              }}
              className={`border border-light bg-white rounded-md shadow-sm hover:bg-accent-light transition-all text-sm ${
                collapseLevel === 2 ? 'p-2 min-h-[40px]' : 'p-3 min-h-[60px]'
              }`}
              title="Upload any project documents to improve logic accuracy."
            >
              <UploadCloud className={`text-primary ${collapseLevel === 2 ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </button>

            {/* Generate Button - DISABLED */}
            <button
              onClick={() => alert("Generate Logic functionality is disabled to prevent unwanted tag creation.")}
              className={`bg-gray-400 text-white rounded-md shadow-sm text-sm cursor-not-allowed ${
                collapseLevel === 2 ? 'px-4 py-2 min-h-[40px]' : 'px-6 py-3 min-h-[60px]'
              }`}
              disabled={true}
            >
              {collapseLevel === 2 ? 'Generate (Disabled)' : 'Generate Logic (Disabled)'}
            </button>
          </div>

          {/* Workflow Step Indicator - Hidden in minimal mode */}
          {collapseLevel < 2 && (
            <div className="text-xs text-muted text-center mt-3">
              🟢 Define Prompt → 🟡 Upload Docs → 🟡 Choose Vendor → ⚪ Review/Edit Logic
            </div>
          )}
        </div>

        {/* AI Suggestions Panel - Hidden in compact+ modes */}
        {showAISuggestions && collapseLevel === 0 && (
          <AISuggestedAutocomplete
            suggestions={[
              "IF Safety_OK AND Start_Button THEN",
              "Conveyor_Speed := Target_Speed;",
              "Motor_Fault := Overload OR Overcurrent;"
            ]}
            onClose={() => setShowAISuggestions(false)}
          />
        )}

        {/* Quick Actions - Hidden in minimal mode */}
        {collapseLevel < 2 && (
          <div className="bg-white border border-light rounded-md p-3">
            <h3 className="text-sm font-medium text-primary mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {collapseLevel === 0 && (
                <button
                  onClick={() => setShowPendingChanges(!showPendingChanges)}
                  className="text-xs bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded transition-colors"
                >
                  {showPendingChanges ? '📋 Hide' : '📋 Show'} Pending Changes
                </button>
              )}
              {!showAISuggestions && collapseLevel === 0 && (
                <button
                  onClick={() => setShowAISuggestions(true)}
                  className="text-xs bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded transition-colors"
                >
                  ✨ Show AI Suggestions
                </button>
              )}
              {collapseLevel === 1 && (
                <button
                  onClick={() => {
                    setCollapseLevel(0);
                    setIsCollapsed(false);
                  }}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded transition-colors"
                >
                  🔧 Show All Features
                </button>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* AI Action Buttons - Hidden in minimal mode */}
      {collapseLevel < 2 && <AIActionButtons />}

      {/* Debug Component - Temporary */}
      {!sessionMode && projectId && (
        <div className="mt-4">
          <VersionControlDebug projectId={projectId} />
        </div>
      )}

      {/* Vendor selection removed - now uses project vendor automatically */}
    </div>
  );
}