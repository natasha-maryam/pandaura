import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  MessageSquare,
  Plus,
  X,
  Send,
} from "lucide-react";
import pandauraLogo from "../assets/logo.png";
import { useModuleState } from "../contexts/ModuleStateContext";
import { useNavigate, useParams } from "react-router-dom";
import { useProjectAutosave } from "../components/projects/hooks";
import AutosaveStatus from "../components/ui/AutosaveStatus";

interface AskPandauraProps {
  sessionMode?: boolean;
}

export default function AskPandaura({ sessionMode = false }: AskPandauraProps) {
  const { getModuleState, saveModuleState } = useModuleState();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  // Get persisted state or use defaults
  const moduleState = getModuleState('AskPandaura');
  const [chatMessage, setChatMessage] = useState(moduleState.chatMessage || "");
  const [showConversationsModal, setShowConversationsModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Enhanced autosave for project state (only in non-session mode)
  const currentProjectId = projectId ? parseInt(projectId) : null;
  const {
    projectState,
    updateProjectState,
    isSaving,
    lastSaved,
    saveError,
    hasUnsavedChanges,
    saveNow
  } = useProjectAutosave(currentProjectId || 0, {
    module: 'AskPandaura',
    chatMessage,
    lastActivity: new Date().toISOString()
  });

  // Update project state when chat message changes (only in non-session mode)
  useEffect(() => {
    if (!sessionMode && currentProjectId) {
      updateProjectState({
        module: 'AskPandaura',
        chatMessage,
        lastActivity: new Date().toISOString()
      });
    }
  }, [sessionMode, currentProjectId, updateProjectState, chatMessage]);

  // Detect sidebar state changes
  useEffect(() => {
    const detectSidebarState = () => {
      const sidebar = document.querySelector('[class*="w-72"], [class*="w-16"]');
      if (sidebar) {
        const isCollapsed = sidebar.classList.contains('w-16');
        setSidebarCollapsed(isCollapsed);
      }
    };

    // Initial detection with a small delay to ensure DOM is ready
    setTimeout(detectSidebarState, 100);
    
    // Listen for sidebar changes
    const observer = new MutationObserver(detectSidebarState);
    const targetNode = document.body; // Watch the whole body for changes
    observer.observe(targetNode, { 
      attributes: true, 
      attributeFilter: ['class'], 
      subtree: true 
    });

    return () => observer.disconnect();
  }, []);

  // Auto-save state changes (only in non-session mode)
  useEffect(() => {
    if (!sessionMode) {
      const timeoutId = setTimeout(() => {
        saveModuleState('AskPandaura', {
          chatMessage
        });
      }, 1000); // Auto-save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [chatMessage, sessionMode, saveModuleState]);

  const renderConversationsModal = () => (
    showConversationsModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-96 max-h-[80vh] overflow-hidden shadow-lg">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-light">
            <h3 className="text-lg font-semibold text-primary">Conversations</h3>
            <button
              onClick={() => setShowConversationsModal(false)}
              className="text-secondary hover:text-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* New Chat Button */}
          <div className="p-4 border-b border-light">
            <button 
              onClick={() => {
                setChatMessage("");
                setShowConversationsModal(false);
                // Reset conversation state here
              }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          
          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            <div className="p-4 space-y-2">
              {/* Example conversations */}
              {[
                { id: 1, title: "TIA Portal Safety IO Configuration", time: "2 hours ago" },
                { id: 2, title: "Motor Control Logic Help", time: "Yesterday" },
                { id: 3, title: "SCADA System Design", time: "3 days ago" },
                { id: 4, title: "PLC Programming Best Practices", time: "1 week ago" },
              ].map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    // Load selected conversation
                    setChatMessage("");
                    setShowConversationsModal(false);
                    console.log("Loading conversation:", chat.title);
                  }}
                  className="p-3 rounded-md hover:bg-gray-100 cursor-pointer transition-colors border border-light"
                >
                  <div className="font-medium text-sm text-primary truncate">
                    {chat.title}
                  </div>
                  <div className="text-xs text-muted mt-1">{chat.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="flex flex-col bg-white h-full relative">
      <div className="p-6 max-w-4xl mx-auto flex-1 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Pandaura AS</h1>
            <p className="text-sm text-secondary">
              Your AI co-engineer for automation, electrical, robotics, and everything in between.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Autosave Status */}
            {!sessionMode && currentProjectId && (
              <AutosaveStatus
                isSaving={isSaving}
                lastSaved={lastSaved}
                saveError={saveError}
                hasUnsavedChanges={hasUnsavedChanges}
                onManualSave={saveNow}
                className="text-xs"
              />
            )}

            {/* Conversations Icon */}
            <button
              onClick={() => setShowConversationsModal(true)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="View Conversations"
            >
              <MessageSquare className="w-6 h-6 text-primary" />
            </button>
          </div>
        </div>

        <div className="text-muted mt-4 px-6 flex flex-col items-center text-center">
          <img 
            src={pandauraLogo} 
            alt="Pandaura Logo" 
            className="h-24 w-auto mb-4 filter-none" 
            style={{ filter: 'none', imageRendering: 'crisp-edges' }}
          />
          <h2 className="text-lg font-semibold text-primary">Ask Pandaura Anything</h2>
          <p className="text-sm">
            Start a conversation with Pandaura or upload a document to begin.
          </p>
        </div>

        <div className="space-y-6 mt-8 scrollable-container optimized-text">
          <div className="px-4 py-3 text-sm">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
                You
              </div>
              <div className="flex-1">
                <p className="text-gray-800">I need to create a motor starter logic with safety interlocks for a conveyor system. Can you help me generate the structured text code for Rockwell PLC?</p>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 text-sm bg-gray-50">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-white">
                P
              </div>
              <div className="flex-1">
                <p className="text-gray-800 mb-3">I'll help you create a comprehensive motor starter logic with safety interlocks. Here's a structured approach:</p>
                
                <div className="text-gray-800 mb-3">
                  <strong>Key Components:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Emergency stop circuit with latching</li>
                    <li>Guard door safety switches</li>
                    <li>Motor overload protection</li>
                    <li>Start/stop pushbutton logic</li>
                    <li>Status indicators and fault diagnostics</li>
                  </ul>
                </div>
                
                <p className="text-gray-800">Would you like me to generate the complete ST code with these safety features included?</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 text-sm">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
                You
              </div>
              <div className="flex-1">
                <p className="text-gray-800">Yes, please generate the code and also create the tag database for all the I/O points.</p>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 text-sm bg-gray-50">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-white">
                P
              </div>
              <div className="flex-1">
                <p className="text-gray-800 mb-3">Perfect! I'll generate both the ST logic and create a comprehensive tag database. Let me switch you to Logic Studio to generate the code, and then we can use the Tag Database Manager to organize all I/O points with proper naming conventions and documentation.</p>
                
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => navigate('/logic-studio')}
                    className="bg-primary text-white px-3 py-1 rounded text-xs hover:bg-secondary transition-colors"
                  >
                    → Open in Logic Studio
                  </button>
                  <button 
                    onClick={() => navigate('/tag-database')}
                    className="bg-white border border-light px-3 py-1 rounded text-xs hover:bg-accent-light transition-colors"
                  >
                    📋 Generate Tag Database
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <div className={`fixed bottom-0 right-0 bg-white border-t px-6 py-4 shadow-md z-30 transition-all duration-200 ${
        sidebarCollapsed ? 'left-16' : 'left-72'
      }`}>
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Ask about PLCs, SCADA, HMI, robotics, motor control, or upload documents..."
            className="flex-1 border border-light rounded-md px-4 py-3 bg-surface shadow-sm text-sm text-primary placeholder-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all min-h-[44px] max-h-[120px]"
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <div className="flex gap-2">
            <button 
              onClick={() => {
                console.log("Opening file upload dialog");
                // Trigger file upload here
              }}
              className="bg-white border border-light p-3 rounded-md hover:bg-accent-light transition-colors shadow-sm"
              title="Upload documents"
            >
              <UploadCloud className="w-4 h-4 text-primary" />
            </button>
            <button 
              onClick={() => {
                if (chatMessage.trim()) {
                  console.log("Sending message:", chatMessage);
                  // Handle message sending here
                  setChatMessage("");
                }
              }}
              className="bg-primary text-white px-6 py-3 rounded-md hover:bg-secondary transition-colors text-sm font-medium shadow-sm"
              disabled={!chatMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {renderConversationsModal()}
    </div>
  );
}