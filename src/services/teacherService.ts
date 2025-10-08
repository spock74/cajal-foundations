/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import { firestore } from '@/firebaseConfig';
import { collection, getDocs, query, where, DocumentData, addDoc } from 'firebase/firestore';
import { Turma, GrupoDeConhecimento } from '@/types';

/**
 * Mapeia um documento do Firestore para um tipo específico, incluindo o ID do documento.
 * @param doc O documento do Firestore.
 * @returns O objeto de dados mapeado.
 */
function mapDoc<T>(doc: DocumentData): T {
  return { id: doc.id, ...doc.data() } as T;
}

class TeacherService {
  private static instance: TeacherService;

  private constructor() {}

  public static getInstance(): TeacherService {
    if (!TeacherService.instance) {
      TeacherService.instance = new TeacherService();
    }
    return TeacherService.instance;
  }

  /**
   * Busca todas as turmas associadas a um professor.
   * @param teacherId O UID do professor.
   * @returns Uma promessa que resolve para um array de Turmas.
   */
  public async getTurmas(teacherId: string): Promise<Turma[]> {
    try {
      const turmasRef = collection(firestore, 'turmas');
      const q = query(turmasRef, where('teacherId', '==', teacherId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return [];
      }

      return querySnapshot.docs.map(doc => mapDoc<Turma>(doc));
    } catch (error) {
      console.error("Erro ao buscar turmas:", error);
      // Lança o erro para que a camada de lógica de negócios (BLL) possa tratá-lo.
      throw new Error("Não foi possível carregar as turmas.");
    }
  }

  /**
   * Busca todos os Grupos de Conhecimento criados por um professor.
   * @param ownerId O UID do professor.
   * @returns Uma promessa que resolve para um array de Grupos de Conhecimento.
   */
  public async getGruposDeConhecimento(ownerId: string): Promise<GrupoDeConhecimento[]> {
    try {
      const gruposRef = collection(firestore, 'gruposDeConhecimento');
      const q = query(gruposRef, where('ownerId', '==', ownerId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return [];
      }

      return querySnapshot.docs.map(doc => mapDoc<GrupoDeConhecimento>(doc));
    } catch (error) {
      console.error("Erro ao buscar grupos de conhecimento:", error);
      throw new Error("Não foi possível carregar os grupos de conhecimento.");
    }
  }

  /**
   * Cria uma nova turma no Firestore.
   * @param name O nome da nova turma.
   * @param teacherId O UID do professor que está criando a turma.
   * @returns O objeto Turma recém-criado.
   */
  public async createTurma(name: string, teacherId: string): Promise<Turma> {
    try {
      const turmasRef = collection(firestore, 'turmas');
      const newTurmaData = {
        name,
        teacherId,
        studentIds: [], // Começa sem alunos
      };
      const docRef = await addDoc(turmasRef, newTurmaData);

      // Retorna o objeto completo, incluindo o novo ID
      return { id: docRef.id, ...newTurmaData };
    } catch (error) {
      console.error("Erro ao criar turma:", error);
      throw new Error("Não foi possível criar a nova turma.");
    }
  }
  // TODO: Adicionar métodos para atualizar e deletar turmas e grupos.
}

export const teacherService = TeacherService.getInstance();