/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
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
import { firestore, functions } from '@/firebaseConfig';
import { geminiService } from './services/geminiService';
import { db } from './services/dbService';
import { sourceManagerService } from './services/sourceManagerService';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';

import { httpsCallable } from 'firebase/functions';
interface AppContextState {
  conversations: Conversation[];
  groups: KnowledgeGroup[];
  activeGroupId: string | null;
  activeConversationId: string | null;
  isSidebarOpen: boolean;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  libraryItems: LibraryItem[];
  allKnowledgeSources: KnowledgeSource[];
  libraryItemsForActiveContext: LibraryItem[];
  theme: 'light' | 'dark';
  activeGroup: KnowledgeGroup | undefined;
  sourcesForActiveGroup: KnowledgeSource[];
  chatPlaceholder: string;
  showModelSelect: boolean;
  activeConversationName: string;
  activeModel: string;
  isEvaluationPanelOpen: boolean;
  isLibraryPanelOpen: boolean;
  activeQuizData: QuizData | null;
}

interface AppContextActions {
  setTheme: (theme: 'light' | 'dark') => void;
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
  handleRemoveSource: (sourceId: string) => Promise<void>;
  handleToggleSourceSelection: (sourceId: string) => void;
  handleSaveToLibrary: (message: ChatMessage) => Promise<void>;
  handleDeleteLibraryItem: (id: number) => Promise<void>;
  handleOpenLibraryItem: (item: LibraryItem) => Promise<void>;
  handleSendMessage: (query: string, sourceIds: string[], actualPrompt?: string) => Promise<void>;
  handleOptimizePrompt: (query: string, sourceIds: string[]) => Promise<void>;
  handleGenerateMindMap: (messageId: string, text: string) => Promise<void>;
  generateUsageReport: () => Promise<any[]>; // Retorna os dados para o painel
  handleSetModel: (modelName: string) => void;
  handleMindMapLayoutChange: (messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => void;
  handleStartEvaluation: (quizData: QuizData) => void;
  handleCloseEvaluation: () => void;
  setIsLibraryPanelOpen: (isOpen: boolean) => void;
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
  const [allKnowledgeSources, setAllKnowledgeSources] = useState<KnowledgeSource[]>([]);
  
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

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Efeito para sincronizar os Tópicos (Knowledge Groups) com o Firestore
  useEffect(() => {
    // Se não houver usuário logado, não faz nada e limpa o estado.
    if (!user) {
      setGroups([]);
      setConversations([]);
      setChatMessages([]);
      setActiveGroupId(null);
      setActiveConversationId(null);
      return;
    }

    setIsLoading(true);
    // Referência para a subcoleção 'groups' do usuário logado
    const groupsCollectionRef = collection(firestore, 'users', user.uid, 'groups');
    const q = query(groupsCollectionRef, orderBy('createdAt', 'desc'));

    // onSnapshot cria um listener em tempo real
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as KnowledgeGroup));
      setGroups(fetchedGroups);

      // Se o grupo ativo foi deletado ou não existe mais,
      // seleciona o primeiro da lista ou define como nulo se a lista estiver vazia.
      if (!activeGroupId || !fetchedGroups.some(g => g.id === activeGroupId)) {
        setActiveGroupId(fetchedGroups[0]?.id || null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar grupos do Firestore:", error);
      toast({ variant: "destructive", title: "Erro de Conexão", description: "Não foi possível carregar seus tópicos." });
      setIsLoading(false);
    });

    // Função de limpeza: remove o listener quando o componente desmonta ou o usuário muda
    return () => unsubscribe();
  }, [user, activeGroupId]); // Re-executa se o usuário mudar

  // Efeito para carregar as conversas do grupo ativo a partir do Firestore
  useEffect(() => {
    if (!user || !activeGroupId) {
      setConversations([]);
      return;
    }

    const convosRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations');
    const q = query(convosRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedConversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Conversation));
      setConversations(fetchedConversations);
    }, (error) => {
      console.error("Erro ao buscar conversas:", error);
    });

    return () => unsubscribe();
  }, [user, activeGroupId]);

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const sourcesForActiveGroup = activeGroup ? activeGroup.sources : [];

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
  }, [user, activeGroupId, activeConversationId, toast]);

  // Efeito para carregar as mensagens da conversa ativa
  useEffect(() => {
    if (!user || !activeGroupId || !activeConversationId) {
      setChatMessages([]);
      return;
    }

    const messagesRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', activeConversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ChatMessage));
      setChatMessages(fetchedMessages);
    }, (error) => {
      console.error("Erro ao buscar mensagens:", error);
    });

    return () => unsubscribe();
  }, [user, activeGroupId, activeConversationId]);

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
      await db.clearAllData(); // Limpa também o Dexie (biblioteca, etc.)

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
      const groupDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId);
      const currentGroup = groups.find(g => g.id === activeGroupId);
      const updatedSources = [...(currentGroup?.sources || []), newSource];
      await updateDoc(groupDocRef, { sources: updatedSources });
      // O listener do Firestore atualizará a UI.
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Adicionar URL",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
      });
    } finally { setIsLoading(false); }
  }, [user, activeGroupId, groups, toast]);
  
  const handleFileAdd = useCallback(async (file: File) => {
    if (!user || !activeGroupId) return;
    setIsLoading(true);
    try {
      const newSource = await sourceManagerService.addFileSource(file, activeGroupId);
      const groupDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId);
      const currentGroup = groups.find(g => g.id === activeGroupId);
      const updatedSources = [...(currentGroup?.sources || []), newSource];
      await updateDoc(groupDocRef, { sources: updatedSources });
      // O listener do Firestore atualizará a UI.
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Adicionar Arquivo",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
      });
    } finally { setIsLoading(false); }
  }, [user, activeGroupId, groups, toast]);

  const handleRemoveSource = useCallback(async (sourceId: string) => {
    if (!user || !activeGroupId) return;
    const groupDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId);
    const currentGroup = groups.find(g => g.id === activeGroupId);
    const updatedSources = currentGroup?.sources.filter(s => s.id !== sourceId) || [];
    await updateDoc(groupDocRef, { sources: updatedSources });
  }, [user, activeGroupId, groups]);

  const handleToggleSourceSelection = useCallback((sourceId: string) => { // Esta função precisa atualizar o grupo também
    setGroups(prevGroups => prevGroups.map(g => {
      if (g.id === activeGroupId && g.sources) {
        const newSources = g.sources.map(s => s.id === sourceId ? { ...s, selected: !s.selected } : s);
        // Persiste a mudança no banco de dados
        db.knowledgeGroups.update(activeGroupId, { sources: newSources });
        return { ...g, sources: newSources };
      }
      return g;
    }));
  }, [activeGroupId]);

  const handleSaveToLibrary = useCallback(async (message: ChatMessage) => {
    if (!activeGroupId || !activeConversationId) return;
    const newItem: LibraryItem = {
      type: 'text',
      content: message.text, 
      timestamp: new Date(),
      conversationId: activeConversationId,
      groupId: activeGroupId,
      messageId: message.id,
      sourceIds: message.sourceIds || []
    };
    const id = await db.addSavedItem(newItem);
    setLibraryItems(prev => [...prev, { ...newItem, id }].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }, [activeGroupId, activeConversationId]);

  const handleDeleteLibraryItem = useCallback(async (id: number) => {
    const itemToDelete = libraryItems.find(item => item.id === id);
    if (!itemToDelete) return;

    // Se o item for um mapa mental, "desarquiva" na mensagem original.
    if (itemToDelete.type === 'mindmap' && itemToDelete.messageId) {
      const messageId = itemToDelete.messageId;
      setChatMessages(prev => prev.map(msg => {
        if (msg.id === messageId && msg.mindMap) {
          const updatedMindMap = { ...msg.mindMap, isArchived: false, isVisible: false };
          db.updateChatMessage(messageId, { mindMap: updatedMindMap });
          return { ...msg, mindMap: updatedMindMap };
        }
        return msg;
      }));
    }

    await db.deleteSavedItem(id);
    setLibraryItems(prev => prev.filter(item => item.id !== id));
  }, [libraryItems]);

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
  }, [activeGroupId, activeConversationId, handleSetGroup, handleSetConversation]);
  
  const handleSendMessage = useCallback(async (query: string, sourceIds: string[], actualPrompt?: string) => {
    if (!query.trim() || isLoading || !user || !activeGroupId) return;
    const promptForAI = actualPrompt || query;
    setIsLoading(true);
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      let title = "Nova Conversa"; // Título de fallback
      try {
        // Tenta chamar a Cloud Function primeiro
        const generateTitleFunction = httpsCallable(functions, 'generateTitle');
        const result = await generateTitleFunction({ text: query });
        if (typeof result.data === 'object' && result.data !== null && 'title' in result.data) {
          title = (result.data as { title: string }).title;
        }
      } catch (error) {
        console.warn("Falha ao chamar a Cloud Function 'generateTitle'. Usando fallback local.", error);
        // Se a Cloud Function falhar, usa o método local como fallback
        title = await geminiService.generateTitleForConversation(query, activeModel);
      }

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
  }, [isLoading, activeGroupId, activeConversationId, activeModel, sourcesForActiveGroup, user]);

  const handleOptimizePrompt = useCallback(async (query: string, sourceIds: string[]) => {
    if (!query.trim() || isLoading || !user || !activeGroupId) return;
    setIsLoading(true);
    const { dismiss } = toast({
      title: "Otimizando Prompt...",
      description: "Aguarde enquanto a IA gera sugestões.",
    });
  
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      let title = "Nova Conversa"; // Título de fallback
      try {
        // Tenta chamar a Cloud Function primeiro
        const generateTitleFunction = httpsCallable(functions, 'generateTitle');
        const result = await generateTitleFunction({ text: query });
        if (typeof result.data === 'object' && result.data !== null && 'title' in result.data) {
          title = (result.data as { title: string }).title;
        }
      } catch (error) {
        console.warn("Falha ao chamar a Cloud Function 'generateTitle'. Usando fallback local.", error);
        // Se a Cloud Function falhar, usa o método local como fallback
        title = await geminiService.generateTitleForConversation(query, activeModel);
      }

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
  }, [isLoading, user, activeGroupId, activeConversationId, activeModel, sourcesForActiveGroup, toast]);

  const handleGenerateMindMap = useCallback(async (messageId: string, text: string) => {
    if (!activeConversationId) return;
    const { dismiss } = toast({ title: "Gerando Mapa Mental..." });

    // Encontra a mensagem atual para verificar seu estado.
    const currentMessage = chatMessages.find(msg => msg.id === messageId);
    const existingMindMap = currentMessage?.mindMap;

    // Se o mapa já foi gerado, apenas alterna a visibilidade.
    if (existingMindMap && existingMindMap.nodes.length > 0) {
      const updatedMindMap = { ...existingMindMap, isVisible: !existingMindMap.isVisible };
      setChatMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, mindMap: updatedMindMap } : msg));
      await db.updateChatMessage(messageId, { mindMap: updatedMindMap });
      dismiss();
      return;
    }

    // Se não existe, procede com a geração.
    const updateMindMapState = (update: Partial<ChatMessage>) => {
      setChatMessages(prev => {
        const newMessages = prev.map(msg => msg.id === messageId ? { ...msg, ...update } : msg);
        const messageToUpdate = newMessages.find(msg => msg.id === messageId);
        if (messageToUpdate) db.updateChatMessage(messageId, messageToUpdate);
        return newMessages;
      });
    };

    updateMindMapState({ mindMap: { isVisible: true, isLoading: true, error: null, nodes: [], edges: [] } });
    try {
      const { title, nodes, edges } = await geminiService.generateMindMapFromText(text, activeModel);
      if (nodes.length === 0) throw new Error("Não foi possível extrair conceitos para o mapa mental.");
      const rootNode = nodes.find(n => !edges.some(e => e.target === n.id)) || nodes[0];
      
      // Salva o mapa mental na biblioteca
      const libraryItem: LibraryItem = {
        type: 'mindmap',
        content: title, // O título do mapa vai para o conteúdo do item da biblioteca
        timestamp: new Date(),
        conversationId: activeConversationId,
        groupId: activeGroupId!,
        messageId: messageId,
        sourceIds: currentMessage?.sourceIds || []
      };
      const libId = await db.addSavedItem(libraryItem);
      setLibraryItems(prev => [...prev, { ...libraryItem, id: libId }].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));

      updateMindMapState({ 
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
      updateMindMapState({ mindMap: { isVisible: true, isLoading: false, error: e.message, nodes: [], edges: [] } });
    } finally {
      if (!existingMindMap) { // Only dismiss if it was a new generation
        dismiss();
      }
    }
  }, [activeConversationId, chatMessages, activeModel, activeGroupId, toast]);

  const handleMindMapLayoutChange = useCallback((messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.mindMap) {
        const updatedMindMap = { ...msg.mindMap, ...layout };
        db.updateChatMessage(messageId, { mindMap: updatedMindMap });
        return { ...msg, mindMap: updatedMindMap };
      }
      return msg;
    }));
  }, []);

  const generateUsageReport = useCallback(async () => {
    const allMessages = await db.chatMessages.toArray();
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
  }, []);

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
      conversations, groups, activeGroupId, activeConversationId, isSidebarOpen, chatMessages, isLoading, libraryItems, allKnowledgeSources, libraryItemsForActiveContext, theme, activeGroup, sourcesForActiveGroup, chatPlaceholder, showModelSelect, activeConversationName, activeModel, isEvaluationPanelOpen, isLibraryPanelOpen, activeQuizData,
      setTheme, setIsSidebarOpen, handleSetGroup, handleAddGroup, handleDeleteGroup, handleUpdateGroup, handleSetConversation, handleNewConversation, handleDeleteConversation, handleClearAllConversations, handleUrlAdd, handleFileAdd, handleRemoveSource, handleToggleSourceSelection, handleSaveToLibrary, handleDeleteLibraryItem, handleOpenLibraryItem, handleSendMessage, handleOptimizePrompt, handleGenerateMindMap, generateUsageReport, handleSetModel, handleMindMapLayoutChange, handleStartEvaluation, handleCloseEvaluation, setIsLibraryPanelOpen
  }), [conversations, groups, activeGroupId, activeConversationId, isSidebarOpen, chatMessages, isLoading, libraryItems, allKnowledgeSources, libraryItemsForActiveContext, theme, activeGroup, sourcesForActiveGroup, chatPlaceholder, showModelSelect, activeConversationName, activeModel, isEvaluationPanelOpen, isLibraryPanelOpen, activeQuizData, handleSetGroup, handleAddGroup, handleDeleteGroup, handleUpdateGroup, handleSetConversation, handleNewConversation, handleDeleteConversation, handleClearAllConversations, handleUrlAdd, handleFileAdd, handleRemoveSource, handleToggleSourceSelection, handleSaveToLibrary, handleDeleteLibraryItem, handleOpenLibraryItem, handleSendMessage, handleOptimizePrompt, handleGenerateMindMap, generateUsageReport, handleSetModel, handleMindMapLayoutChange, handleStartEvaluation, handleCloseEvaluation, setIsLibraryPanelOpen]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
};