import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  ArrowRight, 
  MessageCircle, 
  Cpu, 
  FileText, 
  Database, 
  Zap,
  FolderOpen
} from "lucide-react";
import logo from "../assets/logo.png";
import NavbarIcons from "./NavbarIcons";
import { Card, Button } from "../components/ui";

// Import components directly to avoid barrel export issues
import ProjectsList from "../components/projects/ProjectsList";
import ProjectOverview from "../components/projects/ProjectOverview";
import CreateProjectModal from "../components/projects/CreateProjectModal";
import DeleteProjectModal from "../components/projects/DeleteProjectModal";
import QuickToolsList from "../components/projects/QuickToolsList";

// Import types and API
import type { 
  Project, 
  NewProjectForm, 
  QuickTool
} from "../components/projects/types";
import { ProjectsAPI } from "../components/projects/api";
import { convertApiToDisplay } from "../components/projects/types";

const quickTools: QuickTool[] = [
  {
    name: "Logic Studio",
    icon: Cpu,
    path: "/tool/logic",
    description: "Turn natural language into vendor-ready PLC code instantly.",
    comingSoon: false,
  },
  {
    name: "Tag Database Manager", 
    icon: Database,
    path: "/tool/tags",
    description: "Organize and maintain all your PLC tags in one place.",
    comingSoon: false,
  },
  {
    name: "AutoDocs",
    icon: FileText,
    path: "/tool/autodocs", 
    description: "Auto-generate professional PLC documentation.",
    comingSoon: false,
  },
  {
    name: "SignalFlow",
    icon: Zap,
    path: "/tool/signalflow",
    description: "Visualize and trace signal paths through your automation system.",
    comingSoon: true,
  },
  {
    name: "Pandaura AS Assistant",
    icon: MessageCircle,
    path: "/tool/assistant",
    description: "Get instant help with automation documents, logic files, and real-time support.",
    comingSoon: false,
  },
];

// Enhanced mock project data with detailed version history
const mockProjects: Project[] = [
  { 
    id: 1,
    name: "Automation Line Upgrade", 
    client: "ACME Corp",
    vendor: "Siemens",
    type: "Migration",
    lastModified: "2 days ago", 
    description: "Migration of legacy PLCs to new hardware with safety integration.",
    status: "active",
    versions: [
      { 
        id: 15, 
        type: "Autosave", 
        user: "UserA", 
        timestamp: "2025-08-10T15:30:00Z",
        message: "Added safety interlock system for conveyor belt operations",
        changes: [
          { file: 'src/logic/main.st', type: 'modified', linesAdded: 15, linesRemoved: 8 },
          { file: 'src/tags/safety_tags.xml', type: 'added', linesAdded: 25, linesRemoved: 0 },
          { file: 'docs/safety_requirements.md', type: 'modified', linesAdded: 12, linesRemoved: 3 }
        ]
      },
      { 
        id: 14, 
        type: "Manual Save", 
        user: "UserB", 
        timestamp: "2025-08-09T17:45:00Z",
        message: "Updated HMI screens for new operator interface",
        changes: [
          { file: 'src/hmi/main_screen.xml', type: 'modified', linesAdded: 42, linesRemoved: 18 },
          { file: 'src/hmi/alarms.xml', type: 'modified', linesAdded: 8, linesRemoved: 2 }
        ]
      },
      { 
        id: 13, 
        type: "Manual Save", 
        user: "UserA", 
        timestamp: "2025-08-08T14:20:00Z",
        message: "Initial project setup and basic motor control logic",
        changes: [
          { file: 'src/logic/main.st', type: 'added', linesAdded: 156, linesRemoved: 0 },
          { file: 'src/tags/process_tags.xml', type: 'added', linesAdded: 89, linesRemoved: 0 }
        ]
      },
    ],
    recentActivity: [
      { action: "Updated Logic Studio variables", user: "UserA", timestamp: "2 hours ago", details: "Modified safety interlock logic" },
      { action: "Generated Autodocs report", user: "UserA", timestamp: "1 day ago", details: "Created safety system documentation" },
      { action: "Imported tag database", user: "UserB", timestamp: "2 days ago", details: "Imported 150 process tags from CSV" },
    ]
  },
  { 
    id: 2,
    name: "Smart Factory Build", 
    client: "BetaCo Industries",
    vendor: "Rockwell",
    type: "New Installation", 
    lastModified: "1 day ago",
    description: "New installation with integrated safety systems and IoT connectivity.",
    status: "active",
    versions: [
      { 
        id: 8, 
        type: "Manual Save", 
        user: "UserC", 
        timestamp: "2025-08-09T14:20:00Z",
        message: "Implemented IoT data collection module",
        changes: [
          { file: 'src/logic/iot_handler.st', type: 'added', linesAdded: 78, linesRemoved: 0 },
          { file: 'src/comms/ethernet_config.xml', type: 'modified', linesAdded: 15, linesRemoved: 5 }
        ]
      },
      { 
        id: 7, 
        type: "Autosave", 
        user: "UserC", 
        timestamp: "2025-08-08T16:35:00Z",
        message: "Basic production line control setup",
        changes: [
          { file: 'src/logic/production.st', type: 'added', linesAdded: 234, linesRemoved: 0 }
        ]
      },
    ],
    recentActivity: [
      { action: "Imported tag database CSV", user: "UserB", timestamp: "6 hours ago", details: "Added 89 IoT sensor tags" },
      { action: "Updated communication settings", user: "UserC", timestamp: "1 day ago", details: "Configured Ethernet/IP parameters" },
    ]
  },
  { 
    id: 3,
    name: "HVAC System Integration", 
    client: "Delta Facilities",
    vendor: "Beckhoff",
    type: "Integration",
    lastModified: "3 days ago",
    description: "Building automation system with energy monitoring capabilities.",
    status: "archived",
    versions: [
      { 
        id: 22, 
        type: "Manual Save", 
        user: "UserA", 
        timestamp: "2025-08-07T16:15:00Z",
        message: "Final system validation and documentation",
        changes: [
          { file: 'docs/commissioning_report.md', type: 'added', linesAdded: 156, linesRemoved: 0 },
          { file: 'src/logic/energy_monitor.st', type: 'modified', linesAdded: 12, linesRemoved: 8 }
        ]
      },
    ],
    recentActivity: [
      { action: "Finalized project documentation", user: "UserA", timestamp: "3 days ago", details: "Completed commissioning report" },
      { action: "System validation completed", user: "UserA", timestamp: "4 days ago", details: "All tests passed successfully" },
    ]
  },
];

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<Project | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);

  // Debug authentication state
  React.useEffect(() => {
    console.log('Home component mounted/updated');
    console.log('Authentication state:', { 
      isAuthenticated, 
      isLoading, 
      hasUser: !!user, 
      hasToken: !!token,
      currentPath: location.pathname 
    });
    
    // Debug token storage
    console.log('Token storage debug:', {
      contextToken: token ? `${token.substring(0, 10)}...` : 'none',
      localStorageToken: localStorage.getItem('authToken') ? `${localStorage.getItem('authToken')!.substring(0, 10)}...` : 'none',
      localStorageKeys: Object.keys(localStorage),
      userInfo: user ? { userId: user.userId, email: user.email } : 'none'
    });
  }, [isAuthenticated, isLoading, user, token, location.pathname]);

  // Determine current view based on URL
  const isProjectsView = location.pathname === '/home/projects';
  const isProjectOverview = location.pathname.startsWith('/home/projects/') && projectId;
  const isQuickToolsView = location.pathname === '/home/quick-tools';

  // Load selected project from API when projectId changes
  useEffect(() => {
    const loadProject = async () => {
      if (projectId && isAuthenticated && token) {
        setLoadingProject(true);
        try {
          console.log('Loading project with ID:', projectId);
          const apiProjects = await ProjectsAPI.getProjects();
          console.log('All projects from API:', apiProjects.map(p => ({ id: p.id, name: p.project_name })));
          
          const foundProject = apiProjects.find(p => p.id.toString() === projectId);
          if (foundProject) {
            console.log('Found project:', foundProject.project_name);
            setSelectedProject(convertApiToDisplay(foundProject));
          } else {
            console.warn('Project not found with ID:', projectId);
            console.log('Available project IDs:', apiProjects.map(p => p.id));
            setSelectedProject(null);
          }
        } catch (error) {
          console.error('Failed to load project:', error);
          setSelectedProject(null);
        } finally {
          setLoadingProject(false);
        }
      } else {
        console.log('Clearing selected project - projectId:', projectId, 'isAuthenticated:', isAuthenticated, 'hasToken:', !!token);
        setSelectedProject(null);
        setLoadingProject(false);
      }
    };

    loadProject();
  }, [projectId, isAuthenticated, token]);

  const handleCreateProject = (projectData: NewProjectForm) => {
    // In real app, make API call here
    console.log('Creating project:', projectData);
    // Trigger refresh of projects list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteProject = (project: Project) => {
    // This is now just a placeholder - actual deletion happens in DeleteProjectModal
    console.log('Delete confirmed for project:', project.name);
    // The modal handles the API call and triggers refresh via onSuccess callback
  };

  const handleOpenProjectOverview = (project: Project) => {
    navigate(`/home/projects/${project.id}`);
  };

  const handleOpenProjectWorkspace = (project: Project) => {    
    // Check if user is authenticated before allowing workspace access
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      // Redirect to login if not authenticated
      navigate('/signin');
      return;
    }
    
    console.log('User authenticated, navigating to workspace');
    // Navigate to project workspace with project ID
    localStorage.setItem('currentProjectId', project.id.toString());
    navigate(`/workspace/${project.id}/pandaura-as`, { state: { project } });
  };

  // Project Overview View
  if (isProjectOverview) {
    console.log('Project Overview View - Debug:', {
      projectId,
      isAuthenticated,
      isLoading,
      loadingProject,
      selectedProject: selectedProject ? selectedProject.name : 'null',
      pathname: location.pathname
    });

    // Check authentication first
    if (isLoading) {
      console.log('Auth loading, showing spinner');
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-secondary">Loading authentication...</p>
          </div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      console.log('Project overview accessed but user not authenticated, redirecting to signin');
      // Use setTimeout to ensure the redirect happens
      setTimeout(() => navigate('/signin'), 100);
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-secondary">Redirecting to sign in...</p>
          </div>
        </div>
      );
    }

    // Show loading while fetching project data
    if (loadingProject) {
      console.log('Project loading, showing spinner');
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-secondary">Loading project...</p>
          </div>
        </div>
      );
    }

    // Show error if project not found
    if (!selectedProject) {
      console.log('Project not found, showing error state');
      return (
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="flex items-center justify-between bg-surface px-6 py-4 border-b border-light shadow">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="Pandaura Logo" 
                className="h-16 w-auto filter-none" 
                style={{ filter: 'none', imageRendering: 'crisp-edges' }}
              />
            </div>
            <div className="flex items-center space-x-4">
              <NavbarIcons />
            </div>
          </header>
          
          <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 88px)' }}>
            <div className="text-center">
              <FolderOpen className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">Project not found</h3>
              <p className="text-secondary mb-4">
                The requested project (ID: {projectId}) could not be found or you don't have access to it.
              </p>
              <Button onClick={() => navigate('/home/projects')}>
                Back to Projects
              </Button>
            </div>
          </div>
        </div>
      );
    }

    console.log('Rendering project overview for:', selectedProject.name);
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="flex items-center justify-between bg-surface px-6 py-4 border-b border-light shadow">
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Pandaura Logo" 
              className="h-16 w-auto filter-none" 
              style={{ filter: 'none', imageRendering: 'crisp-edges' }}
            />
          </div>
          <div className="flex items-center space-x-4">
            <NavbarIcons />
          </div>
        </header>

        <ProjectOverview
          project={selectedProject}
          onBack={() => navigate('/home/projects')}
          onOpenWorkspace={handleOpenProjectWorkspace}
        />
      </div>
    );
  }

  // Projects List View
  if (isProjectsView) {
    // Check if user is authenticated before showing projects
    if (isLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-secondary">Loading authentication...</p>
          </div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      console.log('Projects view accessed but user not authenticated, redirecting to signin');
      // Use setTimeout to ensure the redirect happens
      setTimeout(() => navigate('/signin'), 100);
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-secondary">Redirecting to sign in...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="flex items-center justify-between bg-surface px-6 py-4 border-b border-light shadow">
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Pandaura Logo" 
              className="h-16 w-auto filter-none" 
              style={{ filter: 'none', imageRendering: 'crisp-edges' }}
            />
          </div>
          <div className="flex items-center space-x-4">
            <NavbarIcons />
          </div>
        </header>

        <ProjectsList
          onBack={() => navigate('/home')}
          onOpenProject={handleOpenProjectOverview}
          onDeleteProject={(project: Project) => setShowDeleteModal(project)}
          onNewProject={() => setShowNewProjectModal(true)}
          refreshTrigger={refreshTrigger}
        />

        <CreateProjectModal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          onSubmit={handleCreateProject}
          onSuccess={() => setRefreshTrigger(prev => prev + 1)}
        />

        <DeleteProjectModal
          project={showDeleteModal}
          onClose={() => setShowDeleteModal(null)}
          onConfirm={handleDeleteProject}
          onSuccess={() => setRefreshTrigger(prev => prev + 1)}
        />
      </div>
    );
  }

  // Quick Tools View
  if (isQuickToolsView) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="flex items-center justify-between bg-surface px-6 py-4 border-b border-light shadow">
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Pandaura Logo" 
              className="h-16 w-auto filter-none" 
              style={{ filter: 'none', imageRendering: 'crisp-edges' }}
            />
          </div>
          <div className="flex items-center space-x-4">
            <NavbarIcons />
          </div>
        </header>

        <QuickToolsList
          tools={quickTools}
          onBack={() => navigate('/home')}
        />
      </div>
    );
  }

  // Home View - Default Landing Page
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between bg-surface px-6 py-4 border-b border-light shadow">
        <div className="flex items-center gap-3">
          <img 
            src={logo} 
            alt="Pandaura Logo" 
            className="h-16 w-auto filter-none" 
            style={{ filter: 'none', imageRendering: 'crisp-edges' }}
          />
        </div>
        <div className="flex items-center space-x-4">
          <NavbarIcons />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Welcome to Pandaura AS
          </h2>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Your complete industrial automation suite. Choose how you want to work today.
          </p>
        </div>

        {/* Main Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Full Project Workflow */}
          <Card variant="elevated" icon={FolderOpen} title="Projects" subtitle="Manage your automation projects with full history and collaboration." className="text-center">
            <div>
              <div className="mb-6">
                <p className="text-xs text-secondary bg-background rounded-md p-3 border border-light">
                  Access all modules with persistent project history, version control, and team collaboration features.
                </p>
              </div>

              <Button
                onClick={() => navigate('/home/projects')}
                className="w-full py-4"
                icon={ArrowRight}
                iconPosition="right"
                size="lg"
              >
                Browse Projects
              </Button>
            </div>
          </Card>

          {/* Quick Tools */}
          <Card variant="elevated" icon={Zap} title="Quick Tools" subtitle="Single-use sessions for quick tasks and testing." className="text-center">
            <div>
              <div className="mb-6">
                <p className="text-xs text-secondary bg-background rounded-md p-3 border border-light">
                  These tools are available for one-time use. You can upload files, use all features, 
                  and export results — but your session will not be saved.
                </p>
              </div>

              <Button
                onClick={() => navigate('/home/quick-tools')}
                className="w-full py-4"
                variant="outline"
                icon={ArrowRight}
                iconPosition="right"
                size="lg"
              >
                Launch Quick Tools
              </Button>
            </div>
          </Card>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center mb-8">
          <div className="h-px bg-light flex-1"></div>
          <span className="px-4 text-sm text-muted">Pandaura Labs</span>
          <div className="h-px bg-light flex-1"></div>
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm text-muted space-x-6">
          <span>© 2025</span>
          <button 
            onClick={() => navigate("/feedback")}
            className="hover:text-primary transition-colors"
          >
            Support
          </button>
          <button 
            onClick={() => navigate("/terms")}
            className="hover:text-primary transition-colors"
          >
            Terms
          </button>
          <button 
            onClick={() => navigate("/privacy")}
            className="hover:text-primary transition-colors"
          >
            Privacy
          </button>
        </div>
      </div>
    </div>
  );
}