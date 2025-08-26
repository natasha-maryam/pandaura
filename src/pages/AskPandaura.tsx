import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import {
  UploadCloud,
  MessageSquare,
  Plus,
  X,
  Send,
  Loader2,
  Code,
  Database,
} from "lucide-react";
import pandauraLogo from "../assets/logo.png";
import { useModuleState } from "../contexts/ModuleStateContext";
import { useNavigate, useParams } from "react-router-dom";
import { useProjectAutosave } from "../components/projects/hooks";
import AutosaveStatus from "../components/ui/AutosaveStatus";
import TypingIndicator from "../components/ui/TypingIndicator";
import { aiService } from "../services/aiService";
import { AIMessage, Conversation, AIResponse } from "../types/ai";

interface AskPandauraProps {
  sessionMode?: boolean;
}

export default function AskPandaura({ sessionMode = false }: AskPandauraProps) {
  const { getModuleState, saveModuleState } = useModuleState();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get persisted state or use defaults
  const moduleState = getModuleState('AskPandaura');
  const [chatMessage, setChatMessage] = useState(moduleState.chatMessage || "");
  const [showConversationsModal, setShowConversationsModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // AI Chat State
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Generate conversation ID
  const generateConversationId = () => {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Generate message ID
  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Create new conversation
  const createNewConversation = (firstMessage: string): Conversation => {
    const conversationId = generateConversationId();
    const title = aiService.generateConversationTitle(firstMessage);
    
    return {
      id: conversationId,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId: projectId || undefined,
    };
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!chatMessage.trim() || isLoading) return;

    const userMessage = chatMessage.trim();
    setChatMessage("");
    setError(null);
    setIsLoading(true);

    try {
      // Create new conversation if none exists
      let conversation = currentConversation;
      if (!conversation) {
        conversation = createNewConversation(userMessage);
        setCurrentConversation(conversation);
        setConversations(prev => [conversation!, ...prev]);
      }

      // Add user message
      const userMessageObj: AIMessage = {
        id: generateMessageId(),
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };

      // Update conversation with user message
      const updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, userMessageObj],
        updatedAt: new Date(),
      };
      setCurrentConversation(updatedConversation);
      setConversations(prev => 
        prev.map(conv => conv.id === conversation!.id ? updatedConversation : conv)
      );

      // Send to AI API
      const response: AIResponse = await aiService.sendMessage({
        prompt: userMessage,
        projectId: projectId || undefined,
      });

      // Create AI response message
      const aiMessage: AIMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: aiService.formatResponse(response),
        timestamp: new Date(),
        artifacts: response.artifacts,
      };

      // Update conversation with AI response
      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiMessage],
        updatedAt: new Date(),
      };
      setCurrentConversation(finalConversation);
      setConversations(prev => 
        prev.map(conv => conv.id === conversation!.id ? finalConversation : conv)
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start new conversation
  const startNewConversation = () => {
    setCurrentConversation(null);
    setChatMessage("");
    setError(null);
    setShowConversationsModal(false);
  };

  // Load existing conversation
  const loadConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setShowConversationsModal(false);
  };

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
              onClick={startNewConversation}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          
          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            <div className="p-4 space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Start a new chat to begin</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => loadConversation(conversation)}
                    className={`p-3 rounded-md hover:bg-gray-100 cursor-pointer transition-colors border border-light ${
                      currentConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="font-medium text-sm text-primary truncate">
                      {conversation.title}
                    </div>
                    <div className="text-xs text-muted mt-1 flex items-center justify-between">
                      <span>{conversation.messages.length} messages</span>
                      <span>{new Date(conversation.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="flex flex-col bg-white h-full relative">
      <div className="p-6 w-full mx-auto flex-1 pb-10">
        {/* Header */}
        <div className="flex items-center justify-end max-w-6xl mx-auto">
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

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md max-w-6xl mx-auto">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Chat Messages or Welcome Screen */}
        {currentConversation && currentConversation.messages.length > 0 ? (
          <div className="space-y-6 mt-8 scrollable-container optimized-text max-w-6xl mx-auto">
            {currentConversation.messages.map((message: any) => (
              <div key={message.id} className={`px-4 py-3 text-sm ${message.role === 'assistant' ? 'bg-gray-50' : ''}`}>
                <div className="flex items-start gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    message.role === 'user' 
                      ? 'bg-gray-300 text-gray-700' 
                      : 'bg-primary text-white'
                  }`}>
                    {message.role === 'user' ? (
                      'You'
                    ) : (
                      <img 
                        src={pandauraLogo} 
                        alt="Pandaura" 
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-800 prose prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    
                    {/* Render artifacts if present */}
                    {message.artifacts && (
                      <div className="mt-3 space-y-2">
                        {/* Code artifacts */}
                        {message.artifacts.code.length > 0 && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => navigate('/logic-studio')}
                              className="bg-primary text-white px-3 py-1 rounded text-xs hover:bg-secondary transition-colors flex items-center gap-1"
                            >
                              <Code className="w-3 h-3" />
                              Open in Logic Studio
                            </button>
                          </div>
                        )}
                        
                        {/* Table artifacts */}
                        {message.artifacts.tables.length > 0 && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => navigate('/tag-database')}
                              className="bg-white border border-light px-3 py-1 rounded text-xs hover:bg-accent-light transition-colors flex items-center gap-1"
                            >
                              <Database className="w-3 h-3" />
                              Generate Tag Database
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator with typing dots */}
            {isLoading && (
              <div className="px-4 py-3 text-sm bg-gray-50">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-white">
                    <img 
                      src={pandauraLogo} 
                      alt="Pandaura" 
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 text-gray-600">
                      <TypingIndicator />
                      <span className="text-xs">Thinking...</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      💡 Complex automation tasks may take a moment to process
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Welcome Screen */
          <div className="text-muted mt-4 px-6 flex flex-col items-center text-center max-w-6xl mx-auto">
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
            
            {/* Sample questions */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-4xl">
              <p className="col-span-full text-xs font-medium text-gray-600 mb-2 text-left">Try asking:</p>
              {[
                "Create a motor starter logic with safety interlocks",
                "Generate tag database for a conveyor system",
                "Help me with TIA Portal configuration",
                "Design SCADA screens for process monitoring"
              ].map((question, index) => (
                <button
                  key={index}
                  onClick={() => setChatMessage(question)}
                  className="text-left p-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Input */}
      <div className={`fixed bottom-0 right-0 bg-white border-t px-6 py-4 shadow-md z-30 transition-all duration-200 ${
        sidebarCollapsed ? 'left-16' : 'left-72'
      }`}>
        <div className="flex items-end gap-3 max-w-6xl mx-auto">{/* Wider max width for full use of space */}
          <textarea
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
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
              onClick={sendMessage}
              className="bg-primary text-white px-6 py-3 rounded-md hover:bg-secondary transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={!chatMessage.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {renderConversationsModal()}
    </div>
  );
}