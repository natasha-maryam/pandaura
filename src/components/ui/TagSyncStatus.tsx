import React from 'react';
import { Wifi, WifiOff, AlertCircle, Info } from 'lucide-react';

interface TagSyncStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  lastError: string | null;
  isProjectMode: boolean;
  projectId: string | null;
}

export const TagSyncStatus: React.FC<TagSyncStatusProps> = ({
  isConnected,
  isConnecting,
  lastError,
  isProjectMode,
  projectId
}) => {
  if (!isProjectMode) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
        <Info className="w-4 h-4" />
        <span>Session mode - real-time tag sync not available</span>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
        <AlertCircle className="w-4 h-4" />
        <span>No project selected - tag sync unavailable</span>
      </div>
    );
  }

  if (lastError) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
        <WifiOff className="w-4 h-4" />
        <span>Tag sync error: {lastError}</span>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Connecting to tag sync...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
        <Wifi className="w-4 h-4" />
        <span>Tag sync connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
      <WifiOff className="w-4 h-4" />
      <span>Tag sync disconnected</span>
    </div>
  );
};

export default TagSyncStatus;
