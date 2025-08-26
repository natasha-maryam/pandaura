import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Minimize2, Maximize2 } from "lucide-react";
import TypingIndicator from "./ui/TypingIndicator";
import pandauraLogo from "../assets/logo.png";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'pandaura';
  timestamp: string;
}

export default function PandauraOrb() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Pandaura AS (Mini) is your smart co-engineer. It adapts to whatever page you're on and helps with tips, training, logic guidance, and more — always context-aware, always available.",
      sender: 'pandaura',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        // Don't close when clicking the orb itself
        const orbButton = document.querySelector('[data-pandaura-orb]');
        if (orbButton && !orbButton.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);

    // Simulate AI response with typing indicator
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "I understand you're working on that. Let me help you with the PLC logic structure. Would you like me to explain the safety interlocks?",
        "That's a great question about motor control. In industrial automation, we typically use three-wire control circuits for safety. Let me walk you through it.",
        "For tag management, I recommend organizing your variables by function: Inputs (I_), Outputs (O_), and Memory (M_). This follows industry best practices.",
        "I can help you generate the structured text code for that. Which PLC vendor are you targeting - Rockwell, Siemens, or Beckhoff?",
        "Let me analyze your logic. Based on what you've described, you'll need to consider emergency stop circuits, guard door interlocks, and overload protection."
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'pandaura',
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, aiMessage]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Orb */}
      <button
        data-pandaura-orb
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
        title="Ask Pandaura AS (Mini)"
      >
        <Bot className="w-6 h-6 text-white" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatRef}
          className={`fixed bottom-24 right-6 bg-white border border-light rounded-lg shadow-xl z-50 transition-all duration-300 ${
            isMinimized ? 'w-80 h-16' : 'w-80 h-96'
          }`}
        >
          {/* Header */}
          <div className="bg-primary text-white p-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span className="text-sm font-medium">Pandaura AS (Mini)</span>
              <span className="text-xs bg-green-500 px-1 rounded">Online</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white hover:bg-opacity-20 p-1 rounded"
              >
                {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white hover:bg-opacity-20 p-1 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-64 overflow-y-auto p-3 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-2 text-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-primary'
                      }`}
                    >
                      <div>{msg.text}</div>
                      <div className={`text-xs mt-1 ${
                        msg.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-primary rounded-lg p-2 text-sm flex items-center gap-2">
                      <img 
                        src={pandauraLogo} 
                        alt="Pandaura" 
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <TypingIndicator />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-light p-3">
                <div className="flex gap-2">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about PLCs, automation, tags..."
                    className="flex-1 border border-light rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                    rows={1}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="bg-primary text-white p-2 rounded hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}