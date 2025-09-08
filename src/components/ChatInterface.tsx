import { useState, useRef, useEffect } from 'react';
import {  ArrowUp, Loader2, X, Image, FileText, Settings, Copy, Check } from 'lucide-react';
import logo from "../assets/logo.png"

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  code?: string;
  featureDetected?: string;
  summary?: string;
  nextStep?: string;
  fileName?: string;
}

export default function ChatInterface() {
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change or typing indicator appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAssistantTyping]);

  // Debug typing state
  useEffect(() => {
    console.log('isAssistantTyping changed to:', isAssistantTyping);
  }, [isAssistantTyping]);

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Copy code to clipboard
  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Helper function to stop typing indicator with minimum duration
  const stopTypingIndicator = (startTime: number) => {
    const typingDuration = Date.now() - startTime;
    const minTypingDuration = 1000; // 1 second
    const remainingTime = Math.max(0, minTypingDuration - typingDuration);
    
    setTimeout(() => {
      setIsAssistantTyping(false);
      console.log('Set isAssistantTyping to false');
    }, remainingTime);
  };

  const sendMessage = async () => {
    if ((!chatMessage.trim() && selectedFiles.length === 0) || isLoading || isAssistantTyping) return;

    const userMessage: Message = {
      id: generateMessageId(),
      content: chatMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsLoading(true);
    
    // Set typing indicator with a small delay to ensure it's visible
    setTimeout(() => {
      setIsAssistantTyping(true);
      console.log('Set isAssistantTyping to true');
    }, 100);

    // Simulate file upload if files are selected
    if (selectedFiles.length > 0) {
      setUploadingFiles(true);
      // Clear files after "upload"
      setTimeout(() => {
        setUploadingFiles(false);
        setSelectedFiles([]);
      }, 1000);
    }

    // Integrate backend API using WebSocket
    try {
      const ws = new WebSocket('wss://42ba7d41ad2d.ngrok-free.app/ws/chat');
      let messageReceived = false;
      const typingStartTime = Date.now();
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        // Ensure the message content is not empty
        const messageContent = userMessage.content.trim();
        if (!messageContent) {
          console.error('Message content is empty');
          setIsLoading(false);
          setIsAssistantTyping(false);
          return;
        }
        
        const payload = { message: messageContent };
        console.log('Sending payload:', payload);
        ws.send(JSON.stringify(payload));
      };
      
      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        messageReceived = true;
        
        // Stop typing indicator with minimum duration
        stopTypingIndicator(typingStartTime);
        
        try {
          const data = JSON.parse(event.data);
          
          // Check if the message indicates an error
          if (data.type === 'error') {
            const aiMessage: Message = {
              id: generateMessageId(),
              content: `Error from server: ${data.content || 'Unknown error'}`,
              isUser: false,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
            ws.close();
            return;
          }
          
          // Handle new response format
          if (data.type === 'response' && data.content) {
            const responseContent = data.content;
            const aiMessage: Message = {
              id: generateMessageId(),
              content: responseContent.summary || 'No summary provided',
              isUser: false,
              timestamp: new Date(),
              code: responseContent.code || undefined,
              featureDetected: responseContent.feature_detected || undefined,
              summary: responseContent.summary || undefined,
              nextStep: responseContent.next_step || undefined,
              fileName: responseContent.file_name || undefined
            };
            setMessages(prev => [...prev, aiMessage]);
          } else {
            // Fallback for old format
            const aiMessage: Message = {
              id: generateMessageId(),
              content: data?.code || data?.result || data?.message || JSON.stringify(data),
              isUser: false,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
          }
          
          setIsLoading(false);
          ws.close();
        } catch (parseError) {
          console.error('Error parsing WebSocket message:', parseError);
          const aiMessage: Message = {
            id: generateMessageId(),
            content: 'Error: Failed to parse response from server',
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          setIsLoading(false);
          stopTypingIndicator(typingStartTime);
          ws.close();
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        stopTypingIndicator(typingStartTime);
        const aiMessage: Message = {
          id: generateMessageId(),
          content: 'Error: WebSocket connection failed',
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        stopTypingIndicator(typingStartTime);
        
        // Only show error if we didn't receive a message and it's not a normal closure
        if (!messageReceived && event.code !== 1000) {
          const aiMessage: Message = {
            id: generateMessageId(),
            content: `Error: Connection closed unexpectedly (Code: ${event.code}). ${event.reason || 'No reason provided'}`,
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
        }
        setIsLoading(false);
      };

      // Set a timeout for the connection
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING || (ws.readyState === WebSocket.OPEN && !messageReceived)) {
          ws.close();
          stopTypingIndicator(typingStartTime);
          const aiMessage: Message = {
            id: generateMessageId(),
            content: 'Error: Connection timeout - no response received within 30 seconds',
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          setIsLoading(false);
        }
      }, 30000); // 30 second timeout

    } catch (error) {
      let errorMsg = 'Failed to fetch response';
      if (error && typeof error === 'object') {
        const err = error as any;
        if ('message' in err) {
          errorMsg = err.message;
        } else if (err.response && err.response.data) {
          errorMsg = JSON.stringify(err.response.data);
        }
      }
      const aiMessage: Message = {
        id: generateMessageId(),
        content: 'Error: ' + errorMsg,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      setIsAssistantTyping(false);
    }
  };

  // Handle files selected
  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  // Clear selected files
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
  };

  // Simple file type checking function
  const isFileSupported = (file: File) => {
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const plcTypes = ['.xml', '.l5x', '.st', '.zip'];
    const hasPlcExtension = plcTypes.some(ext => file.name.toLowerCase().endsWith(ext));
    return [...imageTypes, ...documentTypes].includes(file.type) || hasPlcExtension;
  };

  // Get file type category for display
  const getFileTypeCategory = (file: File) => {
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    const plcTypes = ['.xml', '.l5x', '.st', '.zip'];
    
    if (imageTypes.includes(file.type)) return 'image';
    if (plcTypes.some(ext => file.name.toLowerCase().endsWith(ext))) return 'plc';
    return 'document';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
        {messages.length === 0 ? (
          // Welcome Screen
          <div className="text-muted mt-4 px-6 flex flex-col items-center text-center mx-auto">
            <img
              src={logo}
              alt="Pandaura Logo"
              className="h-24 w-auto mb-4 filter-none"
              style={{ filter: "none", imageRendering: "crisp-edges" }}
            />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-primary">
                Ask Pandaura Anything
              </h1>
              <p className="text-sm">
                Start a conversation with Pandaura or upload a document to
                begin.
              </p>
            </div>

            {/* Sample questions */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-7xl">
              <p className="col-span-full text-xs font-medium text-gray-600 mb-2 text-left">
                Try asking:
              </p>
              {[
                "Upload and analyze my PLC project files",
                "Extract tag information from this documentation",
                "Review this safety program for compliance",
                "Summarize the I/O configuration from these files",
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
        ) : (
          // Messages
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`p-4 rounded-lg ${
                    message.isUser
                      ? "bg-black text-white max-w-[35%] w-fit"
                      : "bg-gray-100 text-gray-900 w-4/5"
                  }`}
                >
                  {/* Display summary/explanation */}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Display code block if feature_detected is 'code' and code exists */}
                  {message.featureDetected === 'code' && message.code && (
                    <div className="mt-3">
                      <div className="relative bg-gray-50 border border-gray-300 rounded-lg p-4">
                        <button
                          onClick={() => copyToClipboard(message.code || '', message.id)}
                          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs transition-colors text-gray-700"
                          title="Copy code"
                        >
                          {copiedMessageId === message.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                        <div className="overflow-x-auto pr-16">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                            <code>{message.code}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Display next step if available and feature is code */}
                  {message.nextStep && message.featureDetected === 'code' && (
                    <div className="mt-3 text-sm text-gray-700">
                      {message.nextStep}?
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isAssistantTyping && (
              <div className="flex justify-start">
                <div className="max-w-3xl p-4 rounded-lg bg-gray-100 text-gray-900">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
              
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className=" bg-white p-6">
        {/* Selected Files Indicator */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 max-w-[94%] mx-auto">
            <div className="flex items-center gap-2 rounded-md px-3 py-2 bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 flex-1">
                {selectedFiles.some(
                  (f) => getFileTypeCategory(f) === "image"
                ) && <Image className="w-4 h-4 text-blue-600" />}
                {selectedFiles.some(
                  (f) => getFileTypeCategory(f) === "document"
                ) && <FileText className="w-4 h-4 text-blue-600" />}
                {selectedFiles.some(
                  (f) => getFileTypeCategory(f) === "plc"
                ) && <Settings className="w-4 h-4 text-green-600" />}
                <span className="text-sm text-blue-700 font-medium">
                  {selectedFiles.length} file
                  {selectedFiles.length > 1 ? "s" : ""} selected
                </span>
                <div className="text-xs text-blue-600 max-w-md truncate">
                  ({selectedFiles.map((f) => f.name).join(", ")})
                </div>
              </div>
              <button
                onClick={clearSelectedFiles}
                className="hover:opacity-80 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                title="Clear all files"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="max-w-[94%] mx-auto">
          <div className="relative bg-surface shadow-sm">
            
            {/* Hidden file input */}
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.xml,.l5x,.st,.zip"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  // Validate file types
                  const validFiles = files.filter((file) =>
                    isFileSupported(file)
                  );
                  if (validFiles.length !== files.length) {
                    const supportedTypes = "PLC files (.xml, .l5x, .st, .zip), documents (PDF, DOC, TXT, CSV), or images";
                    alert(
                      `Some files are not supported. Please use ${supportedTypes}.`
                    );
                  }
                  if (validFiles.length > 0) {
                    handleFilesSelected(validFiles);
                  }
                }
                // Reset input value to allow same file selection again
                e.target.value = "";
              }}
              className="hidden"
              id="file-upload"
              disabled={
                isLoading ||
                isAssistantTyping ||
                uploadingFiles
              }
            />

            {/* Plus button inside textarea on the left */}
            <button
              onClick={() => document.getElementById("file-upload")?.click()}
              className={`absolute left-3 bottom-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                selectedFiles.length > 0
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title="Upload PLC files, documents, or images"
              disabled={
                isLoading ||
                isAssistantTyping ||
                uploadingFiles
              }
            >
              {selectedFiles.length > 0 ? (
                <span className="text-xs font-medium">{selectedFiles.length}</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>

            {/* Textarea */}
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
                selectedFiles.length > 0
                  ? "Ask about the uploaded files or add additional instructions..."
                  : "Ask anything"
              }
              className="w-full bg-transparent rounded-full pl-14 pr-14 py-3 shadow-md text-sm text-gray-900 placeholder-gray-500 resize-none outline-none border border-gray-300 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all duration-200 min-h-[48px] max-h-[120px]"
              rows={1}
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />

            {/* Send button */}
            {(chatMessage.trim() || selectedFiles.length > 0) && (
              <button
                onClick={sendMessage}
                className="absolute right-3 bottom-3 w-9 h-9 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  (!chatMessage.trim() && selectedFiles.length === 0) ||
                  isLoading ||
                  isAssistantTyping ||
                  uploadingFiles
                }
              >
                {isLoading || isAssistantTyping || uploadingFiles ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-6 h-6" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
