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
  Settings,
  Zap,
  Image,
  FileText,
  Brain,
} from "lucide-react";
import pandauraLogo from "../assets/logo.png";
import { useModuleState } from "../contexts/ModuleStateContext";
import { useNavigate, useParams } from "react-router-dom";
import { useProjectAutosave } from "../components/projects/hooks";
import AutosaveStatus from "../components/ui/AutosaveStatus";
import TypingIndicator from "../components/ui/TypingIndicator";
import StreamingMessage from "../components/ui/StreamingMessage";
import MemoryManager from "../components/ui/MemoryManager";
import { aiService } from "../services/aiService";
import { AIMessage, Conversation, WrapperAResponse, StreamChunk } from "../types/ai";

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
  const [showMemoryManager, setShowMemoryManager] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // AI Chat State
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New AI Features
  const [sessionId, setSessionId] = useState<string>(() => aiService.generateSessionId());
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [streamComplete, setStreamComplete] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

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
    if ((!chatMessage.trim() && selectedFiles.length === 0) || isLoading || isStreaming) return;

    const userMessage = chatMessage.trim() || 'Analyze the uploaded files';
    setChatMessage("");
    setError(null);
    setIsLoading(true);
    setStreamContent('');
    setStreamComplete(false);

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

      // Handle file uploads
      let response: WrapperAResponse;
      
      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        
        // Separate images and documents
        const images = selectedFiles.filter(file => aiService.getFileTypeCategory(file) === 'image');
        const documents = selectedFiles.filter(file => aiService.getFileTypeCategory(file) === 'document');
        
        if (images.length > 0 && documents.length > 0) {
          // Mixed uploads - send all files together
          const formData = new FormData();
          formData.append('prompt', userMessage);
          formData.append('projectId', projectId || '');
          formData.append('sessionId', sessionId);
          
          selectedFiles.forEach(file => {
            if (aiService.getFileTypeCategory(file) === 'image') {
              formData.append('image', file);
            } else {
              formData.append('document', file);
            }
          });

          const uploadResponse = await fetch(`${aiService['baseUrl']}/wrapperA`, {
            method: 'POST',
            body: formData,
          });
          response = await uploadResponse.json();
        } else if (images.length > 0) {
          // Only images
          response = await aiService.uploadAndAnalyzeImages({
            prompt: userMessage,
            projectId: projectId || undefined,
            sessionId,
            images,
          });
        } else {
          // Only documents
          response = await aiService.uploadAndAnalyzeDocuments({
            prompt: userMessage,
            projectId: projectId || undefined,
            sessionId,
            files: documents,
          });
        }
        
        setUploadingFiles(false);
        setSelectedFiles([]);
      } else {
        // Regular text message
        if (streamingEnabled) {
          setIsStreaming(true);
          let finalStreamContent = '';
          
          const fullResponse = await aiService.sendStreamingMessage(
            {
              prompt: userMessage,
              projectId: projectId || undefined,
              sessionId,
              stream: true,
            },
            (chunk: StreamChunk) => {
              if (chunk.type === 'chunk' && chunk.content) {
                setStreamContent(prev => {
                  const newContent = prev + chunk.content;
                  finalStreamContent = newContent; // Keep track of final content
                  return newContent;
                });
              } else if (chunk.type === 'complete' && chunk.answer) {
                // Use the complete answer from backend
                finalStreamContent = chunk.answer;
                setStreamContent(chunk.answer);
                setStreamComplete(true);
              } else if (chunk.type === 'end') {
                setStreamComplete(true);
                setIsStreaming(false);
              } else if (chunk.type === 'error') {
                throw new Error(chunk.error || 'Streaming error');
              }
            }
          );
          
          // Use final streamed content or fallback to fullResponse
          const finalContent = finalStreamContent || fullResponse;
          
          // Create response object for streaming
          response = {
            status: 'ok' as const,
            task_type: 'qna' as const,
            assumptions: [],
            answer_md: finalContent,
            artifacts: { code: [], tables: [], citations: [] },
            next_actions: [],
            errors: [],
          };
        } else {
          // Non-streaming request
          response = await aiService.sendMessage({
            prompt: userMessage,
            projectId: projectId || undefined,
            sessionId,
            stream: false,
          });
        }
      }

      // Create AI response message
      const finalMessageContent = streamingEnabled ? response.answer_md : aiService.formatResponse(response);
      const aiMessage: AIMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: finalMessageContent,
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

      // Clear streaming state only after message is saved
      if (streamingEnabled) {
        setStreamContent('');
        setStreamComplete(false);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Error sending message:', err);
      // Clear streaming state on error
      setStreamContent('');
      setStreamComplete(false);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setUploadingFiles(false);
      // Don't clear streaming state here - it's handled in success path or error path
    }
  };

  // Start new conversation
  const startNewConversation = () => {
    setCurrentConversation(null);
    setChatMessage("");
    setError(null);
    setShowConversationsModal(false);
    setSessionId(aiService.generateSessionId()); // Generate new session ID
  };

  // Load existing conversation
  const loadConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setShowConversationsModal(false);
  };

  // Handle memory cleared
  const handleMemoryCleared = () => {
    setShowMemoryManager(false);
    // Optionally start a new conversation
    startNewConversation();
  };

  // Handle files selected
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  // Clear selected files
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
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
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            {/* Session ID display */}
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Session: {sessionId.split('_')[1]?.slice(0, 8)}...
            </div>
            
            {/* Streaming toggle */}
            <button
              onClick={() => setStreamingEnabled(!streamingEnabled)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                streamingEnabled 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
              title={streamingEnabled ? 'Streaming ON' : 'Streaming OFF'}
            >
              <Zap className="w-3 h-3 inline mr-1" />
              {streamingEnabled ? 'Stream' : 'Regular'}
            </button>
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

            {/* Memory Manager */}
            <button
              onClick={() => setShowMemoryManager(true)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Memory Management"
            >
              <Brain className="w-5 h-5 text-primary" />
            </button>

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
            {(isLoading || uploadingFiles) && !isStreaming && (
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
                      <span className="text-xs">
                        {uploadingFiles ? 'Processing files...' : 'Thinking...'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {uploadingFiles 
                        ? '� Analyzing uploaded documents and images'
                        : '�💡 Complex automation tasks may take a moment to process'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Streaming Message */}
            {isStreaming && (
              <StreamingMessage
                isStreaming={isStreaming}
                streamContent={streamContent}
                isComplete={streamComplete}
                onStreamComplete={(fullResponse) => {
                  setStreamContent(fullResponse);
                  setStreamComplete(true);
                }}
              />
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
        {/* Selected Files Indicator */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 max-w-6xl mx-auto">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
              <div className="flex items-center gap-2 flex-1">
                {selectedFiles.some(f => aiService.getFileTypeCategory(f) === 'image') && (
                  <Image className="w-4 h-4 text-blue-600" />
                )}
                {selectedFiles.some(f => aiService.getFileTypeCategory(f) === 'document') && (
                  <FileText className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-sm text-blue-700 font-medium">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </span>
                <div className="text-xs text-blue-600 max-w-md truncate">
                  ({selectedFiles.map(f => f.name).join(', ')})
                </div>
              </div>
              <button
                onClick={clearSelectedFiles}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                title="Clear all files"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
        )}

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
            placeholder={
              selectedFiles.length > 0 
                ? "Ask about the uploaded files or add additional instructions..."
                : "Ask about PLCs, SCADA, HMI, robotics, motor control, or upload documents..."
            }
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
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    // Validate file types
                    const validFiles = files.filter(file => aiService.isFileSupported(file));
                    if (validFiles.length !== files.length) {
                      setError('Some files are not supported. Please use images (PNG, JPG, GIF) or documents (PDF, DOC, TXT, CSV, XLS, PPT).');
                    }
                    if (validFiles.length > 0) {
                      setSelectedFiles(prev => [...prev, ...validFiles]);
                      setError(null);
                    }
                  }
                  // Reset input value to allow same file selection again
                  e.target.value = '';
                }}
                className="hidden"
                id="file-upload"
                disabled={isLoading || isStreaming || uploadingFiles}
              />
              <button 
                onClick={() => document.getElementById('file-upload')?.click()}
                className={`border p-3 rounded-md transition-colors shadow-sm relative ${
                  selectedFiles.length > 0
                    ? 'bg-blue-100 border-blue-300 text-blue-600'
                    : 'bg-white border-light text-primary hover:bg-accent-light'
                }`}
                title="Upload documents or images"
                disabled={isLoading || isStreaming || uploadingFiles}
              >
                <UploadCloud className="w-4 h-4" />
                {selectedFiles.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedFiles.length}
                  </span>
                )}
              </button>
            </div>
            <button 
              onClick={sendMessage}
              className="bg-primary text-white px-6 py-3 rounded-md hover:bg-secondary transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={(!chatMessage.trim() && selectedFiles.length === 0) || isLoading || isStreaming || uploadingFiles}
            >
              {(isLoading || uploadingFiles) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadingFiles ? 'Processing...' : ''}
                </>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {renderConversationsModal()}

      {/* Memory Manager Modal */}
      {showMemoryManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px] max-h-[80vh] overflow-hidden shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-light">
              <h3 className="text-lg font-semibold text-primary">Memory Management</h3>
              <button
                onClick={() => setShowMemoryManager(false)}
                className="text-secondary hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <MemoryManager
                sessionId={sessionId}
                onSessionCleared={handleMemoryCleared}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}