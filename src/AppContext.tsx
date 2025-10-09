/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import {
  Conversation,
  ChatMessage,
  MessageSender,
  KnowledgeGroup,
  KnowledgeSource,
  LibraryItem,
  QuizData,
} from './types';
import { DEFAULT_MODEL, models as modelInfoConfig } from './components/models';
import { useAuth } from './hooks/useAuth';
import { firestore } from '@/firebaseConfig';
import { geminiService } from './services/geminiService';
import { sourceManagerService } from './services/sourceManagerService';
import { useToast } from '@/hooks/use-toast';
import {
  useThemeEffect,
  useGroupsSync,
  useConversationsSync,
  useSourcesSync,
  useMessagesSync,
  useLibrarySync,
} from './hooks/useFirestoreSync';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, serverTimestamp, getDocs, writeBatch, collectionGroup } from 'firebase/firestore';

interface AppContextState {
  conversations: Conversation[];
  groups: KnowledgeGroup[];
  activeGroupId: string | null;
  activeConversationId: string | null;
  isSidebarOpen: boolean;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  libraryItems: LibraryItem[];
  libraryItemsForActiveContext: LibraryItem[];
  activeGroup: KnowledgeGroup | undefined;
  sourcesForActiveGroup: KnowledgeSource[];
  chatPlaceholder: string;
  showModelSelect: boolean;
  activeConversationName: string;
  activeModel: string;
  isEvaluationPanelOpen: boolean;
  isLibraryPanelOpen: boolean;
  activeQuizData: QuizData | null;
  theme: 'light' | 'dark';
}

interface AppContextActions {
  setIsSidebarOpen: (isOpen: boolean) => void;
  handleSetGroup: (groupId: string) => Promise<void>;
  handleAddGroup: (name: string) => Promise<void>;
  handleDeleteGroup: (groupId: string) => Promise<void>;
  handleUpdateGroup: (groupId: string, newName: string) => Promise<void>;
  handleSetConversation: (id: string) => Promise<void>;
  handleNewConversation: () => void;
  handleDeleteConversation: (id: string) => Promise<void>;
  handleClearAllConversations: () => Promise<void>;
  handleUrlAdd: (url: string) => Promise<void>;
  handleFileAdd: (file: File) => Promise<void>;
  handleRemoveSource: (sourceId: string) => Promise<void>; // NOSONAR
  handleToggleSourceSelection: (sourceId: string) => void;
  handleSaveToLibrary: (message: ChatMessage) => Promise<void>;
  handleDeleteLibraryItem: (id: string) => Promise<void>;
  handleOpenLibraryItem: (item: LibraryItem) => Promise<void>;
  handleSendMessage: (query: string, sourceIds: string[], actualPrompt?: string) => Promise<void>;
  handleOptimizePrompt: (query: string, sourceIds: string[]) => Promise<void>;
  handleGenerateMindMap: (firestoreDocId: string) => Promise<void>;
  generateUsageReport: () => Promise<any[]>;
  handleSetModel: (modelName: string) => void;
  handleMindMapLayoutChange: (messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => void;
  handleStartEvaluation: (quizData: QuizData) => void;
  handleCloseEvaluation: () => void;
  setIsLibraryPanelOpen: (isOpen: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

type AppContextType = AppContextState & AppContextActions;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => { // NOSONAR
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<KnowledgeGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  
  const [sourcesForActiveGroup, setSourcesForActiveGroup] = useState<KnowledgeSource[]>([]);
  // Lê a variável de ambiente para controlar a visibilidade do seletor de modelo.
  const showModelSelect = import.meta.env.VITE_SHOW_MODEL_SELECT === 'true';

  const [activeModel, setActiveModel] = useState<string>(() => {
    // Se o seletor estiver oculto, força o modelo padrão. Caso contrário, usa o do localStorage ou o padrão.
    return showModelSelect ? (localStorage.getItem('activeModel') || DEFAULT_MODEL) : 'gemini-2.5-flash-lite';
  });

  // Estado para o painel de avaliação
  const [isEvaluationPanelOpen, setIsEvaluationPanelOpen] = useState(false);
  const [isLibraryPanelOpen, setIsLibraryPanelOpen] = useState(false);
  const [activeQuizData, setActiveQuizData] = useState<QuizData | null>(null);


  const { toast } = useToast();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemPrefersDark ? "dark" : "light";
  });

  // --- Custom Hooks for Data Synchronization ---
  useThemeEffect(theme);
  useGroupsSync(user, activeGroupId, setGroups, setActiveGroupId, setIsLoading, toast);
  useConversationsSync(user, activeGroupId, setConversations);
  useSourcesSync(user, activeGroupId, setSourcesForActiveGroup);
  useMessagesSync(user, activeGroupId, activeConversationId, setChatMessages);
  useLibrarySync(user, setLibraryItems);

  // Limpa estados quando o usuário faz logout
  useEffect(() => {
    if (!user) {
      setGroups([]);
      setConversations([]);
      setChatMessages([]);
      setActiveGroupId(null);
      setActiveConversationId(null);
      setLibraryItems([]);
    }
  }, [user]);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  // Filtra os itens da biblioteca para o grupo ativo.
  const libraryItemsForActiveContext = activeGroupId 
    ? libraryItems.filter(item => item.groupId === activeGroupId)
    : [];

  const handleSetModel = useCallback((modelName: string) => {
    setActiveModel(modelName);
    if (showModelSelect) {
      localStorage.setItem('activeModel', modelName);
    }
  }, []);

  const handleSetGroup = useCallback(async (groupId: string) => {
    setActiveGroupId(groupId);
    // O useEffect acima cuidará de carregar as conversas
    setActiveConversationId(null);
    setChatMessages([]);
  }, []);

  const handleAddGroup = useCallback(async (name: string) => {
    if (!user) return;
    const groupsCollectionRef = collection(firestore, 'users', user.uid, 'groups');
    await addDoc(groupsCollectionRef, { name, createdAt: serverTimestamp(), sources: [] });
    // O listener onSnapshot cuidará de atualizar a UI.
    // O novo grupo será o primeiro da lista e será selecionado automaticamente.
  }, [user]);

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    if (!user) return;
    
    // Deleta o documento do grupo no Firestore
    const groupDocRef = doc(firestore, 'users', user.uid, 'groups', groupId);
    await deleteDoc(groupDocRef);

    // O listener onSnapshot atualizará o estado da UI automaticamente.
    toast({ title: "Tópico removido" });
  }, [user, toast]);

  const handleUpdateGroup = useCallback(async (groupId: string, newName: string) => {
    if (!user) return;

    const groupDocRef = doc(firestore, 'users', user.uid, 'groups', groupId);
    await updateDoc(groupDocRef, { name: newName });

    // O listener onSnapshot atualizará o estado da UI automaticamente.
    toast({ title: "Tópico atualizado", description: `O nome do tópico foi alterado para "${newName}".` });
  }, [user, toast]);

  const handleSetConversation = useCallback(async (id: string) => {
    if (id === activeConversationId) return;
    setActiveConversationId(id);
    // O useEffect abaixo cuidará de carregar as mensagens
  }, [activeConversationId]);

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setChatMessages([]);
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    if (!user || !activeGroupId) {
      toast({ variant: "destructive", title: "Erro", description: "Nenhum usuário ou tópico ativo." });
      return;
    }

    const convoDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', id);
    
    // Deleta a conversa e suas subcoleções (mensagens)
    // O Firestore não deleta subcoleções automaticamente, então precisamos fazer isso manualmente.
    const messagesRef = collection(convoDocRef, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
    const batch = writeBatch(firestore);
    messagesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    await deleteDoc(convoDocRef);

    // O listener de conversas atualizará a UI.
    toast({ title: "Conversa removida" });

    // Se a conversa ativa foi deletada, limpa a seleção.
    if (id === activeConversationId) {
      setActiveConversationId(null);
      setChatMessages([]);
    }
  }, [user, activeGroupId, activeConversationId, toast, setChatMessages]);

  const handleClearAllConversations = useCallback(async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Nenhum usuário logado." });
      return;
    }

    const { dismiss } = toast({ title: "Limpando todos os dados...", description: "Aguarde, isso pode levar um momento." });
    setIsLoading(true);

    try {
      const groupsRef = collection(firestore, 'users', user.uid, 'groups');
      const groupsSnapshot = await getDocs(groupsRef);
      const batch = writeBatch(firestore);

      for (const groupDoc of groupsSnapshot.docs) {
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

      await batch.commit();

      toast({ title: "Limpeza Concluída", description: "Todos os seus dados foram removidos." });
    } catch (error) {
      console.error("Erro ao limpar dados do Firestore:", error);
      toast({ variant: "destructive", title: "Falha na Limpeza", description: "Não foi possível remover todos os dados." });
    } finally {
      setIsLoading(false);
      dismiss();
    }
  }, [user, toast]);

  const handleUrlAdd = useCallback(async (url: string) => {
    if (!user || !activeGroupId) return;
    setIsLoading(true);
    try {
      const newSource = await sourceManagerService.addUrlSource(url, activeGroupId);
      const sourcesCollectionRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources');
      await addDoc(sourcesCollectionRef, { ...newSource, timestamp: serverTimestamp() });
      // O listener de sources cuidará de atualizar a UI.
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Adicionar URL",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
      });
    } finally { setIsLoading(false); }
  }, [user, activeGroupId, toast]);

  const handleFileAdd = useCallback(async (file: File) => {
    if (!user || !activeGroupId) return;
    setIsLoading(true);
    try {
      const newSource = await sourceManagerService.addFileSource(file, activeGroupId);
      const sourcesCollectionRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources');
      await addDoc(sourcesCollectionRef, { ...newSource, timestamp: serverTimestamp() });
      // O listener de sources cuidará de atualizar a UI.
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Adicionar Arquivo",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
      });
    } finally { setIsLoading(false); }
  }, [user, activeGroupId, toast]);

  const handleRemoveSource = useCallback(async (sourceId: string) => {
    if (!user || !activeGroupId) return;
    const sourceDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources', sourceId);
    await deleteDoc(sourceDocRef);
    toast({ title: "Fonte removida", description: "A fonte de conhecimento foi removida do tópico." });
  }, [user, activeGroupId, toast]);

  const handleToggleSourceSelection = useCallback(async (sourceId: string) => {
    if (!user || !activeGroupId) return;

    const sourceToUpdate = sourcesForActiveGroup.find(s => s.id === sourceId);
    if (!sourceToUpdate) return;

    const sourceDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources', sourceId);
    await updateDoc(sourceDocRef, { selected: !sourceToUpdate.selected });
    // O listener onSnapshot cuidará de atualizar a UI.
  }, [user, activeGroupId, sourcesForActiveGroup]);

  const handleSaveToLibrary = useCallback(async (message: ChatMessage) => {
    if (!user || !activeGroupId || !activeConversationId) return;
    const newItem = {
      type: 'text',
      content: message.text, 
      timestamp: new Date(),
      conversationId: activeConversationId,
      groupId: activeGroupId,
      messageId: message.id, // Firestore will generate its own ID for the library item
      sourceIds: message.sourceIds || []
    };

    const libraryCollectionRef = collection(firestore, 'users', user.uid, 'libraryItems');
    await addDoc(libraryCollectionRef, { ...newItem, timestamp: serverTimestamp() });
    // The onSnapshot for libraryItems will update the state.
    toast({ title: "Salvo na Biblioteca", description: "A mensagem foi adicionada à sua biblioteca." });
  }, [user, activeGroupId, activeConversationId, toast]);

  const handleDeleteLibraryItem = useCallback(async (id: string) => {
    if (!user) return;

    // Find the item in the local state to get its details (groupId, conversationId, messageId)
    const itemToDelete = libraryItems.find(item => item.id === id); // 'id' here is the Firestore doc ID
    if (!itemToDelete || !itemToDelete.groupId || !itemToDelete.conversationId || !itemToDelete.messageId) {
      toast({ variant: "destructive", title: "Erro", description: "Item da biblioteca não encontrado ou incompleto." });
      return;
    }

    // Se o item for um mapa mental, "desarquiva" na mensagem original.
    if (itemToDelete.type === 'mindmap' && itemToDelete.messageId) {
      setChatMessages(prev => prev.map(msg => {
        if (msg.id === itemToDelete.messageId && msg.mindMap) {
          const updatedMindMap = { ...msg.mindMap, isArchived: false, isVisible: false };
          return { ...msg, mindMap: updatedMindMap };
        }
        return msg;
      }));
    }

    // Update Firestore for the message's mindMap state
    if (itemToDelete.type === 'mindmap' && itemToDelete.messageId) {
      const messageDocRef = doc(firestore, 'users', user.uid, 'groups', itemToDelete.groupId, 'conversations', itemToDelete.conversationId, 'messages', itemToDelete.messageId);
      await updateDoc(messageDocRef, { 'mindMap.isArchived': false, 'mindMap.isVisible': false });
    }

    // Delete the library item from Firestore
    const libraryItemDocRef = doc(firestore, 'users', user.uid, 'libraryItems', id);
    await deleteDoc(libraryItemDocRef);
    toast({ title: "Item removido da Biblioteca" });
  }, [user, libraryItems, toast]);

  const handleOpenLibraryItem = useCallback(async (item: LibraryItem) => {
    // Navega para o grupo e conversa corretos
    if (activeGroupId !== item.groupId) {
      await handleSetGroup(item.groupId);
    }
    if (activeConversationId !== item.conversationId) {
      await handleSetConversation(item.conversationId);
    }

    // Se for um mapa mental, torna-o visível
    if (item.type === 'mindmap' && item.messageId) {
      setChatMessages(prev => prev.map(msg => {
        if (msg.id === item.messageId && msg.mindMap) {
          return { ...msg, mindMap: { ...msg.mindMap, isVisible: true } };
        }
        return msg;
      }));
    }
  }, [activeGroupId, activeConversationId, handleSetGroup, handleSetConversation, user]);
  
  const handleSendMessage = useCallback(async (query: string, sourceIds: string[], actualPrompt?: string) => {
    if (!query.trim() || isLoading || !user || !activeGroupId) return;
    const promptForAI = actualPrompt || query;
    setIsLoading(true);
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      const title = await geminiService.generateTitleForConversation(query);
      const convosRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations');
      const newConvoDoc = await addDoc(convosRef, {
        name: title,
        groupId: activeGroupId,
        timestamp: serverTimestamp(),
      });
      currentConversationId = newConvoDoc.id;
      setActiveConversationId(currentConversationId);
    }

    const messagesRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', currentConversationId, 'messages');

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, conversationId: currentConversationId, text: query, sender: MessageSender.USER, timestamp: new Date(), sourceIds };
    const modelPlaceholder: ChatMessage = { id: `model-${Date.now()}`, conversationId: currentConversationId, text: 'Processando...', sender: MessageSender.MODEL, timestamp: new Date(), isLoading: true, sourceIds };
    
    setChatMessages(prev => [...prev, userMessage, modelPlaceholder]);
    
    // Salva as mensagens no Firestore
    await addDoc(messagesRef, { ...userMessage, timestamp: serverTimestamp() });
    const modelPlaceholderDocRef = await addDoc(messagesRef, { ...modelPlaceholder, timestamp: serverTimestamp() });

    try {
      const selectedSources = sourcesForActiveGroup.filter(s => sourceIds.includes(s.id));
      const response = await geminiService.generateContentWithSources(promptForAI, selectedSources, activeModel);
      
      // Cria o objeto base da mensagem final
      const finalMessage: Partial<ChatMessage> = { 
        ...modelPlaceholder, 
        text: response.text, 
        isLoading: false, 
        model: response.modelName,
        usageMetadata: response.usageMetadata,
      };
      // Adiciona urlContext apenas se ele existir, para evitar 'undefined' no Firestore.
      if (response.urlContextMetadata) {
        finalMessage.urlContext = response.urlContextMetadata;
      }

      // A UI será atualizada pelo listener. Apenas atualizamos o documento no Firestore.
      await updateDoc(modelPlaceholderDocRef, { ...finalMessage, timestamp: serverTimestamp() });
    } catch (e: any) {
      const errorMessage: ChatMessage = { ...modelPlaceholder, text: `Erro: ${e.message}`, sender: MessageSender.SYSTEM, isLoading: false };
      toast({
        variant: "destructive",
        title: "Erro na Resposta da IA",
        description: e.message,
      });
      // A UI será atualizada pelo listener. Apenas atualizamos o documento no Firestore.
      await updateDoc(modelPlaceholderDocRef, { ...errorMessage, timestamp: serverTimestamp() });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeGroupId, activeConversationId, activeModel, sourcesForActiveGroup, user, toast]);

  const handleOptimizePrompt = useCallback(async (query: string, sourceIds: string[]) => {
    if (!query.trim() || isLoading || !user || !activeGroupId) return;
    setIsLoading(true);
    const { dismiss } = toast({
      title: "Otimizando Prompt...",
      description: "Aguarde enquanto a IA gera sugestões.",
    });
  
    // CORREÇÃO: Lógica para criar nova conversa e título, se necessário.
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      // A função generateTitleForConversation agora não precisa mais do modelName.
      const title = await geminiService.generateTitleForConversation(query);
      const convosRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations');
      const newConvoDoc = await addDoc(convosRef, {
        name: title,
        groupId: activeGroupId,
        timestamp: serverTimestamp(),
      });
      currentConversationId = newConvoDoc.id;
      // Define a nova conversa como ativa para que as mensagens subsequentes sejam adicionadas a ela.
      // O listener do Firestore cuidará de atualizar a lista de conversas na UI.
      await handleSetConversation(currentConversationId);
    }
  
    // Garante que temos um ID de conversa antes de prosseguir.
    if (!currentConversationId) {
      toast({variant: "destructive", title: "Erro", description: "Não foi possível criar ou encontrar uma conversa ativa."});
      setIsLoading(false);
      dismiss();
      return;
    }

    const messagesRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', currentConversationId, 'messages');
  
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, conversationId: currentConversationId, text: query, sender: MessageSender.USER, timestamp: new Date(), sourceIds };
    const systemPlaceholder: ChatMessage = { id: `system-loading-${Date.now()}`, conversationId: currentConversationId, text: 'Otimizando prompt...', sender: MessageSender.SYSTEM, timestamp: new Date(), isLoading: true };
    
    setChatMessages(prev => [...prev, userMessage, systemPlaceholder]);
    
    // Salva as mensagens no Firestore
    await addDoc(messagesRef, { ...userMessage, timestamp: serverTimestamp() });
    const systemPlaceholderDocRef = await addDoc(messagesRef, { ...systemPlaceholder, timestamp: serverTimestamp() });
  
    try {
      const selectedSources = sourcesForActiveGroup.filter(s => sourceIds.includes(s.id));
      const suggestions = await geminiService.generateOptimizedPrompts(query, selectedSources, activeModel);
  
      const systemMessage: ChatMessage = {
        ...systemPlaceholder,
        text: "Aqui estão algumas sugestões para refinar sua pergunta:",
        isLoading: false,
        optimizedPrompts: suggestions,
        sourceIds: sourceIds,
      };
  
      // A UI será atualizada pelo listener. Apenas atualizamos o documento no Firestore.
      await updateDoc(systemPlaceholderDocRef, { ...systemMessage, timestamp: serverTimestamp() });
  
      toast({
        variant: "success",
        title: "Sugestões Prontas!",
        description: "Escolha uma das opções para refinar sua pesquisa.",
      });
    } catch (e: any) {
      const errorMessage: ChatMessage = { ...systemPlaceholder, text: `Erro ao otimizar: ${e.message}`, sender: MessageSender.SYSTEM, isLoading: false };
      toast({
        variant: "destructive",
        title: "Erro ao Otimizar",
        description: e.message,
      });
      await updateDoc(systemPlaceholderDocRef, { ...errorMessage, timestamp: serverTimestamp() });
    } finally { 
      setIsLoading(false); 
      dismiss();
    }
  }, [isLoading, user, activeGroupId, activeConversationId, activeModel, sourcesForActiveGroup, toast, handleSetConversation]);

  const handleGenerateMindMap = useCallback(async (firestoreDocId: string) => {
    if (!activeConversationId) return;
    const messageIdToUpdate = firestoreDocId; // Garante que estamos usando o ID correto do Firestore
    const { dismiss } = toast({ title: "Gerando Mapa Mental..." });

    // Encontra a mensagem atual para verificar seu estado.
    // CORREÇÃO: Busca a mensagem mais recente do estado `chatMessages` em vez de usar o objeto `message` obsoleto do parâmetro.
    // Isso garante que estamos sempre trabalhando com a versão mais atualizada da mensagem.
    const currentMessageState = chatMessages.find(msg => msg.id === messageIdToUpdate);
    if (!currentMessageState) {
      dismiss();
      return;
    }
    const existingMindMap = currentMessageState.mindMap;

    // Se o mapa já foi gerado, apenas alterna a visibilidade.
    if (existingMindMap && existingMindMap.nodes.length > 0) {
      const updatedMindMap = { ...existingMindMap, isVisible: !existingMindMap.isVisible };
      // Atualiza o estado local para feedback imediato
      setChatMessages(prev => prev.map(msg => msg.id === messageIdToUpdate ? { ...msg, mindMap: updatedMindMap } : msg));
      // Persiste a mudança no Firestore
      if (user && activeGroupId && activeConversationId) {
        const messageDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', activeConversationId, 'messages', messageIdToUpdate);
        await updateDoc(messageDocRef, { mindMap: updatedMindMap });
      }
      dismiss();
      return;
    }

    // Se não existe, procede com a geração.
    const updateMindMapState = async (update: Partial<ChatMessage>) => {
      setChatMessages(prev => prev.map(msg => msg.id === messageIdToUpdate ? { ...msg, ...update } : msg));
      // Persiste a mudança no Firestore
      if (user && activeGroupId && activeConversationId) {
        const messageDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', activeConversationId, 'messages', messageIdToUpdate);
        await updateDoc(messageDocRef, { mindMap: update.mindMap });
      }
    };

    await updateMindMapState({ mindMap: { isVisible: true, isLoading: true, error: null, nodes: [], edges: [] } });
    try {
      const { title, nodes, edges } = await geminiService.generateMindMapFromText(currentMessageState.text, activeModel);
      if (nodes.length === 0) throw new Error("Não foi possível extrair conceitos para o mapa mental.");
      const rootNode = nodes.find(n => !edges.some(e => e.target === n.id)) || nodes[0];
      
      // Salva o mapa mental na biblioteca
      const libraryItem = {
        type: 'mindmap', // O tipo do item é 'mindmap'
        content: title, // O título do mapa vai para o conteúdo do item da biblioteca
        timestamp: new Date(),
        conversationId: activeConversationId,
        groupId: activeGroupId,
        messageId: messageIdToUpdate, // Usa o ID correto do Firestore para referência
        sourceIds: currentMessageState.sourceIds || [] // Usa as fontes da mensagem original
      };
      if (user) {
        const libraryCollectionRef = collection(firestore, 'users', user.uid, 'libraryItems');
        await addDoc(libraryCollectionRef, { ...libraryItem, timestamp: serverTimestamp() });
      }

      await updateMindMapState({ 
        mindMap: { 
          title: title,
          isVisible: true, 
          isLoading: false, 
          error: null, 
          nodes: nodes, 
          edges: edges,
          isArchived: true, // Marca como arquivado para esconder o botão
          expandedNodeIds: rootNode ? [rootNode.id] : [], // Inicia com o nó raiz expandido
          nodePositions: {}, // Inicia sem posições manuais
        } 
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erro no Mapa Mental",
        description: e.message,
      });
      await updateMindMapState({ mindMap: { isVisible: true, isLoading: false, error: e.message, nodes: [], edges: [] } });
    } finally {
      if (!existingMindMap) { // Only dismiss if it was a new generation
        dismiss();
      }
    }
  }, [user, activeConversationId, chatMessages, activeModel, activeGroupId, toast]);

  const handleMindMapLayoutChange = useCallback(async (messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => { // NOSONAR
    if (!user || !activeGroupId || !activeConversationId) return;
    // Apenas persiste as mudanças no Firestore. O estado local do MindMapDisplay é a fonte da verdade para o layout.
    const messageDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', activeConversationId, 'messages', messageId);
    await updateDoc(messageDocRef, { 'mindMap.expandedNodeIds': layout.expandedNodeIds, 'mindMap.nodePositions': layout.nodePositions });
  }, [user, activeGroupId, activeConversationId]);

  const generateUsageReport = useCallback(async () => {
    if (!user) return [];

    // Use a collection group query to get all messages from all conversations
    const messagesCollectionGroupRef = collectionGroup(firestore, `users/${user.uid}/groups`);
    const q = query(messagesCollectionGroupRef);
    const querySnapshot = await getDocs(q);

    const allMessages: ChatMessage[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ChatMessage));

    const usageMap = new Map<string, { totalInputTokens: number; totalOutputTokens: number; interactionCount: number }>();

    allMessages.forEach(msg => {
      if (msg.sender === MessageSender.MODEL && msg.usageMetadata && msg.model) {
        const stats = usageMap.get(msg.model) || { totalInputTokens: 0, totalOutputTokens: 0, interactionCount: 0 };
        stats.totalInputTokens += msg.usageMetadata.promptTokenCount;
        stats.totalOutputTokens += msg.usageMetadata.candidatesTokenCount;
        stats.interactionCount += 1;
        usageMap.set(msg.model, stats);
      }
    });

    const reportData = Array.from(usageMap.entries()).map(([modelName, stats]) => {
      const modelInfo = modelInfoConfig[modelName];
      const costPerMillionInput = modelInfo ? modelInfo.in : 0;
      const costPerMillionOutput = modelInfo ? modelInfo.out : 0;

      const estimatedCost = ((stats.totalInputTokens / 1_000_000) * costPerMillionInput) + ((stats.totalOutputTokens / 1_000_000) * costPerMillionOutput);

      return {
        modelName,
        ...stats,
        totalTokens: stats.totalInputTokens + stats.totalOutputTokens,
        estimatedCost,
      };
    });

    return reportData.sort((a, b) => b.totalTokens - a.totalTokens);
  }, [user]);

  const chatPlaceholder = useMemo(() => sourcesForActiveGroup.filter(s => s.selected).length > 0
      ? `Perguntar sobre as ${sourcesForActiveGroup.filter(s => s.selected).length} fontes selecionadas...`
      : "Comece uma nova conversa ou adicione fontes.", [sourcesForActiveGroup]);

  const activeConversationName = useMemo(() => 
      conversations.find(c => c.id === activeConversationId)?.name || 
      (activeConversationId === null && chatMessages.length === 0 ? "Nova Conversa" : "Navegador de Documentos"), 
  [conversations, activeConversationId, chatMessages.length]);

  const handleStartEvaluation = useCallback((quizData: QuizData) => {
    setActiveQuizData(quizData);
    setIsEvaluationPanelOpen(true);
  }, []);

  const handleCloseEvaluation = useCallback(() => {
    setIsEvaluationPanelOpen(false);
    // Atraso para permitir a animação de saída antes de limpar os dados
    setTimeout(() => setActiveQuizData(null), 300);
  }, []);

  const value = useMemo(() => ({
      conversations, groups, activeGroupId, activeConversationId, isSidebarOpen, chatMessages, isLoading, libraryItems, libraryItemsForActiveContext, activeGroup, sourcesForActiveGroup, chatPlaceholder, showModelSelect, activeConversationName, activeModel, isEvaluationPanelOpen, isLibraryPanelOpen, activeQuizData, theme,
      setIsSidebarOpen, handleSetGroup, handleAddGroup, handleDeleteGroup, handleUpdateGroup, handleSetConversation, handleNewConversation, handleDeleteConversation, handleClearAllConversations, handleUrlAdd, handleFileAdd, handleRemoveSource, handleToggleSourceSelection, handleSaveToLibrary, handleDeleteLibraryItem, handleOpenLibraryItem, handleSendMessage, handleOptimizePrompt, handleGenerateMindMap, generateUsageReport, handleSetModel, handleMindMapLayoutChange, handleStartEvaluation, handleCloseEvaluation, setIsLibraryPanelOpen, setTheme
  // The dependency array is simplified to only include state variables and functions
  // that are not guaranteed to be stable. Functions from `useState` setters or
  // `useCallback` with empty dependency arrays are stable and can be omitted.
  // Other `useCallback` functions are included because their own dependencies might change.
  }), [
      conversations,
      groups,
      activeGroupId,
      activeConversationId,
      isSidebarOpen,
      chatMessages,
      isLoading,
      libraryItems,
      libraryItemsForActiveContext,
      activeGroup,
      sourcesForActiveGroup,
      chatPlaceholder,
      showModelSelect,
      activeConversationName,
      activeModel,
      isEvaluationPanelOpen,
      isLibraryPanelOpen,
      activeQuizData,
      theme,
      handleDeleteConversation,
      handleDeleteLibraryItem,
      handleGenerateMindMap,
      handleOptimizePrompt,
      handleSendMessage,
      handleToggleSourceSelection,
      handleOpenLibraryItem,
      handleMindMapLayoutChange
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
};