import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, Zap, Brain, Image, FileText } from 'lucide-react';
import { aiService } from '../../services/aiService';

interface AIHealthCheckProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export default function AIHealthCheck({
  autoRefresh = false,
  refreshInterval = 30000,
  className = '',
}: AIHealthCheckProps) {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const health = await aiService.checkHealth();
      setHealthStatus(health);
      setLastChecked(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
      setHealthStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const pingTest = async () => {
    try {
      setIsLoading(true);
      const pingResult = await aiService.ping();
      console.log('Ping test result:', pingResult);
    } catch (err) {
      console.error('Ping test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const warmupModel = async () => {
    try {
      setIsLoading(true);
      const warmupResult = await aiService.warmupModel();
      console.log('Warmup result:', warmupResult);
    } catch (err) {
      console.error('Warmup failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(checkHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'ok':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'ok':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'error':
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">AI Service Health</h3>
        <div className="flex gap-2">
          <button
            onClick={pingTest}
            disabled={isLoading}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            Ping Test
          </button>
          <button
            onClick={warmupModel}
            disabled={isLoading}
            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            Warmup
          </button>
          <button
            onClick={checkHealth}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-4 h-4" />
            <span className="font-medium">Connection Error</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {healthStatus && (
        <div className="space-y-3">
          {/* Status Overview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(healthStatus.status)}
              <span className={`text-sm font-medium ${getStatusColor(healthStatus.status)}`}>
                {healthStatus.status || 'Unknown'}
              </span>
            </div>
            {lastChecked && (
              <span className="text-xs text-gray-500">
                {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Model Information */}
          <div className="bg-gray-50 p-3 rounded">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Model</span>
            </div>
            <p className="text-sm text-gray-600">{healthStatus.model_name || 'Not specified'}</p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            {/* Memory */}
            <div className="bg-purple-50 p-2 rounded">
              <div className="flex items-center gap-1 mb-1">
                <Brain className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Memory</span>
              </div>
              <p className="text-xs text-purple-600">
                {healthStatus.memory_sessions || 0} sessions
              </p>
            </div>

            {/* Images */}
            <div className={`p-2 rounded ${healthStatus.image_support ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-1 mb-1">
                <Image className={`w-3 h-3 ${healthStatus.image_support ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-xs font-medium ${healthStatus.image_support ? 'text-green-700' : 'text-gray-500'}`}>
                  Images
                </span>
              </div>
              <p className={`text-xs ${healthStatus.image_support ? 'text-green-600' : 'text-gray-400'}`}>
                {healthStatus.image_support ? 'Enabled' : 'Disabled'}
              </p>
            </div>

            {/* Documents */}
            <div className={`p-2 rounded ${healthStatus.document_support ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-1 mb-1">
                <FileText className={`w-3 h-3 ${healthStatus.document_support ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`text-xs font-medium ${healthStatus.document_support ? 'text-blue-700' : 'text-gray-500'}`}>
                  Documents
                </span>
              </div>
              <p className={`text-xs ${healthStatus.document_support ? 'text-blue-600' : 'text-gray-400'}`}>
                {healthStatus.document_support ? 'Enabled' : 'Disabled'}
              </p>
            </div>

            {/* Streaming */}
            <div className="bg-orange-50 p-2 rounded">
              <div className="flex items-center gap-1 mb-1">
                <Zap className="w-3 h-3 text-orange-600" />
                <span className="text-xs font-medium text-orange-700">Streaming</span>
              </div>
              <p className="text-xs text-orange-600">Available</p>
            </div>
          </div>

          {/* Supported Formats */}
          {healthStatus.supported_formats && healthStatus.supported_formats.length > 0 && (
            <div className="text-xs">
              <p className="text-gray-600 mb-1">Supported formats:</p>
              <p className="text-gray-500 font-mono">
                {healthStatus.supported_formats.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
