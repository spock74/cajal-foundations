/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState } from 'react';
import { KnowledgeSource } from '../types';
import { Send, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (query: string, sourceIds: string[]) => void;
  onOptimizePrompt: (query: string, sourceIds: string[]) => void;
  isLoading: boolean;
  isInputDisabled: boolean;
  activeSources: KnowledgeSource[];
  placeholderText?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onOptimizePrompt,
  isLoading,
  isInputDisabled,
  activeSources,
  placeholderText,
}) => {
  const [userQuery, setUserQuery] = useState('');

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
          {isLoading ? 
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> 
            : <Send size={16} />
          }
        </button>
      </div>
    </div>
  );
};

export default ChatInput;