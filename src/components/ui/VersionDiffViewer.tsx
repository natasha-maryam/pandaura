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

function formatValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
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
                  Version {section.key === 'from' ? 'From' : 'To'}
                </h4>
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {formatValue(section.fromValue)}
                  </pre>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Version {section.key === 'to' ? 'To' : 'From'}
                </h4>
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {formatValue(section.toValue)}
                  </pre>
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
      const [fromVersionData, toVersionData] = await Promise.all([
        getVersionData(fromVersion),
        getVersionData(toVersion)
      ]);
      
      setFromData(fromVersionData);
      setToData(toVersionData);
    } catch (err: any) {
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

    const sections: DiffSection[] = [];

    // Module-specific sections
    if (fromData.module === 'LogicStudio' || toData.module === 'LogicStudio') {
      // PLC Code Section
      sections.push({
        key: 'editorCode',
        label: 'PLC Code',
        icon: Code,
        fromValue: fromData.editorCode || '',
        toValue: toData.editorCode || '',
        hasChanges: (fromData.editorCode || '') !== (toData.editorCode || '')
      });

      // AI Prompt Section
      sections.push({
        key: 'prompt',
        label: 'AI Prompt',
        icon: MessageSquare,
        fromValue: fromData.prompt || '',
        toValue: toData.prompt || '',
        hasChanges: (fromData.prompt || '') !== (toData.prompt || '')
      });

      // PLC Vendor Section
      sections.push({
        key: 'vendor',
        label: 'PLC Vendor',
        icon: Database,
        fromValue: fromData.vendor || 'siemens',
        toValue: toData.vendor || 'siemens',
        hasChanges: (fromData.vendor || 'siemens') !== (toData.vendor || 'siemens')
      });

      // Logic Studio Metadata Section
      const fromMetadata = {
        projectName: fromData.projectName || '',
        clientName: fromData.clientName || '',
        projectType: fromData.projectType || '',
        description: fromData.description || '',
        lastActivity: fromData.lastActivity || '',
        module: fromData.module || '',
        totalLines: fromData.editorCode ? fromData.editorCode.split('\n').length : 0,
        promptLength: fromData.prompt ? fromData.prompt.length : 0,
        timestamp: fromData.timestamp || '',
        collapseLevel: fromData.collapseLevel || 0,
        editorSettings: fromData.editorSettings || {},
        tags: fromData.tags || [],
        hasPrompt: !!(fromData.prompt && fromData.prompt.trim()),
        hasCode: !!(fromData.editorCode && fromData.editorCode.trim()),
        codeComplexity: fromData.editorCode ? (fromData.editorCode.match(/\n/g) || []).length : 0
      };

      const toMetadata = {
        projectName: toData.projectName || '',
        clientName: toData.clientName || '',
        projectType: toData.projectType || '',
        description: toData.description || '',
        lastActivity: toData.lastActivity || '',
        module: toData.module || '',
        totalLines: toData.editorCode ? toData.editorCode.split('\n').length : 0,
        promptLength: toData.prompt ? toData.prompt.length : 0,
        timestamp: toData.timestamp || '',
        collapseLevel: toData.collapseLevel || 0,
        editorSettings: toData.editorSettings || {},
        tags: toData.tags || [],
        hasPrompt: !!(toData.prompt && toData.prompt.trim()),
        hasCode: !!(toData.editorCode && toData.editorCode.trim()),
        codeComplexity: toData.editorCode ? (toData.editorCode.match(/\n/g) || []).length : 0
      };

      sections.push({
        key: 'logicStudioMetadata',
        label: 'Logic Studio Metadata',
        icon: FileText,
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
              <h3 className="font-medium text-blue-900 mb-2">Comparison Summary</h3>
              <div className="text-sm text-blue-700">
                <p>
                  <strong>{changedSections.length}</strong> section{changedSections.length !== 1 ? 's' : ''} changed
                  out of <strong>{diffSections.length}</strong> total sections
                </p>
                {changedSections.length > 0 && (
                  <p className="mt-1">
                    Changed: {changedSections.map(s => s.label).join(', ')}
                  </p>
                )}
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
                }}
              >
                Expand All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpandedSections(new Set())}
              >
                Collapse All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const changedKeys = new Set(changedSections.map(s => s.key));
                  setExpandedSections(changedKeys);
                }}
              >
                Show Changes Only
              </Button>
            </div>

            {/* Diff Sections */}
            <div className="space-y-3">
              {diffSections.map((section) => (
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
