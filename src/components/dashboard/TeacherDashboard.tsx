/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useEffect, useState } from 'react';
import { useTeacherStore } from '@/stores/teacherStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CreateTurmaDialog } from './CreateTurmaDialog';

/**
 * Componente que exibe o dashboard principal para um professor,
 * listando suas turmas e grupos de conhecimento.
 */
interface TeacherDashboardProps {
  onExit: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onExit }) => {
  // Consome o estado e as ações da store do professor.
  const {
    turmas,
    gruposDeConhecimento,
    isLoading,
    error,
    fetchTurmas,
    fetchGruposDeConhecimento,
  } = useTeacherStore();

  const { user } = useAuth();
  const [isCreateTurmaOpen, setCreateTurmaOpen] = useState(false);

  // Efeito para buscar os dados quando o componente é montado ou o usuário muda.
  useEffect(() => {
    if (user?.uid) {
      fetchTurmas(user.uid);
      fetchGruposDeConhecimento(user.uid);
    }
  }, [user, fetchTurmas, fetchGruposDeConhecimento]);

  // Renderização condicional baseada nos estados de carregamento e erro.
  if (isLoading) {
    return <div>Carregando dados do professor...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Erro ao carregar o dashboard: {error}</div>;
  }

  return (
    <div>
      <h1>Dashboard do Professor</h1>
      <div className="my-4">
        <Button onClick={onExit}>Salvar e Voltar ao Chat</Button>
      </div>
      <section className="mb-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Minhas Turmas</h2>
          <Button onClick={() => setCreateTurmaOpen(true)}>Criar Nova Turma</Button>
        </div>
        <ul>{turmas.map((turma) => <li key={turma.id}>{turma.name}</li>)}</ul>
      </section>
      <section>
        <h2>Meus Grupos de Conhecimento</h2>
        <ul>{gruposDeConhecimento.map((grupo) => <li key={grupo.id}>{grupo.name}</li>)}</ul>
      </section>
      <CreateTurmaDialog isOpen={isCreateTurmaOpen} onOpenChange={setCreateTurmaOpen} />
    </div>
  );
};

export default TeacherDashboard;