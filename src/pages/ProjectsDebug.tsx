import React, { useState, useEffect } from 'react';
import { Button, Card, Alert } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { ProjectsAPI } from '../components/projects/api';
import { useProjects } from '../components/projects/hooks';
import { capitalizeFirstLetter } from '../utils/textUtils';

interface DebugInfo {
  auth: {
    isAuthenticated: boolean;
    token: string | null;
    user: any;
  };
  api: {
    canConnect: boolean;
    error: string | null;
  };
  projects: {
    count: number;
    data: any[];
    error: string | null;
  };
}

export default function ProjectsDebugPage() {
  const auth = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    auth: {
      isAuthenticated: false,
      token: null,
      user: null
    },
    api: {
      canConnect: false,
      error: null
    },
    projects: {
      count: 0,
      data: [],
      error: null
    }
  });

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string>('');

  // Test project creation
  const handleCreateTestProject = async () => {
    setIsCreatingProject(true);
    setCreateProjectError('');
    
    try {
      const testProject = {
        projectName: `Test Project ${Date.now()}`,
        clientName: 'Debug Client',
        projectType: 'industrial-automation',
        targetPLCVendor: 'siemens' as const,
        description: 'This is a test project created from the debug page'
      };

      const createdProject = await ProjectsAPI.createProject(testProject);
      console.log('Created test project:', createdProject);
      
      // Refresh debug info
      await updateDebugInfo();
      
    } catch (error: any) {
      console.error('Failed to create test project:', error);
      setCreateProjectError(error.message || 'Failed to create project');
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Update debug information
  const updateDebugInfo = async () => {
    const newDebugInfo: DebugInfo = {
      auth: {
        isAuthenticated: auth.isAuthenticated,
        token: auth.token,
        user: auth.user
      },
      api: {
        canConnect: false,
        error: null
      },
      projects: {
        count: 0,
        data: [],
        error: null
      }
    };

    // Test API connection
    if (auth.isAuthenticated && auth.token) {
      try {
        const projects = await ProjectsAPI.getProjects();
        newDebugInfo.api.canConnect = true;
        newDebugInfo.projects.count = projects.length;
        newDebugInfo.projects.data = projects;
      } catch (error: any) {
        newDebugInfo.api.error = error.message;
        newDebugInfo.projects.error = error.message;
      }
    } else {
      newDebugInfo.api.error = 'Not authenticated';
      newDebugInfo.projects.error = 'Not authenticated';
    }

    setDebugInfo(newDebugInfo);
  };

  useEffect(() => {
    updateDebugInfo();
  }, [auth.isAuthenticated, auth.token]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-primary">Projects Debug Dashboard</h1>
        
        {/* Authentication Status */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${debugInfo.auth.isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>Authenticated: {debugInfo.auth.isAuthenticated ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span>User: {debugInfo.auth.user?.email || 'None'}</span>
              </div>
              <div>
                <span>Token: {debugInfo.auth.token ? 'Present' : 'Missing'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* API Connection Status */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">API Connection</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${debugInfo.api.canConnect ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>API Connection: {debugInfo.api.canConnect ? 'Working' : 'Failed'}</span>
              </div>
              {debugInfo.api.error && (
                <Alert variant="error">
                  API Error: {debugInfo.api.error}
                </Alert>
              )}
            </div>
          </div>
        </Card>

        {/* Projects Status */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Projects ({debugInfo.projects.count})</h2>
            
            {debugInfo.projects.error ? (
              <Alert variant="error">
                Projects Error: {debugInfo.projects.error}
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Projects: {debugInfo.projects.count}</span>
                  <div className="space-x-2">
                    <Button onClick={updateDebugInfo} variant="secondary" size="sm">
                      Refresh
                    </Button>
                    <Button 
                      onClick={handleCreateTestProject} 
                      disabled={!debugInfo.auth.isAuthenticated || isCreatingProject}
                    >
                      {isCreatingProject ? 'Creating...' : 'Create Test Project'}
                    </Button>
                  </div>
                </div>

                {createProjectError && (
                  <Alert variant="error">
                    Create Project Error: {createProjectError}
                  </Alert>
                )}

                {debugInfo.projects.data.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <h3 className="font-medium mb-2">Project List:</h3>
                    {debugInfo.projects.data.map((project: any, index) => (
                      <div key={project.id || index} className="border-b border-gray-200 pb-2 mb-2 last:border-b-0">
                        <div className="font-medium">{project.project_name}</div>
                        <div className="text-sm text-gray-600">
                          Client: {capitalizeFirstLetter(project.client_name || 'N/A')} | 
                          Type: {capitalizeFirstLetter(project.project_type || 'N/A')} | 
                          Vendor: {capitalizeFirstLetter(project.target_plc_vendor || 'N/A')}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created: {new Date(project.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Instructions */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <div className="space-y-2 text-sm">
              <p>1. Make sure you're logged in (authentication status should be green)</p>
              <p>2. Check that the API connection is working (should be green)</p>
              <p>3. Create a test project using the button above</p>
              <p>4. Navigate to /home/projects to see your projects</p>
              <p>5. Click on a project to view the Project Overview screen</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
