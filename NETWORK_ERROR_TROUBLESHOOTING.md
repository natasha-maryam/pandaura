# Network Error Troubleshooting Guide

## Issues Fixed

### 1. TypeScript Error ✅
**Error**: `Parameter 'e' implicitly has an 'any' type`
**Location**: `VersionHistory.tsx:77`

**Fix**: Removed unnecessary event parameter from Button onClick handler:
```typescript
// Before (causing TypeScript error)
onClick={(e) => {
  e.stopPropagation();
  onRefresh();
}}

// After (fixed)
onClick={() => {
  onRefresh();
}}
```

### 2. Network Error Analysis 🔍
**Error**: `ERR_INSUFFICIENT_RESOURCES` when calling `GET http://localhost:5000/api/v1/projects/11`

**Possible Causes**:
1. Backend server not running
2. Backend running on wrong port
3. CORS configuration issues
4. Resource exhaustion on backend
5. Database connection issues

## Enhanced Error Handling ✅

### Improved Project Loading Error Messages
Added specific error handling for different network scenarios:

```typescript
// Enhanced error handling for network issues
let errorMessage = 'Failed to load project';
if (err.code === 'ERR_NETWORK') {
  errorMessage = 'Cannot connect to server. Please check if the backend is running on port 5000.';
} else if (err.code === 'ERR_INSUFFICIENT_RESOURCES') {
  errorMessage = 'Server resource error. Please try refreshing the page or restart the backend.';
} else if (err.response?.status === 404) {
  errorMessage = `Project with ID ${projectId} not found.`;
} else if (err.response?.status === 401) {
  errorMessage = 'Authentication required. Please log in again.';
}
```

### Debug Information Added
- Enhanced debug panel in Project Overview
- Console logging for project loading
- Network error details
- Expected API endpoint URLs

## Troubleshooting Steps

### 1. Check Backend Server Status
```bash
# Navigate to backend directory
cd pandaura-backend

# Check if server is running
npm run dev

# Expected output:
# Server is running on http://localhost:5000
# Environment: development
```

### 2. Verify Backend Port
- **Expected**: Backend should run on port 5000
- **Check**: Look for "Server is running on http://localhost:5000" message
- **Fix**: If running on different port, update frontend config

### 3. Test Backend Connectivity
Open browser and navigate to:
- `http://localhost:5000` - Should show API info
- `http://localhost:5000/api/v1/test` - Should show test endpoint
- `http://localhost:5000/api/v1/projects` - Should show projects (if authenticated)

### 4. Check Database Connection
```bash
# In backend directory, check database
npm run db:check  # If available
# Or check logs for database connection errors
```

### 5. Verify Authentication
- Check if user is logged in
- Verify JWT token in localStorage
- Check if token has expired

### 6. CORS Configuration
Verify backend CORS settings allow frontend origin:
```javascript
// In backend index.js, should include:
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

### 7. Resource Issues
If `ERR_INSUFFICIENT_RESOURCES` persists:
- Restart backend server
- Check system memory usage
- Check for memory leaks in backend
- Restart database if using external DB

## Debug Information Available

### Console Logs
Check browser console for:
```
useProject: Loading project 11...
useProject: Project 11 loaded successfully: {project data}
```

Or error logs:
```
Failed to load project: AxiosError {code: 'ERR_NETWORK', ...}
```

### Debug Panel
The yellow debug panel shows:
- Project ID being requested
- Loading status
- Error messages
- Expected API endpoint URL
- Version control status

### Network Tab
Check browser DevTools Network tab:
- Look for failed requests to `/api/v1/projects/{id}`
- Check response status codes
- Verify request headers include authentication

## Common Solutions

### Solution 1: Backend Not Running
```bash
cd pandaura-backend
npm install  # If first time
npm run dev
```

### Solution 2: Wrong Port
Check `pandaura/src/config/environment.ts`:
```typescript
// Should point to correct backend URL
const getApiBaseUrl = () => {
  if (isDevelopment) {
    return 'http://localhost:5000';  // Verify this matches backend port
  }
  // ...
}
```

### Solution 3: Authentication Issues
```javascript
// Check localStorage for auth token
console.log(localStorage.getItem('authToken'));

// If missing, log in again
// If expired, refresh token or log in again
```

### Solution 4: Database Issues
```bash
# If using SQLite (development)
ls -la pandaura-backend/database.sqlite

# If using PostgreSQL (production)
# Check database connection string and server status
```

### Solution 5: Resource Exhaustion
```bash
# Restart backend
cd pandaura-backend
npm run dev

# Check system resources
top  # or Task Manager on Windows
```

## Testing the Fixes

### 1. Verify TypeScript Error Fixed
- No more "Parameter 'e' implicitly has an 'any' type" errors
- Version History refresh button works without console errors

### 2. Test Network Connectivity
1. Start backend server
2. Navigate to Project Overview
3. Check debug panel for:
   - "Project Loading: No" (after successful load)
   - "Project Error: None"
   - "Versions Count: X" (where X > 0 if versions exist)

### 3. Verify Error Messages
1. Stop backend server
2. Refresh Project Overview
3. Should see user-friendly error message instead of technical error

## Files Modified

1. **`pandaura/src/components/projects/VersionHistory.tsx`**:
   - Fixed TypeScript error with event parameter

2. **`pandaura/src/components/projects/hooks.ts`**:
   - Enhanced error handling for network issues
   - Added debug logging for project loading

3. **`pandaura/src/components/projects/ProjectOverview.tsx`**:
   - Enhanced debug panel with network information
   - Added backend status information

## Next Steps

1. **Start Backend**: Ensure backend is running on port 5000
2. **Check Debug Panel**: Use debug information to identify specific issues
3. **Test Connectivity**: Verify API endpoints are accessible
4. **Check Authentication**: Ensure user is properly logged in
5. **Monitor Console**: Watch for detailed error messages

## Expected Results After Fixes

✅ **TypeScript Error**: Resolved - no more implicit 'any' type errors
✅ **Enhanced Error Messages**: User-friendly network error descriptions
✅ **Debug Information**: Comprehensive troubleshooting data
✅ **Better Logging**: Detailed console logs for debugging

Once the backend connectivity is restored, the Project Overview should load successfully and display dynamic version data!
