/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */
import React, { useState } from 'react';
import { Conversation, KnowledgeSource, KnowledgeGroup } from '../types';
import { Plus, Trash2, X, LogOut } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button, buttonVariants } from '@/components/ui/button';
import KnowledgeBaseManager from './KnowledgeBaseManager';
import { useAuth } from '@/hooks/useAuth';
import { modelOptions } from './models';
import ConversationList from './ConversationList';
import GroupManager from './GroupManager';

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
  showModelSelect: boolean;
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
  showModelSelect,
}) => {
  const { user, logOut } = useAuth();
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);

  const handleNewConversationClick = () => {
    const anySourceSelected = sourcesForActiveGroup.some(s => s.selected);
    if (sourcesForActiveGroup.length > 0 && !anySourceSelected) {
      setDialogState({
        isOpen: true,
        title: "Nenhuma fonte selecionada",
        description: "Para iniciar uma nova conversa, por favor, selecione pelo menos uma fonte de conhecimento na lista abaixo.",
        onConfirm: () => setDialogState(null), // Apenas fecha o diálogo
        isDestructive: false,
      });
    } else {
      onNewConversation();
    }
  };

  const confirmDeletion = (type: 'single' | 'all', id?: string, name?: string) => {
    if (type === 'single' && id && name) {
      setDialogState({
        isOpen: true,
        title: `Apagar "${name}"?`,
        description: "Esta ação não pode ser desfeita. A conversa e todas as suas mensagens serão permanentemente removidas.",
        onConfirm: () => onDeleteConversation(id),
        isDestructive: true,
      });
    } else if (type === 'all') {
      setDialogState({
        isOpen: true,
        title: "Apagar TODAS as conversas?",
        description: "Esta ação não pode ser desfeita. Todas as conversas neste tópico serão permanentemente removidas.",
        onConfirm: onClearAll,
        isDestructive: true,
      });
    }
  };
  return (
    // Efeito de vidro fosco para o painel
    <div className="flex flex-col h-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/5">
      <div className="p-4 border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)] flex items-center justify-between flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-[#E2E2E2]">Conversas</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewConversationClick}
            className="p-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
            title="Nova Conversa"
          >
            <Plus size={18} />
          </button>
          {onCloseSidebar && (
            <button
              onClick={onCloseSidebar}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors md:hidden"
              aria-label="Fechar painel"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo rolável */}
      <div className="flex-grow overflow-y-auto chat-container">
        <GroupManager
          groups={groups}
          activeGroupId={activeGroupId}
          onSetGroupId={onSetGroupId}
          onAddGroup={onAddGroup}
          onDeleteGroup={onDeleteGroup}
          onUpdateGroup={onUpdateGroup}
        />

        {/* Seletor de Modelo */}
        {showModelSelect && (
          <div className="p-3 border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)]">
            <label className="block text-sm font-medium text-gray-500 dark:text-[#A8ABB4]">
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
        )}

        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSetConversationId={onSetConversationId}
          onConfirmDelete={(id, name) => confirmDeletion('single', id, name)}
        />

        <div className="min-h-0">
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
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-[rgba(255,255,255,0.05)] flex-shrink-0 space-y-3">
        {/* Seção do Usuário */}
        {user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium truncate" title={user.email || ''}>
                {user.displayName || user.email}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={logOut} className="flex-shrink-0 text-muted-foreground hover:text-foreground" title="Sair">
              <LogOut size={16} />
            </Button>
          </div>
        )}
        {/* Botão Limpar Tudo */}
        <Button onClick={() => confirmDeletion('all')} variant="destructive" className="w-full h-9 bg-red-500/10 hover:bg-red-500/20 text-red-600">
          <Trash2 size={16} className="mr-2" />
          Limpar Tudo
        </Button>
      </div>

      {dialogState && (
        <AlertDialog open={dialogState.isOpen} onOpenChange={(isOpen) => !isOpen && setDialogState(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
              <AlertDialogDescription>{dialogState.description}</AlertDialogDescription>
            </AlertDialogHeader>
            {dialogState.isDestructive ? (
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDialogState(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { dialogState.onConfirm(); setDialogState(null); }} className={buttonVariants({ variant: "destructive" })}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            ) : (
              <AlertDialogFooter><AlertDialogAction onClick={() => { dialogState.onConfirm(); setDialogState(null); }}>Ok</AlertDialogAction></AlertDialogFooter>
            )}
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default ConversationManager;