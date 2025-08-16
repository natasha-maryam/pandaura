import React, { useState } from 'react';
import { ProjectsAPI } from '../projects/api';

interface VersionControlDebugProps {
  projectId: number;
}

export default function VersionControlDebug({ projectId }: VersionControlDebugProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testGetVersionHistory = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing version history API for project:', projectId);
      const versions = await ProjectsAPI.getVersionHistory(projectId);
      console.log('Version history result:', versions);
      setResult(versions);
    } catch (err: any) {
      console.error('Version history error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testCreateVersion = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing create version API for project:', projectId);
      const versionNumber = await ProjectsAPI.createVersion(projectId, {
        state: { test: 'debug version', timestamp: Date.now() },
        message: 'Debug test version'
      });
      console.log('Create version result:', versionNumber);
      setResult({ versionNumber });
    } catch (err: any) {
      console.error('Create version error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testAutoSave = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing auto-save API for project:', projectId);
      await ProjectsAPI.createAutoSaveVersion(projectId, {
        test: 'debug auto-save',
        timestamp: Date.now()
      });
      console.log('Auto-save completed successfully');
      setResult({ success: true, message: 'Auto-save completed' });
    } catch (err: any) {
      console.error('Auto-save error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Version Control API Debug</h3>
      <p className="text-sm text-gray-600 mb-4">Project ID: {projectId}</p>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testGetVersionHistory}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mr-2"
        >
          Test Get Version History
        </button>
        
        <button
          onClick={testCreateVersion}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 mr-2"
        >
          Test Create Version
        </button>
        
        <button
          onClick={testAutoSave}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Auto-Save
        </button>
      </div>
      
      {loading && (
        <div className="text-blue-600">Loading...</div>
      )}
      
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded border">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="text-green-600 bg-green-50 p-3 rounded border">
          <strong>Result:</strong>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
