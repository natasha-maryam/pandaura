# Version Control Testing Guide

This guide provides comprehensive test scenarios to verify the version control functionality works correctly across all project modules.

## Prerequisites

1. **Backend Running**: Ensure the Pandaura backend is running with version control endpoints
2. **Database Setup**: Verify `project_versions` and `project_autosave` tables exist
3. **Project Access**: Have at least one test project created
4. **Browser DevTools**: Open to monitor API calls and console logs

## Test Scenarios

### 1. Manual Version Creation

#### Test 1.1: Create Version from Logic Studio
1. Navigate to Logic Studio (`/workspace/{projectId}/logic-studio`)
2. Make changes to PLC code
3. Click "Save Version" in the version control toolbar
4. Enter a descriptive message (e.g., "Added motor control logic")
5. Click "Save Version"

**Expected Results**:
- Version creation modal appears
- Success message after saving
- New version appears in version history
- Version number increments correctly

#### Test 1.2: Create Version from Tag Manager
1. Navigate to Tag Database Manager
2. Add or modify tags
3. Use version control toolbar to save version
4. Enter message (e.g., "Updated sensor tags")

**Expected Results**:
- Version created with tag state
- Tag filters and editing state preserved

### 2. Auto-Version Creation

#### Test 2.1: Auto-Version on Significant Changes
1. Make 10+ changes in Logic Studio (each change triggers autosave)
2. Wait for auto-version creation

**Expected Results**:
- Auto-version created after 10 changes
- Version marked as "Auto" in history
- Change counter resets

#### Test 2.2: Time-Based Auto-Versioning
1. Make changes and wait 10+ minutes
2. Make another change to trigger autosave

**Expected Results**:
- Auto-version created based on time interval
- Previous state preserved

### 3. Version History Display

#### Test 3.1: Version List Functionality
1. Open version history in any module
2. Verify version list shows:
   - Version numbers (descending order)
   - Creation timestamps
   - Manual vs Auto labels
   - User information
   - Version messages

#### Test 3.2: Pagination
1. Create 10+ versions
2. Test pagination controls
3. Verify correct versions shown per page

**Expected Results**:
- Pagination works correctly
- Version count accurate
- Navigation between pages smooth

### 4. Version Comparison (Diff Viewer)

#### Test 4.1: Compare Adjacent Versions
1. Create two versions with different content
2. Click "Diff" button on newer version
3. Review diff viewer

**Expected Results**:
- Diff viewer opens with correct versions
- Changes highlighted (red for removed, green for added)
- Section-by-section comparison
- Expand/collapse functionality works

#### Test 4.2: Compare Non-Adjacent Versions
1. Create multiple versions
2. Use custom comparison (if implemented)
3. Compare versions 1 and 3

**Expected Results**:
- Correct versions compared
- All intermediate changes shown
- Summary shows total changes

### 5. Version Rollback

#### Test 5.1: Rollback in Logic Studio
1. Create version with initial code
2. Make significant changes
3. Create another version
4. Rollback to first version

**Expected Results**:
- Confirmation dialog appears
- Logic Studio state restored to version 1
- New rollback version created
- Editor content matches original version

#### Test 5.2: Rollback in Tag Manager
1. Create version with initial tag state
2. Modify filters and tags
3. Rollback to previous version

**Expected Results**:
- Tag filters restored
- Editing state restored
- UI reflects previous state

### 6. Cross-Module Integration

#### Test 6.1: State Isolation
1. Make changes in Logic Studio
2. Make changes in Tag Manager
3. Create versions from both modules

**Expected Results**:
- Each module's state saved independently
- Rollback affects only the relevant module
- No cross-contamination of state

#### Test 6.2: Project-Wide Rollback
1. Make changes across multiple modules
2. Perform rollback from Project Overview

**Expected Results**:
- All modules receive rollback event
- Each module restores its state
- Consistent project state achieved

### 7. Error Handling

#### Test 7.1: Network Failure During Version Creation
1. Block network requests in DevTools
2. Try to create a version
3. Restore network

**Expected Results**:
- Error message displayed
- Retry option available
- Version created after network restoration

#### Test 7.2: Invalid Version Data
1. Try to rollback to non-existent version
2. Try to view diff with missing version

**Expected Results**:
- Appropriate error messages
- Graceful failure handling
- No application crashes

### 8. Performance Testing

#### Test 8.1: Large Version History
1. Create 50+ versions
2. Test version history loading
3. Test pagination performance

**Expected Results**:
- History loads within 2 seconds
- Pagination responsive
- No memory leaks

#### Test 8.2: Large State Objects
1. Create version with large PLC code (>100KB)
2. Test diff viewer performance
3. Test rollback performance

**Expected Results**:
- Operations complete within 5 seconds
- UI remains responsive
- No browser freezing

### 9. API Endpoint Testing

Test the backend endpoints directly:

```bash
# Get version history
curl -X GET http://localhost:3001/projects/{projectId}/versions \
  -H "Authorization: Bearer {token}"

# Create version
curl -X POST http://localhost:3001/projects/{projectId}/versions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"state": {"test": "data"}, "message": "Test version"}'

# Get specific version
curl -X GET http://localhost:3001/projects/{projectId}/version/{versionNumber} \
  -H "Authorization: Bearer {token}"

# Rollback to version
curl -X POST http://localhost:3001/projects/{projectId}/versions/{versionNumber}/restore \
  -H "Authorization: Bearer {token}"
```

### 10. Database Verification

Check database state after operations:

```sql
-- Check version history
SELECT * FROM project_versions WHERE project_id = {projectId} ORDER BY version_number DESC;

-- Check auto-save entries
SELECT * FROM project_autosave WHERE project_id = {projectId} ORDER BY timestamp DESC;

-- Verify data integrity
SELECT version_number, LENGTH(state::text) as state_size, timestamp 
FROM project_versions 
WHERE project_id = {projectId};
```

## Success Criteria

✅ **Manual version creation works across all modules**
✅ **Auto-versioning triggers correctly based on changes and time**
✅ **Version history displays accurately with proper metadata**
✅ **Diff viewer shows changes clearly and accurately**
✅ **Rollback restores state correctly in all modules**
✅ **Cross-module integration maintains state isolation**
✅ **Error handling is graceful and informative**
✅ **Performance remains acceptable with large datasets**
✅ **API endpoints respond correctly to all operations**
✅ **Database maintains data integrity and consistency**

## Common Issues and Troubleshooting

### Issue: Versions not appearing in history
- **Check**: API endpoints are responding
- **Check**: Database permissions and table structure
- **Check**: Authentication tokens are valid

### Issue: Rollback not working
- **Check**: Event listeners are properly attached
- **Check**: Version data contains expected structure
- **Check**: Component state updates are triggered

### Issue: Diff viewer showing incorrect changes
- **Check**: Version data is being retrieved correctly
- **Check**: State comparison logic is working
- **Check**: UI rendering of differences

### Issue: Auto-versioning not triggering
- **Check**: Change counter is incrementing
- **Check**: Time interval logic is correct
- **Check**: Auto-save integration is working

## Performance Benchmarks

- **Version Creation**: < 1 second
- **Version History Load**: < 2 seconds for 100 versions
- **Diff Viewer Load**: < 3 seconds for large states
- **Rollback Operation**: < 2 seconds
- **Auto-Version Creation**: < 500ms (background operation)
