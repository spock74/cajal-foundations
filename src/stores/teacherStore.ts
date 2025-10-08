/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import { create } from 'zustand';
import { teacherService } from '@/services/teacherService';
import { Turma, GrupoDeConhecimento } from '@/types.ts';

/**
 * Define o formato do estado para os dados relacionados ao professor.
 */
interface TeacherState {
  turmas: Turma[];
  gruposDeConhecimento: GrupoDeConhecimento[];
  isLoading: boolean;
  error: string | null;
  fetchTurmas: (teacherId: string) => Promise<void>;
  fetchGruposDeConhecimento: (ownerId: string) => Promise<void>;
  createTurma: (name: string, teacherId: string) => Promise<void>;
}

/**
 * Store Zustand para gerenciar o estado do dashboard do professor.
 * Esta store consome o `teacherService` para buscar dados e gerencia
 * os estados de carregamento e erro.
 */
export const useTeacherStore = create<TeacherState>((set) => ({
  // Estado inicial
  turmas: [],
  gruposDeConhecimento: [],
  isLoading: false,
  error: null,

  /**
   * Ação para buscar as turmas de um professor.
   */
  fetchTurmas: async (teacherId: string) => {
    set({ isLoading: true, error: null });
    try {
      const turmas = await teacherService.getTurmas(teacherId);
      set({ turmas, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      set({ isLoading: false, error: errorMessage });
    }
  },

  /**
   * Ação para buscar os grupos de conhecimento de um professor.
   */
  fetchGruposDeConhecimento: async (ownerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const grupos = await teacherService.getGruposDeConhecimento(ownerId);
      set({ gruposDeConhecimento: grupos, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      set({ isLoading: false, error: errorMessage });
    }
  },

  /**
   * Ação para criar uma nova turma.
   */
  createTurma: async (name: string, teacherId: string) => {
    set({ isLoading: true, error: null });
    try {
      const newTurma = await teacherService.createTurma(name, teacherId);
      // Adiciona a nova turma ao estado local sem precisar de um novo fetch.
      set((state) => ({ turmas: [...state.turmas, newTurma], isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      set({ isLoading: false, error: errorMessage });
    }
  }
}));