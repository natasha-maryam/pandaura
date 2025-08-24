import React, { useState } from 'react';
import { Save, History, GitBranch, Clock, MessageSquare } from 'lucide-react';
import  Button  from './Button';
import Modal from './Modal';
import { useVersionControl } from '../../hooks/useVersionControl';
import { useToast } from './Toast';

interface VersionControlToolbarProps {
  projectId: number;
  currentState?: any;
  onVersionCreated?: (versionNumber: number) => void;
  onRollback?: (versionNumber: number) => void;
  className?: string;
}

interface SaveVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (message: string) => void;
  isSaving: boolean;
}

function SaveVersionModal({ isOpen, onClose, onSave, isSaving }: SaveVersionModalProps) {
  const [message, setMessage] = useState('');

  const handleSave = () => {
    if (message.trim()) {
      onSave(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Version">
      <div className="space-y-4">
        <div>
          <label htmlFor="version-message" className="block text-sm font-medium text-gray-700 mb-2">
            Version Message
          </label>
          <textarea
            id="version-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the changes in this version..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={isSaving}
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!message.trim() || isSaving}
            icon={Save}
          >
            {isSaving ? 'Saving...' : 'Save Version'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function VersionControlToolbar({
  projectId,
  currentState,
  onVersionCreated,
  onRollback,
  className = ''
}: VersionControlToolbarProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const {
    versions,
    isLoading: versionsLoading,
    createVersion,
    rollbackToVersion,
    canCreateVersion,
    lastVersionTime
  } = useVersionControl({
    projectId,
    autoCreateVersions: true
  });

  const handleSaveVersion = async (message: string) => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      const versionNumber = await createVersion(message, currentState);
      console.log('Version created:', versionNumber);
      
      setShowSaveModal(false);
      onVersionCreated?.(versionNumber);
      
      // Show success toast
      showToast({
        variant: 'success',
        title: 'Version Saved Successfully!',
        message: `Version ${versionNumber} has been saved with message: "${message}"`,
        duration: 4000
      });
    } catch (error) {
      console.error('Failed to create version:', error);
      showToast({
        variant: 'error',
        title: 'Save Failed',
        message: 'Failed to save version. Please try again.',
        duration: 4000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRollback = async (versionNumber: number) => {
    try {
      await rollbackToVersion(versionNumber);
      onRollback?.(versionNumber);
      
      // Note: Toast notification is already shown by the rollbackToVersion function in useVersionControl
    } catch (error) {
      console.error('Failed to rollback:', error);
      showToast({
        variant: 'error',
        title: 'Rollback Failed',
        message: 'Failed to rollback to version. Please try again.',
        duration: 5000
      });
    }
  };

  const getLastVersionText = () => {
    if (!lastVersionTime) return 'No versions yet';
    
    const now = new Date();
    const diffMs = now.getTime() - lastVersionTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Save Version Button */}
        <Button
          size="sm"
          variant="outline"
          icon={Save}
          onClick={() => setShowSaveModal(true)}
          disabled={!canCreateVersion}
          title={canCreateVersion ? 'Save current state as a new version' : 'Please wait before creating another version'}
        >
          Save Version
        </Button>

        {/* Version History Button */}
        <Button
          size="sm"
          variant="ghost"
          icon={History}
          onClick={() => setShowHistoryModal(true)}
          title="View version history"
        >
          History ({versions.length})
        </Button>

        {/* Last Version Info */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Last: {getLastVersionText()}</span>
        </div>
      </div>

      {/* Save Version Modal */}
      <SaveVersionModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveVersion}
        isSaving={isSaving}
      />

      {/* Version History Modal */}
      {showHistoryModal && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title="Version History"
          size="lg"
        >
          <div className="space-y-4">
            {versionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading versions...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No versions saved yet</p>
                <p className="text-sm text-gray-400 mt-1">Create your first version to track changes</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={`p-3 border rounded-lg ${
                      index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Version {version.version_number}</span>
                          {index === 0 && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            version.is_auto 
                              ? 'bg-gray-100 text-gray-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {version.is_auto ? 'Auto' : 'Manual'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {new Date(version.snapshot_info.timestamp * 1000).toLocaleString()}
                        </p>
                        {version.message && (
                          <p className="text-sm text-gray-800">{version.message}</p>
                        )}
                      </div>
                      {index > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (window.confirm(`Rollback to version ${version.version_number}?`)) {
                              handleRollback(version.version_number);
                              setShowHistoryModal(false);
                            }
                          }}
                        >
                          Rollback
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
