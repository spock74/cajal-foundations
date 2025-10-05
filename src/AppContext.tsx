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
import { geminiService } from './services/geminiService';
import { db } from './services/dbService';
import { sourceManagerService } from './services/sourceManagerService';
import { useToast } from '@/hooks/use-toast';

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<KnowledgeGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [allKnowledgeSources, setAllKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [activeModel, setActiveModel] = useState<string>(() => {
    return localStorage.getItem('activeModel') || DEFAULT_MODEL;
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

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        let savedGroups = await db.getAllKnowledgeGroups();
        if (savedGroups.length === 0) {
          const defaultGroup = { id: `group-${Date.now()}`, name: "Tópico Geral", sources: [] };
          await db.addKnowledgeGroup(defaultGroup);
          savedGroups = [defaultGroup];
        }
        setGroups(savedGroups);
        
        const lastActiveGroupId = savedGroups[0].id;
        setActiveGroupId(lastActiveGroupId);

        const convosForGroup = await db.getConversationsForGroup(lastActiveGroupId);
        setConversations(convosForGroup);
        
        const items = await db.getAllSavedItems();
        setLibraryItems(items);

        const sources = await db.getAllSourcesMetadata();
        setAllKnowledgeSources(sources);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const sourcesForActiveGroup = activeGroup ? activeGroup.sources : [];

  // Filtra os itens da biblioteca para o grupo ativo.
  const libraryItemsForActiveContext = activeGroupId 
    ? libraryItems.filter(item => item.groupId === activeGroupId)
    : [];

  const handleSetModel = useCallback((modelName: string) => {
    setActiveModel(modelName);
    localStorage.setItem('activeModel', modelName);
  }, []);

  const handleSetGroup = useCallback(async (groupId: string) => {
    setActiveGroupId(groupId);
    const convosForGroup = await db.getConversationsForGroup(groupId);
    setConversations(convosForGroup);
    setActiveConversationId(null);
    setChatMessages([]);
  }, []);

  const handleAddGroup = useCallback(async (name: string) => {
    const newGroup = { id: `group-${Date.now()}`, name, sources: [] };
    await db.addKnowledgeGroup(newGroup);
    setGroups(prev => [...prev, newGroup]);
    await handleSetGroup(newGroup.id);
  }, [handleSetGroup]);

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    await db.deleteKnowledgeGroup(groupId);
    const remainingGroups = groups.filter(g => g.id !== groupId);
    setGroups(remainingGroups);

    if (activeGroupId === groupId) {
      if (remainingGroups.length > 0) {
        await handleSetGroup(remainingGroups[0].id);
      } else {
        // Lidar com o caso em que não há mais grupos
      }
    }
    toast({ title: "Tópico removido", description: "O tópico e todas as suas conversas foram removidos." });
  }, [groups, activeGroupId, handleSetGroup, toast]);

  const handleUpdateGroup = useCallback(async (groupId: string, newName: string) => {
    await db.knowledgeGroups.update(groupId, { name: newName });
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
    toast({ title: "Tópico atualizado", description: `O nome do tópico foi alterado para "${newName}".` });
  }, [toast]);

  const handleSetConversation = useCallback(async (id: string) => {
    if (id === activeConversationId) return;
    const messages = await db.getMessagesForConversation(id);
    setChatMessages(messages);
    setActiveConversationId(id);
  }, [activeConversationId]);

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setChatMessages([]);
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    await db.deleteConversation(id);
    const newConversations = conversations.filter(c => c.id !== id);
    setConversations(newConversations);
    // Remove também os itens da biblioteca associados à conversa deletada do estado da UI.
    setLibraryItems(prev => prev.filter(item => item.conversationId !== id));
    if (activeConversationId === id) {
      newConversations.length > 0 ? await handleSetConversation(newConversations[0].id) : handleNewConversation();
    }
  }, [conversations, activeConversationId, handleSetConversation, handleNewConversation]);

  const handleClearAllConversations = useCallback(async () => {
    await db.clearAllData();
    // Reseta todos os estados para o estado inicial
    const defaultGroup = { id: `group-${Date.now()}`, name: "Tópico Geral", sources: [] };
    await db.addKnowledgeGroup(defaultGroup);
    
    setGroups([defaultGroup]);
    setConversations([]);
    setChatMessages([]);
    setLibraryItems([]);
    setActiveGroupId(defaultGroup.id);
    setActiveConversationId(null);
  }, []);

  const handleUrlAdd = useCallback(async (url: string) => {
    if (!activeGroupId) return;
    setIsLoading(true);
    try {
      const newSource = await sourceManagerService.addUrlSource(url, activeGroupId);
      setAllKnowledgeSources(prev => prev.find(s => s.id === newSource.id) ? prev : [...prev, newSource]);
      const updatedGroup = await db.knowledgeGroups.get(activeGroupId);
      if (updatedGroup) {
        const finalSources = [...updatedGroup.sources, newSource];
        await db.knowledgeGroups.update(activeGroupId, { sources: finalSources });
        setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, sources: finalSources } : g));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Adicionar URL",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId, toast]);
  
  const handleFileAdd = useCallback(async (file: File) => {
    if (!activeGroupId) return;
    setIsLoading(true);
    try {
      const newSource = await sourceManagerService.addFileSource(file, activeGroupId);
      setAllKnowledgeSources(prev => prev.find(s => s.id === newSource.id) ? prev : [...prev, newSource]);
      const updatedGroup = await db.knowledgeGroups.get(activeGroupId);
      if (updatedGroup) {
        const finalSources = [...updatedGroup.sources, newSource];
        await db.knowledgeGroups.update(activeGroupId, { sources: finalSources });
        setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, sources: finalSources } : g));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Adicionar Arquivo",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeGroupId, toast]);

  const handleRemoveSource = useCallback(async (sourceId: string) => {
    if (!activeGroupId) return;
    await db.deleteSource(sourceId);
    setAllKnowledgeSources(prev => prev.filter(s => s.id !== sourceId));
    setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, sources: g.sources.filter(s => s.id !== sourceId) } : g));
  }, [activeGroupId]);

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
    if (!query.trim() || isLoading || !activeGroupId) return;
    const promptForAI = actualPrompt || query;
    setIsLoading(true);
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      const newConversationId = `convo-${Date.now()}`;
      const title = await geminiService.generateTitleForConversation(query, activeModel);
      const newConversation: Conversation = { id: newConversationId, name: title, groupId: activeGroupId, timestamp: new Date() };
      await db.addConversation(newConversation);
      // Correção: Recarrega as conversas do DB para garantir a ordem correta.
      const updatedConversations = await db.getConversationsForGroup(activeGroupId);
      setConversations(updatedConversations);
      setActiveConversationId(newConversationId);
      currentConversationId = newConversationId;
    }
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, conversationId: currentConversationId, text: query, sender: MessageSender.USER, timestamp: new Date(), sourceIds };
    const modelPlaceholder: ChatMessage = { id: `model-${Date.now()}`, conversationId: currentConversationId, text: 'Processando...', sender: MessageSender.MODEL, timestamp: new Date(), isLoading: true, sourceIds };
    setChatMessages(prev => [...prev, userMessage, modelPlaceholder]);
    await db.addChatMessage(userMessage);
    await db.addChatMessage(modelPlaceholder);
    try {
      const selectedSources = allKnowledgeSources.filter(s => sourceIds.includes(s.id));
      const response = await geminiService.generateContentWithSources(promptForAI, selectedSources, activeModel);
      const finalMessage: ChatMessage = { 
        ...modelPlaceholder, 
        text: response.text, 
        isLoading: false, 
        urlContext: response.urlContextMetadata, 
        mindMap: undefined,
        model: response.modelName,
        usageMetadata: response.usageMetadata,
      };
      setChatMessages(prev => prev.map(msg => msg.id === modelPlaceholder.id ? finalMessage : msg));
      await db.updateChatMessage(modelPlaceholder.id, finalMessage);
    } catch (e: any) {
      const errorMessage: ChatMessage = { ...modelPlaceholder, text: `Erro: ${e.message}`, sender: MessageSender.SYSTEM, isLoading: false };
      toast({
        variant: "destructive",
        title: "Erro na Resposta da IA",
        description: e.message,
      });
      setChatMessages(prev => prev.map(msg => msg.id === modelPlaceholder.id ? errorMessage : msg));
      await db.updateChatMessage(modelPlaceholder.id, errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeGroupId, activeConversationId, activeModel, allKnowledgeSources]);

  const handleOptimizePrompt = useCallback(async (query: string, sourceIds: string[]) => {
    if (!query.trim() || isLoading || !activeGroupId) return;
    setIsLoading(true);
    const { dismiss } = toast({
      title: "Otimizando Prompt...",
      description: "Aguarde enquanto a IA gera sugestões.",
    });

    let currentConversationId = activeConversationId;
    // Se não houver conversa ativa, cria uma nova.
    if (!currentConversationId) {
      const newConversationId = `convo-${Date.now()}`;
      const title = await geminiService.generateTitleForConversation(query, activeModel);
      const newConversation: Conversation = { id: newConversationId, name: title, groupId: activeGroupId, timestamp: new Date() };
      await db.addConversation(newConversation);
      const updatedConversations = await db.getConversationsForGroup(activeGroupId);
      setConversations(updatedConversations);
      setActiveConversationId(newConversationId);
      currentConversationId = newConversationId;
    }

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, conversationId: currentConversationId, text: query, sender: MessageSender.USER, timestamp: new Date(), sourceIds };
    const systemPlaceholder: ChatMessage = { id: `system-loading-${Date.now()}`, conversationId: currentConversationId, text: 'Otimizando prompt...', sender: MessageSender.SYSTEM, timestamp: new Date(), isLoading: true };
    
    setChatMessages(prev => [...prev, userMessage, systemPlaceholder]);
    await db.addChatMessage(userMessage);
    await db.addChatMessage(systemPlaceholder);

    try {
      const selectedSources = allKnowledgeSources.filter(s => sourceIds.includes(s.id));
      const suggestions = await geminiService.generateOptimizedPrompts(query, selectedSources, activeModel);
      
      const systemMessage: ChatMessage = {
        ...systemPlaceholder,
        text: "Aqui estão algumas sugestões para refinar sua pergunta:",
        isLoading: false,
        optimizedPrompts: suggestions,
        sourceIds: sourceIds,
      };

      // Substitui o placeholder pela mensagem final com as sugestões
      setChatMessages(prev => prev.map(msg => msg.id === systemPlaceholder.id ? systemMessage : msg));
      await db.updateChatMessage(systemPlaceholder.id, systemMessage); // Persiste a mensagem com as sugestões

      toast({
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
      setChatMessages(prev => prev.map(msg => msg.id === systemPlaceholder.id ? errorMessage : msg));
      await db.updateChatMessage(systemPlaceholder.id, errorMessage);
    } finally { 
      setIsLoading(false); 
      dismiss();
    }
  }, [isLoading, activeGroupId, activeConversationId, activeModel, allKnowledgeSources, toast]);

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
      conversations, groups, activeGroupId, activeConversationId, isSidebarOpen, chatMessages, isLoading, libraryItems, allKnowledgeSources, libraryItemsForActiveContext, theme, activeGroup, sourcesForActiveGroup, chatPlaceholder, activeConversationName, activeModel, isEvaluationPanelOpen, isLibraryPanelOpen, activeQuizData,
      setTheme, setIsSidebarOpen, handleSetGroup, handleAddGroup, handleDeleteGroup, handleUpdateGroup, handleSetConversation, handleNewConversation, handleDeleteConversation, handleClearAllConversations, handleUrlAdd, handleFileAdd, handleRemoveSource, handleToggleSourceSelection, handleSaveToLibrary, handleDeleteLibraryItem, handleOpenLibraryItem, handleSendMessage, handleOptimizePrompt, handleGenerateMindMap, generateUsageReport, handleSetModel, handleMindMapLayoutChange, handleStartEvaluation, handleCloseEvaluation, setIsLibraryPanelOpen
  }), [conversations, groups, activeGroupId, activeConversationId, isSidebarOpen, chatMessages, isLoading, libraryItems, allKnowledgeSources, libraryItemsForActiveContext, theme, activeGroup, sourcesForActiveGroup, chatPlaceholder, activeConversationName, activeModel, isEvaluationPanelOpen, isLibraryPanelOpen, activeQuizData, handleSetGroup, handleAddGroup, handleDeleteGroup, handleUpdateGroup, handleSetConversation, handleNewConversation, handleDeleteConversation, handleClearAllConversations, handleUrlAdd, handleFileAdd, handleRemoveSource, handleToggleSourceSelection, handleSaveToLibrary, handleDeleteLibraryItem, handleOpenLibraryItem, handleSendMessage, handleOptimizePrompt, handleGenerateMindMap, generateUsageReport, handleSetModel, handleMindMapLayoutChange, handleStartEvaluation, handleCloseEvaluation, setIsLibraryPanelOpen]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
};