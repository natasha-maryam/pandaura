import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, FileText, Code, Database, MessageSquare, Clock, User } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import { useVersionControl } from '../../hooks/useVersionControl';

interface VersionSnapshotViewerProps {
  projectId: number;
  versionNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

interface SnapshotSection {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
  value: any;
  important?: boolean;
}

function formatDisplayValue(value: any): string {
  if (value === null || value === undefined) return 'Not set';
  if (typeof value === 'string') {
    if (value.trim() === '') return 'Empty';
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
        if (typeof val === 'string' && val.length > 100) {
          return `${label}: ${val.substring(0, 100)}...`;
        }
        return `${label}: ${val}`;
      })
      .join('\n');
    
    return formatted || 'Empty';
  }
  return String(value);
}

function SnapshotSectionComponent({ section, isExpanded, onToggle }: {
  section: SnapshotSection;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;
  
  return (
    <div className={`border rounded-lg mb-3 ${section.important ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${section.important ? 'text-blue-600' : 'text-gray-600'}`} />
          <span className={`font-medium ${section.important ? 'text-blue-900' : 'text-gray-900'}`}>
            {section.label}
          </span>
          {section.important && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              Key Data
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
          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {formatDisplayValue(section.value)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VersionSnapshotViewer({
  projectId,
  versionNumber,
  isOpen,
  onClose
}: VersionSnapshotViewerProps) {
  const [versionData, setVersionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['logicStudioCore']));
  
  const { getVersionData } = useVersionControl({ projectId });

  useEffect(() => {
    if (isOpen && projectId && versionNumber) {
      loadVersionData();
    }
  }, [isOpen, projectId, versionNumber]);

  const loadVersionData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getVersionData(versionNumber);
      setVersionData(data);
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

  const createSnapshotSections = (): SnapshotSection[] => {
    if (!versionData) return [];

    const sections: SnapshotSection[] = [];

    // Core Logic Studio Data (always shown first and marked as important)
    if (versionData.module === 'LogicStudio') {
      sections.push({
        key: 'logicStudioCore',
        label: '🎯 Logic Studio Core Data',
        icon: Code,
        value: {
          'PLC Code Lines': versionData.editorCode ? versionData.editorCode.split('\n').length : 0,
          'Code Content': versionData.editorCode ? (versionData.editorCode.length > 100 ? `${versionData.editorCode.substring(0, 100)}...` : versionData.editorCode) : 'No code',
          'AI Prompt': versionData.prompt || 'No prompt set',
          'PLC Vendor': versionData.vendor || 'siemens',
          'Has Active Code': !!(versionData.editorCode && versionData.editorCode.trim()),
          'Has AI Prompt': !!(versionData.prompt && versionData.prompt.trim())
        },
        important: true
      });

      // Full PLC Code Section
      if (versionData.editorCode) {
        sections.push({
          key: 'fullPlcCode',
          label: 'Complete PLC Code',
          icon: Code,
          value: versionData.editorCode
        });
      }

      // AI Prompt Section
      if (versionData.prompt) {
        sections.push({
          key: 'aiPrompt',
          label: 'AI Prompt Details',
          icon: MessageSquare,
          value: versionData.prompt
        });
      }

      // Project Metadata
      sections.push({
        key: 'projectMetadata',
        label: 'Project Information',
        icon: FileText,
        value: {
          'Project Name': versionData.projectName || 'Unnamed Project',
          'Client Name': versionData.clientName || 'No client specified',
          'Project Type': versionData.projectType || 'Not specified',
          'Description': versionData.description || 'No description',
          'Module': versionData.module,
          'Last Activity': versionData.lastActivity || 'Unknown'
        }
      });

      // Technical Details
      sections.push({
        key: 'technicalDetails',
        label: 'Technical Details',
        icon: Database,
        value: {
          'PLC Vendor': versionData.vendor || 'siemens',
          'Code Complexity (Lines)': versionData.editorCode ? versionData.editorCode.split('\n').length : 0,
          'Prompt Length (Characters)': versionData.prompt ? versionData.prompt.length : 0,
          'Collapse Level': versionData.collapseLevel || 0,
          'Timestamp': versionData.timestamp ? new Date(versionData.timestamp).toLocaleString() : 'Unknown',
          'Editor Settings': versionData.editorSettings || 'Default settings'
        }
      });

      // Tags and Categories
      if (versionData.tags && versionData.tags.length > 0) {
        sections.push({
          key: 'tagsAndCategories',
          label: 'Tags & Categories',
          icon: Database,
          value: {
            'Associated Tags': versionData.tags,
            'Tag Count': versionData.tags.length
          }
        });
      }

      // Activity and State Tracking
      sections.push({
        key: 'activityTracking',
        label: 'Activity & State',
        icon: Clock,
        value: {
          'Last Activity': versionData.lastActivity || 'Unknown',
          'Timestamp': versionData.timestamp ? new Date(versionData.timestamp).toLocaleString() : 'Unknown',
          'Collapse Level': versionData.collapseLevel || 0,
          'Module State': versionData.module || 'Unknown'
        }
      });

      // Raw Data (for debugging)
      sections.push({
        key: 'rawData',
        label: 'Raw Snapshot Data (Debug)',
        icon: Database,
        value: versionData
      });
    }

    return sections;
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Version {versionNumber} Snapshot
          </h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </Button>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-600">Loading version snapshot...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {versionData && !isLoading && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {createSnapshotSections().map((section) => (
              <SnapshotSectionComponent
                key={section.key}
                section={section}
                isExpanded={expandedSections.has(section.key)}
                onToggle={() => toggleSection(section.key)}
              />
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
