/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { marked } from 'marked';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import { ChatMessage, MessageSender } from '../types';
import { BrainCircuit, Bookmark } from 'lucide-react';

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
  onGenerateMindMap?: (text: string) => void;
  onSaveToLibrary?: (content: string) => void;
}

const SenderAvatar: React.FC<{ sender: MessageSender }> = ({ sender }) => {
  let avatarChar = '';
  let bgColorClass = '';
  let textColorClass = '';

  if (sender === MessageSender.USER) {
    avatarChar = 'U';
    bgColorClass = 'bg-primary-accent';
    textColorClass = 'text-primary-accent-foreground';
  } else if (sender === MessageSender.MODEL) {
    avatarChar = 'IA';
    bgColorClass = 'bg-secondary-accent';
    textColorClass = 'text-secondary-accent-foreground';
  } else { // SYSTEM
    avatarChar = 'S';
    bgColorClass = 'bg-background-hover';
    textColorClass = 'text-foreground-muted';
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
    if (isModel && !message.isLoading) {
      // For model responses, use prose for better typography on markdown
      const proseClasses = "prose prose-sm prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-headings:text-foreground w-full min-w-0"; 
      const rawMarkup = marked.parse(message.text || "") as string;
      return <div className={proseClasses} dangerouslySetInnerHTML={{ __html: rawMarkup }} />;
    }
    
    // For user, system, and loading model messages, use simpler text rendering
    let textColorClass = '';
    if (isUser) {
        textColorClass = 'text-primary-accent-foreground';
    } else if (isSystem) {
        textColorClass = 'text-foreground-muted';
    } else { // Model loading
        textColorClass = 'text-foreground';
    }
    return <div className={`whitespace-pre-wrap text-sm ${textColorClass}`}>{message.text}</div>;
  };
  
  let bubbleClasses = "p-3 rounded-lg shadow w-full ";

  if (isUser) {
    bubbleClasses += "bg-primary-accent text-primary-accent-foreground rounded-br-none";
  } else if (isModel) {
    bubbleClasses += `bg-background-secondary border border-border rounded-bl-none`;
  } else { // System message
    bubbleClasses += "bg-background-hover text-foreground-muted rounded-bl-none";
  }

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2 max-w-[85%]`}>
        {!isUser && <SenderAvatar sender={message.sender} />}
        <div className={bubbleClasses}>
          {message.isLoading ? (
            <div className="flex items-center space-x-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${isUser ? 'bg-primary-accent-foreground' : 'bg-foreground-muted'}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${isUser ? 'bg-primary-accent-foreground' : 'bg-foreground-muted'}`}></div>
              <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isUser ? 'bg-primary-accent-foreground' : 'bg-foreground-muted'}`}></div>
            </div>
          ) : (
            renderMessageContent()
          )}
          
          {(isModel && !message.isLoading && message.text) && (
            <div className="mt-2.5 pt-2.5 border-t border-border flex items-center justify-between gap-2">
              {message.urlContext && message.urlContext.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold text-foreground-muted mb-1">URLs de Contexto Recuperadas:</h4>
                  <ul className="space-y-0.5">
                    {message.urlContext.map((meta, index) => {
                      const statusText = getStatusText(meta.urlRetrievalStatus);
                      const isSuccess = meta.urlRetrievalStatus === 'URL_RETRIEVAL_STATUS_SUCCESS';

                      return (
                        <li key={index} className="text-[11px] text-foreground-muted">
                          <a href={meta.retrievedUrl} target="_blank" rel="noopener noreferrer" className="hover:underline break-all text-primary-accent">
                            {meta.retrievedUrl}
                          </a>
                          <span className={`ml-1.5 px-1 py-0.5 rounded-sm text-[9px] ${
                            isSuccess
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
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
                    className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground bg-background-hover px-2 py-1 rounded-md transition-colors"
                    title="Visualizar como um Mapa Mental"
                  >
                    <BrainCircuit size={14} />
                  </button>
                )}
                {onSaveToLibrary && (
                   <button
                    onClick={() => onSaveToLibrary(message.text)}
                    className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground bg-background-hover px-2 py-1 rounded-md transition-colors"
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
