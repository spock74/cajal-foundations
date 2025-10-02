/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Conversation,
  ChatMessage,
  MessageSender,
  KnowledgeGroup,
  KnowledgeSource,
  LibraryItem,
} from './types';
import { geminiService } from './services/geminiService';
import { db } from './services/dbService';
import { sourceManagerService } from './services/sourceManagerService';

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
  theme: 'light' | 'dark';
  activeGroup: KnowledgeGroup | undefined;
  sourcesForActiveGroup: KnowledgeSource[];
  chatPlaceholder: string;
  activeConversationName: string;
}

interface AppContextActions {
  setTheme: (theme: 'light' | 'dark') => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  handleSetGroup: (groupId: string) => Promise<void>;
  handleAddGroup: (name: string) => Promise<void>;
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
  handleSendMessage: (query: string, sourceIds: string[]) => Promise<void>;
  handleGenerateMindMap: (messageId: string, text: string) => Promise<void>;
  handleMindMapLayoutChange: (messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => void;
}

type AppContextType = AppContextState & AppContextActions;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<KnowledgeGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [allKnowledgeSources, setAllKnowledgeSources] = useState<KnowledgeSource[]>([]);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemPrefersDark ? "dark" : "light";
  });

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

  const handleSetGroup = async (groupId: string) => {
    setActiveGroupId(groupId);
    const convosForGroup = await db.getConversationsForGroup(groupId);
    setConversations(convosForGroup);
    setActiveConversationId(null);
    setChatMessages([]);
  };

  const handleAddGroup = async (name: string) => {
    const newGroup = { id: `group-${Date.now()}`, name, sources: [] };
    await db.addKnowledgeGroup(newGroup);
    setGroups(prev => [...prev, newGroup]);
    await handleSetGroup(newGroup.id);
  };

  const handleSetConversation = async (id: string) => {
    if (id === activeConversationId) return;
    const messages = await db.getMessagesForConversation(id);
    setChatMessages(messages);
    setActiveConversationId(id);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setChatMessages([]);
  };

  const handleDeleteConversation = async (id: string) => {
    await db.deleteConversation(id);
    const newConversations = conversations.filter(c => c.id !== id);
    setConversations(newConversations);
    if (activeConversationId === id) {
      newConversations.length > 0 ? await handleSetConversation(newConversations[0].id) : handleNewConversation();
    }
  };

  const handleClearAllConversations = async () => {
    await db.clearAllConversations();
    setConversations([]);
    handleNewConversation();
  };

  const handleUrlAdd = async (url: string) => {
    if (!activeGroupId) return;
    setIsLoading(true);
    try {
      const newSource = await sourceManagerService.addUrlSource(url, activeGroupId);
      setAllKnowledgeSources(prev => prev.find(s => s.id === newSource.id) ? prev : [...prev, newSource]);
      setGroups(prevGroups => {
        const newGroups = prevGroups.map(g => g.id === activeGroupId ? { ...g, sources: [...g.sources, newSource] } : g);
        const updatedGroup = newGroups.find(g => g.id === activeGroupId);
        if (updatedGroup) db.knowledgeGroups.update(activeGroupId, { sources: updatedGroup.sources });
        return newGroups;
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileAdd = async (file: File) => {
    if (!activeGroupId) return;
    setIsLoading(true);
    try {
      const newSource = await sourceManagerService.addFileSource(file, activeGroupId);
      setAllKnowledgeSources(prev => prev.find(s => s.id === newSource.id) ? prev : [...prev, newSource]);
      setGroups(prevGroups => {
        const newGroups = prevGroups.map(g => g.id === activeGroupId ? { ...g, sources: [...g.sources, newSource] } : g);
        const updatedGroup = newGroups.find(g => g.id === activeGroupId);
        if (updatedGroup) db.knowledgeGroups.update(activeGroupId, { sources: updatedGroup.sources });
        return newGroups;
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSource = async (sourceId: string) => {
    if (!activeGroupId) return;
    await db.deleteSource(sourceId);
    setAllKnowledgeSources(prev => prev.filter(s => s.id !== sourceId));
    setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, sources: g.sources.filter(s => s.id !== sourceId) } : g));
  };

  const handleToggleSourceSelection = (sourceId: string) => { // Esta função precisa atualizar o grupo também
    setGroups(prevGroups => prevGroups.map(g => {
      if (g.id === activeGroupId && g.sources) {
        const newSources = g.sources.map(s => s.id === sourceId ? { ...s, selected: !s.selected } : s);
        // Persiste a mudança no banco de dados
        db.knowledgeGroups.update(activeGroupId, { sources: newSources });
        return { ...g, sources: newSources };
      }
      return g;
    }));
  };

  const handleSaveToLibrary = async (message: ChatMessage) => {
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
  };
  const handleDeleteLibraryItem = async (id: number) => {
    await db.deleteSavedItem(id);
    setLibraryItems(prev => prev.filter(item => item.id !== id));
  };
  
  const handleSendMessage = async (query: string, sourceIds: string[]) => {
    if (!query.trim() || isLoading || !activeGroupId) return;
    setIsLoading(true);
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      const newConversationId = `convo-${Date.now()}`;
      const title = await geminiService.generateTitleForConversation(query);
      const newConversation: Conversation = { id: newConversationId, name: title, groupId: activeGroupId, timestamp: new Date() };
      await db.addConversation(newConversation);
      setConversations(prev => [newConversation, ...prev]);
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
      const response = await geminiService.generateContentWithSources(query, selectedSources);
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
      setChatMessages(prev => prev.map(msg => msg.id === modelPlaceholder.id ? errorMessage : msg));
      await db.updateChatMessage(modelPlaceholder.id, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMindMap = async (messageId: string, text: string) => {
    if (!activeConversationId) return;

    // Encontra a mensagem atual para verificar seu estado.
    const currentMessage = chatMessages.find(msg => msg.id === messageId);
    const existingMindMap = currentMessage?.mindMap;

    // Se o mapa já foi gerado, apenas alterna a visibilidade.
    if (existingMindMap && existingMindMap.nodes.length > 0) {
      const updatedMindMap = { ...existingMindMap, isVisible: !existingMindMap.isVisible };
      setChatMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, mindMap: updatedMindMap } : msg));
      await db.updateChatMessage(messageId, { mindMap: updatedMindMap });
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
      const { title, nodes, edges } = await geminiService.generateMindMapFromText(text);
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
      updateMindMapState({ mindMap: { isVisible: true, isLoading: false, error: e.message, nodes: [], edges: [] } });
    }
  };

  const handleMindMapLayoutChange = (messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => {
    setChatMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.mindMap) {
        const updatedMindMap = { ...msg.mindMap, ...layout };
        db.updateChatMessage(messageId, { mindMap: updatedMindMap });
        return { ...msg, mindMap: updatedMindMap };
      }
      return msg;
    }));
  };

  const chatPlaceholder = sourcesForActiveGroup.filter(s => s.selected).length > 0
    ? `Perguntar sobre as ${sourcesForActiveGroup.filter(s => s.selected).length} fontes selecionadas...`
    : "Comece uma nova conversa ou adicione fontes.";
  const activeConversationName = 
    conversations.find(c => c.id === activeConversationId)?.name || 
    (activeConversationId === null && chatMessages.length === 0 ? "Nova Conversa" : "Navegador de Documentos");

  const value = {
    conversations, groups, activeGroupId, activeConversationId, isSidebarOpen, chatMessages, isLoading, libraryItems, allKnowledgeSources, theme, activeGroup, sourcesForActiveGroup, chatPlaceholder, activeConversationName,
    setTheme, setIsSidebarOpen, handleSetGroup, handleAddGroup, handleSetConversation, handleNewConversation, handleDeleteConversation, handleClearAllConversations, handleUrlAdd, handleFileAdd, handleRemoveSource, handleToggleSourceSelection, handleSaveToLibrary, handleDeleteLibraryItem, handleSendMessage, handleGenerateMindMap, handleMindMapLayoutChange
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
};