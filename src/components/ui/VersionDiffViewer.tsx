import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, FileText, Code, Database, MessageSquare } from 'lucide-react';
import  Button  from './Button';
import Modal from './Modal';
import { useVersionControl } from '../../hooks/useVersionControl';

interface VersionDiffViewerProps {
  projectId: number;
  fromVersion: number;
  toVersion: number;
  isOpen: boolean;
  onClose: () => void;
}

interface DiffSection {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
  fromValue: any;
  toValue: any;
  hasChanges: boolean;
}

function formatValue(value: any, isCode = false): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    // Special formatting for code
    if (isCode && value.trim()) {
      return value; // Return code as-is for proper formatting
    }
    return value;
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    // Handle arrays
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None';
    }
    
    // Handle objects - format for better readability
    if (Object.keys(value).length === 0) return 'None';
    
    // Format metadata objects in a more readable way
    const formatted = Object.entries(value)
      .filter(([_, val]) => val !== null && val !== undefined && val !== '')
      .map(([key, val]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        if (typeof val === 'boolean') {
          return `${label}: ${val ? 'Yes' : 'No'}`;
        }
        if (typeof val === 'object' && val !== null) {
          return `${label}: ${JSON.stringify(val)}`;
        }
        if (typeof val === 'string' && val.length > 50) {
          return `${label}: ${val.substring(0, 50)}...`;
        }
        return `${label}: ${val}`;
      })
      .join('\n');
    
    return formatted || 'Empty';
  }
  return String(value);
}

function DiffSectionComponent({ section, isExpanded, onToggle }: {
  section: DiffSection;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;
  
  // Special handling for different section types
  const isCodeSection = section.key === 'editorCode';
  const isTagsSection = section.key === 'tags';
  const isMetadataSection = section.key === 'metadata';
  
  return (
    <div className="border border-gray-200 rounded-lg mb-3">
      <div
        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
          section.hasChanges ? 'bg-yellow-50 border-yellow-200' : ''
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="font-medium">{section.label}</span>
          {section.hasChanges && (
            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
              Changed
            </span>
          )}
          {isCodeSection && section.hasChanges && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              Code Modified
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 p-3">
          {section.hasChanges ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Previous Version {isCodeSection ? '(Before)' : ''}
                </h4>
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  {isTagsSection ? (
                    <div className="flex flex-col gap-1">
                      {Array.isArray(section.fromValue) && section.fromValue.length > 0 ? (
                        section.fromValue.map((tag: any, index: number) => (
                          <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {typeof tag === 'string' ? tag : tag.name || JSON.stringify(tag)}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">No tags</span>
                      )}
                    </div>
                  ) : isMetadataSection ? (
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono overflow-auto max-h-96">
                      {JSON.stringify(section.fromValue, null, 2)}
                    </pre>
                  ) : (
                    <pre className={`text-sm text-gray-800 whitespace-pre-wrap ${isCodeSection ? 'font-mono' : ''}`}>
                      {formatValue(section.fromValue, isCodeSection)}
                    </pre>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Current Version {isCodeSection ? '(After)' : ''}
                </h4>
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  {isTagsSection ? (
                    <div className="flex flex-col gap-1">
                      {Array.isArray(section.toValue) && section.toValue.length > 0 ? (
                        section.toValue.map((tag: any, index: number) => (
                          <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {typeof tag === 'string' ? tag : tag.name || JSON.stringify(tag)}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">No tags</span>
                      )}
                    </div>
                  ) : isMetadataSection ? (
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono overflow-auto max-h-96">
                      {JSON.stringify(section.toValue, null, 2)}
                    </pre>
                  ) : (
                    <pre className={`text-sm text-gray-800 whitespace-pre-wrap ${isCodeSection ? 'font-mono' : ''}`}>
                      {formatValue(section.toValue, isCodeSection)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No changes in this section
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VersionDiffViewer({
  projectId,
  fromVersion,
  toVersion,
  isOpen,
  onClose
}: VersionDiffViewerProps) {
  const [fromData, setFromData] = useState<any>(null);
  const [toData, setToData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showChangesOnly, setShowChangesOnly] = useState(false);

  const { getVersionData } = useVersionControl({
    projectId,
    autoCreateVersions: false
  });

  // Load version data
  useEffect(() => {
    if (isOpen && projectId && fromVersion && toVersion) {
      loadVersionData();
    }
  }, [isOpen, projectId, fromVersion, toVersion]);

  const loadVersionData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('VersionDiffViewer: Loading version data for comparison:', { fromVersion, toVersion });
      
      const [fromVersionData, toVersionData] = await Promise.all([
        getVersionData(fromVersion),
        getVersionData(toVersion)
      ]);
      
      console.log('VersionDiffViewer: Loaded version data:', { 
        fromVersionData, 
        toVersionData,
        fromKeys: Object.keys(fromVersionData || {}),
        toKeys: Object.keys(toVersionData || {})
      });
      
      setFromData(fromVersionData);
      setToData(toVersionData);
      
      // Auto-expansion logic removed since PLC code section is no longer shown
      // Previously auto-expanded PLC code section if it had changes
      console.log('VersionDiffViewer: Version data loaded successfully');
    } catch (err: any) {
      console.error('VersionDiffViewer: Error loading version data:', err);
      setError(err.message || 'Failed to load version data');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const createDiffSections = (): DiffSection[] => {
    if (!fromData || !toData) return [];

    console.log('VersionDiffViewer: Creating diff sections with data:', { fromData, toData });

    const sections: DiffSection[] = [];
    let aiPromptSection: DiffSection | undefined;

    // Module-specific sections
    if (fromData.module === 'LogicStudio' || toData.module === 'LogicStudio' || 
        fromData.state?.module === 'LogicStudio' || toData.state?.module === 'LogicStudio' ||
        fromData.moduleStates?.LogicStudio || toData.moduleStates?.LogicStudio ||
        fromData.logicStudioCode || toData.logicStudioCode) {
      
      // Try multiple possible locations for PLC code
      const fromCode = fromData.editorCode || fromData.logicStudioCode || 
                      fromData.state?.editorCode || fromData.moduleStates?.LogicStudio?.editorCode ||
                      fromData.logic?.code || '';
      const toCode = toData.editorCode || toData.logicStudioCode || 
                    toData.state?.editorCode || toData.moduleStates?.LogicStudio?.editorCode ||
                    toData.logic?.code || '';
      
      console.log('VersionDiffViewer: Found PLC code:', { fromCode: fromCode.length, toCode: toCode.length });
      
      // PLC Code section - REMOVED per user request
      // sections.push({
      //   key: 'editorCode',
      //   label: 'PLC Code',
      //   icon: Code,
      //   fromValue: fromCode,
      //   toValue: toCode,
      //   hasChanges: fromCode !== toCode
      // });

      // Store AI Prompt section to add at the end
      const fromPrompt = fromData.prompt || fromData.ai_prompt || 
                        fromData.state?.prompt || fromData.moduleStates?.LogicStudio?.prompt ||
                        fromData.logic?.ai_prompt || '';
      const toPrompt = toData.prompt || toData.ai_prompt || 
                      toData.state?.prompt || toData.moduleStates?.LogicStudio?.prompt ||
                      toData.logic?.ai_prompt || '';
      
      aiPromptSection = {
        key: 'prompt',
        label: 'AI Prompt',
        icon: MessageSquare,
        fromValue: fromPrompt,
        toValue: toPrompt,
        hasChanges: fromPrompt !== toPrompt
      };

      // PLC Vendor section - REMOVED per user request
      // Try multiple possible locations for PLC Vendor
      // const fromVendor = fromData.vendor || fromData.state?.vendor || 
      //                   fromData.moduleStates?.LogicStudio?.vendor ||
      //                   fromData.logic?.vendor || 'siemens';
      // const toVendor = toData.vendor || toData.state?.vendor || 
      //                 toData.moduleStates?.LogicStudio?.vendor ||
      //                 toData.logic?.vendor || 'siemens';
      // 
      // sections.push({
      //   key: 'vendor',
      //   label: 'PLC Vendor',
      //   icon: Database,
      //   fromValue: fromVendor,
      //   toValue: toVendor,
      //   hasChanges: fromVendor !== toVendor
      // });

      // Tags Section - Only show tags information
      const fromTags = fromData.tags || [];
      const toTags = toData.tags || [];

      sections.push({
        key: 'tags',
        label: 'Tags',
        icon: FileText,
        fromValue: fromTags,
        toValue: toTags,
        hasChanges: JSON.stringify(fromTags) !== JSON.stringify(toTags)
      });

      // Metadata Section - Show only tags as JSON
      const fromMetadata = {
        tags: fromData.tags || []
      };

      const toMetadata = {
        tags: toData.tags || []
      };

      sections.push({
        key: 'metadata',
        label: 'Metadata',
        icon: Database,
        fromValue: fromMetadata,
        toValue: toMetadata,
        hasChanges: JSON.stringify(fromMetadata) !== JSON.stringify(toMetadata)
      });

      // Project Information Section
      const fromProjectInfo = {
        projectName: fromData.projectName || '',
        clientName: fromData.clientName || '',
        projectType: fromData.projectType || '',
        description: fromData.description || ''
      };

      const toProjectInfo = {
        projectName: toData.projectName || '',
        clientName: toData.clientName || '',
        projectType: toData.projectType || '',
        description: toData.description || ''
      };

      // Editor Settings Section
      if (fromData.editorSettings || toData.editorSettings) {
        sections.push({
          key: 'editorSettings',
          label: 'Editor Settings',
          icon: Code,
          fromValue: fromData.editorSettings || {},
          toValue: toData.editorSettings || {},
          hasChanges: JSON.stringify(fromData.editorSettings || {}) !== JSON.stringify(toData.editorSettings || {})
        });
      }

      // Activity Tracking Section
      const fromActivity = {
        lastActivity: fromData.lastActivity || '',
        timestamp: fromData.timestamp || '',
        collapseLevel: fromData.collapseLevel || 0
      };

      const toActivity = {
        lastActivity: toData.lastActivity || '',
        timestamp: toData.timestamp || '',
        collapseLevel: toData.collapseLevel || 0
      };

      sections.push({
        key: 'activityTracking',
        label: 'Activity & State',
        icon: Database,
        fromValue: fromActivity,
        toValue: toActivity,
        hasChanges: JSON.stringify(fromActivity) !== JSON.stringify(toActivity)
      });
    }

    if (fromData.module === 'TagManager' || toData.module === 'TagManager') {
      sections.push({
        key: 'filters',
        label: 'Tag Filters',
        icon: Database,
        fromValue: fromData.filters || {},
        toValue: toData.filters || {},
        hasChanges: JSON.stringify(fromData.filters || {}) !== JSON.stringify(toData.filters || {})
      });
    }

    if (fromData.module === 'AskPandaura' || toData.module === 'AskPandaura') {
      sections.push({
        key: 'chatMessage',
        label: 'Chat Message',
        icon: MessageSquare,
        fromValue: fromData.chatMessage || '',
        toValue: toData.chatMessage || '',
        hasChanges: (fromData.chatMessage || '') !== (toData.chatMessage || '')
      });
    }

    // General metadata
    sections.push({
      key: 'lastActivity',
      label: 'Last Activity',
      icon: FileText,
      fromValue: fromData.lastActivity || '',
      toValue: toData.lastActivity || '',
      hasChanges: (fromData.lastActivity || '') !== (toData.lastActivity || '')
    });

    // Add AI Prompt section at the end if it was created
    if (aiPromptSection) {
      sections.push(aiPromptSection);
    }

    return sections;
  };

  const diffSections = createDiffSections();
  const changedSections = diffSections.filter(section => section.hasChanges);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Compare Versions ${fromVersion} → ${toVersion}`}
      size="xl"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading version data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Failed to load version data</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button onClick={loadVersionData} variant="outline">
              Try Again
            </Button>
          </div>
        ) : diffSections.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No data available for comparison</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                Comparison Summary
                {showChangesOnly && (
                  <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    Changes Only
                  </span>
                )}
              </h3>
              <div className="text-sm text-blue-700">
                <p>
                  <strong>{changedSections.length}</strong> section{changedSections.length !== 1 ? 's' : ''} changed
                  out of <strong>{diffSections.length}</strong> total sections
                  {showChangesOnly && (
                    <span className="ml-1">(showing {changedSections.length} changed sections)</span>
                  )}
                </p>
                {changedSections.length > 0 && (
                  <p className="mt-1">
                    Changed: {changedSections.map(s => s.label).join(', ')}
                  </p>
                )}
                {/* PLC code change warning removed since PLC code section is no longer shown */}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const allKeys = new Set(diffSections.map(s => s.key));
                  setExpandedSections(allKeys);
                  setShowChangesOnly(false);
                }}
              >
                Expand All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setExpandedSections(new Set());
                  setShowChangesOnly(false);
                }}
              >
                Collapse All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const changedKeys = new Set(changedSections.map(s => s.key));
                  setExpandedSections(changedKeys);
                  setShowChangesOnly(true);
                }}
                className={showChangesOnly ? "bg-blue-100 border-blue-300" : ""}
              >
                Show Changes Only
              </Button>
              {showChangesOnly && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowChangesOnly(false);
                    setExpandedSections(new Set());
                  }}
                >
                  Show All Sections
                </Button>
              )}
            </div>

            {/* Diff Sections */}
            <div className="space-y-3">
              {(showChangesOnly ? changedSections : diffSections).map((section) => (
                <DiffSectionComponent
                  key={section.key}
                  section={section}
                  isExpanded={expandedSections.has(section.key)}
                  onToggle={() => toggleSection(section.key)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
