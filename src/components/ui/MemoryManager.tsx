import React, { useState } from 'react';
import { Brain, Trash2, RefreshCw, Clock, MessageSquare } from 'lucide-react';
import { aiService } from '../../services/aiService';

interface MemoryManagerProps {
  sessionId?: string;
  onSessionCleared?: () => void;
  className?: string;
}

interface MemoryStats {
  sessionsCount: number;
  currentSessionId?: string;
  lastActivity?: Date;
}

export default function MemoryManager({
  sessionId,
  onSessionCleared,
  className = '',
}: MemoryManagerProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [stats, setStats] = useState<MemoryStats>({ sessionsCount: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = async () => {
    try {
      setIsRefreshing(true);
      const health = await aiService.checkHealth();
      setStats({
        sessionsCount: health.memory_sessions || 0,
        currentSessionId: sessionId,
        lastActivity: new Date(),
      });
    } catch (error) {
      console.error('Failed to refresh memory stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearCurrentSession = async () => {
    if (!sessionId) return;

    try {
      setIsClearing(true);
      await aiService.clearMemory(sessionId);
      
      // Refresh stats after clearing
      await refreshStats();
      
      if (onSessionCleared) {
        onSessionCleared();
      }
    } catch (error) {
      console.error('Failed to clear memory:', error);
    } finally {
      setIsClearing(false);
    }
  };

  React.useEffect(() => {
    if (sessionId) {
      refreshStats();
    }
  }, [sessionId]);

  if (!sessionId) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-900">Conversation Memory</h3>
        </div>
        <button
          onClick={refreshStats}
          disabled={isRefreshing}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Refresh memory statistics"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Memory Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-blue-600 font-medium">Active Sessions</span>
            </div>
            <p className="text-lg font-bold text-blue-800">{stats.sessionsCount}</p>
          </div>
          
          <div className="bg-green-50 p-3 rounded">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">Last Update</span>
            </div>
            <p className="text-xs text-green-800">
              {stats.lastActivity ? stats.lastActivity.toLocaleTimeString() : 'Not available'}
            </p>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-xs text-gray-600 mb-1">Current Session ID:</p>
          <p className="text-xs font-mono text-gray-800 break-all">
            {sessionId}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={clearCurrentSession}
            disabled={isClearing}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isClearing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {isClearing ? 'Clearing...' : 'Clear Memory'}
          </button>
        </div>

        {/* Memory Info */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <p className="mb-1">• Memory automatically expires after 30 minutes of inactivity</p>
          <p className="mb-1">• Keeps last 20 messages to prevent context overflow</p>
          <p>• Memory is not persistent across server restarts</p>
        </div>
      </div>
    </div>
  );
}
