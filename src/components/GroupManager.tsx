/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState } from 'react';
import { KnowledgeGroup } from '../types';
import { Trash2, Check, Pencil, X } from 'lucide-react';
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
import { Button, buttonVariants } from '@/components/ui/button';

interface GroupManagerProps {
  groups: KnowledgeGroup[];
  activeGroupId: string | null;
  onSetGroupId: (id: string) => void;
  onAddGroup: (name: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onUpdateGroup: (groupId: string, newName: string) => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({
  groups,
  activeGroupId,
  onSetGroupId,
  onAddGroup,
  onDeleteGroup,
  onUpdateGroup,
}) => {
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup(newGroupName.trim());
      setNewGroupName('');
      setIsCreatingGroup(false);
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
    if (activeGroupId) {
      setIsAlertOpen(true);
    }
  };

  const activeGroup = groups.find(g => g.id === activeGroupId);

  return (
    <div className="p-3 border-b border-gray-200 dark:border-[rgba(255,255,255,0.05)]">
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

      {activeGroup && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar o tópico "{activeGroup.name}"?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação é irreversível e removerá o tópico, todas as suas conversas e fontes associadas.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => activeGroupId && onDeleteGroup(activeGroupId)} className={buttonVariants({ variant: "destructive" })}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default GroupManager;