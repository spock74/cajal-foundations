/**
 * @author José E. Moraes // NOSONAR
 * @copyright 2025 - Todos os direitos reservados
 */

import { StateCreator } from 'zustand';
import { KnowledgeGroup, KnowledgeSource, Conversation, LibraryItem, ChatMessage } from '../types';
import { firestore, auth } from '@/firebaseConfig';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, getDocs, writeBatch, onSnapshot, query, orderBy } from 'firebase/firestore';
import { sourceManagerService } from '@/services/sourceManagerService';
import { toast } from '@/hooks/use-toast';
import { ChatSlice } from './chatSlice';

// Definindo a interface para o estado e ações do slice de grupos.
export interface GroupSlice {
  groups: KnowledgeGroup[];
  activeGroupId: string | null;
  sourcesForActiveGroup: KnowledgeSource[];
  conversations: Conversation[];
  libraryItems: LibraryItem[];
  setLibraryItems: (items: LibraryItem[]) => void;
  setGroups: (groups: KnowledgeGroup[]) => void;
  setSourcesForActiveGroup: (sources: KnowledgeSource[]) => void;
  setConversations: (conversations: Conversation[]) => void;
  handleSetGroup: (groupId: string) => void;
  handleAddGroup: (name: string) => Promise<void>;
  handleDeleteGroup: (groupId: string) => Promise<void>;
  handleUpdateGroup: (groupId: string, newName: string) => Promise<void>;
  handleDeleteConversation: (conversationId: string) => Promise<void>;
  initConversationsListener: (groupId: string) => () => void; // Retorna a função de unsubscribe
  initLibraryListener: () => () => void; // Retorna a função de unsubscribe
  initSourcesListener: (groupId: string) => () => void; // Retorna a função de unsubscribe
  initGroupsListener: () => () => void; // Retorna a função de unsubscribe
  handleClearAll: () => Promise<void>;
  handleSaveToLibrary: (message: ChatMessage) => Promise<void>;
  handleDeleteLibraryItem: (id: string) => Promise<void>;
  handleOpenLibraryItem: (item: LibraryItem) => Promise<void>;
  handleUrlAdd: (url: string) => Promise<void>;
  handleFileAdd: (file: File) => Promise<void>;
  handleRemoveSource: (sourceId: string) => Promise<void>;
  handleToggleSourceSelection: (sourceId: string) => Promise<void>;
}

// O StateCreator agora pode acessar outros slices, como o ChatSlice.
export const createGroupSlice: StateCreator<
  GroupSlice & ChatSlice, // O slice combinado
  [],
  [],
  GroupSlice
> = (set, get) => ({
  groups: [],
  activeGroupId: null,
  sourcesForActiveGroup: [],
  conversations: [],
  libraryItems: [],
  setGroups: (groups) => set({ groups }),
  setSourcesForActiveGroup: (sources) => set({ sourcesForActiveGroup: sources }),
  setLibraryItems: (items) => set({ libraryItems: items }),
  setConversations: (conversations) => set({ conversations }),
  handleSetGroup: (groupId) => {
    set({ 
      activeGroupId: groupId, 
      activeConversationId: null, // Reseta a conversa ativa ao trocar de grupo
      chatMessages: [] 
    });
  },
  handleAddGroup: async (name) => {
    const user = get().user;
    if (!user) return;
    const groupsCollectionRef = collection(firestore, 'users', user.uid, 'groups');
    await addDoc(groupsCollectionRef, { name, createdAt: serverTimestamp(), sources: [] });
  },
  handleDeleteGroup: async (groupId) => {
    const user = get().user;
    if (!user) return;
    const groupDocRef = doc(firestore, 'users', user.uid, 'groups', groupId);
    await deleteDoc(groupDocRef);
    toast({ title: "Tópico removido" });
  },
  handleUpdateGroup: async (groupId, newName) => {
    const user = get().user;
    if (!user) return;
    const groupDocRef = doc(firestore, 'users', user.uid, 'groups', groupId);
    await updateDoc(groupDocRef, { name: newName });
    toast({ title: "Tópico atualizado", description: `O nome foi alterado para "${newName}".` });
  },
  initConversationsListener: (groupId) => {
    const user = get().user;
    if (!user) return () => {};

    const convosQuery = query(collection(firestore, 'users', user.uid, 'groups', groupId, 'conversations'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(convosQuery, (snapshot) => {
      const newConversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      set({ conversations: newConversations });
    });
    return unsubscribe;
  },
  initLibraryListener: () => {
    const user = get().user;
    if (!user) return () => {};

    const libraryQuery = query(collection(firestore, 'users', user.uid, 'libraryItems'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(libraryQuery, (snapshot) => {
      const newItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryItem));
      set({ libraryItems: newItems });
    });
    return unsubscribe;
  },
  initSourcesListener: (groupId) => {
    const user = get().user;
    if (!user) return () => {};

    const sourcesQuery = query(collection(firestore, 'users', user.uid, 'groups', groupId, 'sources'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(sourcesQuery, (snapshot) => {
      const newSources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeSource));
      set({ sourcesForActiveGroup: newSources });
    });
    return unsubscribe;
  },
  initGroupsListener: () => {
    const user = get().user;
    if (!user) return () => {};

    const groupsQuery = query(collection(firestore, 'users', user.uid, 'groups'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      const newGroups: KnowledgeGroup[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeGroup));
      const oldGroups = get().groups;

      set({ groups: newGroups });

      // Se um novo grupo foi adicionado, seleciona-o automaticamente.
      if (newGroups.length > oldGroups.length && newGroups.length > 0) {
        get().handleSetGroup(newGroups[0].id);
      }
    });

    return unsubscribe;
  },
  handleDeleteConversation: async (conversationId) => {
    const { user, activeGroupId, activeConversationId } = get();
    if (!user || !activeGroupId) return;

    const convoDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', conversationId);
    const messagesRef = collection(convoDocRef, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
    const batch = writeBatch(firestore);
    messagesSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    await deleteDoc(convoDocRef);

    toast({ title: "Conversa removida" });

    if (conversationId === activeConversationId) {
      get().handleNewConversation();
    }
  },
  handleClearAll: async () => {
    const { user } = get();
    if (!user) return;

    const { dismiss } = toast({ title: "Limpando todos os dados...", description: "Aguarde..." });
    try {
      const groupsRef = collection(firestore, 'users', user.uid, 'groups');
      const groupsSnapshot = await getDocs(groupsRef);
      const batch = writeBatch(firestore);

      for (const groupDoc of groupsSnapshot.docs) {
        const sourcesRef = collection(groupDoc.ref, 'sources');
        const sourcesSnapshot = await getDocs(sourcesRef);
        sourcesSnapshot.forEach(sourceDoc => batch.delete(sourceDoc.ref));

        const conversationsRef = collection(groupDoc.ref, 'conversations');
        const conversationsSnapshot = await getDocs(conversationsRef);
        for (const convoDoc of conversationsSnapshot.docs) {
          const messagesRef = collection(convoDoc.ref, 'messages');
          const messagesSnapshot = await getDocs(messagesRef);
          messagesSnapshot.forEach(messageDoc => batch.delete(messageDoc.ref));
          batch.delete(convoDoc.ref);
        }
        batch.delete(groupDoc.ref);
      }

      // Adiciona a exclusão de todos os itens da biblioteca ao batch
      const libraryItemsRef = collection(firestore, 'users', user.uid, 'libraryItems');
      const libraryItemsSnapshot = await getDocs(libraryItemsRef);
      libraryItemsSnapshot.forEach(doc => batch.delete(doc.ref));

      await batch.commit();
      toast({ title: "Limpeza Concluída" });
    } catch (error) {
      toast({ variant: "destructive", title: "Falha na Limpeza" });
    } finally { dismiss(); }
  },
  handleSaveToLibrary: async (message) => {
    const { user, activeGroupId, activeConversationId } = get();
    if (!user || !activeGroupId || !activeConversationId) return;
    const newItem = {
      type: 'text',
      content: message.text,
      timestamp: new Date(),
      conversationId: activeConversationId,
      groupId: activeGroupId,
      messageId: message.id,
      sourceIds: message.sourceIds || []
    };
    const libraryCollectionRef = collection(firestore, 'users', user.uid, 'libraryItems');
    await addDoc(libraryCollectionRef, { ...newItem, timestamp: serverTimestamp() });
    toast({ title: "Salvo na Biblioteca" });
  },
  handleDeleteLibraryItem: async (id: string) => {
    const { user, libraryItems } = get();
    if (!user) return;
    const itemToDelete = libraryItems.find(item => item.id === id);
    if (!itemToDelete || !itemToDelete.groupId || !itemToDelete.conversationId || !itemToDelete.messageId) {
      toast({ variant: "destructive", title: "Erro", description: "Item da biblioteca não encontrado." });
      return;
    }
    if (itemToDelete.type === 'mindmap') {
      const messageDocRef = doc(firestore, 'users', user.uid, 'groups', itemToDelete.groupId, 'conversations', itemToDelete.conversationId, 'messages', itemToDelete.messageId);
      await updateDoc(messageDocRef, { 'mindMap.isArchived': false, 'mindMap.isVisible': false });
    }
    const libraryItemDocRef = doc(firestore, 'users', user.uid, 'libraryItems', id);
    await deleteDoc(libraryItemDocRef);
    toast({ title: "Item removido da Biblioteca" });
  },
  handleOpenLibraryItem: async (item) => {
    const { activeGroupId, activeConversationId, handleSetGroup, handleSetConversation } = get();
    if (activeGroupId !== item.groupId) {
      await handleSetGroup(item.groupId);
    }
    if (activeConversationId !== item.conversationId) {
      await handleSetConversation(item.conversationId);
    }
    if (item.type === 'mindmap' && item.messageId) {
      const { chatMessages, setMessages } = get();
      const updatedMessages = chatMessages.map(msg => msg.id === item.messageId ? { ...msg, mindMap: { ...msg.mindMap!, isVisible: true } } : msg);
      setMessages(updatedMessages);
    }
  },
  handleUrlAdd: async (url) => {
    const { user, activeGroupId } = get();
    if (!user || !activeGroupId) return;
    try {
      const newSource = await sourceManagerService.addUrlSource(url, activeGroupId);
      const sourcesCollectionRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources');
      await addDoc(sourcesCollectionRef, { ...newSource, timestamp: serverTimestamp() });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao Adicionar URL", description: error instanceof Error ? error.message : "Ocorreu um erro." });
    }
  },
  handleFileAdd: async (file) => {
    const { user, activeGroupId } = get();
    if (!user || !activeGroupId) return;
    try {
      const newSource = await sourceManagerService.addFileSource(file, activeGroupId);
      const sourcesCollectionRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources');
      await addDoc(sourcesCollectionRef, { ...newSource, timestamp: serverTimestamp() });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao Adicionar Arquivo", description: error instanceof Error ? error.message : "Ocorreu um erro." });
    }
  },
  handleRemoveSource: async (sourceId) => {
    const { user, activeGroupId } = get();
    if (!user || !activeGroupId) return;
    const sourceDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources', sourceId);
    await deleteDoc(sourceDocRef);
    toast({ title: "Fonte removida" });
  },
  handleToggleSourceSelection: async (sourceId) => {
    const { user, activeGroupId, sourcesForActiveGroup } = get();
    if (!user || !activeGroupId) return;
    const sourceToUpdate = sourcesForActiveGroup.find(s => s.id === sourceId);
    if (!sourceToUpdate) return;
    const sourceDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources', sourceId);
    await updateDoc(sourceDocRef, { selected: !sourceToUpdate.selected });
  },
});