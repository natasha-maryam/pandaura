import React, { useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  MessageCircle,
  Cpu,
  FileText,
  Database,
  Download,
  X,
} from "lucide-react";
import logo from "../assets/logo.png";
import NavbarIcons from "../pages/NavbarIcons";
import PandauraOrb from "../components/PandauraOrb";
import { useModuleState } from "../contexts/ModuleStateContext";
import { config, getHostInfo, isOffline } from "../config/environment";

const tools = [
  { name: "Pandaura AS", path: "/pandaura-as", icon: MessageCircle },
  { name: "Logic Studio", path: "/logic-studio", icon: Cpu },
  { name: "AutoDocs", path: "/autodocs", icon: FileText },
  { name: "Tag Database Manager", path: "/tag-database", icon: Database },
  { name: "Projects", path: "/projects", icon: Download },
] as const;

const toolDescriptions = {
  "Pandaura AS": [
    "Your AI co-engineer for automation, electrical, robotics, and everything in between.",
  ],
  "Logic Studio": [
    "Turn natural language into fully structured PLC code — instantly and vendor-ready.",
  ],
  "AutoDocs": [
    "Auto-generate PLC docs for end-user delivery—specs, IO lists, logic summaries, and more",
  ],
  "Tag Database Manager": [
    "Organize, edit, and maintain all your PLC tags in one centralized system.",
  ],
  "Projects": [
    "Manage and organize your automation projects, files, and collaborative workspaces.",
  ],
};

interface SharedLayoutProps {
  children: React.ReactNode;
}

export default function SharedLayout({ children }: SharedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { saveModuleState } = useModuleState();

  const getCurrentTool = () => {
    const currentPath = location.pathname;
    const tool = tools.find(t => t.path === currentPath);
    return tool?.name || "Pandaura AS";
  };

  const handleToolClick = useCallback((toolPath: string) => {
    navigate(toolPath);
  }, [navigate]);

  const handleLogoClick = useCallback(() => {
    setShowSaveModal(true);
  }, []);

  const handleSaveAndGoHome = useCallback(() => {
    // Trigger final save for current module
    const currentTool = getCurrentTool();
    console.log(`Auto-saving ${currentTool} progress...`);
    
    // Additional save logic can be added here if needed
    // The individual modules are already auto-saving via their useEffect hooks
    
    setShowSaveModal(false);
    navigate('/home');
  }, [navigate]);

  const handleGoHomeWithoutSaving = useCallback(() => {
    setShowSaveModal(false);
    navigate('/home');
  }, [navigate]);

  const renderHeader = () => {
    const hostInfo = getHostInfo();
    const offline = isOffline();
    
    return (
      <header className="flex items-center justify-between bg-surface px-6 py-4 border-b border-light shadow">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLogoClick} 
            className="hover:opacity-80 transition-opacity"
            title="Go to Home"
          >
            <img 
              src={logo} 
              alt="Pandaura Logo" 
              className="h-16 w-auto filter-none" 
              style={{ filter: 'none', imageRendering: 'crisp-edges' }}
            />
          </button>
          {config.onPremise.showStatus && (
            <div className="flex flex-col text-xs">
              <span className="text-primary font-medium">
                {config.appTitle}
              </span>
              <span className="text-muted">
                Running on {hostInfo.displayUrl}
                {offline && " (Offline Mode)"}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {offline && (
            <div className="bg-yellow-100 border border-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
              Offline Mode
            </div>
          )}
          <NavbarIcons />
        </div>
      </header>
    );
  };

  const renderSidebar = useMemo(() => (
    <div
      className={`h-full overflow-y-auto scrollbar-hide bg-gray-light border-r border-light shadow-card p-2 space-y-4 transition-all duration-200 will-change-transform ${
        sidebarOpen ? "w-72" : "w-16"
      }`}
      style={{ scrollBehavior: 'smooth' }}
    >
      <button
        className="text-secondary mb-2 focus:outline-none hover:text-primary transition-colors"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
        title="Toggle sidebar"
      >
        <Menu className="w-8 h-8" />
      </button>
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = getCurrentTool() === tool.name;
        return (
          <div key={tool.name}>
            <div
              onClick={() => handleToolClick(tool.path)}
              className={`flex items-center ${!sidebarOpen ? "justify-center" : ""} cursor-pointer py-3 rounded-md transition-colors duration-150 ${
                isActive
                  ? " text-primary shadow-sm"
                  : "hover:bg-gray hover:text-primary hover:shadow-sm"
              }`}
            >
              <Icon className="w-6 h-6 min-w-[1.5rem] min-h-[1.5rem]" />
              {sidebarOpen && <span className="text-sm font-medium ml-2">{tool.name}</span>}
            </div>
            {sidebarOpen && (
              <div className="ml-7 mt-1 space-y-1 text-xs text-muted">
                {toolDescriptions[tool.name]?.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-disabled">→</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  ), [sidebarOpen, location.pathname, handleToolClick]);

  const renderSaveModal = () => (
    showSaveModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-96 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary">Save Current Progress?</h3>
            <button
              onClick={() => setShowSaveModal(false)}
              className="text-secondary hover:text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-secondary mb-6">
            Do you want to save your current progress before returning to the Home screen?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleGoHomeWithoutSaving}
              className="px-4 py-2 border border-light rounded-md text-sm hover:bg-gray-100 transition-colors"
            >
              Don't Save
            </button>
            <button
              onClick={handleSaveAndGoHome}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-secondary transition-colors"
            >
              Save & Go Home
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="flex flex-col h-screen bg-background text-primary">
      {renderHeader()}
      <div className="flex flex-1 overflow-hidden min-w-0">
        {renderSidebar}
        <div className="flex-1 overflow-y-auto will-change-scroll" style={{ scrollBehavior: 'smooth' }}>{children}</div>
      </div>
      <PandauraOrb />
      {renderSaveModal()}
    </div>
  );
}