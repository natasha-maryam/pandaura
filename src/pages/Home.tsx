import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  MessageCircle, 
  Cpu, 
  FileText, 
  Database, 
  Zap,
  Clock,
  FolderOpen
} from "lucide-react";
import logo from "../assets/logo.png";
import NavbarIcons from "./NavbarIcons";
import { Card, Button } from "../components/ui";

const quickTools = [
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

// Mock recent projects data
const recentProjects = [
  { name: "Water Treatment Plant", lastModified: "2 hours ago", vendor: "Rockwell" },
  { name: "Packaging Line Control", lastModified: "1 day ago", vendor: "Siemens" },
  { name: "HVAC System Integration", lastModified: "3 days ago", vendor: "Beckhoff" },
];

export default function Home() {
  const navigate = useNavigate();

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
          <Card variant="elevated" icon={FolderOpen} title="Start Full Project Workflow" subtitle="Access all modules with persistent history, tagging, and AI memory." className="text-center">
            <div>
            
            {/* Recent Projects */}
            {recentProjects.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-secondary mb-3">Recent Projects</h4>
                <div className="space-y-2">
                  {recentProjects.map((project, index) => (
                    <button
                      key={index}
                      onClick={() => navigate("/app")}
                      className="w-full text-left p-3 bg-background rounded-md border border-light hover:border-accent hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-primary">{project.name}</p>
                          <p className="text-xs text-muted">{project.vendor} • {project.lastModified}</p>
                        </div>
                        <Clock className="w-4 h-4 text-muted" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => navigate("/app")}
              className="w-full py-4"
              icon={ArrowRight}
              iconPosition="right"
              size="lg"
            >
              Start Full Project Workflow
            </Button>
            </div>
          </Card>

          {/* Quick Tools */}
          <Card variant="elevated" icon={Zap} title="Quick Tools" subtitle="Single-use sessions for quick tasks and testing." className="text-center">
            <div className="mb-6">
              <p className="text-xs text-secondary bg-background rounded-md p-3 border border-light">
                These tools are available for one-time use. You can upload files, use all features, 
                and export results — but your session will not be saved.
              </p>
            </div>

            <div className="grid gap-3">
              {quickTools.map((tool) => (
                <button
                  key={tool.name}
                  onClick={() => !tool.comingSoon && navigate(tool.path)}
                  disabled={tool.comingSoon}
                  className={`flex items-center gap-3 p-4 bg-background rounded-md border border-light transition-all text-left relative ${
                    tool.comingSoon 
                      ? 'opacity-75 cursor-not-allowed' 
                      : 'hover:border-accent hover:shadow-sm'
                  }`}
                >
                  <tool.icon className="w-5 h-5 text-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-primary">{tool.name}</h4>
                      {tool.comingSoon && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200 whitespace-nowrap">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">{tool.description}</p>
                  </div>
                  {!tool.comingSoon && <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center mb-8">
          <div className="h-px bg-light flex-1"></div>
          <span className="px-4 text-sm text-muted">OR</span>
          <div className="h-px bg-light flex-1"></div>
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm text-muted space-x-6">
          <span>Pandaura Labs © 2025</span>
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