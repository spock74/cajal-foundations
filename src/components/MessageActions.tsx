/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { BrainCircuit, Bookmark, Copy, Check, Trash2 } from 'lucide-react';

interface MessageActionsProps {
  message: ChatMessage;
  firestoreDocId: string;
  onToggleMindMap?: (firestoreDocId: string) => void;
  onSaveToLibrary?: (message: ChatMessage) => void;
  onDelete?: (firestoreDocId: string, messageText: string) => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({ message, firestoreDocId, onToggleMindMap, onSaveToLibrary, onDelete }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    console.log("[MessageActions] Botão 'Copiar' clicado.");
    if (isCopied) return;
    navigator.clipboard.writeText(message.text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Falha ao copiar texto para a área de transferência:', err);
    });
  };

  return (
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
          onClick={() => onToggleMindMap(firestoreDocId)}
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${message.mindMap?.isVisible ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
          title="Visualizar como um Mapa Mental"
          disabled={firestoreDocId.startsWith('model-') || firestoreDocId.startsWith('user-')}
        >
          <BrainCircuit size={14} />
        </button>
      )}
      {onSaveToLibrary && (
        <button
          onClick={() => {
            console.log("[MessageActions] Botão 'Salvar na Biblioteca' clicado.");
            onSaveToLibrary(message);
          }}
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors bg-transparent text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
          title="Salvar na Biblioteca"
        >
          <Bookmark size={14} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(firestoreDocId, message.text)}
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors bg-transparent text-gray-500 dark:text-gray-400 hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/10"
          title="Apagar mensagem"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

export default MessageActions;