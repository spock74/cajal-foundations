/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, MessageSender, KnowledgeGroup, KnowledgeSource, LibraryItem } from '../types';
import { generateContentWithSources, getInitialSuggestions, generateMindMapFromText } from '../services/geminiService';
import { db } from '../services/dbService';
import KnowledgeBaseManager from './KnowledgeBaseManager';
import ChatInterface from './ChatInterface';
import MindMapModal from './MindMapModal';
import LibraryPanel from './LibraryPanel';

const SCIENTIFIC_ARTICLE_URL = "https://pmc.ncbi.nlm.nih.gov/articles/PMC11849834/pdf/pone.0315539.pdf";

const INITIAL_KNOWLEDGE_GROUPS: KnowledgeGroup[] = [
  { id: 'artigo-cientifico', name: 'Artigo Científico', sources: [{ type: 'url', id: SCIENTIFIC_ARTICLE_URL, value: SCIENTIFIC_ARTICLE_URL }] },
];

const App: React.FC = () => {
  const [knowledgeGroups, setKnowledgeGroups] = useState<KnowledgeGroup[]>(INITIAL_KNOWLEDGE_GROUPS);
  const [activeGroupId, setActiveGroupId] = useState<string>(INITIAL_KNOWLEDGE_GROUPS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [initialQuerySuggestions, setInitialQuerySuggestions] = useState<string[]>([]);
  
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

  // Theme management side-effects
  useEffect(() => {
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

  // Library items management (Dexie)
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


   useEffect(() => {
    const apiKey = process.env.API_KEY;
    const currentActiveGroup = knowledgeGroups.find(group => group.id === activeGroupId);
    const welcomeMessageText = !apiKey 
        ? 'ERRO: A chave da API Gemini (process.env.API_KEY) não está configurada. Por favor, defina esta variável de ambiente para usar a aplicação.'
        : `Bem-vindo ao Navegador de Documentos! Atualmente, você está explorando o conteúdo de: "${currentActiveGroup?.name || 'Nenhum'}". Faça-me perguntas ou experimente uma das sugestões abaixo para começar.`;
    
    setChatMessages([{
      id: `system-welcome-${activeGroupId}-${Date.now()}`,
      text: welcomeMessageText,
      sender: MessageSender.SYSTEM,
      timestamp: new Date(),
    }]);
  }, [activeGroupId, knowledgeGroups]); 


  const fetchAndSetInitialSuggestions = useCallback(async (currentSources: KnowledgeSource[]) => {
    const currentUrls = currentSources.filter(s => s.type === 'url').map(s => (s as { value: string }).value);
    if (currentUrls.length === 0) {
      setInitialQuerySuggestions([]);
      return;
    }
      
    setIsFetchingSuggestions(true);
    setInitialQuerySuggestions([]); 

    try {
      const response = await getInitialSuggestions(currentUrls); 
      let suggestionsArray: string[] = [];
      if (response.text) {
        try {
          let jsonStr = response.text.trim();
          const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; 
          const match = jsonStr.match(fenceRegex);
          if (match && match[2]) {
            jsonStr = match[2].trim();
          }
          const parsed = JSON.parse(jsonStr);
          if (parsed && Array.isArray(parsed.suggestions)) {
            suggestionsArray = parsed.suggestions.filter((s: unknown) => typeof s === 'string');
          } else {
            console.warn("Parsed suggestions response, but 'suggestions' array not found or invalid:", parsed);
             setChatMessages(prev => [...prev, { id: `sys-err-suggestion-fmt-${Date.now()}`, text: "Sugestões recebidas em um formato inesperado.", sender: MessageSender.SYSTEM, timestamp: new Date() }]);
          }
        } catch (parseError) {
          console.error("Failed to parse suggestions JSON:", parseError, "Raw text:", response.text);
          setChatMessages(prev => [...prev, { id: `sys-err-suggestion-parse-${Date.now()}`, text: "Erro ao processar as sugestões da IA.", sender: MessageSender.SYSTEM, timestamp: new Date() }]);
        }
      }
      setInitialQuerySuggestions(suggestionsArray.slice(0, 4)); 
    } catch (e: any) {
      const errorMessage = e.message || 'Falha ao buscar sugestões iniciais.';
      setChatMessages(prev => [...prev, { id: `sys-err-suggestion-fetch-${Date.now()}`, text: `Erro ao buscar sugestões: ${errorMessage}`, sender: MessageSender.SYSTEM, timestamp: new Date() }]);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []); 

  useEffect(() => {
    if (currentSourcesForChat.length > 0 && process.env.API_KEY) { 
        fetchAndSetInitialSuggestions(currentSourcesForChat);
    } else {
        setInitialQuerySuggestions([]); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSourcesForChat, fetchAndSetInitialSuggestions]); 


  const handleAddSource = (source: KnowledgeSource) => {
    setKnowledgeGroups(prevGroups => 
      prevGroups.map(group => {
        if (group.id === activeGroupId) {
          if (group.sources.length < MAX_SOURCES && !group.sources.find(s => s.id === source.id)) {
            return { ...group, sources: [...group.sources, source] };
          }
        }
        return group;
      })
    );
  };

  const handleRemoveSource = (sourceId: string) => {
    setKnowledgeGroups(prevGroups =>
      prevGroups.map(group => {
        if (group.id === activeGroupId) {
          return { ...group, sources: group.sources.filter(s => s.id !== sourceId) };
        }
        return group;
      })
    );
  };

  const handleAddGroup = (groupName: string) => {
    const newGroupId = `${groupName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const newGroup: KnowledgeGroup = {
      id: newGroupId,
      name: groupName,
      sources: [],
    };
    setKnowledgeGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newGroupId);
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    setKnowledgeGroups(prev => 
      prev.map(group => group.id === groupId ? { ...group, name: newName } : group)
    );
  };

  const handleDeleteGroup = (groupId: string) => {
    setKnowledgeGroups(prevGroups => {
      const newGroups = prevGroups.filter(group => group.id !== groupId);
  
      // If the active group was deleted, update the active group ID
      if (activeGroupId === groupId) {
        if (newGroups.length > 0) {
          setActiveGroupId(newGroups[0].id);
        } else {
          // If no groups are left, we will reset to initial state, so update active ID accordingly
          setActiveGroupId(INITIAL_KNOWLEDGE_GROUPS[0].id);
        }
      }
  
      // If the resulting list of groups is empty, reset to the initial default groups
      if (newGroups.length === 0) {
        return INITIAL_KNOWLEDGE_GROUPS;
      }
  
      return newGroups;
    });
  };

  const handleClearAllSources = () => {
    setKnowledgeGroups(prevGroups =>
      prevGroups.map(group => {
        if (group.id === activeGroupId) {
          return { ...group, sources: [] };
        }
        return group;
      })
    );
  };

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isLoading || isFetchingSuggestions) return;

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
       setChatMessages(prev => [...prev, {
        id: `error-apikey-${Date.now()}`,
        text: 'ERRO: A chave da API (process.env.API_KEY) não está configurada. Por favor, configure-a para enviar mensagens.',
        sender: MessageSender.SYSTEM,
        timestamp: new Date(),
      }]);
      return;
    }
    
    setIsLoading(true);
    setInitialQuerySuggestions([]); 

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: query,
      sender: MessageSender.USER,
      timestamp: new Date(),
    };
    
    const modelPlaceholderMessage: ChatMessage = {
      id: `model-response-${Date.now()}`,
      text: 'Pensando...', 
      sender: MessageSender.MODEL,
      timestamp: new Date(),
      isLoading: true,
    };

    setChatMessages(prevMessages => [...prevMessages, userMessage, modelPlaceholderMessage]);

    try {
      const response = await generateContentWithSources(query, currentSourcesForChat);
      setChatMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === modelPlaceholderMessage.id
            ? { ...modelPlaceholderMessage, text: response.text || "Recebi uma resposta vazia.", isLoading: false, urlContext: response.urlContextMetadata }
            : msg
        )
      );
    } catch (e: any) {
      const errorMessage = e.message || 'Falha ao obter resposta da IA.';
      setChatMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === modelPlaceholderMessage.id
            ? { ...modelPlaceholderMessage, text: `Erro: ${errorMessage}`, sender: MessageSender.SYSTEM, isLoading: false } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQueryClick = (query: string) => {
    handleSendMessage(query);
  };
  
  const handleGenerateMindMap = async (text: string) => {
    setMindMapState({
      isOpen: true,
      isLoading: true,
      error: null,
      title: 'Gerando Mapa Mental...',
      rawNodes: [],
      rawEdges: [],
    });
    try {
      const { nodes, edges } = await generateMindMapFromText(text);
      if (nodes.length === 0) {
        throw new Error("O modelo não conseguiu encontrar conceitos para criar um mapa mental a partir deste texto.");
      }
      setMindMapState(prev => ({
        ...prev,
        isLoading: false,
        title: 'Mapa Mental',
        rawNodes: nodes.map(n => ({ ...n, data: { label: n.label } })), // Adapt to React Flow format
        rawEdges: edges,
      }));
    } catch (e: any) {
      setMindMapState(prev => ({
        ...prev,
        isLoading: false,
        error: e.message || 'Ocorreu um erro desconhecido ao gerar o mapa mental.'
      }));
    }
  };

  const handleCloseMindMap = () => {
    setMindMapState(prev => ({ ...prev, isOpen: false }));
  };

  const chatPlaceholder = currentSourcesForChat.length > 0 
    ? `Faça perguntas sobre "${activeGroup?.name || 'documentos atuais'}"...`
    : "Selecione um grupo e/ou adicione URLs/arquivos à base de conhecimento para habilitar o chat.";

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
            sources={currentSourcesForChat}
            onAddSource={handleAddSource}
            onRemoveSource={handleRemoveSource}
            maxSources={MAX_SOURCES}
            knowledgeGroups={knowledgeGroups}
            activeGroupId={activeGroupId}
            onSetGroupId={setActiveGroupId}
            onAddGroup={handleAddGroup}
            onRenameGroup={handleRenameGroup}
            onDeleteGroup={handleDeleteGroup}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            onClearAllSources={handleClearAllSources}
          />
        </div>

        {/* Center Panel: Chat Interface */}
        <div className="w-full h-full p-3 md:p-0 md:flex-1">
          <ChatInterface
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholderText={chatPlaceholder}
            initialQuerySuggestions={initialQuerySuggestions}
            onSuggestedQueryClick={handleSuggestedQueryClick}
            isFetchingSuggestions={isFetchingSuggestions}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onGenerateMindMap={handleGenerateMindMap}
            onSaveToLibrary={handleSaveToLibrary}
            theme={theme}
            setTheme={setTheme}
          />
        </div>

        {/* Right Panel: Library */}
        <div className="hidden lg:block lg:w-1/4 xl:w-1/5 h-full">
           <LibraryPanel items={libraryItems} onDeleteItem={handleDeleteLibraryItem} />
        </div>
      </div>
      
      <MindMapModal
        isOpen={mindMapState.isOpen}
        onClose={handleCloseMindMap}
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