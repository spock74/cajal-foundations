/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

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
  id?: number;
  type: 'text' | 'mindmap';
  content: string;
  conversationId: string;
  groupId: string;
  sourceIds: string[];
  timestamp: Date;
  messageId?: string;
}

// --- Tipos para a Funcionalidade de Avaliação ---

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