import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Zap } from 'lucide-react';
import pandauraLogo from '../../assets/logo.png';
import { WrapperAResponse, CodeArtifact } from '../../types/ai';
import { CodeArtifactViewer } from './CodeArtifactViewer';

interface StreamingMessageProps {
  isStreaming: boolean;
  streamContent: string;
  isComplete: boolean;
  onStreamComplete?: (fullResponse: string) => void;
  className?: string;
}

export default function StreamingMessage({
  isStreaming,
  streamContent,
  isComplete,
  onStreamComplete,
  className = '',
}: StreamingMessageProps) {
  const [displayContent, setDisplayContent] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [fullResponse, setFullResponse] = useState<WrapperAResponse | null>(null);

  // Update display content when streaming
  useEffect(() => {
    if (isStreaming || isComplete) {
      setDisplayContent(streamContent);
    }
  }, [streamContent, isStreaming, isComplete]);

  // Cursor blinking effect
  useEffect(() => {
    if (!isStreaming || isComplete) {
      setShowCursor(false);
      return;
    }

    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming, isComplete]);

  // Stop cursor when streaming is complete
  useEffect(() => {
    if (isComplete) {
      setShowCursor(false);
      if (onStreamComplete && streamContent) {
        onStreamComplete(streamContent);
      }
    }
  }, [isComplete, streamContent, onStreamComplete]);

  // Listen for window events that contain the full response
  useEffect(() => {
    const handleStreamComplete = (event: any) => {
      if (event.detail && event.detail.fullResponse) {
        setFullResponse(event.detail.fullResponse);
      }
    };

    window.addEventListener('streamComplete', handleStreamComplete);
    return () => window.removeEventListener('streamComplete', handleStreamComplete);
  }, []);

  if (!isStreaming && !isComplete && !displayContent) {
    return null;
  }

  return (
    <div className={`px-4 py-3 text-sm bg-gray-50 ${className}`}>
      <div className="flex items-start gap-3 mb-2">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-medium text-white">
          <img 
            src={pandauraLogo} 
            alt="Pandaura" 
            className="w-5 h-5 rounded-full object-cover"
          />
        </div>
        <div className="flex-1">
          {/* Streaming indicator */}
          {isStreaming && !isComplete && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">Streaming response</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="text-gray-800 prose prose-sm max-w-none">
            {isStreaming && displayContent ? (
              <div className="relative">
                <ReactMarkdown>{displayContent}</ReactMarkdown>
                {showCursor && (
                  <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                )}
              </div>
            ) : isStreaming && !displayContent ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing response...</span>
              </div>
            ) : isComplete && displayContent ? (
              <div className="relative">
                <ReactMarkdown>{displayContent}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing response...</span>
              </div>
            )}
          </div>

          {/* Complete indicator */}
          {isComplete && displayContent && (
            <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Response complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Code Artifacts - Show after streaming is complete */}
      {isComplete && fullResponse && fullResponse.artifacts?.code?.length > 0 && (
        <div className="mt-4 space-y-3">
          {fullResponse.artifacts.code.map((artifact, index) => (
            <CodeArtifactViewer
              key={index}
              artifact={artifact}
              onSaveToProject={() => {
                // Handle save to project
                console.log('Save to project:', artifact);
              }}
              onMoveToLogicStudio={() => {
                // Handle move to logic studio
                console.log('Move to logic studio:', artifact);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
