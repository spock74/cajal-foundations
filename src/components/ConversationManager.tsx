/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState } from 'react';
import { Conversation, KnowledgeSource, KnowledgeGroup } from '../types';
import { Plus, Trash2, MessageSquare, X, ChevronDown, Settings } from 'lucide-react';
import KnowledgeBaseManager from './KnowledgeBaseManager';

interface ConversationManagerProps {
  // Grupos
  groups: KnowledgeGroup[];
  activeGroupId: string | null;
  onSetGroupId: (id: string) => void;
  onAddGroup: (name: string) => void;
  // Conversas
  conversations: Conversation[];
  activeConversationId: string | null;
  onSetConversationId: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  // Fontes
  activeConversationSources: KnowledgeSource[];
  onUrlAdd: (url: string) => void;
  onFileAdd: (file: File) => void;
  onRemoveSource: (sourceId: string) => void;
  onToggleSourceSelection: (sourceId: string) => void;
  // Controles Gerais
  onClearAll: () => void;
  onCloseSidebar?: () => void;
}

const ConversationManager: React.FC<ConversationManagerProps> = ({
  groups,
  activeGroupId,
  onSetGroupId,
  onAddGroup,
  conversations,
  activeConversationId,
  activeConversationSources,
  onSetConversationId,
  onNewConversation,
  onDeleteConversation,
  onClearAll,
  onCloseSidebar,
  onUrlAdd,
  onFileAdd,
  onRemoveSource,
  onToggleSourceSelection,
}) => {
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim());
      setNewGroupName('');
      setIsCreatingGroup(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1E1E1E] rounded-xl shadow-lg border border-gray-200 dark:border-[rgba(255,255,255,0.05)]">
      <div className="p-4 border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-[#E2E2E2]">Conversas</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewConversation}
            className="p-1.5 text-gray-500 dark:text-[#A8ABB4] hover:text-black dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title="Nova Conversa"
          >
            <Plus size={18} />
          </button>
          {onCloseSidebar && (
            <button
              onClick={onCloseSidebar}
              className="p-1.5 text-gray-500 dark:text-[#A8ABB4] hover:text-black dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors md:hidden"
              aria-label="Fechar painel"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Seletor de Grupos */}
      <div className="p-3 border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)] flex-shrink-0">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-500 dark:text-[#A8ABB4]">
            Tópico de Pesquisa
          </label>
          <div className="flex items-center gap-2">
            <button onClick={() => {}} className="text-xs text-blue-600 dark:text-[#79B8FF] hover:text-black dark:hover:text-white font-medium"><Settings size={14}/></button>
            <div className="w-px h-3 bg-gray-300 dark:bg-white/20"></div>
            <button onClick={() => setIsCreatingGroup(true)} className="text-xs text-blue-600 dark:text-[#79B8FF] hover:text-black dark:hover:text-white font-medium">Novo</button>
          </div>
        </div>
        {isCreatingGroup ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nome do novo tópico..."
              className="flex-grow h-8 py-1 px-2.5 border border-gray-300 dark:border-[rgba(255,255,255,0.1)] bg-gray-100 dark:bg-[#2C2C2C] text-gray-800 dark:text-[#E2E2E2] rounded-lg text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              autoFocus
            />
            <button onClick={handleCreateGroup} className="px-2.5 py-1 text-xs bg-gray-800 text-white rounded-md">Criar</button>
            <button onClick={() => setIsCreatingGroup(false)} className="px-2.5 py-1 text-xs text-gray-600 rounded-md">X</button>
          </div>
        ) : (
          <div className="relative w-full">
            <select id="group-select" value={activeGroupId || ''} onChange={(e) => onSetGroupId(e.target.value)} className="w-full py-2 pl-3 pr-8 text-sm bg-gray-100 dark:bg-[#2C2C2C] border border-gray-300 dark:border-[rgba(255,255,255,0.1)] rounded-lg appearance-none">
              {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-2 border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)] max-h-36 overflow-y-auto">
        <ul className="space-y-1">
          {conversations.map(convo => (
            <li key={convo.id} className="flex items-center justify-between group rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-white/5">
              <button
                onClick={() => onSetConversationId(convo.id)}
                className={`flex-grow flex items-center gap-2 p-2 text-sm text-left transition-colors rounded-md ${
                  activeConversationId === convo.id
                    ? 'bg-gray-800 text-white dark:bg-white/20'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <MessageSquare size={16} className="flex-shrink-0" />
                <span className="flex-grow truncate" title={convo.name}>{convo.name}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Tem certeza que deseja apagar a conversa "${convo.name}"?`)) {
                    onDeleteConversation(convo.id);
                  }
                }}
                className="p-2 flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-opacity"
                title="Apagar conversa"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-grow min-h-0">
        {activeGroupId ? (
          <KnowledgeBaseManager
            sources={activeConversationSources}
            onUrlAdd={onUrlAdd}
            onFileAdd={onFileAdd}
            onRemoveSource={onRemoveSource}
            onToggleSourceSelection={onToggleSourceSelection}
          />
        ) : null}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[rgba(255,255,255,0.05)]">
        <button
          onClick={() => {
            if (window.confirm("Tem certeza que deseja apagar TODAS as conversas? Esta ação não pode ser desfeita.")) {
              onClearAll();
            }
          }}
          className="w-full flex items-center justify-center gap-2 text-sm p-2 rounded-md text-red-600 bg-red-500/10 hover:bg-red-500/20 transition-colors"
        >
          <Trash2 size={16} />
          <span>Limpar Tudo</span>
        </button>
      </div>
    </div>
  );
};

export default ConversationManager;