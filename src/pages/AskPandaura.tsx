import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  AlertCircle,
} from "lucide-react";
import pandauraLogo from "../assets/chatlogo.jpg";
import logo from "../assets/logo.png";
import { useModuleState } from "../contexts/ModuleStateContext";
import { WrapperAResponseViewer } from "../components/ui/WrapperAResponseViewer";
import { useNavigate, useParams } from "react-router-dom";
import { useProjectAutosave } from "../components/projects/hooks";
import AutosaveStatus from "../components/ui/AutosaveStatus";
import TypingIndicator from "../components/ui/TypingIndicator";
import MemoryManager from "../components/ui/MemoryManager";
import { aiService } from "../services/aiService";
import { AIMessage, Conversation, WrapperAResponse, WrapperBResponse, StreamChunk, WrapperType, TaskType } from "../types/ai";
import { CodeArtifactViewer } from "../components/ui/CodeArtifactViewer";
import { TableArtifactViewer } from "../components/ui/TableArtifactViewer";
import { parseMarkdownTables, removeMarkdownTables, parseCitations, removeCitations, parseProcessedFiles, removeProcessedFiles } from "../utils/markdownTableParser";

interface AskPandauraProps {
  sessionMode?: boolean;
}

export default function AskPandaura({ sessionMode = false }: AskPandauraProps) {
  const { getModuleState, saveModuleState } = useModuleState();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper function to clean message content
  const cleanMessageContent = (content: string, message?: any): string => {
    if (!content) return content;
    
    let cleanedContent = content;
    
    // Remove "Next step →" sentences and any content after it
    // Handle various formats: "Next step →", "Next step:", "Next step -"
    cleanedContent = cleanedContent
      .replace(/Next step[→:\-] .*/gi, '')
      .replace(/Next step → .*/gi, '')
      .trim();
    
    // For Wrapper B messages with backend table artifacts, remove markdown tables to avoid duplication
    if (message && 
        message.wrapperType === 'B' && 
        message.artifacts && 
        message.artifacts.tables && 
        message.artifacts.tables.length > 0) {
      cleanedContent = removeMarkdownTables(cleanedContent);
    }
    
    return cleanedContent;
  };

  // Get persisted state or use defaults
  const moduleState = getModuleState('AskPandaura');
  const [chatMessage, setChatMessage] = useState(moduleState.chatMessage || "");
  const [showConversationsModal, setShowConversationsModal] = useState(false);
  const [showMemoryManager, setShowMemoryManager] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // AI Chat State with persistence
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(
    moduleState.currentConversation || null
  );
  const [conversations, setConversations] = useState<Conversation[]>(
    moduleState.conversations || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New AI Features
  const [sessionId, setSessionId] = useState<string>(() => 
    moduleState.sessionId || aiService.generateSessionId()
  );
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [streamComplete, setStreamComplete] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Wrapper Selection State
  const [selectedWrapper, setSelectedWrapper] = useState<WrapperType>('A');
  const [showWrapperInfo, setShowWrapperInfo] = useState(false);

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

  // Persist conversations to localStorage when they change
  useEffect(() => {
    saveModuleState('AskPandaura', {
      ...getModuleState('AskPandaura'),
      conversations,
      currentConversation,
      sessionId
    });
  }, [conversations, currentConversation, sessionId, saveModuleState]);

  // Persist chat message separately with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveModuleState('AskPandaura', {
        ...getModuleState('AskPandaura'),
        chatMessage
      });
    }, 500); // 500ms debounce for chat message

    return () => clearTimeout(timeoutId);
  }, [chatMessage, saveModuleState]);

  // Load persisted conversations on component mount
  useEffect(() => {
    try {
      const persistedState = getModuleState('AskPandaura');
      console.log('Loading persisted state:', persistedState);
      
      if (persistedState.conversations && Array.isArray(persistedState.conversations)) {
        // Convert date strings back to Date objects
        const restoredConversations = persistedState.conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(restoredConversations);
        console.log('Restored conversations:', restoredConversations);
      }
      
      if (persistedState.currentConversation) {
        const restoredConversation = {
          ...persistedState.currentConversation,
          createdAt: new Date(persistedState.currentConversation.createdAt),
          updatedAt: new Date(persistedState.currentConversation.updatedAt),
          messages: persistedState.currentConversation.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        };
        setCurrentConversation(restoredConversation);
        console.log('Restored current conversation:', restoredConversation);
      }
    } catch (error) {
      console.error('Error loading persisted conversations:', error);
    }
  }, []);

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
      let response: WrapperAResponse | WrapperBResponse;
      let streamingHandled = false;
      
      if (selectedFiles.length > 0) {
        setUploadingFiles(true);
        
        if (selectedWrapper === 'B') {
          // Use Wrapper B for document analysis with streaming support
          if (streamingEnabled) {
            setIsStreaming(true);
            let finalStreamContent = '';
            
            // Add a placeholder streaming message immediately
            const streamingMessageId = generateMessageId();
            const streamingMessage: AIMessage = {
              id: streamingMessageId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
              isStreaming: true,
              wrapperType: 'B',
            };

            const conversationWithStreaming = {
              ...updatedConversation,
              messages: [...updatedConversation.messages, streamingMessage],
              updatedAt: new Date(),
            };
            setCurrentConversation(conversationWithStreaming);
            setConversations(prev => 
              prev.map(conv => conv.id === conversation!.id ? conversationWithStreaming : conv)
            );
            
            const fullResponse = await aiService.sendWrapperBStreamingMessage(
              {
                prompt: userMessage,
                projectId: projectId || undefined,
                sessionId,
                files: selectedFiles,
                stream: true,
              },
              (chunk: StreamChunk) => {
                if (chunk.type === 'status') {
                  // Show status updates for file processing
                  setCurrentConversation(prevConv => {
                    if (!prevConv) return prevConv;
                    const updatedMessages = prevConv.messages.map(msg => 
                      msg.id === streamingMessageId 
                        ? { ...msg, content: `*${chunk.content}*` }
                        : msg
                    );
                    return { ...prevConv, messages: updatedMessages };
                  });
                } else if (chunk.type === 'start') {
                  // Clear status and start streaming content
                  setCurrentConversation(prevConv => {
                    if (!prevConv) return prevConv;
                    const updatedMessages = prevConv.messages.map(msg => 
                      msg.id === streamingMessageId 
                        ? { ...msg, content: '' }
                        : msg
                    );
                    return { ...prevConv, messages: updatedMessages };
                  });
                } else if (chunk.type === 'chunk' && chunk.content) {
                  finalStreamContent += chunk.content;
                  setCurrentConversation(prevConv => {
                    if (!prevConv) return prevConv;
                    const updatedMessages = prevConv.messages.map(msg => 
                      msg.id === streamingMessageId 
                        ? { ...msg, content: finalStreamContent }
                        : msg
                    );
                    return { ...prevConv, messages: updatedMessages };
                  });
                } else if (chunk.type === 'complete' && chunk.fullResponse) {
                  // Store the complete response data for artifacts
                  finalStreamContent = chunk.answer || finalStreamContent;
                  
                  // Type guard for fullResponse
                  const fullResponse = chunk.fullResponse;
                  if (typeof fullResponse === 'object' && fullResponse !== null) {
                    setCurrentConversation(prevConv => {
                      if (!prevConv) return prevConv;
                      const updatedMessages = prevConv.messages.map(msg => 
                        msg.id === streamingMessageId 
                          ? { 
                              ...msg, 
                              content: finalStreamContent,
                              task_type: (fullResponse as any).task_type,
                              artifacts: (fullResponse as any).artifacts,
                              processedFiles: (fullResponse as any).processed_files
                            }
                          : msg
                      );
                      return { ...prevConv, messages: updatedMessages };
                    });
                    setConversations(prev => 
                      prev.map(conv => {
                        if (conv.id === conversation!.id) {
                          const updatedMessages = conv.messages.map(msg => 
                            msg.id === streamingMessageId 
                              ? { 
                                  ...msg, 
                                  content: finalStreamContent,
                                  task_type: (fullResponse as any).task_type,
                                  artifacts: (fullResponse as any).artifacts,
                                  processedFiles: (fullResponse as any).processed_files
                                }
                              : msg
                          );
                          return { ...conv, messages: updatedMessages };
                        }
                        return conv;
                      })
                    );
                  }
                } else if (chunk.type === 'end') {
                  setIsStreaming(false);
                  
                  // Mark streaming as complete
                  setCurrentConversation(prevConv => {
                    if (!prevConv) return prevConv;
                    const updatedMessages = prevConv.messages.map(msg => 
                      msg.id === streamingMessageId 
                        ? { ...msg, isStreaming: false }
                        : msg
                    );
                    return { ...prevConv, messages: updatedMessages };
                  });
                  setConversations(prev => 
                    prev.map(conv => {
                      if (conv.id === conversation!.id) {
                        const updatedMessages = conv.messages.map(msg => 
                          msg.id === streamingMessageId 
                            ? { ...msg, isStreaming: false }
                            : msg
                        );
                        return { ...conv, messages: updatedMessages };
                      }
                      return conv;
                    })
                  );
                } else if (chunk.type === 'error') {
                  throw new Error(chunk.error || 'Streaming error');
                }
              }
            );
            
            // Create response object for streaming (will be used later if needed)
            response = {
              status: 'ok' as const,
              task_type: 'doc_qa' as const,
              assumptions: [],
              answer_md: finalStreamContent,
              artifacts: { code: [], tables: [], reports: [], anchors: [], citations: [] },
              next_actions: [],
              errors: [],
            };
            
            streamingHandled = true;
          } else {
            // Non-streaming Wrapper B
          const wrapperBResponse = await aiService.analyzeDocumentsWithWrapperB({
            prompt: userMessage,
            projectId: projectId || undefined,
            sessionId,
            files: selectedFiles,
          });
          
          // Wrapper B now returns the full schema - use it directly
          response = wrapperBResponse;
          
          // Add processed files to user message for display
          if (wrapperBResponse.processed_files) {
            userMessageObj.processedFiles = wrapperBResponse.processed_files.map(f => ({
              filename: f.filename,
              type: f.type,
              size: f.size,
              extracted_data_available: f.extracted_data_available
            }));
          }
          }
          
          userMessageObj.wrapperType = 'B';
          
        } else {
          // Use Wrapper A (existing logic)
          // Separate images and documents
          const images = selectedFiles.filter(file => aiService.getFileTypeCategory(file, 'A') === 'image');
          const documents = selectedFiles.filter(file => aiService.getFileTypeCategory(file, 'A') === 'document');
          
          if (images.length > 0 && documents.length > 0) {
            // Mixed uploads - send all files together
            const formData = new FormData();
            formData.append('prompt', userMessage);
            formData.append('projectId', projectId || '');
            formData.append('sessionId', sessionId);
            
            selectedFiles.forEach(file => {
              if (aiService.getFileTypeCategory(file, 'A') === 'image') {
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
          
          userMessageObj.wrapperType = 'A';
        }
        
        setUploadingFiles(false);
        setSelectedFiles([]);
      } else {
        // Regular text message - only Wrapper A supports this (Wrapper B requires files)
        if (selectedWrapper === 'B') {
          setError("Document Analyst requires files to analyze. Please upload PLC files, documents, or images.");
          setIsLoading(false);
          return;
        }
        
        // Regular text message for Wrapper A
        if (streamingEnabled) {
          setIsStreaming(true);
          let finalStreamContent = '';
          
          // Add a placeholder streaming message immediately
          const streamingMessageId = generateMessageId();
          const streamingMessage: AIMessage = {
            id: streamingMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
          };

          const conversationWithStreaming = {
            ...updatedConversation,
            messages: [...updatedConversation.messages, streamingMessage],
            updatedAt: new Date(),
          };
          setCurrentConversation(conversationWithStreaming);
          setConversations(prev => 
            prev.map(conv => conv.id === conversation!.id ? conversationWithStreaming : conv)
          );
          
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
                  
                  // Update the streaming message in real-time
                  setCurrentConversation(prevConv => {
                    if (!prevConv) return prevConv;
                    const updatedMessages = prevConv.messages.map(msg => 
                      msg.id === streamingMessageId 
                        ? { ...msg, content: newContent || '' }
                        : msg
                    );
                    return { ...prevConv, messages: updatedMessages };
                  });
                  setConversations(prev => 
                    prev.map(conv => {
                      if (conv.id === conversation!.id) {
                        const updatedMessages = conv.messages.map(msg => 
                          msg.id === streamingMessageId 
                            ? { ...msg, content: newContent || '' }
                            : msg
                        );
                        return { ...conv, messages: updatedMessages };
                      }
                      return conv;
                    })
                  );
                  
                  return newContent;
                });
              } else if (chunk.type === 'complete' && chunk.answer) {
                // Use the complete answer from backend
                finalStreamContent = chunk.answer;
                setStreamContent(chunk.answer);
                setStreamComplete(true);
                
                // Extract artifacts from the full response if available
                let artifacts = undefined;
                let processedFiles = undefined;
                
                if (chunk.fullResponse && typeof chunk.fullResponse === 'object' && 'artifacts' in chunk.fullResponse) {
                  // Both WrapperA and WrapperB now have the same artifact structure
                  artifacts = (chunk.fullResponse as WrapperAResponse | WrapperBResponse).artifacts;
                  processedFiles = (chunk.fullResponse as WrapperBResponse).processed_files;
                } else {
                  // If no artifacts in response, try to parse tables and other data from markdown content
                  console.log("Parsing content for tables:", chunk.answer);
                  const parsedTables = parseMarkdownTables(chunk.answer);
                  const parsedCitations = parseCitations(chunk.answer);
                  const parsedFiles = parseProcessedFiles(chunk.answer);
                  
                  console.log("Parsed tables:", parsedTables);
                  console.log("Parsed citations:", parsedCitations);
                  console.log("Parsed files:", parsedFiles);
                  
                  if (parsedTables.length > 0 || parsedCitations.length > 0 || parsedFiles.length > 0) {
                    artifacts = {
                      code: [],
                      tables: parsedTables,
                      citations: parsedCitations,
                      reports: [],
                      anchors: []
                    };
                    processedFiles = parsedFiles;
                  }
                }
                
                // Clean the content by removing parsed elements to avoid duplication
                let cleanContent = chunk.answer;
                if (artifacts?.tables && artifacts.tables.length > 0) {
                  cleanContent = removeMarkdownTables(cleanContent);
                }
                if (artifacts?.citations && artifacts.citations.length > 0) {
                  cleanContent = removeCitations(cleanContent);
                }
                if (processedFiles && processedFiles.length > 0) {
                  cleanContent = removeProcessedFiles(cleanContent);
                }
                
                // Update the final message with artifacts
                setCurrentConversation(prevConv => {
                  if (!prevConv) return prevConv;
                  const updatedMessages = prevConv.messages.map(msg => 
                    msg.id === streamingMessageId 
                      ? { ...msg, content: cleanContent || '', isStreaming: false, artifacts, processedFiles }
                      : msg
                  );
                  return { ...prevConv, messages: updatedMessages };
                });
                setConversations(prev => 
                  prev.map(conv => {
                    if (conv.id === conversation!.id) {
                      const updatedMessages = conv.messages.map(msg => 
                        msg.id === streamingMessageId 
                          ? { ...msg, content: cleanContent || '', isStreaming: false, artifacts, processedFiles }
                          : msg
                      );
                      return { ...conv, messages: updatedMessages };
                    }
                    return conv;
                  })
                );
              } else if (chunk.type === 'end') {
                setStreamComplete(true);
                setIsStreaming(false);
                
                // Mark streaming as complete
                setCurrentConversation(prevConv => {
                  if (!prevConv) return prevConv;
                  const updatedMessages = prevConv.messages.map(msg => 
                    msg.id === streamingMessageId 
                      ? { ...msg, isStreaming: false }
                      : msg
                  );
                  return { ...prevConv, messages: updatedMessages };
                });
                setConversations(prev => 
                  prev.map(conv => {
                    if (conv.id === conversation!.id) {
                      const updatedMessages = conv.messages.map(msg => 
                        msg.id === streamingMessageId 
                          ? { ...msg, isStreaming: false }
                          : msg
                      );
                      return { ...conv, messages: updatedMessages };
                    }
                    return conv;
                  })
                );
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
          
          // For streaming, we already updated the message, so skip creating a new one
          streamingHandled = true;
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

      // Only create AI response message if not handled by streaming
      if (!streamingEnabled || !streamingHandled) {
        // Create AI response message
        let finalMessageContent: string;
        let artifacts: any = undefined;
        
        // Both Wrapper A and B now use the same response format
        finalMessageContent = streamingEnabled ? response.answer_md : aiService.formatResponse(response as WrapperAResponse);
        artifacts = response.artifacts;
        
        const aiMessage: AIMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: finalMessageContent,
          timestamp: new Date(),
          wrapperType: selectedWrapper,
          task_type: response.task_type, // Preserve task_type from backend
          artifacts,
        };

        // For Wrapper B, add processed files to the AI message
        if (selectedWrapper === 'B' && response.processed_files) {
          aiMessage.processedFiles = response.processed_files;
        }

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
      }

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
    
    // Clear persisted current conversation but keep conversations history
    saveModuleState('AskPandaura', {
      ...moduleState,
      currentConversation: null,
      chatMessage: "",
      sessionId: aiService.generateSessionId()
    });
  };

  // Load existing conversation
  const loadConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setShowConversationsModal(false);
  };

  // Clear all conversations
  const clearAllConversations = () => {
    setCurrentConversation(null);
    setConversations([]);
    setChatMessage("");
    setError(null);
    setSessionId(aiService.generateSessionId());
    
    // Clear from persistence
    saveModuleState('AskPandaura', {
      conversations: [],
      currentConversation: null,
      chatMessage: "",
      sessionId: aiService.generateSessionId()
    });
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
          <div className="p-4 border-b border-light space-y-2">
            <button 
              onClick={startNewConversation}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
            
            {conversations.length > 0 && (
              <button 
                onClick={clearAllConversations}
                className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Clear All Chats
              </button>
            )}
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
      {/* Main content area - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 w-full mx-auto pb-32">
          {" "}
          {/* Added bottom padding for fixed input */}
          {/* Header */}
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              {/* Session ID display */}
              {/* <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Session: {sessionId.split('_')[1]?.slice(0, 8)}...
            </div> */}

              {/* Streaming toggle */}
              <button
                onClick={() => setStreamingEnabled(!streamingEnabled)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  streamingEnabled
                    ? "bg-green-100 text-green-700 border border-green-200 w-[80px]"
                    : "bg-gray-100 text-gray-600 border border-gray-200 w-[80px]"
                }`}
                title={streamingEnabled ? "Streaming ON" : "Streaming OFF"}
              >
                <Zap className="w-3 h-3 inline mr-1" />
                {streamingEnabled ? "Stream" : "Regular"}
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
            <div className="space-y-4 mt-8 mb-8 max-w-6xl mx-auto">
              {currentConversation.messages.map((message: any) => (
                <div key={message.id} className={`px-4 py-2 text-sm `}>
                  <div className="flex gap-2">
                    {message.role === "user" ? (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 bg-gray-300 text-gray-700 mt-0.5`}
                      >You</div>
                    ) : (
                      <img
                        src={pandauraLogo}
                        alt="Pandaura"
                        className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-gray-800 prose prose-sm max-w-none">
                        {message.isStreaming && !message.content ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <TypingIndicator />
                            <span className="text-xs">Thinking...</span>
                          </div>
                        ) : message.content ? (
                          <div className="relative">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanMessageContent(message.content, message)}</ReactMarkdown>
                            {message.isStreaming && (
                              <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                            )}
                          </div>
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanMessageContent(message.content || "", message)}</ReactMarkdown>
                        )}
                      </div>

                      {/* Show completion indicator for recently completed streams */}
                      {!message.isStreaming &&
                        message.content &&
                        streamComplete &&
                        currentConversation?.messages[
                          currentConversation.messages.length - 1
                        ]?.id === message.id && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Response complete</span>
                          </div>
                        )}

                      {/* Render artifacts using WrapperAResponseViewer - single source of truth */}
                      {message.role === "assistant" && 
                       message.artifacts && 
                       (() => {
                         // Only show WrapperAResponseViewer if there are actual meaningful artifacts
                         return (
                           (message.artifacts.code && message.artifacts.code.length > 0) || 
                           (message.artifacts.tables && message.artifacts.tables.length > 0) || 
                           message.artifacts.diff ||
                           (message.artifacts.reports && message.artifacts.reports.length > 0)
                         );
                       })() && (
                        <div className="mt-4">
                          <WrapperAResponseViewer
                            response={{
                              status: "ok" as const,
                              task_type:
                                message.wrapperType === "B"
                                  ? (message.task_type || "doc_qa" as const)
                                  : ("code_gen" as const),
                              assumptions: message.artifacts.assumptions || [],
                              answer_md: "", // Content is already displayed above
                              artifacts: {
                                code: message.artifacts.code || [],
                                tables: message.artifacts.tables || [],
                                citations: message.artifacts.citations || [],
                                diff: message.artifacts.diff,
                                reports: message.artifacts.reports || [],
                                anchors: message.artifacts.anchors || [],
                              },
                              next_actions: [], // Remove next_actions to prevent "Next step" text
                              errors: message.artifacts.errors || [],
                              processed_files: message.processedFiles,
                            }}
                            onSaveToProject={() => {
                              // Handle save to project
                            }}
                            onMoveToLogicStudio={() => {
                              // Handle move to Logic Studio
                            }}
                            hideStatusAndTaskType={true}
                          />
                        </div>
                       )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator with typing dots */}
              {(isLoading || uploadingFiles) && !isStreaming && (
                <div className="px-4 py-3 text-sm bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0">
                      <img
                        src={pandauraLogo}
                        alt="Pandaura"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 text-gray-600">
                        <TypingIndicator />
                        <span className="text-xs">
                          {uploadingFiles
                            ? "Processing files..."
                            : "Thinking..."}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {uploadingFiles
                          ? "Analyzing uploaded documents"
                          : "💡 Complex automation tasks may take a moment to process"}
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
                src={logo}
                alt="Pandaura Logo"
                className="h-24 w-auto mb-4 filter-none"
                style={{ filter: "none", imageRendering: "crisp-edges" }}
              />
              <h2 className="text-lg font-semibold text-primary">
                Ask Pandaura Anything
              </h2>
              <p className="text-sm">
                Start a conversation with Pandaura or upload a document to
                begin.
              </p>

              {/* Persistence indicator */}
              {conversations.length > 0 && (
                <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border">
                  💾 {conversations.length} conversation
                  {conversations.length !== 1 ? "s" : ""} saved locally
                </div>
              )}

              {/* Sample questions */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-4xl">
                <p className="col-span-full text-xs font-medium text-gray-600 mb-2 text-left">
                  Try asking{" "}
                  {selectedWrapper === "A"
                    ? "(Code Generator)"
                    : "(Document Analyst)"}
                  :
                </p>
                {(selectedWrapper === "A"
                  ? [
                      "Create a motor starter logic with safety interlocks",
                      "Generate tag database for a conveyor system",
                    ]
                  : [
                      "Upload and analyze my PLC project files",
                      "Extract tag information from this documentation",
                      "Review this safety program for compliance",
                      "Summarize the I/O configuration from these files",
                    ]
                ).map((question, index) => (
                  <button
                    key={`${selectedWrapper}-${index}`}
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
        {/* End of scrollable area */}
      </div>

      {/* Fixed Bottom Input */}
      <div
        className={`fixed bottom-0 right-0 bg-white border-t px-6 py-4 shadow-md z-30 transition-all duration-200 ${
          sidebarCollapsed ? "left-16" : "left-72"
        }`}
      >
        {/* Selected Files Indicator */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 max-w-6xl mx-auto">
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                selectedWrapper === "A"
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-blue-50 border border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                {selectedWrapper === "A" ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700 font-medium">
                      Files not supported in Code Generator mode
                    </span>
                  </>
                ) : (
                  <>
                    {selectedFiles.some(
                      (f) =>
                        aiService.getFileTypeCategory(f, selectedWrapper) ===
                        "image"
                    ) && <Image className="w-4 h-4 text-blue-600" />}
                    {selectedFiles.some(
                      (f) =>
                        aiService.getFileTypeCategory(f, selectedWrapper) ===
                        "document"
                    ) && <FileText className="w-4 h-4 text-blue-600" />}
                    {selectedFiles.some(
                      (f) =>
                        aiService.getFileTypeCategory(f, selectedWrapper) ===
                        "plc"
                    ) && <Settings className="w-4 h-4 text-green-600" />}
                    <span className="text-sm text-blue-700 font-medium">
                      {selectedFiles.length} file
                      {selectedFiles.length > 1 ? "s" : ""} selected
                    </span>
                    <div className="text-xs text-blue-600 max-w-md truncate">
                      ({selectedFiles.map((f) => f.name).join(", ")})
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={clearSelectedFiles}
                className={`hover:opacity-80 flex items-center gap-1 text-xs ${
                  selectedWrapper === "A"
                    ? "text-amber-600 hover:text-amber-800"
                    : "text-blue-600 hover:text-blue-800"
                }`}
                title="Clear all files"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Wrapper Selection */}
        <div className="mb-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                AI Mode:
              </label>
              <div className="flex rounded-md border border-gray-300 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedWrapper("A");
                    // Clear selected files when switching to Code Generator
                    if (selectedFiles.length > 0) {
                      setSelectedFiles([]);
                    }
                  }}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    selectedWrapper === "A"
                      ? "bg-black text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Code className="w-3 h-3" />
                    Code Generator
                  </div>
                </button>
                <button
                  onClick={() => setSelectedWrapper("B")}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    selectedWrapper === "B"
                      ? "bg-black text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    Doc Analyst
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowWrapperInfo(!showWrapperInfo)}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              ℹ️ What's the difference?
            </button>
          </div>

          {/* Wrapper Info Panel */}
          {showWrapperInfo && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-blue-600 mb-1 flex items-center gap-1">
                    <Code className="w-3 h-3" />
                    Code Generator (A)
                  </h4>
                  <p className="text-gray-600 mb-2">
                    Generates PLC code, logic, and automation solutions. Best
                    for:
                  </p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Creating new PLC programs</li>
                    <li>• Logic design and optimization</li>
                    <li>• Tag databases and HMI screens</li>
                    <li>• Code review and debugging</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600 mb-1 flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    Document Analyst (B)
                  </h4>
                  <p className="text-gray-600 mb-2">
                    Analyzes PLC projects, documentation, and technical files.
                    Best for:
                  </p>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Analyzing existing PLC projects (.xml, .l5x, .st)</li>
                    <li>• Extracting information from technical docs</li>
                    <li>• Safety system analysis</li>
                    <li>• Project documentation review</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-end gap-3 max-w-6xl mx-auto">
          {/* Wider max width for full use of space */}
          <textarea
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={
              selectedWrapper === "A"
                ? selectedFiles.length > 0
                  ? "Files are not supported in Code Generator mode. Switch to Document Analyst or clear files."
                  : "Ask about PLCs, SCADA, HMI, robotics, motor control, or request code generation..."
                : selectedFiles.length > 0
                ? "Ask about the uploaded files or add additional instructions..."
                : "Upload PLC files, documents, or images for analysis..."
            }
            className="flex-1 border border-light rounded-md px-4 py-2 bg-surface shadow-sm text-sm text-primary placeholder-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all min-h-[36px] max-h-[120px]"
            rows={1}
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
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
                    // Validate file types based on selected wrapper
                    const validFiles = files.filter((file) =>
                      aiService.isFileSupported(file, selectedWrapper)
                    );
                    if (validFiles.length !== files.length) {
                      const supportedTypes =
                        selectedWrapper === "A"
                          ? "images (PNG, JPG, GIF) or documents (PDF, DOC, TXT, CSV, XLS, PPT)"
                          : "PLC files (.xml, .l5x, .st, .zip), documents (PDF, DOC, TXT, CSV), or images";
                      setError(
                        `Some files are not supported. Please use ${supportedTypes}.`
                      );
                    }
                    if (validFiles.length > 0) {
                      setSelectedFiles((prev) => [...prev, ...validFiles]);
                      setError(null);
                    }
                  }
                  // Reset input value to allow same file selection again
                  e.target.value = "";
                }}
                className="hidden"
                id="file-upload"
                disabled={
                  selectedWrapper === "A" ||
                  isLoading ||
                  isStreaming ||
                  uploadingFiles
                }
              />
              <button
                onClick={() =>
                  selectedWrapper === "B"
                    ? document.getElementById("file-upload")?.click()
                    : null
                }
                className={`border p-3 rounded-md transition-colors shadow-sm relative ${
                  selectedWrapper === "A"
                    ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                    : selectedFiles.length > 0
                    ? "bg-blue-100 border-blue-300 text-blue-600"
                    : "bg-white border-light text-primary hover:bg-accent-light"
                }`}
                title={
                  selectedWrapper === "A"
                    ? "File upload is disabled for Code Generator mode"
                    : "Upload PLC files, documents, or images"
                }
                disabled={
                  selectedWrapper === "A" ||
                  isLoading ||
                  isStreaming ||
                  uploadingFiles
                }
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
              disabled={
                (!chatMessage.trim() && selectedFiles.length === 0) ||
                isLoading ||
                isStreaming ||
                uploadingFiles
              }
            >
              {isLoading || uploadingFiles ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadingFiles ? "Processing..." : ""}
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
              <h3 className="text-lg font-semibold text-primary">
                Memory Management
              </h3>
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