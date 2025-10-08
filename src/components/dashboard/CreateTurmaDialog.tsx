/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState } from 'react';
import { useTeacherStore } from '@/stores/teacherStore'; // NOSONAR
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateTurmaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateTurmaDialog: React.FC<CreateTurmaDialogProps> = ({ isOpen, onOpenChange }) => {
  const [turmaName, setTurmaName] = useState('');
  const { createTurma, isLoading } = useTeacherStore();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!turmaName.trim() || !user) return;

    await createTurma(turmaName, user.uid);
    setTurmaName(''); // Limpa o input
    onOpenChange(false); // Fecha o diálogo
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Turma</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="turma-name">Nome da Turma</Label>
          <Input id="turma-name" value={turmaName} onChange={(e) => setTurmaName(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isLoading || !turmaName.trim()}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};