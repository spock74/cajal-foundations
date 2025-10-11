/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */
import React from 'react'; // NOSONAR
import { marked } from 'marked'; 
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import MindMapWrapper from './MindMapDisplay'; // NOSONAR
import { ChatMessage, MessageSender, OptimizedPrompt } from '../types'; // NOSONAR
import MessageActions from './MessageActions';
import OptimizedPrompts from './OptimizedPrompts';
import MessageInfoTrigger from './MessageInfoTrigger';


// Configure marked to use highlight.js for syntax highlighting
marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));

interface MessageItemProps {
  message: ChatMessage; // NOSONAR
  firestoreDocId: string; // ID do documento no Firestore
  onSendMessage?: (query: string, sourceIds: string[], actualPrompt?: string, generatedFrom?: OptimizedPrompt) => void;
  onToggleMindMap?: (firestoreDocId: string) => void;
  onMindMapLayoutChange?: (messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => void;
  onSaveToLibrary?: (message: ChatMessage) => void;
  onDeleteMessage?: (messageId: string, messageText: string) => void; // Agora será requestDeleteMessage
  showAiAvatar: boolean;
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

const SenderInfo: React.FC<{ sender: MessageSender; showAiAvatar: boolean; }> = ({ sender, showAiAvatar }) => {
  // Não renderiza nada para o usuário, para uma UI mais limpa.
  if (sender === MessageSender.USER) {
    return null;
  }
  // Se for a IA e a configuração for para não mostrar, não renderiza nada.
  if (sender === MessageSender.MODEL && !showAiAvatar) {
    return null;
  }
  // Para o modelo e sistema, renderiza apenas o avatar, sem o nome.
  return (
    <div className="flex items-center gap-2">
      <SenderAvatar sender={sender} />
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

const MessageItem: React.FC<MessageItemProps> = React.memo(({ message, firestoreDocId, onSendMessage, onToggleMindMap, onMindMapLayoutChange, onSaveToLibrary, onDeleteMessage, showAiAvatar }) => {
  const isUser = message.sender === MessageSender.USER;
  const isModel = message.sender === MessageSender.MODEL;
  const isSystem = message.sender === MessageSender.SYSTEM;

  const renderMessageContent = () => {
    // Se a mensagem do usuário foi gerada por uma sugestão, renderiza de forma especial.
    if (isUser && message.generatedFrom) {
      return (
        <>
          <p className="text-sm font-semibold text-white dark:text-gray-100 text-right">{message.generatedFrom.question_title}</p>
          <p className="text-xs text-white/80 dark:text-gray-300/80 mt-1 text-right">{message.generatedFrom.description}</p>
        </>
      );
    }
    if (isModel && !message.isLoading) {
      const proseClasses = "prose prose-sm prose-slate dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-blockquote:my-2 prose-li:my-1 prose-code:text-sm"; 
      const rawMarkup = marked.parse(message.text || "") as string;
      return <div className={proseClasses} dangerouslySetInnerHTML={{ __html: rawMarkup }} />;
    }

    if (isSystem && message.optimizedPrompts) {
      return (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{message.text}</p>
          <OptimizedPrompts prompts={message.optimizedPrompts} sourceIds={message.sourceIds || []} onSendMessage={onSendMessage} />
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
  
  let bubbleClasses = "relative p-2 md:p-3 rounded-lg shadow w-full text-xs md:text-sm ";

  if (isUser) {
    // Se for uma mensagem gerada por sugestão, usa o fundo verde, senão, o azul padrão.
    bubbleClasses += "bg-indigo-600 text-white rounded-bl-none";
  } else if (isModel) {
    bubbleClasses += `bg-white/80 dark:bg-gray-800/50 border border-black/5 dark:border-white/10 rounded-bl-none`;
  } else { // System message
    bubbleClasses += "bg-transparent text-gray-500 dark:text-gray-400 rounded-bl-none shadow-none";
  }

  return (
    <div className="flex flex-col items-start gap-2 mb-6">
      <SenderInfo sender={message.sender} showAiAvatar={showAiAvatar} />
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
              <div className="flex items-center gap-2">
                <MessageInfoTrigger item={message} />
                {message.urlContext && message.urlContext.length > 0 && (
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
                )}
              </div>
              <MessageActions
                message={message}
                firestoreDocId={firestoreDocId}
                onToggleMindMap={onToggleMindMap}
                onSaveToLibrary={onSaveToLibrary}
                onDelete={onDeleteMessage}
              />
            </div>
          )}
        </div>
        {/* CORREÇÃO: Renderiza o MindMap apenas se ele existir e estiver visível */}
        {message.mindMap?.isVisible && message.mindMap.nodes && message.mindMap.edges && (
          <MindMapWrapper
            isLoading={message.mindMap.isLoading}
            error={message.mindMap.error}
            nodes={message.mindMap.nodes}
            edges={message.mindMap.edges}
            initialExpandedNodeIds={message.mindMap.expandedNodeIds}
            initialNodePositions={message.mindMap.nodePositions}
            onLayoutSave={(layout) => onMindMapLayoutChange && onMindMapLayoutChange(firestoreDocId, layout)}
          />
        )}
      </div>
    </div>
  );
});

export default MessageItem;