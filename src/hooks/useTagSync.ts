import { useEffect, useRef, useState, useCallback } from 'react';
import { authStorage } from '../utils/authStorage';

export interface TagSyncMessage {
  type: 'sync_tags' | 'subscribe' | 'unsubscribe' | 'ping';
  projectId?: string;
  vendor?: string;
  stCode?: string;
  debounceMs?: number;
}

export interface TagSyncResponse {
  type: 'tags_updated' | 'error' | 'sync_queued' | 'pong';
  success: boolean;
  projectId?: string;
  tags?: any[];
  error?: string;
  timestamp: string;
  parsedCount?: number;
  syncId?: string;
}

export interface UseTagSyncOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  debounceMs?: number;
  onTagsUpdated?: (response: TagSyncResponse) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export interface UseTagSyncReturn {
  isConnected: boolean;
  isConnecting: boolean;
  lastError: string | null;
  connectionAttempts: number;
  syncTags: (projectId: string, vendor: string, stCode: string) => void;
  subscribe: (projectId: string) => void;
  unsubscribe: () => void;
  ping: () => void;
  connect: () => void;
  disconnect: () => void;
  resetConnection: () => void;
  lastSyncTime: number | null;
  queuedSyncs: number;
  isDisabled: boolean;
}

export function useTagSync(options: UseTagSyncOptions = {}): UseTagSyncReturn {
  const {
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    debounceMs = 500,
    onTagsUpdated,
    onError,
    onConnectionChange
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [queuedSyncs, setQueuedSyncs] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false); // Circuit breaker

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const subscribedProjectRef = useRef<string | null>(null);

  // Get auth token from authStorage
  const getAuthToken = useCallback(() => {
    return authStorage.getToken();
  }, []);

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Use environment-specific WebSocket URL
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL;
    if (wsBaseUrl) {
      return `${wsBaseUrl}/ws/tags?token=${encodeURIComponent(token)}`;
    }

    // Fallback to auto-detection (for backward compatibility)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/tags?token=${encodeURIComponent(token)}`;
  }, [getAuthToken]);

  // Get WebSocket origin for CORS
  const getWebSocketOrigin = useCallback(() => {
    // Use the frontend URL as origin
    return window.location.origin;
  }, []);

  // Send message to WebSocket
  const sendMessage = useCallback((message: TagSyncMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Handle WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      console.log('📨 Received WebSocket message:', event.data);
      const response: TagSyncResponse = JSON.parse(event.data);
      console.log('📨 Parsed message:', response);

      switch (response.type) {
        case 'tags_updated':
          setLastSyncTime(Date.now());
          setQueuedSyncs(prev => Math.max(0, prev - 1));
          onTagsUpdated?.(response);
          break;
        
        case 'sync_queued':
          setQueuedSyncs(prev => prev + 1);
          break;
        
        case 'error':
          setLastError(response.error || 'Unknown error');
          setQueuedSyncs(prev => Math.max(0, prev - 1));
          onError?.(response.error || 'Unknown error');
          break;
        
        case 'pong':
          // Connection health check response
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      setLastError('Failed to parse server response');
    }
  }, [onTagsUpdated, onError]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting || isDisabled) {
      console.log(`🚫 Connection blocked: open=${wsRef.current?.readyState === WebSocket.OPEN}, connecting=${isConnecting}, disabled=${isDisabled}`);
      return;
    }

    // Circuit breaker: stop trying after max attempts
    if (connectionAttempts >= maxReconnectAttempts) {
      console.log(`🚫 Circuit breaker activated: ${connectionAttempts}/${maxReconnectAttempts} attempts exhausted`);
      setIsDisabled(true);
      setLastError(`Connection failed after ${maxReconnectAttempts} attempts. Please refresh the page.`);
      return;
    }

    try {
      setIsConnecting(true);
      setLastError(null);
      
      const url = getWebSocketUrl();
      const origin = getWebSocketOrigin();

      console.log(`🔗 Connecting to WebSocket: ${url}`);
      console.log(`🌐 Browser origin: ${origin}`);
      console.log(`🔗 Environment VITE_WS_BASE_URL: ${import.meta.env.VITE_WS_BASE_URL}`);

      // Create WebSocket (browser will automatically send Origin header)
      const ws = new WebSocket(url);

      // Set wsRef BEFORE setting up event handlers so sendMessage works in onopen
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 TagSync WebSocket connected successfully!');
        console.log('🔌 WebSocket readyState:', ws.readyState);
        console.log('🔌 WebSocket URL:', ws.url);
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionAttempts(0);
        setLastError(null);
        onConnectionChange?.(true);

        // Re-subscribe to project if we were subscribed before
        if (subscribedProjectRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          console.log(`🔄 Re-subscribing to project: ${subscribedProjectRef.current}`);
          try {
            wsRef.current.send(JSON.stringify({
              type: 'subscribe',
              projectId: subscribedProjectRef.current
            }));
            console.log(`📤 Subscription message sent successfully`);
          } catch (error) {
            console.error(`❌ Failed to send subscription message:`, error);
          }
        }
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        console.log('🔌 TagSync WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        onConnectionChange?.(false);

        // Only attempt reconnection if:
        // 1. Not a clean close (1000)
        // 2. Under max attempts
        // 3. Not already connecting
        // 4. WebSocket reference matches current one (prevent multiple reconnection loops)
        if (event.code !== 1000 &&
            connectionAttempts < maxReconnectAttempts &&
            !isConnecting &&
            wsRef.current === ws) {

          console.log(`🔄 Scheduling reconnection attempt ${connectionAttempts + 1}/${maxReconnectAttempts} in ${reconnectInterval}ms`);
          setConnectionAttempts(prev => prev + 1);

          reconnectTimeoutRef.current = setTimeout(() => {
            // Double-check we should still reconnect
            if (wsRef.current === ws && !isConnecting) {
              console.log(`🔄 Attempting reconnection ${connectionAttempts}/${maxReconnectAttempts}`);
              connect();
            }
          }, reconnectInterval * Math.pow(2, connectionAttempts)); // Exponential backoff
        } else {
          console.log(`❌ Not reconnecting: code=${event.code}, attempts=${connectionAttempts}/${maxReconnectAttempts}, connecting=${isConnecting}`);
        }
      };

      ws.onerror = (error) => {
        console.error('🔌 TagSync WebSocket error:', error);
        setLastError('WebSocket connection error');
        setIsConnecting(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setLastError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnecting(false);
    }
  }, [
    isConnecting,
    getWebSocketUrl,
    getWebSocketOrigin,
    handleMessage,
    connectionAttempts,
    maxReconnectAttempts,
    reconnectInterval,
    onConnectionChange
  ]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    console.log('🔌 Manually disconnecting WebSocket');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionAttempts(0);
    setIsDisabled(false); // Reset circuit breaker on manual disconnect
    subscribedProjectRef.current = null;
  }, []);

  // Reset connection (for manual retry after circuit breaker)
  const resetConnection = useCallback(() => {
    console.log('🔄 Resetting connection state');
    disconnect();
    setLastError(null);
    setTimeout(() => {
      connect();
    }, 1000);
  }, [disconnect, connect]);

  // Sync tags with debouncing
  const syncTags = useCallback((projectId: string, vendor: string, stCode: string) => {
    if (!sendMessage({
      type: 'sync_tags',
      projectId,
      vendor,
      stCode,
      debounceMs
    })) {
      setLastError('Not connected to sync service');
    }
  }, [sendMessage, debounceMs]);

  // Subscribe to project updates
  const subscribe = useCallback((projectId: string) => {
    subscribedProjectRef.current = projectId;
    if (!sendMessage({
      type: 'subscribe',
      projectId
    })) {
      setLastError('Not connected to sync service');
    }
  }, [sendMessage]);

  // Unsubscribe from project updates
  const unsubscribe = useCallback(() => {
    subscribedProjectRef.current = null;
    if (!sendMessage({
      type: 'unsubscribe'
    })) {
      setLastError('Not connected to sync service');
    }
  }, [sendMessage]);

  // Send ping for connection health check
  const ping = useCallback(() => {
    sendMessage({ type: 'ping' });
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !isDisabled) {
      console.log('🔄 Auto-connecting to WebSocket...');
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isDisabled]); // Removed connect/disconnect from deps to prevent reconnection loop

  // Periodic ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      ping();
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, ping]);

  return {
    isConnected,
    isConnecting,
    lastError,
    connectionAttempts,
    syncTags,
    subscribe,
    unsubscribe,
    ping,
    connect,
    disconnect,
    resetConnection,
    lastSyncTime,
    queuedSyncs,
    isDisabled
  };
}
