/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import Dexie, { type Table } from 'dexie';
import { type LibraryItem, type KnowledgeSource, type ChatMessage, type Conversation, type KnowledgeGroup } from '../types';

// Interface para o objeto que será armazenado na nova tabela.
// O conteúdo é separado dos metadados para otimizar queries futuras.
export interface StoredSource {
  hashId: string; // Chave primária (o hash SHA-256)
  content: string;
  metadata: KnowledgeSource;
}

export class MyDatabase extends Dexie {
  public savedItems!: Table<LibraryItem, number>;
  public sourceContents!: Table<StoredSource, string>; // Nova tabela
  public knowledgeGroups!: Table<KnowledgeGroup, string>;
  public conversations!: Table<Conversation, string>;
  public chatMessages!: Table<ChatMessage, string>;

  public constructor() {
    super('CajalFoundationsDB');
    
    // ATENÇÃO: A versão do DB foi incrementada para '6' para introduzir o novo schema.
    // Isso irá migrar o banco de dados existente no navegador do usuário.
    this.version(6).stores({
      savedItems: '++id, content, timestamp',
      sourceContents: '&hashId, metadata.groupId', // '&' indica que 'hashId' é a chave primária e deve ser única.
      knowledgeGroups: 'id, name',
      conversations: 'id, groupId, timestamp',
      chatMessages: 'id, conversationId, timestamp',
    });
  }

  // --- Métodos para a tabela 'savedItems' (Biblioteca) ---
  
  async addSavedItem(item: LibraryItem): Promise<number> {
    return this.savedItems.add(item);
  }

  async getAllSavedItems(): Promise<LibraryItem[]> {
    return this.savedItems.orderBy('timestamp').reverse().toArray();
  }
  
  async deleteSavedItem(id: number): Promise<void> {
    return this.savedItems.delete(id);
  }

  // --- Novos Métodos para a tabela 'sourceContents' (Fontes de Conhecimento) ---

  /**
   * Adiciona uma nova fonte de conhecimento ao banco de dados.
   * A operação falhará se um item com o mesmo hashId já existir.
   * @param source O objeto StoredSource a ser adicionado.
   * @returns O hashId da fonte adicionada.
   */
  async addSource(source: StoredSource): Promise<string> {
    return this.sourceContents.add(source);
  }

  /**
   * Recupera uma fonte de conhecimento do banco de dados pelo seu hash.
   * @param hashId O hash SHA-256 do conteúdo da fonte.
   * @returns O objeto StoredSource ou undefined se não for encontrado.
   */
  async getSource(hashId: string): Promise<StoredSource | undefined> {
    return this.sourceContents.get(hashId);
  }

  /**
   * Remove uma fonte de conhecimento do banco de dados.
   * @param hashId O hash da fonte a ser removida.
   */
  async deleteSource(hashId: string): Promise<void> {
    return this.sourceContents.delete(hashId);
  }

  /**
   * Recupera todas as fontes de um determinado grupo (placeholder para o futuro).
   * Por enquanto, apenas recupera todos os metadados.
   */
  async getAllSourcesMetadata(): Promise<KnowledgeSource[]> {
    const allStoredSources = await this.sourceContents.toArray();
    return allStoredSources.map(s => s.metadata);
  }

  async getSourcesForGroup(groupId: string): Promise<KnowledgeSource[]> {
    const storedSources = await this.sourceContents.where('groupId').equals(groupId).toArray();
    return storedSources.map(s => s.metadata);
  }

  // --- Métodos para Grupos de Conhecimento ---

  async getAllKnowledgeGroups(): Promise<KnowledgeGroup[]> {
    return this.knowledgeGroups.toArray();
  }

  async addKnowledgeGroup(group: KnowledgeGroup): Promise<string> {
    return this.knowledgeGroups.add(group);
  }

  async deleteKnowledgeGroup(groupId: string): Promise<void> {
    return this.transaction('rw', this.knowledgeGroups, this.conversations, this.chatMessages, async () => {
      // 1. Encontra todas as conversas do grupo
      const conversationsToDelete = await this.conversations.where('groupId').equals(groupId).toArray();
      const conversationIds = conversationsToDelete.map(c => c.id);

      // 2. Deleta todas as mensagens dessas conversas
      await this.chatMessages.where('conversationId').anyOf(conversationIds).delete();

      // 3. Deleta as conversas e o próprio grupo
      await this.conversations.where('groupId').equals(groupId).delete();
      await this.knowledgeGroups.delete(groupId);
    });
  }

  // --- Métodos para Conversas e Mensagens ---

  async getAllConversations(): Promise<Conversation[]> {
    return this.conversations.orderBy('timestamp').reverse().toArray();
  }

  async getConversationsForGroup(groupId: string): Promise<Conversation[]> {
    return this.conversations.where('groupId').equals(groupId).reverse().sortBy('timestamp');
  }

  async addConversation(conversation: Conversation): Promise<string> {
    return this.conversations.add(conversation);
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<number> {
    return this.conversations.update(id, updates);
  }

  async deleteConversation(conversationId: string): Promise<void> {
    // Usa uma transação para garantir que a conversa e suas mensagens sejam removidas atomicamente.
    return this.transaction('rw', this.conversations, this.chatMessages, async () => {
      await this.conversations.delete(conversationId);
      await this.chatMessages.where('conversationId').equals(conversationId).delete();
    });
  }

  async clearAllConversations(): Promise<void> {
    await this.conversations.clear();
    await this.chatMessages.clear();
  }

  // --- Novos Métodos para a tabela 'chatMessages' ---

  async getAllChatMessages(): Promise<ChatMessage[]> {
    return this.chatMessages.orderBy('timestamp').toArray();
  }

  async getMessagesForConversation(conversationId: string): Promise<ChatMessage[]> {
    return this.chatMessages.where('conversationId').equals(conversationId).sortBy('timestamp');
  }

  async addChatMessage(message: ChatMessage): Promise<string> {
    return this.chatMessages.add(message);
  }

  async updateChatMessage(id: string, updates: Partial<ChatMessage>): Promise<number> {
    return this.chatMessages.update(id, updates);
  }
}

export const db = new MyDatabase();



// /**
//  * @author José E. Moraes
//  * @copyright 2025 - Todos os direitos reservados
//  */
// 
// import Dexie, { Table } from 'dexie';
// import { LibraryItem } from '../types';
// 
// export class MyDatabase extends Dexie {
//   public savedItems!: Table<LibraryItem, number>; 
// 
//   public constructor() {
//     super('CajalFoundationsDB');
//     // Fix: Cast `this` to Dexie to resolve a TypeScript type inference issue where the `version` method is not found on the subclass.
//     (this as Dexie).version(1).stores({
//       savedItems: '++id, content, timestamp',
//     });
//   }
// 
//   async addSavedItem(item: LibraryItem): Promise<number> {
//     return this.savedItems.add(item);
//   }
// 
//   async getAllSavedItems(): Promise<LibraryItem[]> {
//     // Return sorted by most recent first
//     return this.savedItems.orderBy('timestamp').reverse().toArray();
//   }
//   
//   async deleteSavedItem(id: number): Promise<void> {
//     return this.savedItems.delete(id);
//   }
// }
// 
// export const db = new MyDatabase();