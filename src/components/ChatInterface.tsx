/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageSender, KnowledgeSource, OptimizedPrompt } from '../types'; 
import MessageItem from './MessageItem';
import ThemeSwitcher from './ThemeSwitcher';
import { Send, Menu, Sparkles } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface ChatInterfaceProps {
  activeSources: KnowledgeSource[];
  messages: ChatMessage[];
  conversationTitle: string;
  onSendMessage: (query: string, sourceIds: string[], actualPrompt?: string) => void;
  onOptimizePrompt: (query: string, sourceIds: string[]) => void;
  isLoading: boolean;
  placeholderText?: string;
  onToggleSidebar?: () => void;
  onToggleMindMap?: (messageId: string, text: string) => void;
  onMindMapLayoutChange?: (messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => void;
  onSaveToLibrary?: (message: ChatMessage) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  activeSources,
  messages, 
  conversationTitle,
  onSendMessage, 
  onOptimizePrompt,
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
  const { conversations, activeConversationId } = useAppContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // A entrada de texto deve ser desabilitada se houver conversas mas nenhuma estiver ativa.
  const isInputDisabled = isLoading || (conversations.length > 0 && !activeConversationId);

  const handleSend = () => {
    if (userQuery.trim() && !isInputDisabled) {
      const selectedSourceIds = activeSources.filter(s => s.selected).map(s => s.id);
      onSendMessage(userQuery.trim(), selectedSourceIds);
      setUserQuery('');
    }
  };

  const handleOptimize = () => {
    if (userQuery.trim() && !isInputDisabled) {
      const selectedSourceIds = activeSources.filter(s => s.selected).map(s => s.id);
      onOptimizePrompt(userQuery.trim(), selectedSourceIds);
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
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-[#E2E2E2] truncate" title={conversationTitle}>{conversationTitle}</h2>
            {placeholderText && messages.filter(m => m.sender !== MessageSender.SYSTEM).length === 0 && (
               <p className="text-xs text-gray-500 dark:text-[#A8ABB4] mt-0.5 md:mt-1 max-w-full truncate" title={placeholderText}>{placeholderText}</p>
            )}
          </div>
        </div>
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
      </div>

      {/* O fundo do chat agora é transparente para mostrar o gradiente principal */}
      <div className="flex-grow px-2 py-4 md:p-4 overflow-y-auto chat-container">
        <div className="max-w-4xl mx-auto w-full">
          {messages.map((msg) => (
            <MessageItem 
              key={msg.id} 
              message={msg} 
              onSendMessage={onSendMessage} // Passando onSendMessage para o MessageItem
              onToggleMindMap={onToggleMindMap} 
              onMindMapLayoutChange={onMindMapLayoutChange} onSaveToLibrary={onSaveToLibrary} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="px-2 py-3 md:p-4 border-t border-black/5 dark:border-white/5 bg-transparent rounded-b-2xl">
        <div className="flex items-center gap-2">
           <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={placeholderText || "Sua pergunta..."}
            className="flex-grow h-10 min-h-[40px] py-2 px-3 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-shadow resize-none text-sm"
            rows={1}
            disabled={isInputDisabled}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleOptimize}
            disabled={isInputDisabled || !userQuery.trim()}
            className="h-10 w-10 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:bg-gray-300 dark:disabled:bg-white/5 disabled:text-gray-500 dark:disabled:text-gray-600 flex items-center justify-center flex-shrink-0"
            aria-label="Otimizar prompt"
          >
            <Sparkles size={18} />
          </button>
          <button
            onClick={handleSend}
            disabled={isInputDisabled || !userQuery.trim()}
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