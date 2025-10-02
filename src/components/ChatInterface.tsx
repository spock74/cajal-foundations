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
  onMindMapLayoutChange?: (messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => void;
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
  onMindMapLayoutChange,
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
    // Efeito de vidro fosco para o painel de chat
    <div className="flex flex-col h-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl border border-black/5 dark:border-white/5 transition-colors duration-200">
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

      {/* O fundo do chat agora é transparente para mostrar o gradiente principal */}
      <div className="flex-grow p-4 overflow-y-auto chat-container">
        <div className="max-w-4xl mx-auto w-full">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} onToggleMindMap={onToggleMindMap} onMindMapLayoutChange={onMindMapLayoutChange} onSaveToLibrary={onSaveToLibrary} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-black/5 dark:border-white/5 bg-transparent rounded-b-2xl">
        <div className="flex items-center gap-2">
          <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={placeholderText || "Comece uma nova conversa..."}
            className="flex-grow h-10 min-h-[40px] py-2 px-3 border-none bg-black/5 dark:bg-white/5 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-shadow resize-none text-sm"
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
            className="h-10 w-10 p-2 bg-gray-800 hover:bg-black dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-xl transition-colors disabled:bg-gray-300 dark:disabled:bg-white/5 disabled:text-gray-500 dark:disabled:text-gray-600 flex items-center justify-center flex-shrink-0"
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