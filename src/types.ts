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

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  isLoading?: boolean;
  urlContext?: UrlContextMetadataItem[];
}

// Interface base para metadados comuns a todas as fontes de conhecimento.
interface BaseSource {
  id: string; // Será o hash SHA-256 do conteúdo.
  name: string; // Nome do arquivo ou URL.
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
  content: string;
  timestamp: Date;
}