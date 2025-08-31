import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, AlertTriangle } from "lucide-react";
import logo from "../assets/logo.png";

interface SessionLayoutProps {
  children: React.ReactNode;
}

export default function SessionLayout({ children }: SessionLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-background text-primary">
      {/* Session Header */}
      <header className="flex items-center justify-between bg-surface px-6 py-4 border-b border-light">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-background rounded-md transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </button>
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Pandaura Logo" 
              className="h-12 w-auto filter-none" 
              style={{ filter: 'none', imageRendering: 'crisp-edges' }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                  Quick Session
                </span>
                <span className="text-xs text-muted">One-time use</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Session Warning */}
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs text-yellow-800">Session data will not be saved</span>
          </div>
          
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>
      </header>

      {/* Session Notice */}
      <div className="bg-accent/5 border-b border-accent/20 px-6 py-3">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-accent-dark">
            <strong>Quick Session Mode:</strong> You can upload files, use all features, and export results — 
            but your session will not be saved. For persistent projects, 
            <button 
              onClick={() => navigate("/app")}
              className="underline hover:text-primary transition-colors ml-1"
            >
              start a full project workflow
            </button>.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}