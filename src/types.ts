/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum MessageSender {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface UrlContextMetadataItem {
  retrievedUrl: string; // Changed from retrieved_url
  urlRetrievalStatus: string; // Changed from url_retrieval_status
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  isLoading?: boolean;
  urlContext?: UrlContextMetadataItem[];
}

export type KnowledgeSource =
  | { type: 'url'; id: string; value: string }
  | { type: 'file'; id: string; name: string; mimeType: string; content: string /* base64 encoded */ };


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