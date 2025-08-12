import React, { useState } from 'react';
import { Modal, Button } from '../ui';
import { ProjectVersion, VersionChange } from './types';
import { FileText, Plus, Minus, RotateCcw, Download } from 'lucide-react';

interface VersionDiffModalProps {
  version: ProjectVersion | null;
  onClose: () => void;
  onRollback: (version: ProjectVersion) => void;
  onExport?: (version: ProjectVersion) => void;
}

// Mock diff data - in a real app, this would come from the API
const generateMockDiff = (version: ProjectVersion) => {
  const mockFiles: VersionChange[] = version.changes || [
    {
      file: 'src/logic/main.st',
      type: 'modified',
      linesAdded: 15,
      linesRemoved: 8,
    },
    {
      file: 'src/tags/process_tags.xml',
      type: 'modified',
      linesAdded: 3,
      linesRemoved: 1,
    },
    {
      file: 'docs/system_overview.md',
      type: 'added',
      linesAdded: 42,
      linesRemoved: 0,
    },
  ];

  return mockFiles;
};

const mockDiffContent = {
  'src/logic/main.st': {
    additions: [
      '+ // Added safety interlock for conveyor belt',
      '+ IF Safety_OK AND Motor_Ready THEN',
      '+     Conveyor_Start := TRUE;',
      '+ ELSE',
      '+     Conveyor_Start := FALSE;',
      '+ END_IF;',
      '',
      '+ // Enhanced error handling',
      '+ IF Error_Count > MAX_ERRORS THEN',
      '+     System_Shutdown();',
      '+ END_IF;',
    ],
    deletions: [
      '- // Basic motor control',
      '- Motor_Start := TRUE;',
      '',
      '- IF Error THEN',
      '-     Motor_Start := FALSE;',
      '- END_IF;',
    ],
    context: [
      '  PROGRAM Main',
      '  VAR',
      '      Safety_OK : BOOL;',
      '      Motor_Ready : BOOL;',
      '      Conveyor_Start : BOOL;',
      '  END_VAR',
    ],
  },
};

export default function VersionDiffModal({ version, onClose, onRollback, onExport }: VersionDiffModalProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

  if (!version) return null;

  const diffFiles = generateMockDiff(version);
  const currentFile = selectedFile || (diffFiles.length > 0 ? diffFiles[0].file : null);

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

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <>
      <Modal
        isOpen={!!version}
        onClose={onClose}
        title={`Version ${version.id} - Changes & Diff`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Version Info Header */}
          <div className="bg-background rounded-lg p-4 border border-light">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-primary">Version {version.id}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  version.type === 'Autosave' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {version.type}
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
              <span className="font-medium">{version.user}</span> • {formatTimestamp(version.timestamp)}
            </div>
            {version.message && (
              <p className="text-sm text-primary mt-2">{version.message}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted mt-3">
              <span className="text-green-600">
                +{diffFiles.reduce((sum, file) => sum + file.linesAdded, 0)} additions
              </span>
              <span className="text-red-600">
                -{diffFiles.reduce((sum, file) => sum + file.linesRemoved, 0)} deletions
              </span>
              <span>{diffFiles.length} file{diffFiles.length !== 1 ? 's' : ''} changed</span>
            </div>
          </div>

          {/* Files Changed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File List */}
            <div className="lg:col-span-1">
              <h4 className="font-medium text-primary mb-3">Files Changed</h4>
              <div className="space-y-2">
                {diffFiles.map((file) => (
                  <button
                    key={file.file}
                    onClick={() => setSelectedFile(file.file)}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                      currentFile === file.file
                        ? 'bg-accent-light border-accent'
                        : 'bg-background border-light hover:border-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium text-primary truncate">
                        {file.file.split('/').pop()}
                      </span>
                      <span className={`ml-auto px-1 py-0.5 rounded text-xs ${
                        file.type === 'added' ? 'bg-green-100 text-green-700' :
                        file.type === 'deleted' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {file.type === 'added' ? 'A' : file.type === 'deleted' ? 'D' : 'M'}
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      {file.file}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted mt-1">
                      <span className="text-green-600">+{file.linesAdded}</span>
                      <span className="text-red-600">-{file.linesRemoved}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Diff View */}
            <div className="lg:col-span-2">
              <h4 className="font-medium text-primary mb-3">
                {currentFile ? `Changes in ${currentFile.split('/').pop()}` : 'Select a file'}
              </h4>
              {currentFile && mockDiffContent[currentFile as keyof typeof mockDiffContent] ? (
                <div className="bg-background border border-light rounded-md overflow-hidden">
                  <div className="p-3 border-b border-light bg-surface">
                    <span className="text-sm font-mono text-muted">{currentFile}</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="font-mono text-sm">
                      {/* Context lines */}
                      {mockDiffContent[currentFile as keyof typeof mockDiffContent].context.map((line, index) => (
                        <div key={`context-${index}`} className="flex">
                          <div className="w-12 bg-surface text-muted text-center py-0.5 text-xs select-none">
                            {index + 1}
                          </div>
                          <div className="flex-1 px-3 py-0.5">{line}</div>
                        </div>
                      ))}
                      
                      {/* Deletions */}
                      {mockDiffContent[currentFile as keyof typeof mockDiffContent].deletions.map((line, index) => (
                        <div key={`del-${index}`} className="flex bg-red-50">
                          <div className="w-12 bg-red-100 text-red-700 text-center py-0.5 text-xs select-none">
                            <Minus className="w-3 h-3 mx-auto" />
                          </div>
                          <div className="flex-1 px-3 py-0.5 text-red-700">{line}</div>
                        </div>
                      ))}
                      
                      {/* Additions */}
                      {mockDiffContent[currentFile as keyof typeof mockDiffContent].additions.map((line, index) => (
                        <div key={`add-${index}`} className="flex bg-green-50">
                          <div className="w-12 bg-green-100 text-green-700 text-center py-0.5 text-xs select-none">
                            <Plus className="w-3 h-3 mx-auto" />
                          </div>
                          <div className="flex-1 px-3 py-0.5 text-green-700">{line}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-background border border-light rounded-md p-8 text-center">
                  <FileText className="w-12 h-12 text-muted mx-auto mb-3" />
                  <p className="text-secondary">
                    {currentFile ? 'No diff available for this file' : 'Select a file to view changes'}
                  </p>
                </div>
              )}
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
            Are you sure you want to rollback to <strong>Version {version.id}</strong>?
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
            Rollback to Version {version.id}
          </Button>
        </div>
      </Modal>
    </>
  );
}
