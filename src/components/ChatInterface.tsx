/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados. // NOSONAR
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageSender } from '../types'; 
import MessageItem from './MessageItem'; // NOSONAR
import ThemeSwitcher from './ThemeSwitcher'; // NOSONAR
import { Send, Menu, Sparkles } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

const ChatInterface: React.FC = () => {
  const {
    sourcesForActiveGroup,
    chatMessages,
    activeConversationId,
    conversations,
    sendMessage,
    optimizePrompt,
    isLoading,
    setIsSidebarOpen,
    handleGenerateMindMap,
    handleMindMapLayoutChange,
    handleSaveToLibrary,
    requestDeleteMessage,
    theme,
    setTheme,
    showAiAvatar
  } = useAppStore();

  const [userQuery, setUserQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatMessages]);

  const isInputDisabled = isLoading;

  const placeholderText = sourcesForActiveGroup.filter(s => s.selected).length > 0
    ? `Perguntar sobre as ${sourcesForActiveGroup.filter(s => s.selected).length} fontes selecionadas...`
    : "Comece uma nova conversa ou adicione fontes.";

  const conversationTitle = conversations.find(c => c.id === activeConversationId)?.name ||
    (activeConversationId === null && chatMessages.length === 0 ? "Nova Conversa" : "Navegador de Documentos");

  const handleSend = (query: string) => {
    if (query.trim() && !isSending) {
      setIsSending(true);
      const selectedSources = sourcesForActiveGroup.filter(s => s.selected);
      const history = chatMessages.filter(m => m.sender === MessageSender.USER || m.sender === MessageSender.MODEL);
      const activeModel = useAppStore.getState().activeModel;
      sendMessage(query.trim(), selectedSources, history, activeModel).finally(() => {
        setIsSending(false);
      });
      setUserQuery('');
    }
  };

  const handleOptimize = async (query: string) => {
    if (query.trim() && !isSending) {
      const selectedSources = sourcesForActiveGroup.filter(s => s.selected);
      const activeModel = useAppStore.getState().activeModel;
      await optimizePrompt(query, selectedSources, activeModel);
      setUserQuery('');
    }
  };

  return (
    // Efeito de vidro fosco para o painel de chat
    <div className="flex flex-col h-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl border border-black/5 dark:border-white/5 transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)] flex justify-between items-center">
        <div className="flex items-center gap-3">
           { (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-gray-500 dark:text-[#A8ABB4] hover:text-black dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors md:hidden"
              aria-label="Abrir base de conhecimento"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-[#E2E2E2] truncate" title={conversationTitle}>{conversationTitle}</h2>
            {placeholderText && chatMessages.filter(m => m.sender !== MessageSender.SYSTEM).length === 0 && (
               <p className="text-xs text-gray-500 dark:text-[#A8ABB4] mt-0.5 md:mt-1 max-w-full truncate" title={placeholderText}>{placeholderText}</p>
            )}
          </div>
        </div>
        <ThemeSwitcher theme={theme} setTheme={setTheme} />
      </div>

      {/* O fundo do chat agora é transparente para mostrar o gradiente principal */}
      <div className="flex-grow px-2 py-4 md:p-4 overflow-y-auto chat-container">
        <div className="max-w-4xl mx-auto w-full">
          {chatMessages.map((msg) => (
            <MessageItem 
              key={msg.id} 
              firestoreDocId={msg.id} // CORREÇÃO: Garante que o ID do Firestore seja passado corretamente.
              message={msg}
              onSendMessage={(query, sourceIds, actualPrompt, generatedFrom) => { // O parâmetro 'generatedFrom' agora é usado.
                const history = chatMessages.filter(m => m.sender === MessageSender.USER || m.sender === MessageSender.MODEL);
                const activeModel = useAppStore.getState().activeModel;
                const selectedSources = sourcesForActiveGroup.filter(s => sourceIds.includes(s.id));
                // A função sendMessage do slice é chamada aqui com os parâmetros corretos.
                sendMessage(query, selectedSources, history, activeModel, actualPrompt, generatedFrom);
              }}
              onToggleMindMap={handleGenerateMindMap}
              onMindMapLayoutChange={handleMindMapLayoutChange} 
              onSaveToLibrary={handleSaveToLibrary}
              onDeleteMessage={requestDeleteMessage}
              showAiAvatar={showAiAvatar} />
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
                handleSend(userQuery);
              }
            }}
          />
          <button
            onClick={() => handleOptimize(userQuery)}
            disabled={isInputDisabled || !userQuery.trim()}
            className="h-10 w-10 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:bg-gray-300 dark:disabled:bg-white/5 disabled:text-gray-500 dark:disabled:text-gray-600 flex items-center justify-center flex-shrink-0"
            aria-label="Otimizar prompt"
          >
            <Sparkles size={18} />
          </button>
          <button
            onClick={() => handleSend(userQuery)}
            disabled={isInputDisabled || isSending || !userQuery.trim()}
            className="h-10 w-10 p-2 bg-gray-800 hover:bg-black dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-xl transition-colors disabled:bg-gray-300 dark:disabled:bg-white/5 disabled:text-gray-500 dark:disabled:text-gray-600 flex items-center justify-center flex-shrink-0"            aria-label="Enviar mensagem"          >
            {isSending ? 
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