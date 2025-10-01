/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, MessageSender, KnowledgeGroup, KnowledgeSource, LibraryItem } from '../types';
// Importação CORRETA para named export (se você usou export const geminiService = ...)
import { geminiService } from '../services/geminiService'; 
import { db } from '../services/dbService';
import KnowledgeBaseManager from './KnowledgeBaseManager';
import ChatInterface from './ChatInterface';
import MindMapModal from './MindMapModal';
import LibraryPanel from './LibraryPanel';

const SCIENTIFIC_ARTICLE_URL = "https://pmc.ncbi.nlm.nih.gov/articles/PMC11849834";
const INITIAL_KNOWLEDGE_GROUPS: KnowledgeGroup[] = [
  { id: 'artigo-cientifico', name: 'Artigo Científico', sources: [{ type: 'url', id: SCIENTIFIC_ARTICLE_URL, value: SCIENTIFIC_ARTICLE_URL }] },
];

const App: React.FC = () => {
  const [knowledgeGroups, setKnowledgeGroups] = useState<KnowledgeGroup[]>(INITIAL_KNOWLEDGE_GROUPS);
  const [activeGroupId, setActiveGroupId] = useState<string>(INITIAL_KNOWLEDGE_GROUPS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  });

  const [mindMapState, setMindMapState] = useState<{
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;
    title: string;
    rawNodes: any[];
    rawEdges: any[];
  }>({
    isOpen: false,
    isLoading: false,
    error: null,
    title: '',
    rawNodes: [],
    rawEdges: [],
  });
  
  const MAX_SOURCES = 20;

  const activeGroup = knowledgeGroups.find(group => group.id === activeGroupId);
  const currentSourcesForChat = activeGroup ? activeGroup.sources : [];

  // --- LÓGICA DE PERSISTÊNCIA E ESTADO DE GRUPO ---
  
  useEffect(() => {
    // Gerenciamento de tema
    const root = document.documentElement;
    const lightThemeSheet = document.getElementById('hljs-light-theme') as HTMLLinkElement;
    const darkThemeSheet = document.getElementById('hljs-dark-theme') as HTMLLinkElement;
    
    if (theme === 'light') {
      root.classList.remove('dark');
      if (lightThemeSheet) lightThemeSheet.disabled = false;
      if (darkThemeSheet) darkThemeSheet.disabled = true;
    } else {
      root.classList.add('dark');
      if (lightThemeSheet) lightThemeSheet.disabled = true;
      if (darkThemeSheet) darkThemeSheet.disabled = false;
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Gerenciamento da Biblioteca (IndexedDB)
  useEffect(() => {
    const fetchLibraryItems = async () => {
      const items = await db.getAllSavedItems();
      setLibraryItems(items);
    };
    fetchLibraryItems();
  }, []);

  const handleSaveToLibrary = async (content: string) => {
    const newItem: LibraryItem = { content, timestamp: new Date() };
    const id = await db.addSavedItem(newItem);
    setLibraryItems(prevItems => [...prevItems, { ...newItem, id }].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const handleDeleteLibraryItem = async (id: number) => {
    await db.deleteSavedItem(id);
    setLibraryItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  // Efeito CRUCIAL: Reinicia o chat (Singleton) quando o contexto muda
  useEffect(() => {
    geminiService.endChat(); // Encerra a sessão anterior (garante novo histórico)
    
    const currentActiveGroup = knowledgeGroups.find(g => g.id === activeGroupId);
    const welcomeMessageText = `Bem-vindo! Você está explorando o grupo: "${currentActiveGroup?.name || 'Nenhum'}". Faça perguntas sobre as fontes listadas.`;
    
    setChatMessages([{
      id: `system-welcome-${activeGroupId}-${Date.now()}`,
      text: welcomeMessageText,
      sender: MessageSender.SYSTEM,
      timestamp: new Date(),
    }]);

  }, [activeGroupId]); 
  
  // --- Manipuladores de Fontes e Grupos (abreviados) ---
  const handleAddSource = (source: KnowledgeSource) => {
    setKnowledgeGroups(prevGroups => 
      prevGroups.map(group => {
        if (group.id === activeGroupId && group.sources.length < MAX_SOURCES && !group.sources.find(s => s.id === source.id)) {
          return { ...group, sources: [...group.sources, source] };
        }
        return group;
      })
    );
  };

  const handleRemoveSource = (sourceId: string) => {
    setKnowledgeGroups(prevGroups =>
      prevGroups.map(group => group.id === activeGroupId ? { ...group, sources: group.sources.filter(s => s.id !== sourceId) } : group)
    );
  };

  const handleAddGroup = (groupName: string) => {
    const newGroupId = `${groupName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const newGroup: KnowledgeGroup = { id: newGroupId, name: groupName, sources: [] };
    setKnowledgeGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newGroupId);
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    setKnowledgeGroups(prev => prev.map(group => group.id === groupId ? { ...group, name: newName } : group));
  };

  const handleDeleteGroup = (groupId: string) => {
    setKnowledgeGroups(prevGroups => {
      const newGroups = prevGroups.filter(group => group.id !== groupId);
      if (activeGroupId === groupId) {
        setActiveGroupId(newGroups.length > 0 ? newGroups[0].id : INITIAL_KNOWLEDGE_GROUPS[0].id);
      }
      return newGroups.length > 0 ? newGroups : INITIAL_KNOWLEDGE_GROUPS;
    });
  };

  const handleClearAllSources = () => {
    setKnowledgeGroups(prevGroups =>
      prevGroups.map(group => group.id === activeGroupId ? { ...group, sources: [] } : group)
    );
  };

  // --- Lógica Principal de Envio de Mensagem (Singleton) ---
  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, text: query, sender: MessageSender.USER, timestamp: new Date() };
    const modelPlaceholder: ChatMessage = { id: `model-${Date.now()}`, text: '', sender: MessageSender.MODEL, timestamp: new Date(), isLoading: true };
    setChatMessages(prev => [...prev, userMessage, modelPlaceholder]);

    try {
      await geminiService.sendMessageStream(
        query,
        currentSourcesForChat,
        (chunk) => {
          setChatMessages(prev =>
            prev.map(msg =>
              msg.id === modelPlaceholder.id
                ? { ...msg, text: msg.text + chunk }
                : msg
            )
          );
        }
      );
    } catch (e: any) {
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === modelPlaceholder.id
            ? { ...modelPlaceholder, text: `Erro: ${e.message}`, sender: MessageSender.SYSTEM, isLoading: false }
            : msg
        )
      );
    } finally {
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === modelPlaceholder.id ? { ...msg, isLoading: false } : msg
        )
      );
      setIsLoading(false);
    }
  };
  
  // --- Manipuladores de Ferramentas Adicionais (Singleton) ---
  const handleGenerateMindMap = async (text: string) => {
    setMindMapState({ isOpen: true, isLoading: true, error: null, title: 'Gerando Mapa Mental...', rawNodes: [], rawEdges: [] });
    try {
      // Chamada CORRETA para o Singleton
      const { nodes, edges } = await geminiService.generateMindMapFromText(text);
      if (nodes.length === 0) {
        throw new Error("Não foi possível extrair conceitos para o mapa mental.");
      }
      setMindMapState(prev => ({ ...prev, isLoading: false, title: 'Mapa Mental', rawNodes: nodes.map(n => ({ ...n, data: { label: n.label } })), rawEdges: edges }));
    } catch (e: any) {
      setMindMapState(prev => ({ ...prev, isLoading: false, error: e.message }));
    }
  };

  const handleCloseMindMap = () => setMindMapState(prev => ({ ...prev, isOpen: false }));
  
  const chatPlaceholder = currentSourcesForChat.length > 0 
    ? `Faça perguntas sobre "${activeGroup?.name || 'documentos'}"...`
    : "Adicione fontes de conhecimento para começar.";

  return (
    <div 
      className="h-screen max-h-screen antialiased relative overflow-x-hidden bg-gray-100 text-gray-800 dark:bg-[#121212] dark:text-[#E2E2E2] transition-colors duration-200"
    >
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <div className="flex h-full w-full md:p-4 md:gap-4">
        {/* Left Panel: Knowledge Base */}
        <div className={`
          fixed top-0 left-0 h-full w-11/12 max-w-sm z-30 transform transition-transform ease-in-out duration-300 p-3
          md:static md:p-0 md:w-1/4 xl:w-1/5 md:h-full md:max-w-xs md:translate-x-0 md:z-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <KnowledgeBaseManager
            sources={currentSourcesForChat} onAddSource={handleAddSource} onRemoveSource={handleRemoveSource} maxSources={MAX_SOURCES}
            knowledgeGroups={knowledgeGroups} activeGroupId={activeGroupId} onSetGroupId={setActiveGroupId}
            onAddGroup={handleAddGroup} onRenameGroup={handleRenameGroup} onDeleteGroup={handleDeleteGroup}
            onCloseSidebar={() => setIsSidebarOpen(false)} onClearAllSources={handleClearAllSources}
          />
        </div>

        {/* Center Panel: Chat Interface */}
        <div className="w-full h-full p-3 md:p-0 md:flex-1">
          <ChatInterface
            messages={chatMessages} onSendMessage={handleSendMessage} isLoading={isLoading}
            placeholderText={chatPlaceholder}
            onToggleSidebar={() => setIsSidebarOpen(true)} onGenerateMindMap={handleGenerateMindMap}
            onSaveToLibrary={handleSaveToLibrary} theme={theme} setTheme={setTheme}
          />
        </div>

        {/* Right Panel: Library */}
        <div className="hidden lg:block lg:w-1/4 xl:w-1/5 h-full">
           {/* Assumindo que você tem handleDeleteLibraryItem no escopo */}
           <LibraryPanel items={libraryItems} onDeleteItem={handleDeleteLibraryItem} />
        </div>
      </div>
      
      <MindMapModal
        isOpen={mindMapState.isOpen} onClose={handleCloseMindMap} isLoading={mindMapState.isLoading}
        error={mindMapState.error} title={mindMapState.title} nodes={mindMapState.rawNodes} edges={mindMapState.rawEdges}
      />
    </div>
  );
};

export default App;