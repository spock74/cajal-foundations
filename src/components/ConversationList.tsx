/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React from 'react';
import { Conversation } from '../types';
import { MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSetConversationId: (id: string) => void;
  onConfirmDelete: (id: string, name: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSetConversationId,
  onConfirmDelete,
}) => {
  return (
    <div className="p-2">
      <ul className="space-y-1">
        {conversations.map(convo => (
          <li key={convo.id} className="flex items-center justify-between group rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-white/5">
            <button
              onClick={() => onSetConversationId(convo.id)}
              className={cn(
                "flex-grow flex items-center gap-3 p-2 text-sm text-left transition-colors rounded-md",
                activeConversationId === convo.id ? 'bg-gray-800 text-white dark:bg-white/20' : 'text-gray-700 dark:text-gray-300'
              )}
            >
              <MessageSquare size={16} className="flex-shrink-0" />
              <span className="flex-grow truncate" title={convo.name}>{convo.name}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onConfirmDelete(convo.id, convo.name); }} className="p-2 flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity" title="Apagar conversa">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConversationList;