import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../lib/api';
import { Send, Bot, User, Activity, CornerDownRight } from 'lucide-react';

// Define a type for our chat messages, which can be extended from a base Message type if available
interface ChatMessage {
  _id?: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp?: string;
}

interface AIChatSidebarProps {
  patientId: string | null;
  patientName: string | null;
}

export function AIChatSidebar({ patientId, patientName }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (patientId) {
      fetchHistory();
    } else {
      setMessages([]); // Clear messages if no patient is selected
    }
  }, [patientId]);

  const fetchHistory = async () => {
    if (!patientId) return;
    setIsLoading(true);
    try {
      const history = await apiClient.ai.getChatHistory(patientId);
      // The backend returns a list of messages that might not match ChatMessage type exactly
      // We need to map them. Assuming the sender and content fields are compatible.
      const formattedHistory = history.map(h => ({ sender: h.sender, content: h.content, _id: h._id, timestamp: h.created_at } as ChatMessage));
      setMessages(formattedHistory);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      setMessages([]); // Clear on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !patientId) return;

    const userMessage: ChatMessage = { sender: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.ai.chat(patientId, currentInput);
      const aiMessage: ChatMessage = { sender: 'ai', content: response.response };
      setMessages(prev => [...prev, aiMessage]);
      // We can optionally refetch history to get server-generated fields like timestamps
      // fetchHistory();
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = { sender: 'ai', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const suggestedPrompts = [
    "Summarize today’s logs",
    "Any missed doses?",
    "Show mood trends for the past week",
    "Generate caregiver advice"
  ];

  if (!patientId) {
    return (
      <div className="w-full md:w-1/3 max-w-md bg-gray-50 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-center h-full">
        <Bot className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-800">AI Assistant</h3>
        <p className="text-gray-600 mt-2">Please select a patient from the list to view their details and interact with the AI assistant.</p>
      </div>
    );
  }

  return (
    <div className="w-full md:w-1/3 max-w-md bg-white rounded-2xl shadow-lg flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
        <p className="text-sm text-gray-600">Conversation with AI for <span className="font-semibold">{patientName || 'patient'}</span></p>
      </div>

      <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'ai' && <Bot className="h-6 w-6 text-blue-600 flex-shrink-0" />}
              <div className={`px-4 py-2 rounded-2xl max-w-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                <p className="text-sm">{msg.content}</p>
              </div>
              {msg.sender === 'user' && <User className="h-6 w-6 text-gray-400 flex-shrink-0" />}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <Bot className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div className="px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-2 flex flex-wrap gap-2">
            {suggestedPrompts.map(prompt => (
                <button
                    key={prompt}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs hover:bg-blue-200 transition-colors"
                >
                    {prompt}
                </button>
            ))}
        </div>
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI assistant..."
            className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
