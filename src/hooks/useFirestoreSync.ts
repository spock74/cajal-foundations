/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import { useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/firebaseConfig';
import { 
  KnowledgeGroup, 
  Conversation, 
  KnowledgeSource, 
  ChatMessage, 
  LibraryItem 
} from '@/types';

/**
 * Hook para sincronizar o tema da aplicação com o localStorage e o DOM.
 * @param theme O tema atual ('light' ou 'dark').
 */
export const useThemeEffect = (theme: 'light' | 'dark') => {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
};

/**
 * Hook para sincronizar os grupos de conhecimento (tópicos) do usuário.
 */
export const useGroupsSync = (
  user: any,
  activeGroupId: string | null,
  setGroups: (groups: KnowledgeGroup[]) => void,
  setActiveGroupId: (id: string | null) => void,
  setIsLoading: (loading: boolean) => void,
  toast: (options: any) => void
) => {
  useEffect(() => {
    if (!user) {
      setGroups([]);
      setActiveGroupId(null);
      return;
    }

    setIsLoading(true);
    const groupsCollectionRef = collection(firestore, 'users', user.uid, 'groups');
    const q = query(groupsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeGroup));
      setGroups(fetchedGroups);

      if (!activeGroupId || !fetchedGroups.some(g => g.id === activeGroupId)) {
        setActiveGroupId(fetchedGroups[0]?.id || null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar grupos do Firestore:", error);
      toast({ variant: "destructive", title: "Erro de Conexão", description: "Não foi possível carregar seus tópicos." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeGroupId]); // A dependência activeGroupId é necessária para reavaliar o grupo ativo.
};

/**
 * Hook para sincronizar as conversas do grupo ativo.
 */
export const useConversationsSync = (
  user: any,
  activeGroupId: string | null,
  setConversations: (conversations: Conversation[]) => void
) => {
  useEffect(() => {
    if (!user || !activeGroupId) {
      setConversations([]);
      return;
    }

    const convosRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations');
    const q = query(convosRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedConversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      setConversations(fetchedConversations);
    }, (error) => console.error("Erro ao buscar conversas:", error));

    return () => unsubscribe();
  }, [user, activeGroupId]);
};

/**
 * Hook para sincronizar as fontes de conhecimento do grupo ativo.
 */
export const useSourcesSync = (
  user: any,
  activeGroupId: string | null,
  setSources: (sources: KnowledgeSource[]) => void
) => {
  useEffect(() => {
    if (!user || !activeGroupId) {
      setSources([]);
      return;
    }

    const sourcesRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources');
    const q = query(sourcesRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: (doc.data().timestamp as any)?.toDate() } as KnowledgeSource));
      setSources(fetchedSources);
    }, (error) => console.error("Erro ao buscar fontes de conhecimento:", error));

    return () => unsubscribe();
  }, [user, activeGroupId]);
};

/**
 * Hook para sincronizar as mensagens da conversa ativa.
 */
export const useMessagesSync = (
  user: any,
  activeGroupId: string | null,
  activeConversationId: string | null,
  setMessages: (messages: ChatMessage[]) => void
) => {
  useEffect(() => {
    if (!user || !activeGroupId || !activeConversationId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', activeConversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(fetchedMessages);
    }, (error) => console.error("Erro ao buscar mensagens:", error));

    return () => unsubscribe();
  }, [user, activeGroupId, activeConversationId]);
};

/**
 * Hook para sincronizar os itens da biblioteca do usuário.
 */
export const useLibrarySync = (
  user: any,
  setLibraryItems: (items: LibraryItem[]) => void
) => {
  useEffect(() => {
    if (!user) {
      setLibraryItems([]);
      return;
    }

    const libraryCollectionRef = collection(firestore, 'users', user.uid, 'libraryItems');
    const q = query(libraryCollectionRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: (doc.data().timestamp as any)?.toDate() } as unknown as LibraryItem));
      setLibraryItems(fetchedItems);
    }, (error) => console.error("Erro ao buscar itens da biblioteca:", error));

    return () => unsubscribe();
  }, [user, setLibraryItems]);
};