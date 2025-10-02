/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState, useEffect } from "react";
import {
  ChatMessage,
  MessageSender,
  KnowledgeGroup,
  KnowledgeSource,
  LibraryItem,
} from "../types";
import { geminiService } from "../services/geminiService";
import { sourceManagerService } from "../services/sourceManagerService";
import { db } from "../services/dbService";
import KnowledgeBaseManager from "./KnowledgeBaseManager";
import ChatInterface from "./ChatInterface";
import MindMapModal from "./MindMapModal";
import LibraryPanel from "./LibraryPanel";

const App: React.FC = () => {
  const [knowledgeGroups, setKnowledgeGroups] = useState<KnowledgeGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemPrefersDark ? "dark" : "light";
  });

  const [mindMapState, setMindMapState] = useState<{
    isOpen: boolean; isLoading: boolean; error: string | null;
    title: string; rawNodes: any[]; rawEdges: any[];
  }>({
    isOpen: false, isLoading: false, error: null, title: "", rawNodes: [], rawEdges: [],
  });

  // Carrega dados iniciais do Dexie na montagem.
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const allMetadata = await db.getAllSourcesMetadata();
        const initialGroup: KnowledgeGroup = { id: "default-group", name: "Grupo Principal", sources: allMetadata };
        setKnowledgeGroups([initialGroup]);
        setActiveGroupId(initialGroup.id);

        const items = await db.getAllSavedItems();
        setLibraryItems(items);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const activeGroup = knowledgeGroups.find(group => group.id === activeGroupId);
  const selectedSources = activeGroup ? activeGroup.sources.filter(s => s.selected) : [];

  // --- LÓGICA DE MANIPULAÇÃO DE FONTES (DELEGADA AO SERVIÇO) ---
  
  const handleUrlAdd = async (url: string) => {
    if (!activeGroupId) return;
    setIsLoading(true);
    try {
      const newSource = await sourceManagerService.addUrlSource(url);
      setKnowledgeGroups(prevGroups =>
        prevGroups.map(group => {
          if (group.id === activeGroupId && !group.sources.find(s => s.id === newSource.id)) {
            return { ...group, sources: [...group.sources, newSource] };
          }
          return group;
        })
      );
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
      const newSource = await sourceManagerService.addFileSource(file);
      setKnowledgeGroups(prevGroups =>
        prevGroups.map(group => {
          if (group.id === activeGroupId && !group.sources.find(s => s.id === newSource.id)) {
            return { ...group, sources: [...group.sources, newSource] };
          }
          return group;
        })
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSource = async (sourceId: string) => {
    if (!activeGroupId) return;
    await db.deleteSource(sourceId);
    setKnowledgeGroups(prevGroups =>
      prevGroups.map(group => 
        group.id === activeGroupId 
          ? { ...group, sources: group.sources.filter(s => s.id !== sourceId) }
          : group
      )
    );
  };
  
  const handleToggleSourceSelection = (sourceId: string) => {
    setKnowledgeGroups(prevGroups =>
      prevGroups.map(group => {
        if (group.id === activeGroupId) {
          return {
            ...group,
            sources: group.sources.map(s =>
              s.id === sourceId ? { ...s, selected: !s.selected } : s
            ),
          };
        }
        return group;
      })
    );
  };

  // --- HANDLERS DE GRUPOS E BIBLIOTECA ---

  const handleAddGroup = (groupName: string) => {
    const newGroupId = `${groupName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const newGroup: KnowledgeGroup = { id: newGroupId, name: groupName, sources: [] };
    setKnowledgeGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newGroupId);
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    setKnowledgeGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
  };

  const handleDeleteGroup = (groupId: string) => {
    setKnowledgeGroups(prev => {
      const newGroups = prev.filter(g => g.id !== groupId);
      if (activeGroupId === groupId) {
        setActiveGroupId(newGroups.length > 0 ? newGroups[0].id : null);
      }
      return newGroups;
    });
  };

  const handleClearAllSources = () => {
    if (!activeGroupId) return;
    // Lógica para remover do DB também seria necessária aqui no futuro
    setKnowledgeGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, sources: [] } : g));
  };
  
  const handleSaveToLibrary = async (content: string) => {
    const newItem: LibraryItem = { content, timestamp: new Date() };
    const id = await db.addSavedItem(newItem);
    setLibraryItems(prev => [...prev, { ...newItem, id }].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const handleDeleteLibraryItem = async (id: number) => {
    await db.deleteSavedItem(id);
    setLibraryItems(prev => prev.filter(item => item.id !== id));
  };

  // --- HANDLERS DE CHAT E FERRAMENTAS ---
  
  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, text: query, sender: MessageSender.USER, timestamp: new Date() };
    const modelPlaceholder: ChatMessage = { id: `model-${Date.now()}`, text: 'Processando...', sender: MessageSender.MODEL, timestamp: new Date(), isLoading: true };
    setChatMessages(prev => [...prev, userMessage, modelPlaceholder]);

    try {
      const response = await geminiService.generateContentWithSources(query, selectedSources);
      setChatMessages(prev => prev.map(msg => msg.id === modelPlaceholder.id ? { ...modelPlaceholder, text: response.text, isLoading: false, urlContext: response.urlContextMetadata } : msg));
    } catch (e: any) {
      setChatMessages(prev => prev.map(msg => msg.id === modelPlaceholder.id ? { ...modelPlaceholder, text: `Erro: ${e.message}`, sender: MessageSender.SYSTEM, isLoading: false } : msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMindMap = async (text: string) => {
    setIsLoading(true);
    setMindMapState({ isOpen: true, isLoading: true, error: null, title: 'Gerando Mapa Mental...', rawNodes: [], rawEdges: [] });
    try {
      const { nodes, edges } = await geminiService.generateMindMapFromText(text);
      if (nodes.length === 0) throw new Error("Não foi possível extrair conceitos para o mapa mental.");
      setMindMapState(prev => ({ ...prev, isLoading: false, title: 'Mapa Mental', rawNodes: nodes.map(n => ({ ...n, data: { label: n.label } })), rawEdges: edges }));
    } catch (e: any) {
      setMindMapState(prev => ({ ...prev, isLoading: false, error: e.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const chatPlaceholder = selectedSources.length > 0
      ? `Pergunte sobre as ${selectedSources.length} fontes selecionadas...`
      : "Selecione ou adicione uma fonte de conhecimento para começar.";

  return (
    <div className="h-screen max-h-screen antialiased relative overflow-x-hidden bg-gray-100 dark:bg-[#121212] dark:text-[#E2E2E2]">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />}
      
      <div className="flex h-full w-full md:p-4 md:gap-4">
        <div className={`fixed top-0 left-0 h-full w-11/12 max-w-sm z-30 transform transition-transform ease-in-out duration-300 p-3 md:static md:p-0 md:w-1/4 xl:w-1/5 md:h-full md:max-w-xs md:translate-x-0 md:z-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {activeGroup && (
            <KnowledgeBaseManager
              sources={activeGroup.sources}
              onUrlAdd={handleUrlAdd}
              onFileAdd={handleFileAdd}
              onRemoveSource={handleRemoveSource}
              onToggleSourceSelection={handleToggleSourceSelection}
              knowledgeGroups={knowledgeGroups}
              activeGroupId={activeGroupId}
              onSetGroupId={setActiveGroupId}
              onAddGroup={handleAddGroup}
              onRenameGroup={handleRenameGroup}
              onDeleteGroup={handleDeleteGroup}
              onClearAllSources={handleClearAllSources}
              onCloseSidebar={() => setIsSidebarOpen(false)}
            />
          )}
        </div>

        <div className="w-full h-full p-3 md:p-0 md:flex-1">
          <ChatInterface
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholderText={chatPlaceholder}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onGenerateMindMap={handleGenerateMindMap}
            onSaveToLibrary={handleSaveToLibrary}
            theme={theme}
            setTheme={setTheme}
          />
        </div>

        <div className="hidden lg:block lg:w-1/4 xl:w-1/5 h-full">
           <LibraryPanel items={libraryItems} onDeleteItem={handleDeleteLibraryItem} />
        </div>
      </div>
      
      <MindMapModal
        isOpen={mindMapState.isOpen}
        onClose={() => setMindMapState(prev => ({ ...prev, isOpen: false }))}
        isLoading={mindMapState.isLoading}
        error={mindMapState.error}
        title={mindMapState.title}
        nodes={mindMapState.rawNodes}
        edges={mindMapState.rawEdges}
      />
    </div>
  );
};

export default App;