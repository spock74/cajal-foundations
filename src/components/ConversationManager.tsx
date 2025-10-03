/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState } from 'react';
import { Conversation, KnowledgeSource, KnowledgeGroup } from '../types';
import { Plus, Trash2, MessageSquare, X, Check, Pencil } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import KnowledgeBaseManager from './KnowledgeBaseManager';
import { modelOptions } from './models';

interface ConversationManagerProps {
  // Grupos
  groups: KnowledgeGroup[];
  activeGroupId: string | null;
  onSetGroupId: (id: string) => void;
  onAddGroup: (name: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onUpdateGroup: (groupId: string, newName: string) => void;
  // Conversas
  conversations: Conversation[];
  activeConversationId: string | null;
  onSetConversationId: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  // Fontes
  sourcesForActiveGroup: KnowledgeSource[];
  onUrlAdd: (url: string) => void;
  onFileAdd: (file: File) => void;
  onRemoveSource: (sourceId: string) => void;
  onToggleSourceSelection: (sourceId: string) => void;
  // Modelo
  activeModel: string;
  onSetModel: (modelName: string) => void;
  // Controles Gerais
  onClearAll: () => void;
  onCloseSidebar?: () => void;
}

const ConversationManager: React.FC<ConversationManagerProps> = ({
  groups,
  activeGroupId,
  onSetGroupId,
  onAddGroup,
  onDeleteGroup,
  onUpdateGroup,
  conversations,
  activeConversationId,
  sourcesForActiveGroup,
  onSetConversationId,
  onNewConversation,
  onDeleteConversation,
  onClearAll,
  onCloseSidebar,
  onUrlAdd,
  onFileAdd,
  onRemoveSource,
  onToggleSourceSelection,
  activeModel,
  onSetModel,
}) => {
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim());
      setNewGroupName('');
      setIsCreatingGroup(false);
    }
  };

  const handleNewConversationClick = () => {
    const anySourceSelected = sourcesForActiveGroup.some(s => s.selected);
    if (sourcesForActiveGroup.length > 0 && !anySourceSelected) {
      setDialogState({
        isOpen: true,
        title: "Nenhuma fonte selecionada",
        description: "Para iniciar uma nova conversa, por favor, selecione pelo menos uma fonte de conhecimento na lista abaixo.",
        onConfirm: () => setDialogState(null), // Apenas fecha o diálogo
      });
    } else {
      onNewConversation();
    }
  };

  const handleStartEditing = () => {
    if (activeGroupId) {
      setEditingGroupId(activeGroupId);
      setEditingGroupName(groups.find(g => g.id === activeGroupId)?.name || '');
    }
  };

  const handleCancelEditing = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const handleUpdateGroupName = () => {
    if (editingGroupId && editingGroupName.trim()) {
      onUpdateGroup(editingGroupId, editingGroupName.trim());
      handleCancelEditing();
    }
  };

  const confirmGroupDeletion = () => {
    const group = groups.find(g => g.id === activeGroupId);
    if (group) {
      setDialogState({
        isOpen: true,
        title: `Apagar o tópico "${group.name}"?`,
        description: "Esta ação é irreversível e removerá o tópico, todas as suas conversas e fontes associadas.",
        onConfirm: () => onDeleteGroup(group.id),
      });
    }
  };

  const confirmDeletion = (type: 'single' | 'all', id?: string, name?: string) => {
    if (type === 'single' && id && name) {
      setDialogState({
        isOpen: true,
        title: `Apagar "${name}"?`,
        description: "Esta ação não pode ser desfeita. A conversa e todas as suas mensagens serão permanentemente removidas.",
        onConfirm: () => onDeleteConversation(id),
      });
    } else if (type === 'all') {
      setDialogState({
        isOpen: true,
        title: "Apagar TODAS as conversas?",
        description: "Esta ação não pode ser desfeita. Todas as conversas neste tópico serão permanentemente removidas.",
        onConfirm: onClearAll,
      });
    }
  };
  return (
    // Efeito de vidro fosco para o painel
    <div className="flex flex-col h-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/5">
      <div className="p-4 border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-[#E2E2E2]">Conversas</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewConversationClick}
            className="p-1.5 rounded-md bg-green-900/80 text-white hover:bg-green-900 transition-colors"
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
        <div className="group flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-500 dark:text-[#A8ABB4]">
            Tópico de Pesquisa
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
              <button onClick={confirmGroupDeletion} className="p-1 text-red-600 rounded-md hover:bg-red-500/10" title="Apagar Tópico"><Trash2 size={14}/></button>
              <button onClick={handleStartEditing} className="p-1 text-blue-600 rounded-md hover:bg-blue-500/10" title="Editar Tópico"><Pencil size={14}/></button>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-white/20"></div>
            <button onClick={() => setIsCreatingGroup(true)} className="text-xs text-blue-600 dark:text-[#79B8FF] hover:text-black dark:hover:text-white font-medium">NOVO</button>
          </div>
        </div>
        <div>
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
        ) : editingGroupId ? (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={editingGroupName}
              onChange={(e) => setEditingGroupName(e.target.value)}
              className="h-9 flex-grow"
              onKeyPress={(e) => e.key === 'Enter' && handleUpdateGroupName()}
              autoFocus
            />
            <Button onClick={handleUpdateGroupName} size="icon" className="h-9 w-9 flex-shrink-0 bg-green-600 hover:bg-green-700">
              <Check size={16} />
            </Button>
            <Button onClick={handleCancelEditing} size="icon" variant="ghost" className="h-9 w-9 flex-shrink-0">
              <X size={16} />
            </Button>
          </div>
        ) : (
          <Select value={activeGroupId || ''} onValueChange={onSetGroupId}>
            <SelectTrigger className="w-full h-9 text-sm bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
              <SelectValue placeholder="Selecione um tópico..." />
            </SelectTrigger>
            <SelectContent>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        </div>
      </div>

      {/* Seletor de Modelo */}
      <div className="p-3 border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)] flex-shrink-0">
        <label className="block text-sm font-medium text-gray-500 dark:text-[#A8ABB4] mb-1">
          Modelo da IA
        </label>
        <Select value={activeModel} onValueChange={onSetModel}>
          <SelectTrigger className="w-full h-9 text-sm bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
            <SelectValue placeholder="Selecione um modelo..." />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map(model => (
              <SelectItem key={model.name} value={model.name}>{model.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-shrink-0 p-2 max-h-36 overflow-y-auto">
        <ul className="space-y-1">
          {conversations.map(convo => (
            <li key={convo.id} className="flex items-center justify-between group rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-white/5">
              <button
                onClick={() => onSetConversationId(convo.id)}
                className={`flex-grow flex items-center gap-3 p-2 text-sm text-left transition-colors rounded-md ${
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
                  confirmDeletion('single', convo.id, convo.name);
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
            sources={sourcesForActiveGroup}
            onUrlAdd={onUrlAdd}
            onFileAdd={onFileAdd}
            onRemoveSource={onRemoveSource}
            onToggleSourceSelection={onToggleSourceSelection}
          />
        ) : (
          <div className="p-4 h-full flex items-center justify-center text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Selecione uma conversa existente ou clique em '+' para iniciar uma nova.</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[rgba(255,255,255,0.05)]">
        <button
          onClick={() => confirmDeletion('all')}
          className="w-full flex items-center justify-center gap-2 text-sm p-2 rounded-md text-red-600 bg-red-500/10 hover:bg-red-500/20 transition-colors"
        >
          <Trash2 size={16} />
          <span>Limpar Tudo</span>
        </button>
      </div>

      {dialogState && (
        <AlertDialog open={dialogState.isOpen} onOpenChange={(isOpen) => !isOpen && setDialogState(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
              <AlertDialogDescription>{dialogState.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {dialogState.onConfirm.name === 'onClearAll' || dialogState.onConfirm.name.includes('onDelete') ? (
                <AlertDialogCancel onClick={() => setDialogState(null)}>Cancelar</AlertDialogCancel>
              ) : null}
              <AlertDialogAction onClick={() => { dialogState.onConfirm(); setDialogState(null); }}>Ok</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default ConversationManager;