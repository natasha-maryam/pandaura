import { useState, useRef, useEffect } from 'react';
import {  ArrowUp, Loader2, Code, Brain, X, AlertCircle, Image, FileText, Settings } from 'lucide-react';
import logo from "../assets/logo.png"

type WrapperType = 'A' | 'B';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatInterface() {
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWrapper, setSelectedWrapper] = useState<WrapperType>('A');
  const [showWrapperInfo, setShowWrapperInfo] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const sendMessage = async () => {
    if ((!chatMessage.trim() && selectedFiles.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      content: chatMessage.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsLoading(true);

    // Simulate file upload if files are selected
    if (selectedFiles.length > 0) {
      setUploadingFiles(true);
      // Clear files after "upload"
      setTimeout(() => {
        setUploadingFiles(false);
        setSelectedFiles([]);
      }, 1000);
    }

    // Simulate AI response (in a real app, this would call an API)
    setTimeout(() => {
      const aiMessage: Message = {
        id: generateMessageId(),
        content: `I received your message: "${userMessage.content}". This is a demo response. In the full application, this would connect to the Pandaura AI service.`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
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
  const isFileSupported = (file: File, wrapper: WrapperType) => {
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
    
    if (wrapper === 'A') {
      return [...imageTypes, ...documentTypes].includes(file.type);
    } else {
      // Document Analyst mode supports more file types
      const plcTypes = ['.xml', '.l5x', '.st', '.zip'];
      const hasPlcExtension = plcTypes.some(ext => file.name.toLowerCase().endsWith(ext));
      return [...imageTypes, ...documentTypes].includes(file.type) || hasPlcExtension;
    }
  };

  // Get file type category for display
  const getFileTypeCategory = (file: File, _wrapper: WrapperType) => {
    const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    const plcTypes = ['.xml', '.l5x', '.st', '.zip'];
    
    if (imageTypes.includes(file.type)) return 'image';
    if (plcTypes.some(ext => file.name.toLowerCase().endsWith(ext))) return 'plc';
    return 'document';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                  className={`max-w-3xl p-4 rounded-lg ${
                    message.isUser
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`text-xs mt-2 ${
                      message.isUser ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-3xl p-4 rounded-lg bg-gray-100 text-gray-900">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* AI Mode Selector */}
      <div className="border-t bg-white p-3">
        <div className="max-w-[94%] mx-auto">
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
                    <li>• Compliance reviews</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-6">
        {/* Selected Files Indicator */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 max-w-[94%] mx-auto">
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
                      (f) => getFileTypeCategory(f, selectedWrapper) === "image"
                    ) && <Image className="w-4 h-4 text-blue-600" />}
                    {selectedFiles.some(
                      (f) => getFileTypeCategory(f, selectedWrapper) === "document"
                    ) && <FileText className="w-4 h-4 text-blue-600" />}
                    {selectedFiles.some(
                      (f) => getFileTypeCategory(f, selectedWrapper) === "plc"
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
                  // Validate file types based on selected wrapper
                  const validFiles = files.filter((file) =>
                    isFileSupported(file, selectedWrapper)
                  );
                  if (validFiles.length !== files.length) {
                    const supportedTypes =
                      selectedWrapper === "A"
                        ? "images (PNG, JPG, GIF) or documents (PDF, DOC, TXT, CSV, XLS, PPT)"
                        : "PLC files (.xml, .l5x, .st, .zip), documents (PDF, DOC, TXT, CSV), or images";
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
                selectedWrapper === "A" ||
                isLoading ||
                uploadingFiles
              }
            />

            {/* Plus button inside textarea on the left */}
            <button
              onClick={() =>
                selectedWrapper === "B"
                  ? document.getElementById("file-upload")?.click()
                  : null
              }
              className={`absolute left-3 bottom-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                selectedWrapper === "A"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : selectedFiles.length > 0
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title={
                selectedWrapper === "A"
                  ? "File upload is disabled for Code Generator mode"
                  : "Upload PLC files, documents, or images"
              }
              disabled={
                selectedWrapper === "A" ||
                isLoading ||
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
                selectedWrapper === "A"
                  ? selectedFiles.length > 0
                    ? "Files are not supported in Code Generator mode. Switch to Document Analyst or clear files."
                    : "Ask about PLCs, SCADA, HMI, robotics, motor control, or request code generation..."
                  : selectedFiles.length > 0
                  ? "Ask about the uploaded files or add additional instructions..."
                  : "Upload PLC files, documents, or images for analysis..."
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
                  uploadingFiles
                }
              >
                {isLoading || uploadingFiles ? (
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
