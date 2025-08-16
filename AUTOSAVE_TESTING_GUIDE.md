# Autosave Testing Guide

This guide provides comprehensive test scenarios to verify the autosave functionality works correctly across all project modules.

## Prerequisites

1. **Backend Running**: Ensure the Pandaura backend is running on the configured port
2. **Database Access**: Verify the SQLite database is accessible and has the required tables
3. **Project Setup**: Have at least one test project created in the system
4. **Browser DevTools**: Open browser developer tools to monitor console logs and network requests

## Test Scenarios

### 1. Logic Studio Autosave Tests

#### Test 1.1: Basic Code Editing Autosave
1. Navigate to Logic Studio in a project workspace (`/workspace/{projectId}/logic-studio`)
2. Start typing PLC code in the editor
3. **Expected**: 
   - Autosave status shows "Unsaved changes" after typing
   - After 2 seconds of inactivity, status shows "Saving..."
   - Status updates to "Saved just now" when complete
   - Console shows autosave requests being sent

#### Test 1.2: Vendor Selection Autosave
1. Change the PLC vendor selection
2. **Expected**: Autosave triggers and saves the vendor preference

#### Test 1.3: UI State Autosave
1. Toggle interface collapse levels
2. Toggle pending changes panel
3. Toggle AI suggestions
4. **Expected**: All UI state changes trigger autosave

#### Test 1.4: Navigation Protection
1. Make changes to code without waiting for autosave
2. Try to navigate away (click logo or different tool)
3. **Expected**: Browser shows confirmation dialog asking to save changes

### 2. Tag Database Manager Autosave Tests

#### Test 2.1: Filter State Autosave
1. Navigate to Tag Database Manager in project workspace
2. Change search filters (vendor, tag type, search text)
3. **Expected**: Filter changes trigger autosave

#### Test 2.2: Tag Editing Autosave
1. Start editing a tag (click edit icon)
2. **Expected**: Editing state is saved to autosave

#### Test 2.3: Real-time Tag Updates
1. Have Logic Studio open in another tab
2. Add new tags in Logic Studio
3. Switch to Tag Database Manager
4. **Expected**: Real-time updates trigger autosave state update

### 3. AskPandaura Autosave Tests

#### Test 3.1: Chat Message Autosave
1. Navigate to AskPandaura in project workspace
2. Type in the chat input field
3. **Expected**: Chat message content is autosaved

### 4. Cross-Module Integration Tests

#### Test 4.1: State Persistence Across Navigation
1. Make changes in Logic Studio
2. Navigate to Tag Database Manager
3. Navigate back to Logic Studio
4. **Expected**: Previous state is restored from autosave

#### Test 4.2: Project State Recovery
1. Make changes across multiple modules
2. Close browser tab
3. Reopen the project workspace
4. **Expected**: Previous state is restored from autosave

### 5. Error Handling Tests

#### Test 5.1: Network Failure Recovery
1. Make changes in any module
2. Disconnect network (or block API requests in DevTools)
3. **Expected**: 
   - Autosave shows error status
   - State is cached to localStorage as fallback
   - Retry attempts are made with exponential backoff

#### Test 5.2: Backend Unavailable
1. Stop the backend server
2. Make changes in modules
3. **Expected**: 
   - Autosave fails gracefully
   - Fallback to localStorage caching
   - Error indicators shown to user

#### Test 5.3: Large State Handling
1. Create very large PLC code (>1MB)
2. Make changes
3. **Expected**: Autosave handles large payloads appropriately

### 6. Performance Tests

#### Test 6.1: Rapid Changes
1. Type rapidly in Logic Studio editor
2. **Expected**: 
   - Debouncing prevents excessive API calls
   - Only one autosave request per 2-second window
   - No performance degradation

#### Test 6.2: Multiple Modules Open
1. Open Logic Studio, Tag Manager, and AskPandaura in separate tabs
2. Make changes in all modules
3. **Expected**: Each module autosaves independently without conflicts

## Verification Steps

### Backend Verification
1. Check database tables:
   ```sql
   SELECT * FROM projects WHERE id = {projectId};
   -- Verify autosave_state column contains recent changes
   
   SELECT * FROM project_autosave WHERE project_id = {projectId};
   -- Verify versioned autosave entries
   ```

### Frontend Verification
1. **Console Logs**: Check for autosave success/failure messages
2. **Network Tab**: Verify PUT requests to `/api/v1/projects/{id}/autosave`
3. **LocalStorage**: Check for fallback cache entries
4. **UI Indicators**: Verify autosave status components show correct states

### API Endpoint Testing
Test the autosave endpoints directly:

```bash
# Test main autosave endpoint
curl -X PUT http://localhost:3001/api/v1/projects/1/autosave \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"autosaveState": {"test": "data"}}'

# Test versioned autosave endpoint  
curl -X POST http://localhost:3001/projects/1/auto-save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"state": {"test": "data"}}'
```

## Common Issues and Troubleshooting

### Issue: Autosave not triggering
- **Check**: Project ID is correctly passed to hooks
- **Check**: User is authenticated
- **Check**: Component is not in session mode

### Issue: Navigation protection not working
- **Check**: `hasUnsavedChanges` state is correctly updated
- **Check**: `beforeunload` event listeners are attached
- **Check**: Navigation handlers use protection logic

### Issue: State not persisting
- **Check**: Backend autosave endpoints are working
- **Check**: Database write permissions
- **Check**: LocalStorage fallback is functioning

### Issue: Performance problems
- **Check**: Debouncing is working (2-second delay)
- **Check**: Deep comparison prevents unnecessary saves
- **Check**: Large state objects are handled efficiently

## Success Criteria

✅ **All modules autosave state changes within 2 seconds**
✅ **Navigation protection prevents data loss**
✅ **Error handling gracefully degrades to localStorage**
✅ **UI indicators accurately reflect autosave status**
✅ **State persists across browser sessions**
✅ **Performance remains smooth with rapid changes**
✅ **Cross-module state synchronization works**
✅ **Fallback recovery mechanisms function correctly**
