/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import { Timestamp } from "firebase/firestore";

export enum MessageSender {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface UrlContextMetadataItem {
  retrievedUrl: string;
  urlRetrievalStatus: string;
}

export interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface MindMapData {
  title?: string;
  nodes: any[];
  edges: any[];
  isLoading: boolean;
  error: string | null;
  isVisible: boolean;
  isArchived?: boolean;
  expandedNodeIds?: string[];
  nodePositions?: { [nodeId: string]: { x: number; y: number } };
}

export interface OptimizedPrompt {
  question_title: string;
  prompt: string;
  description: string;
}

export interface Conversation {
  id: string;
  name: string;
  groupId: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  isLoading?: boolean;
  urlContext?: UrlContextMetadataItem[];
  mindMap?: MindMapData;
  sourceIds?: string[];
  optimizedPrompts?: OptimizedPrompt[];
  model?: string;
  usageMetadata?: UsageMetadata;
}

// Interface base para metadados comuns a todas as fontes de conhecimento.
interface BaseSource {
  id: string; // Será o hash SHA-256 do conteúdo.
  name: string; // Nome do arquivo ou URL.
  groupId: string;
  timestamp: Date;
  userId: 'dev_user';
  selected: boolean;
}

// Interface específica para fontes do tipo arquivo, com metadados adicionais.
interface FileSource extends BaseSource {
  fileType: string; // MIME Type.
  fileSize: number; // Tamanho em bytes.
  content: string; // Conteúdo textual extraído.
}

// Interface específica para fontes do tipo URL.
interface UrlSource extends BaseSource {
  value: string; // A própria URL.
}

// O tipo unificado que será usado no estado do React.
export type KnowledgeSource =
  | ({ type: 'url' } & UrlSource)
  | ({ type: 'file' } & FileSource);


export interface KnowledgeGroup {
  id: string;
  name: string;
  sources: KnowledgeSource[];
}

export interface LibraryItem {
  id: string;
  type: 'text' | 'mindmap';
  content: string;
  conversationId: string;
  groupId: string;
  sourceIds: string[];
  timestamp: Date;
  messageId?: string;
}

// --- Tipos para a Modelagem de Dados Pedagógica ---

/**
 * Representa um usuário na plataforma, com um papel definido para RBAC.
 */
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'teacher' | 'student';
}

/**
 * Representa uma turma, agrupando alunos sob a tutela de um professor.
 */
export interface Turma {
  id: string; // ID do documento no Firestore
  name: string;
  teacherId: string; // Ref: /users/{userId}
  studentIds: string[]; // Array de UIDs dos alunos
}

/**
 * Representa um módulo de estudo criado por um professor.
 */
export interface GrupoDeConhecimento {
  id: string; // ID do documento no Firestore
  name: string;
  ownerId: string; // Ref: /users/{userId}
  createdAt: Timestamp;
  sources: {
    fileName: string;
    fileType: string;
    uploadTimestamp: Timestamp;
  }[];
}

/**
 * Representa uma avaliação (prova, quiz) criada por um professor.
 */
export interface Avaliacao {
  id: string; // ID do documento no Firestore
  title: string;
  status: 'draft' | 'published' | 'closed';
  type: 'formative' | 'summative';
  ownerId: string; // Ref: /users/{userId}
  grupoId: string; // Ref: /gruposDeConhecimento/{grupoId}
  turmaId: string; // Ref: /turmas/{turmaId}
  createdAt: Timestamp;
  publishedAt?: Timestamp;
}

/**
 * Representa uma única questão dentro de uma Avaliacao.
 */
export interface ItemDeAvaliacao {
  id: string; // ID do documento no Firestore
  conceptId: string;
  bloomLevel: string;
  prompt: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    justification: string;
  }[];
  hint?: string;
}

/**
 * Registra a tentativa de um aluno em uma avaliação.
 */
export interface Submissao {
  id: string; // ID do documento no Firestore
  avaliacaoId: string; // Ref: /avaliacoes/{avaliacaoId}
  studentId: string; // Ref: /users/{userId}
  turmaId: string; // Ref: /turmas/{turmaId}
  submittedAt: Timestamp;
  score: number;

  // Dado denormalizado para eficiência de leitura
  assessmentTitle: string;
}

/**
 * Registra a resposta de um aluno a um único item.
 */
export interface Resposta {
  id: string; // ID do documento no Firestore
  itemId: string; // Ref: /avaliacoes/{id}/itens/{id}
  selectedOptionId: string;
  isCorrect: boolean;

  // Dados denormalizados para eficiência de diagnóstico
  conceptId: string;
  bloomLevel: string;
}

// --- Tipos para a Funcionalidade de Avaliação (Legado/Quiz) ---
// TODO: Unificar ou refatorar `QuizData` e `QuizQuestion` com os novos modelos `Assessment` e `AssessmentItem`.

export interface AnswerOption {
  text: string;
  rationale: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  questionNumber: number;
  question: string;
  answerOptions: AnswerOption[];
  hint: string;
  /**
   * A resposta do aluno, adicionada durante a exportação dos resultados.
   */
  resposta_aluno?: string | null;
}

export interface QuizData {
  title: string;
  description: string;
  questions: QuizQuestion[];
}