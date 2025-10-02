/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageSender } from '../types'; 
import MessageItem from './MessageItem';
import ThemeSwitcher from './ThemeSwitcher';
import { Send, Menu } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  conversationTitle: string;
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  placeholderText?: string;
  onToggleSidebar?: () => void;
  onToggleMindMap?: (messageId: string, text: string) => void;
  onSaveToLibrary?: (content: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  conversationTitle,
  onSendMessage, 
  isLoading, 
  placeholderText,
  onToggleSidebar,
  onToggleMindMap,
  onSaveToLibrary,
  theme,
  setTheme
}) => {
  const [userQuery, setUserQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (userQuery.trim() && !isLoading) {
      onSendMessage(userQuery.trim());
      setUserQuery('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg border border-gray-200 dark:border-[rgba(255,255,255,0.05)] transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)] flex justify-between items-center">
        <div className="flex items-center gap-3">
           {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-1.5 text-gray-500 dark:text-[#A8ABB4] hover:text-black dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors md:hidden"
              aria-label="Abrir base de conhecimento"
            >
              <Menu size={20} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-[#E2E2E2] truncate" title={conversationTitle}>{conversationTitle}</h2>
            {placeholderText && messages.filter(m => m.sender !== MessageSender.SYSTEM).length === 0 && (
               <p className="text-xs text-gray-500 dark:text-[#A8ABB4] mt-1 max-w-md truncate" title={placeholderText}>{placeholderText}</p>
            )}
          </div>
        </div>
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
      </div>

      <div className="flex-grow p-4 overflow-y-auto chat-container bg-gray-50 dark:bg-[#282828]">
        <div className="max-w-4xl mx-auto w-full">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} onToggleMindMap={onToggleMindMap} onSaveToLibrary={onSaveToLibrary} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[rgba(255,255,255,0.05)] bg-white dark:bg-[#1E1E1E] rounded-b-xl">
        <div className="flex items-center gap-2">
          <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={placeholderText || "Comece uma nova conversa..."}
            className="flex-grow h-8 min-h-[32px] py-1.5 px-2.5 border border-gray-300 dark:border-[rgba(255,255,255,0.1)] bg-gray-100 dark:bg-[#2C2C2C] text-gray-800 dark:text-[#E2E2E2] placeholder-gray-400 dark:placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-blue-500 dark:focus:ring-white/20 focus:border-blue-500 dark:focus:border-white/20 transition-shadow resize-none text-sm"
            rows={1}
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !userQuery.trim()}
            className="h-8 w-8 p-1.5 bg-gray-800 hover:bg-black dark:bg-white/[.12] dark:hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-gray-300 dark:disabled:bg-[#4A4A4A] disabled:text-gray-500 dark:disabled:text-[#777777] flex items-center justify-center flex-shrink-0"
            aria-label="Enviar mensagem"
          >
            {(isLoading && messages.length > 0 && messages[messages.length-1]?.isLoading && messages[messages.length-1]?.sender === MessageSender.MODEL) ? 
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> 
              : <Send size={16} />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;