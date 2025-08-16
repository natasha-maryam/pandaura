# Real-Time Tag Sync Implementation

## Overview

This implementation provides real-time synchronization of PLC tags between Logic Studio and Tag Database using WebSocket connections. When users edit ST (Structured Text) code in Logic Studio, tags are automatically parsed, formatted for the selected vendor, and synchronized to the database in real-time.

## Architecture

### Backend Components

1. **Enhanced TagSyncService** (`pandaura-backend/src/services/tagSyncService.ts`)
   - WebSocket server with JWT authentication
   - Debounced tag parsing to prevent excessive processing
   - Real-time broadcasting to subscribed clients
   - Connection health monitoring with ping/pong
   - Comprehensive error handling and logging

2. **Existing ST Parser** (`pandaura-backend/src/utils/stParser.ts`)
   - Parses structured text code to extract variable declarations
   - Supports IEC 61131-3 format with vendor-specific extensions

3. **Vendor Formatters** (`pandaura-backend/src/utils/vendorFormatters.ts`)
   - Formats tags for Rockwell, Siemens, and Beckhoff PLCs
   - Generates appropriate addresses and data types

### Frontend Components

1. **useTagSync Hook** (`pandaura/src/hooks/useTagSync.ts`)
   - WebSocket connection management with auto-reconnection
   - Debounced message sending
   - Authentication token handling
   - Connection health monitoring

2. **ProjectSyncContext** (`pandaura/src/contexts/ProjectSyncContext.tsx`)
   - Provides project-scoped tag synchronization
   - Manages WebSocket subscriptions based on URL project ID
   - Handles real-time tag update callbacks

3. **Enhanced Logic Studio** (`pandaura/src/pages/LogicStudio.tsx`)
   - Real-time sync status indicator
   - Debounced tag synchronization on code changes
   - Connection status display

4. **Enhanced Tag Database** (`pandaura/src/components/tags/TagDatabaseManagerNew.tsx`)
   - Real-time tag update notifications
   - Sync status indicator
   - Automatic refresh on tag updates

## Features

### Real-Time Synchronization
- **Debounced Parsing**: 1.5-second delay prevents excessive parsing during typing
- **Live Status**: Visual indicators show connection status and sync progress
- **Automatic Reconnection**: Handles network interruptions gracefully
- **Project-Scoped**: Only syncs tags for the current project

### Security
- **JWT Authentication**: All WebSocket connections require valid JWT tokens
- **Zero Trust**: Token validation on every connection and message
- **Project Access Control**: Users can only sync tags for projects they have access to

### User Experience
- **Visual Feedback**: Connection status indicators in both Logic Studio and Tag Database
- **Toast Notifications**: Success/error messages for tag sync operations
- **Queue Indicators**: Shows pending sync operations
- **Last Update Timestamps**: Displays when tags were last synchronized

## Usage

### For Developers

1. **Start the Backend**:
   ```bash
   cd pandaura-backend
   npm run dev
   ```

2. **Start the Frontend**:
   ```bash
   cd pandaura
   npm start
   ```

3. **Access Project Workspace**:
   Navigate to `/workspace/{projectId}/logic-studio` or `/workspace/{projectId}/tag-database`

### For Users

1. **Open Logic Studio**: Navigate to a project workspace and open Logic Studio
2. **Check Connection**: Look for the "Live Sync" indicator in the header
3. **Edit ST Code**: Make changes to the structured text code
4. **View Real-Time Updates**: Switch to Tag Database to see tags update automatically
5. **Monitor Status**: Watch sync indicators for connection health and update progress

## WebSocket Message Protocol

### Client to Server Messages

```typescript
{
  type: 'sync_tags',
  projectId: string,
  vendor: 'rockwell' | 'siemens' | 'beckhoff',
  stCode: string,
  debounceMs?: number
}

{
  type: 'subscribe',
  projectId: string
}

{
  type: 'unsubscribe'
}

{
  type: 'ping'
}
```

### Server to Client Messages

```typescript
{
  type: 'tags_updated',
  success: true,
  projectId: string,
  tags: Tag[],
  parsedCount: number,
  syncId: string,
  timestamp: string
}

{
  type: 'sync_queued',
  success: true,
  projectId: string,
  syncId: string,
  timestamp: string
}

{
  type: 'error',
  success: false,
  error: string,
  timestamp: string
}

{
  type: 'pong',
  success: true,
  timestamp: string
}
```

## Configuration

### Environment Variables

- `JWT_SECRET`: Secret key for JWT token validation
- `PORT`: Backend server port (default: 3000)

### WebSocket URL

The frontend automatically constructs the WebSocket URL:
- Development: `ws://localhost:3000/ws/tags?token={jwt}`
- Production: `wss://yourdomain.com/ws/tags?token={jwt}`

## Error Handling

### Connection Errors
- Automatic reconnection with exponential backoff
- Visual indicators for connection status
- Graceful degradation when offline

### Parsing Errors
- Detailed error messages for invalid ST code
- Continues processing other tags if one fails
- User-friendly error notifications

### Authentication Errors
- Automatic token refresh attempts
- Redirect to login if token is invalid
- Secure error messages without exposing sensitive data

## Performance Considerations

### Debouncing
- **Logic Studio**: 1.5-second debounce for tag sync
- **Backend**: 500ms debounce for WebSocket messages
- **Auto-save**: 1-second debounce for state persistence

### Connection Management
- **Ping Interval**: 30 seconds to keep connections alive
- **Reconnection**: Maximum 5 attempts with 3-second intervals
- **Cleanup**: Automatic cleanup of disconnected clients

### Memory Management
- **Client Tracking**: Efficient Map-based client storage
- **Timer Cleanup**: Proper cleanup of debounce timers
- **Connection Limits**: Graceful handling of connection limits

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if backend is running
   - Verify JWT token is valid
   - Check network connectivity

2. **Tags Not Syncing**
   - Ensure project ID is valid
   - Check ST code syntax
   - Verify vendor selection

3. **Performance Issues**
   - Reduce debounce delays if needed
   - Check for memory leaks in browser
   - Monitor WebSocket connection count

### Debug Information

Enable debug logging by setting `localStorage.debug = 'tagsync:*'` in browser console.

## Future Enhancements

- **Conflict Resolution**: Handle simultaneous edits from multiple users
- **Offline Support**: Queue changes when offline and sync when reconnected
- **Change History**: Track and display tag change history
- **Bulk Operations**: Support for bulk tag imports/exports via WebSocket
- **Performance Metrics**: Real-time performance monitoring dashboard
