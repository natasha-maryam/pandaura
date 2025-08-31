import React, { useState } from 'react';
import { TestTube, Send, Upload, Brain, Zap, FileText, Image } from 'lucide-react';
import { aiService } from '../services/aiService';
import AIHealthCheck from '../components/ui/AIHealthCheck';
import FileUploadComponent from '../components/ui/FileUploadComponent';
import StreamingMessage from '../components/ui/StreamingMessage';
import MemoryManager from '../components/ui/MemoryManager';

export default function AITestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId] = useState(() => aiService.generateSessionId());
  
  // Streaming test states
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [streamComplete, setStreamComplete] = useState(false);
  
  // File upload test states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const addTestResult = (test: string, success: boolean, data?: any, error?: string) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    }]);
  };

  const runBasicTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Health Check
      console.log('🧪 Testing health check...');
      const health = await aiService.checkHealth();
      addTestResult('Health Check', true, health);

      // Test 2: Ping Test
      console.log('🧪 Testing ping...');
      const ping = await aiService.ping();
      addTestResult('Ping Test', true, ping);

      // Test 3: Simple Query
      console.log('🧪 Testing simple query...');
      const simpleResponse = await aiService.sendMessage({
        prompt: 'What is automation engineering?',
        sessionId,
      });
      addTestResult('Simple Query', true, simpleResponse);

      // Test 4: Memory Test - Introduction
      console.log('🧪 Testing memory - introduction...');
      const introResponse = await aiService.sendMessage({
        prompt: 'Hi, I am John Doe',
        sessionId,
      });
      addTestResult('Memory - Introduction', true, introResponse);

      // Test 5: Memory Test - Recall
      console.log('🧪 Testing memory - recall...');
      const recallResponse = await aiService.sendMessage({
        prompt: 'Who am I?',
        sessionId,
      });
      addTestResult('Memory - Recall', true, recallResponse);

      // Test 6: Test Format
      console.log('🧪 Testing format response...');
      const formatResponse = await aiService.testFormat('Create a simple motor starter logic');
      addTestResult('Format Test', true, formatResponse);

    } catch (error) {
      addTestResult('Test Suite', false, null, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  const runStreamingTest = async () => {
    setIsStreaming(true);
    setStreamContent('');
    setStreamComplete(false);

    try {
      console.log('🧪 Testing streaming...');
      
      const fullResponse = await aiService.sendStreamingMessage(
        {
          prompt: 'Tell me a detailed explanation about PLC programming with examples',
          sessionId,
          stream: true,
        },
        (chunk) => {
          if (chunk.type === 'chunk' && chunk.content) {
            setStreamContent(prev => prev + chunk.content);
          } else if (chunk.type === 'end') {
            setStreamComplete(true);
            setIsStreaming(false);
          } else if (chunk.type === 'error') {
            throw new Error(chunk.error || 'Streaming error');
          }
        }
      );

      addTestResult('Streaming Test', true, { fullResponse });
    } catch (error) {
      addTestResult('Streaming Test', false, null, error instanceof Error ? error.message : 'Unknown error');
      setIsStreaming(false);
    }
  };

  const runFileUploadTest = async () => {
    if (selectedFiles.length === 0) {
      addTestResult('File Upload Test', false, null, 'No files selected');
      return;
    }

    try {
      console.log('🧪 Testing file upload...');
      
      const images = selectedFiles.filter(file => aiService.getFileTypeCategory(file) === 'image');
      const documents = selectedFiles.filter(file => aiService.getFileTypeCategory(file) === 'document');

      if (images.length > 0) {
        const imageResponse = await aiService.uploadAndAnalyzeImages({
          prompt: 'What do you see in these images?',
          sessionId,
          images,
        });
        addTestResult('Image Upload Test', true, imageResponse);
      }

      if (documents.length > 0) {
        const docResponse = await aiService.uploadAndAnalyzeDocuments({
          prompt: 'Analyze these documents and summarize the key points',
          sessionId,
          files: documents,
        });
        addTestResult('Document Upload Test', true, docResponse);
      }

    } catch (error) {
      addTestResult('File Upload Test', false, null, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const clearMemory = async () => {
    try {
      console.log('🧪 Testing memory clear...');
      const result = await aiService.clearMemory(sessionId);
      addTestResult('Clear Memory Test', true, result);
    } catch (error) {
      addTestResult('Clear Memory Test', false, null, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TestTube className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Integration Test Suite</h1>
          </div>
          <p className="text-gray-600">
            Test all the OpenAI wrapper APIs and features to ensure everything is working correctly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Health Check */}
            <AIHealthCheck autoRefresh={true} refreshInterval={30000} />

            {/* Test Controls */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Controls</h3>
              <div className="space-y-3">
                <button
                  onClick={runBasicTests}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Run Basic Tests
                </button>

                <button
                  onClick={runStreamingTest}
                  disabled={isStreaming}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  Test Streaming
                </button>

                <button
                  onClick={runFileUploadTest}
                  disabled={selectedFiles.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Test File Upload ({selectedFiles.length} files)
                </button>

                <button
                  onClick={clearMemory}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  <Brain className="w-4 h-4" />
                  Clear Memory
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">File Upload Test</h3>
              <FileUploadComponent
                onFilesSelected={setSelectedFiles}
                maxFiles={5}
              />
            </div>

            {/* Memory Manager */}
            <MemoryManager sessionId={sessionId} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Streaming Test Display */}
            {(isStreaming || streamContent) && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Streaming Test</h3>
                <StreamingMessage
                  isStreaming={isStreaming}
                  streamContent={streamContent}
                  isComplete={streamComplete}
                />
              </div>
            )}

            {/* Test Results */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No tests run yet. Click a test button to start.
                  </p>
                ) : (
                  testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-medium ${
                          result.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.test}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          result.success 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {result.success ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      {result.error && (
                        <p className="text-red-600 text-sm mb-2">{result.error}</p>
                      )}
                      {result.data && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            View Response Data
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
