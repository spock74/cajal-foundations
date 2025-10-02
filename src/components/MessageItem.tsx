/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState } from 'react';
import { marked } from 'marked';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import MindMapWrapper from './MindMapDisplay';
import { ChatMessage, MessageSender } from '../types';
import { BrainCircuit, Bookmark, Copy, Check } from 'lucide-react';

// Configure marked to use highlight.js for syntax highlighting
marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));

interface MessageItemProps {
  message: ChatMessage;
  onToggleMindMap?: (messageId: string, text: string) => void;
  onMindMapLayoutChange?: (messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => void;
  onSaveToLibrary?: (content: string) => void;
}

const SenderAvatar: React.FC<{ sender: MessageSender }> = ({ sender }) => {
  let avatarChar = '';
  let bgColorClass = '';
  let textColorClass = '';

  if (sender === MessageSender.USER) {
    avatarChar = 'U';
    bgColorClass = 'bg-gray-800 dark:bg-white/[.12]';
    textColorClass = 'text-white';
  } else if (sender === MessageSender.MODEL) {
    avatarChar = 'IA';
    bgColorClass = 'bg-gray-500 dark:bg-[#777777]'; 
    textColorClass = 'text-white dark:text-[#E2E2E2]';
  } else { // SYSTEM
    avatarChar = 'S';
    bgColorClass = 'bg-gray-400 dark:bg-[#4A4A4A]';
    textColorClass = 'text-white dark:text-[#E2E2E2]';
  }

  return (
    <div className={`w-8 h-8 rounded-full ${bgColorClass} ${textColorClass} flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
      {avatarChar}
    </div>
  );
};

const getStatusText = (status: string | undefined): string => {
  if (!status) return 'DESCONHECIDO';
  const cleanStatus = status.replace('URL_RETRIEVAL_STATUS_', '');
  switch(cleanStatus) {
    case 'SUCCESS': return 'SUCESSO';
    case 'NOT_FOUND': return 'NÃO ENCONTRADO';
    case 'UNSPECIFIED': return 'NÃO ESPECIFICADO';
    default: return cleanStatus;
  }
};

const MessageItem: React.FC<MessageItemProps> = ({ message, onToggleMindMap, onMindMapLayoutChange, onSaveToLibrary }) => {
  const isUser = message.sender === MessageSender.USER;
  const isModel = message.sender === MessageSender.MODEL;
  const isSystem = message.sender === MessageSender.SYSTEM;
  const [isCopied, setIsCopied] = useState(false);

  const renderMessageContent = () => {
    if (isModel && !message.isLoading) {
      const proseClasses = "prose prose-sm prose-gray dark:prose-invert w-full min-w-0"; 
      const rawMarkup = marked.parse(message.text || "") as string;
      return <div className={proseClasses} dangerouslySetInnerHTML={{ __html: rawMarkup }} />;
    }
    
    let textColorClass = '';
    if (isUser) {
        textColorClass = 'text-white dark:text-white';
    } else if (isSystem) {
        textColorClass = 'text-gray-500 dark:text-[#A8ABB4]';
    } else { // Model loading
        textColorClass = 'text-gray-800 dark:text-[#E2E2E2]';
    }
    return <div className={`whitespace-pre-wrap text-sm ${textColorClass}`}>{message.text}</div>;
  };
  
  const handleCopy = () => {
    if (isCopied) return;
    navigator.clipboard.writeText(message.text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // O estado de "copiado" dura 2 segundos
    }).catch(err => {
      console.error('Falha ao copiar texto para a área de transferência:', err);
    });
  };

  let bubbleClasses = "p-3 rounded-lg shadow w-full ";

  if (isUser) {
    bubbleClasses += "bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-br-none";
  } else if (isModel) {
    bubbleClasses += `bg-white/80 dark:bg-gray-800/50 border border-black/5 dark:border-white/10 rounded-bl-none`;
  } else { // System message
    bubbleClasses += "bg-transparent text-gray-500 dark:text-gray-400 rounded-bl-none shadow-none";
  }

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col items-start gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && <SenderAvatar sender={message.sender} />}
        <div className={bubbleClasses}>
          {message.isLoading ? (
            <div className="flex items-center space-x-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${isUser ? 'bg-white' : 'bg-gray-500 dark:bg-[#A8ABB4]'}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${isUser ? 'bg-white' : 'bg-gray-500 dark:bg-[#A8ABB4]'}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isUser ? 'bg-white' : 'bg-gray-500 dark:bg-[#A8ABB4]'}`}></div>
            </div>
          ) : (
            renderMessageContent()
          )}
          
          {(isModel && !message.isLoading && message.text) && (
            <div className="mt-2.5 pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
              {message.urlContext && message.urlContext.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-[#A8ABB4] mb-1">URLs de Contexto Recuperadas:</h4>
                  <ul className="space-y-0.5">
                    {message.urlContext.map((meta, index) => {
                      const statusText = getStatusText(meta.urlRetrievalStatus);
                      const isSuccess = meta.urlRetrievalStatus === 'URL_RETRIEVAL_STATUS_SUCCESS';

                      return (
                        <li key={index} className="text-[11px] text-gray-500 dark:text-[#A8ABB4]">
                          <a href={meta.retrievedUrl} target="_blank" rel="noopener noreferrer" className="hover:underline break-all text-blue-600 dark:text-[#79B8FF]">
                            {meta.retrievedUrl}
                          </a>
                          <span className={`ml-1.5 px-1 py-0.5 rounded-sm text-[9px] ${
                            isSuccess
                              ? 'bg-gray-800 text-white dark:bg-white/[.12] dark:text-white'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400'
                          }`}>
                            {statusText}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : <div className="flex-1" />}
              <div className="flex items-center gap-1 self-end flex-shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors bg-transparent text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
                  title="Copiar para a área de transferência"
                >
                  {isCopied 
                    ? <Check size={14} className="text-green-500" /> 
                    : <Copy size={14} />}
                </button>
                {onToggleMindMap && (
                  <button
                    onClick={() => onToggleMindMap(message.id, message.text)}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${message.mindMap?.isVisible ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    title="Visualizar como um Mapa Mental"
                  >
                    <BrainCircuit size={14} />
                  </button>
                )}
                {onSaveToLibrary && (
                   <button
                    onClick={() => onSaveToLibrary(message.text)}
                    className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors bg-transparent text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
                    title="Salvar na Biblioteca"
                  >
                    <Bookmark size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {message.mindMap?.isVisible && (
          <MindMapWrapper
            isLoading={message.mindMap.isLoading}
            error={message.mindMap.error}
            nodes={message.mindMap.nodes}
            edges={message.mindMap.edges}
            expandedNodeIds={message.mindMap.expandedNodeIds}
            nodePositions={message.mindMap.nodePositions}
            onLayoutChange={(layout) => onMindMapLayoutChange && onMindMapLayoutChange(message.id, layout)}
          />
        )}
        {isUser && <SenderAvatar sender={message.sender} />}
      </div>
    </div>
  );
};

export default MessageItem;