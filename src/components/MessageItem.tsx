/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ChatMessage, MessageSender } from '../types';
import { BrainCircuit, Bookmark } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
  onGenerateMindMap?: (text: string) => void;
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

const MessageItem: React.FC<MessageItemProps> = ({ message, onGenerateMindMap, onSaveToLibrary }) => {
  const isUser = message.sender === MessageSender.USER;
  const isModel = message.sender === MessageSender.MODEL;
  const isSystem = message.sender === MessageSender.SYSTEM;

  const renderMessageContent = () => {
    if (isModel) {
      return (
        <div className="prose prose-sm prose-gray dark:prose-invert w-full min-w-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {message.text}
          </ReactMarkdown>
        </div>
      );
    }
    
    let textColorClass = '';
    if (isUser) {
        textColorClass = 'text-white dark:text-white';
    } else if (isSystem) {
        textColorClass = 'text-gray-500 dark:text-[#A8ABB4]';
    }
    return <div className={`whitespace-pre-wrap text-sm ${textColorClass}`}>{message.text}</div>;
  };
  
  let bubbleClasses = "p-3 rounded-lg shadow w-full ";

  if (isUser) {
    bubbleClasses += "bg-gray-800 text-white dark:bg-white/[.12] rounded-br-none";
  } else if (isModel) {
    bubbleClasses += `bg-white dark:bg-[rgba(119,119,119,0.10)] border border-gray-100 dark:border-t dark:border-[rgba(255,255,255,0.04)] dark:backdrop-blur-lg rounded-bl-none`;
  } else { // System message
    bubbleClasses += "bg-gray-200 dark:bg-[#2C2C2C] text-gray-600 dark:text-[#A8ABB4] rounded-bl-none";
  }

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2 max-w-[85%]`}>
        {!isUser && <SenderAvatar sender={message.sender} />}
        <div className={bubbleClasses}>
          {message.isLoading && message.sender !== MessageSender.MODEL ? (
            <div className="flex items-center space-x-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${isUser ? 'bg-white' : 'bg-gray-500 dark:bg-[#A8ABB4]'}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${isUser ? 'bg-white' : 'bg-gray-500 dark:bg-[#A8ABB4]'}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isUser ? 'bg-white' : 'bg-gray-500 dark:bg-[#A8ABB4]'}`}></div>
            </div>
          ) : (
            renderMessageContent()
          )}
          
          {(isModel && !message.isLoading && message.text) && (
            <div className="mt-2.5 pt-2.5 border-t border-gray-200 dark:border-[rgba(255,255,255,0.1)] flex items-center justify-between gap-2">
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
                {onGenerateMindMap && (
                  <button
                    onClick={() => onGenerateMindMap(message.text)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#A8ABB4] hover:text-black dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-2 py-1 rounded-md transition-colors"
                    title="Visualizar como um Mapa Mental"
                  >
                    <BrainCircuit size={14} />
                  </button>
                )}
                {onSaveToLibrary && (
                   <button
                    onClick={() => onSaveToLibrary(message.text)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#A8ABB4] hover:text-black dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-2 py-1 rounded-md transition-colors"
                    title="Salvar na Biblioteca"
                  >
                    <Bookmark size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {isUser && <SenderAvatar sender={message.sender} />}
      </div>
    </div>
  );
};

export default MessageItem;