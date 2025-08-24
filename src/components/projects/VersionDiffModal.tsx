import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../ui';
import { ProjectVersion, ProjectsAPI } from './api';
import { FileText, RotateCcw, Download, Code, Database, MessageSquare, Clock, ChevronDown, ChevronRight } from 'lucide-react';

interface VersionDiffModalProps {
  version: ProjectVersion | null;
  onClose: () => void;
  onRollback: (version: ProjectVersion) => void;
  onExport?: (version: ProjectVersion) => void;
  projectId?: number; // Add projectId to fetch full data
}

// Helper function to format version state for display
const formatVersionState = (state: any) => {
  if (!state) return 'No state data available';
  
  try {
    return JSON.stringify(state, null, 2);
  } catch {
    return 'Invalid state data';
  }
};

// Helper function to format display values for Logic Studio metadata
const formatDisplayValue = (value: any): string => {
  if (value === null || value === undefined) return 'Not set';
  if (typeof value === 'string') {
    if (value.trim() === '') return 'Empty';
    return value;
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None';
    }
    if (Object.keys(value).length === 0) return 'None';
    
    const formatted = Object.entries(value)
      .filter(([_, val]) => val !== null && val !== undefined && val !== '')
      .map(([key, val]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (typeof val === 'boolean') return `${label}: ${val ? 'Yes' : 'No'}`;
        if (typeof val === 'object' && val !== null) return `${label}: ${JSON.stringify(val)}`;
        if (typeof val === 'string' && val.length > 100) return `${label}: ${val.substring(0, 100)}...`;
        return `${label}: ${val}`;
      })
      .join('\n');
    
    return formatted || 'Empty';
  }
  return String(value);
};

// Component for expandable metadata sections
const MetadataSection = ({ 
  title, 
  icon: Icon, 
  data, 
  isExpanded, 
  onToggle, 
  important = false 
}: {
  title: string;
  icon: React.ComponentType<any>;
  data: any;
  isExpanded: boolean;
  onToggle: () => void;
  important?: boolean;
}) => (
  <div className={`border rounded-lg mb-3 ${important ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
    <div
      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${important ? 'text-blue-600' : 'text-gray-600'}`} />
        <span className={`font-medium ${important ? 'text-blue-900' : 'text-gray-900'}`}>
          {title}
        </span>
        {important && (
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
            {formatDisplayValue(data)}
          </pre>
        </div>
      </div>
    )}
  </div>
);

export default function VersionDiffModal({ version, onClose, onRollback, onExport, projectId }: VersionDiffModalProps) {
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [showStateDetails, setShowStateDetails] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['logicStudioCore']));
  const [fullVersionData, setFullVersionData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch full version data when modal opens
  useEffect(() => {
    if (version && projectId && version.version_number) {
      setIsLoadingData(true);
      ProjectsAPI.getVersion(projectId, version.version_number)
        .then(data => {
          console.log('VersionDiffModal: Loaded full version data:', data);
          setFullVersionData(data);
        })
        .catch(error => {
          console.error('VersionDiffModal: Failed to load version data:', error);
          setFullVersionData(null);
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    }
  }, [version, projectId]);

  if (!version) return null;

  const handleRollback = () => {
    onRollback(version);
    setShowRollbackConfirm(false);
    onClose();
  };

  const handleExport = () => {
    if (onExport) {
      onExport(version);
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

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return new Date().toLocaleString();
    }
  };

  // Extract Logic Studio metadata from the full version data
  const getLogicStudioMetadata = () => {
    if (!fullVersionData) {
      return {
        basicInfo: {
          'Version Number': version.version_number,
          'Created': formatTimestamp(version.created_at),
          'Save Type': version.is_auto ? 'Auto-save' : 'Manual Save',
          'Message': version.message || 'No message provided',
          'Status': isLoadingData ? 'Loading...' : 'Data not loaded'
        }
      };
    }

    // Check if this is Logic Studio data
    if (fullVersionData.moduleStates?.LogicStudio || fullVersionData.state?.module === 'LogicStudio') {
      const logicData = fullVersionData.moduleStates?.LogicStudio || fullVersionData.state || {};
      
      return {
        logicStudioCore: {
          'PLC Vendor': logicData.vendor || 'siemens',
          'Code Lines': logicData.editorCode ? logicData.editorCode.split('\n').length : 0,
          'Has PLC Code': !!(logicData.editorCode && logicData.editorCode.trim()),
          'Has AI Prompt': !!(logicData.prompt && logicData.prompt.trim()),
          'Prompt Length': logicData.prompt ? `${logicData.prompt.length} characters` : '0 characters',
          'Last Activity': logicData.lastActivity || 'Unknown'
        },
        projectInfo: {
          'Project Name': logicData.projectName || fullVersionData.projectMetadata?.project_name || 'Unnamed Project',
          'Client Name': logicData.clientName || 'No client specified',
          'Project Type': logicData.projectType || 'Not specified',
          'Description': logicData.description || 'No description',
          'Module': logicData.module || 'LogicStudio'
        },
        codeContent: {
          'Full PLC Code': logicData.editorCode || 'No code available',
          'Code Preview': logicData.editorCode ? 
            (logicData.editorCode.length > 200 ? 
              `${logicData.editorCode.substring(0, 200)}...` : 
              logicData.editorCode) : 'No code'
        },
        aiPrompt: {
          'AI Prompt': logicData.prompt || 'No prompt set',
          'Prompt Preview': logicData.prompt ? 
            (logicData.prompt.length > 200 ? 
              `${logicData.prompt.substring(0, 200)}...` : 
              logicData.prompt) : 'No prompt'
        },
        technicalDetails: {
          'PLC Vendor': logicData.vendor || 'siemens',
          'Collapse Level': logicData.collapseLevel || 0,
          'Timestamp': fullVersionData.timestamp ? new Date(fullVersionData.timestamp).toLocaleString() : 'Unknown',
          'Version Number': version.version_number,
          'Save Type': version.is_auto ? 'Auto-save' : 'Manual Save',
          'Created': formatTimestamp(version.created_at)
        },
        rawData: fullVersionData
      };
    }

    // If not Logic Studio data, show general version info
    return {
      basicInfo: {
        'Version Number': version.version_number,
        'Created': formatTimestamp(version.created_at),
        'Save Type': version.is_auto ? 'Auto-save' : 'Manual Save',
        'Message': version.message || 'No message provided',
        'Data Type': 'Non-Logic Studio data'
      },
      rawData: fullVersionData
    };
  };

  const metadataInfo = getLogicStudioMetadata();

  return (
    <>
      <Modal
        isOpen={!!version}
        onClose={onClose}
        title={`Version ${version.version_number} - Project State`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Version Info Header */}
          <div className="bg-background rounded-lg p-4 border border-light">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-primary">Version {version.version_number}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  version.is_auto 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {version.is_auto ? 'Auto-save' : 'Manual'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onExport && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Download}
                    onClick={handleExport}
                  >
                    Export
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  icon={RotateCcw}
                  onClick={() => setShowRollbackConfirm(true)}
                  className="text-orange-600 hover:text-orange-700"
                >
                  Rollback
                </Button>
              </div>
            </div>
            <div className="text-sm text-secondary">
              <span className="font-medium">User {version.user_id}</span> • {formatTimestamp(version.created_at)}
            </div>
            {version.message && (
              <p className="text-sm text-primary mt-2">{version.message}</p>
            )}
          </div>

          {/* Enhanced Version State Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-primary">Project State Snapshot</h4>
              <Button
                size="sm"
                variant="outline"
                icon={Code}
                onClick={() => setShowStateDetails(!showStateDetails)}
              >
                {showStateDetails ? 'Hide Raw Data' : 'Show Raw Data'}
              </Button>
            </div>
            
            {/* Enhanced Metadata Sections */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoadingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading Logic Studio metadata...</p>
                </div>
              ) : (
                <>
                  {/* PLC Code Content */}
                  {metadataInfo.codeContent && (
                    <MetadataSection
                      title="PLC Code Content"
                      icon={Code}
                      data={metadataInfo.codeContent}
                      isExpanded={expandedSections.has('codeContent')}
                      onToggle={() => toggleSection('codeContent')}
                    />
                  )}

                  {/* AI Prompt */}
                  {metadataInfo.aiPrompt && (
                    <MetadataSection
                      title="AI Prompt"
                      icon={MessageSquare}
                      data={metadataInfo.aiPrompt}
                      isExpanded={expandedSections.has('aiPrompt')}
                      onToggle={() => toggleSection('aiPrompt')}
                    />
                  )}

                  {/* Technical Details */}
                  {metadataInfo.technicalDetails && (
                    <MetadataSection
                      title="Technical Details"
                      icon={Database}
                      data={metadataInfo.technicalDetails}
                      isExpanded={expandedSections.has('technicalDetails')}
                      onToggle={() => toggleSection('technicalDetails')}
                    />
                  )}

                  {/* Basic Info (fallback for non-Logic Studio data) */}
                  {metadataInfo.basicInfo && !metadataInfo.logicStudioCore && (
                    <MetadataSection
                      title="Version Information"
                      icon={FileText}
                      data={metadataInfo.basicInfo}
                      isExpanded={expandedSections.has('basicInfo')}
                      onToggle={() => toggleSection('basicInfo')}
                      important={true}
                    />
                  )}

                  {/* Raw Data */}
                  {metadataInfo.rawData && (
                    <MetadataSection
                      title="Raw Version Data (Debug)"
                      icon={Database}
                      data={metadataInfo.rawData}
                      isExpanded={expandedSections.has('rawData')}
                      onToggle={() => toggleSection('rawData')}
                    />
                  )}
                </>
              )}
            </div>

            {/* Raw State Details (if requested) */}
            {showStateDetails && (
              <div className="bg-background border border-light rounded-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Code className="w-5 h-5 text-accent" />
                  <span className="font-medium text-primary">Raw Version Data (JSON)</span>
                </div>
                <div className="bg-surface rounded-md p-3 max-h-96 overflow-y-auto">
                  <pre className="text-xs text-primary whitespace-pre-wrap font-mono">
                    {formatVersionState(version)}
                  </pre>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> We stores complete project state snapshots. 
                Rolling back will restore the entire project to this version's state.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* Rollback Confirmation */}
      <Modal
        isOpen={showRollbackConfirm}
        onClose={() => setShowRollbackConfirm(false)}
        title="Confirm Rollback"
        size="sm"
      >
        <div className="mb-6">
          <p className="text-secondary mb-4">
            Are you sure you want to rollback to <strong>Version {version.version_number}</strong>?
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <p className="text-sm text-orange-800">
              <strong>Warning:</strong> This action will create a new version with the rollback changes. 
              Your current work will be preserved as the latest version.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setShowRollbackConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRollback}
            icon={RotateCcw}
          >
            Rollback to Version {version.version_number}
          </Button>
        </div>
      </Modal>
    </>
  );
}
