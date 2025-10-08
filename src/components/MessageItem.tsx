/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState, useMemo } from 'react';
import { marked } from 'marked'; 
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import MindMapWrapper from './MindMapDisplay'; // NOSONAR
import { ChatMessage, MessageSender, OptimizedPrompt } from '../types'; // NOSONAR
import { BrainCircuit, Bookmark, Copy, Check, Wand2, HelpCircle, X } from 'lucide-react'; // NOSONAR

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
  onSendMessage?: (query: string, sourceIds: string[], actualPrompt?: string) => void;
  onToggleMindMap?: (message: ChatMessage) => void;
  onMindMapLayoutChange?: (messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => void;
  onSaveToLibrary?: (message: ChatMessage) => void;
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
    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full ${bgColorClass} ${textColorClass} flex items-center justify-center text-xs md:text-sm font-semibold flex-shrink-0`}>
      {avatarChar}
    </div>
  );
};

const SenderInfo: React.FC<{ sender: MessageSender }> = ({ sender }) => {
  const name = sender === MessageSender.USER ? 'Você' : 'Assistente IA';
  return (
    <div className="flex items-center gap-2">
      <SenderAvatar sender={sender} />
      <span className="text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-300">{name}</span>
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

const SuggestionTooltip: React.FC<{ suggestion: OptimizedPrompt; onClose: () => void }> = ({ suggestion, onClose }) => (
  <div className="absolute z-20 w-80 p-3 bg-gray-800 text-white rounded-lg shadow-lg right-0 top-full mt-2 border border-white/10">
    <button onClick={onClose} className="absolute top-1.5 right-1.5 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10">
      <X size={16} />
    </button>
    <h4 className="font-bold text-sm mb-2 pr-6">{suggestion.question_title}</h4>
    <p className="text-xs mb-2 opacity-80">{suggestion.description}</p>
    <div className="mt-2 pt-2 border-t border-white/10">
      <p className="text-xs font-semibold mb-1">Prompt Completo:</p>
      <p className="text-xs font-mono bg-black/50 p-2 rounded whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
        {suggestion.prompt}
      </p>
    </div>
  </div>
);

const MessageItem: React.FC<MessageItemProps> = ({ message, onSendMessage, onToggleMindMap, onMindMapLayoutChange, onSaveToLibrary }) => {
  const isUser = message.sender === MessageSender.USER;
  const isModel = message.sender === MessageSender.MODEL;
  const isSystem = message.sender === MessageSender.SYSTEM;
  const [isCopied, setIsCopied] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // CORREÇÃO: Chamar useMemo no nível superior do componente.
  const mindMapComponent = useMemo(() => {
    // A lógica condicional agora está *dentro* do useMemo.
    if (message.mindMap?.isVisible && message.mindMap) {
      return (
        <MindMapWrapper
          isLoading={message.mindMap.isLoading}
          error={message.mindMap.error}
          nodes={message.mindMap.nodes}
          edges={message.mindMap.edges}
          initialExpandedNodeIds={message.mindMap.expandedNodeIds} // Passa o estado inicial
          initialNodePositions={message.mindMap.nodePositions} // Passa o estado inicial
          onLayoutSave={(layout) => onMindMapLayoutChange && onMindMapLayoutChange(message.id, layout)} // Renomeado para clareza
        />
      );
    }
    // Retorna null se a condição não for atendida.
    return null;
  }, [message.id, message.mindMap, onMindMapLayoutChange]);

  const renderMessageContent = () => {
    if (isModel && !message.isLoading) {
      const proseClasses = "prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-blockquote:my-2 prose-li:my-1 prose-code:text-sm"; 
      const rawMarkup = marked.parse(message.text || "") as string;
      return <div className={proseClasses} dangerouslySetInnerHTML={{ __html: rawMarkup }} />;
    }

    if (isSystem && message.optimizedPrompts) {
      return (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{message.text}</p>
          <div className="space-y-2">
            {message.optimizedPrompts.map((suggestion) => (
              <div key={suggestion.prompt} className="relative">
                <button 
                  onClick={() => onSendMessage && onSendMessage(suggestion.question_title, message.sourceIds || [], suggestion.prompt)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  <Wand2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-grow pr-6">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{suggestion.question_title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {suggestion.description}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === suggestion.prompt ? null : suggestion.prompt)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                  title="Ver detalhes da sugestão"
                >
                  <HelpCircle size={16} />
                </button>
                {activeTooltip === suggestion.prompt && (
                  <SuggestionTooltip suggestion={suggestion} onClose={() => setActiveTooltip(null)} />
                )}
              </div>
            ))}
          </div>
        </div>
      );
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

  let bubbleClasses = "p-2 md:p-3 rounded-lg shadow w-full text-xs md:text-sm ";

  if (isUser) {
    bubbleClasses += "bg-blue-600 dark:bg-blue-900/80 text-white rounded-bl-none";
  } else if (isModel) {
    bubbleClasses += `bg-white/80 dark:bg-gray-800/50 border border-black/5 dark:border-white/10 rounded-bl-none`;
  } else { // System message
    bubbleClasses += "bg-transparent text-gray-500 dark:text-gray-400 rounded-bl-none shadow-none";
  }

  return (
    <div className="flex flex-col items-start gap-2 mb-6">
      <SenderInfo sender={message.sender} />
      <div className="w-full">
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
                {onToggleMindMap && !message.mindMap?.isArchived && (
                  <button
                    onClick={() => onToggleMindMap(message)}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${message.mindMap?.isVisible ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    title="Visualizar como um Mapa Mental"
                  >
                    <BrainCircuit size={14} />
                  </button>
                )}
                {onSaveToLibrary && (
                   <button
                    onClick={() => onSaveToLibrary(message)}
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
        {/* Renderiza o componente memoizado. */}
        {mindMapComponent}
      </div>
    </div>
  );
};

export default MessageItem;