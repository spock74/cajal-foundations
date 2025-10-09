/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados.
 */

import { create } from 'zustand';
import {
  Conversation,
  ChatMessage,
  MessageSender,
  KnowledgeGroup,
  KnowledgeSource,
  LibraryItem,
  QuizData,
} from '../types';
import { DEFAULT_MODEL, models as modelInfoConfig } from '../components/models';
import { firestore } from '@/firebaseConfig';
import { geminiService } from '../services/geminiService';
import { sourceManagerService } from '../services/sourceManagerService';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  writeBatch,
  onSnapshot,
  collectionGroup,
} from 'firebase/firestore';
import { User } from 'firebase/auth';

interface AppState {
  // State
  conversations: Conversation[];
  groups: KnowledgeGroup[];
  activeGroupId: string | null;
  activeConversationId: string | null;
  isSidebarOpen: boolean;
  chatMessages: ChatMessage[];
  isLoading: boolean;
  libraryItems: LibraryItem[];
  sourcesForActiveGroup: KnowledgeSource[];
  activeModel: string;
  isEvaluationPanelOpen: boolean;
  isLibraryPanelOpen: boolean;
  activeQuizData: QuizData | null;
  theme: 'light' | 'dark';
  user: User | null;
  showModelSelect: boolean;

  // Actions
  initFirestoreListeners: (user: User) => () => void;
  cleanupFirestoreListeners: () => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  handleSetGroup: (groupId: string | null) => void;
  handleAddGroup: (name: string, user: User) => Promise<void>;
  handleDeleteGroup: (groupId: string, user: User) => Promise<void>;
  handleUpdateGroup: (groupId: string, newName: string, user: User) => Promise<void>;
  handleSetConversation: (id: string | null) => void;
  handleNewConversation: () => void;
  handleDeleteConversation: (id: string, user: User) => Promise<void>;
  handleClearAllConversations: (user: User) => Promise<void>; // Kept for clarity, no change here
  handleUrlAdd: (url: string, user: User) => Promise<void>;
  handleFileAdd: (file: File, user: User) => Promise<void>;
  handleRemoveSource: (sourceId: string, user: User) => Promise<void>;
  handleToggleSourceSelection: (sourceId: string, user: User) => Promise<void>;
  handleSaveToLibrary: (message: ChatMessage, user: User) => Promise<void>;
  handleDeleteLibraryItem: (id: string, user: User) => Promise<void>;
  handleOpenLibraryItem: (item: LibraryItem) => Promise<void>;
  handleSendMessage: (query: string, sourceIds: string[], user: User, actualPrompt?: string) => Promise<{ success: boolean; error?: Error }>;
  handleOptimizePrompt: (query: string, sourceIds: string[], user: User) => Promise<{ success: boolean; error?: Error }>;
  handleGenerateMindMap: (firestoreDocId: string, user: User) => Promise<{ success: boolean; error?: Error }>;
  generateUsageReport: () => Promise<any[]>;
  handleSetModel: (modelName: string) => void;
  handleMindMapLayoutChange: (messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }, user: User) => Promise<void>;
  handleStartEvaluation: (quizData: QuizData) => void;
  handleCloseEvaluation: () => void;
  setIsLibraryPanelOpen: (isOpen: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const showModelSelect = import.meta.env.VITE_SHOW_MODEL_SELECT === 'true';

// Centralized object to hold all active listener unsubscribe functions
let listeners = {
  user: null as (() => void) | null,
  group: null as (() => void) | null,
  conversation: null as (() => void) | null,
};

export const useAppStore = create<AppState>((set, get) => ({
  // --- INTERNAL STATE (not exposed in AppState interface) ---

  // --- INITIAL STATE ---
  conversations: [],
  groups: [],
  activeGroupId: null,
  activeConversationId: null,
  isSidebarOpen: false,
  chatMessages: [],
  isLoading: false,
  libraryItems: [],
  sourcesForActiveGroup: [],
  activeModel: showModelSelect ? (localStorage.getItem('activeModel') || DEFAULT_MODEL) : 'gemini-2.5-flash-lite',
  isEvaluationPanelOpen: false,
  isLibraryPanelOpen: false,
  activeQuizData: null,
  user: null,
  theme: (() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  })(),
  showModelSelect,

  // --- ACTIONS ---

  // Listener Management
  initFirestoreListeners: (user) => {
    get().cleanupFirestoreListeners(); // Clean up any previous listeners
    set({ user });
    const userId = user.uid;

    const groupQuery = query(collection(firestore, 'users', userId, 'groups'), orderBy('createdAt', 'desc'));
    const unsubGroups = onSnapshot(groupQuery, (snapshot) => {
      const fetchedGroups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeGroup));
      set({ groups: fetchedGroups });
      const currentActiveGroupId = get().activeGroupId;
      if (!currentActiveGroupId || !fetchedGroups.some(g => g.id === currentActiveGroupId)) {
        // Setting a new group will automatically trigger the handleSetGroup logic
        get().handleSetGroup(fetchedGroups[0]?.id || null);
      }
    }, (error) => {
      console.error("Erro ao buscar grupos:", error);
      // Consider setting an error state in the store here for the UI to display
    });

    const unsubLibrary = onSnapshot(query(collection(firestore, 'users', userId, 'libraryItems'), orderBy('timestamp', 'desc')), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as LibraryItem));
      set({ libraryItems: items });
    });
    
    listeners.user = () => { unsubGroups(); unsubLibrary(); };

    return () => {
      get().cleanupFirestoreListeners();
    };
  },
  
  cleanupFirestoreListeners: () => {
    listeners.user?.();
    listeners.group?.();
    listeners.conversation?.();
    listeners = { user: null, group: null, conversation: null };
    set({
        groups: [],
        conversations: [],
        chatMessages: [],
        libraryItems: [],
        sourcesForActiveGroup: [],
        activeGroupId: null,
        activeConversationId: null,
        user: null,
    });
  },

  // UI State
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setIsLibraryPanelOpen: (isOpen) => set({ isLibraryPanelOpen: isOpen }),
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  },

  // Model
  handleSetModel: (modelName) => {
    set({ activeModel: modelName });
    if (get().showModelSelect) {
      localStorage.setItem('activeModel', modelName);
    }
  },

  // Group Management
  handleSetGroup: (groupId: string | null) => {
    const { user } = get();
    listeners.group?.(); // Unsubscribe from previous group listeners
    set({ activeGroupId: groupId, conversations: [], sourcesForActiveGroup: [] });

    // Also reset the active conversation
    get().handleSetConversation(null);

    if (groupId && user?.uid) {
      const convosQuery = query(collection(firestore, 'users', user.uid, 'groups', groupId, 'conversations'), orderBy('timestamp', 'desc'));
      const unsubConvos = onSnapshot(convosQuery, (snapshot) => {
        const fetchedConversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
        set({ conversations: fetchedConversations });
      });

      const sourcesQuery = query(collection(firestore, 'users', user.uid, 'groups', groupId, 'sources'), orderBy('timestamp', 'desc'));
      const unsubSources = onSnapshot(sourcesQuery, (snapshot) => {
        const fetchedSources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KnowledgeSource));
        set({ sourcesForActiveGroup: fetchedSources });
      });

      listeners.group = () => { unsubConvos(); unsubSources(); };
    }
  },
  handleAddGroup: async (name, user) => {
    const groupsCollectionRef = collection(firestore, 'users', user.uid, 'groups');
    await addDoc(groupsCollectionRef, { name, createdAt: serverTimestamp(), sources: [] });
  },
  handleDeleteGroup: async (groupId, user) => {
    const groupDocRef = doc(firestore, 'users', user.uid, 'groups', groupId);
    await deleteDoc(groupDocRef);
  },
  handleUpdateGroup: async (groupId, newName, user) => {
    const groupDocRef = doc(firestore, 'users', user.uid, 'groups', groupId);
    await updateDoc(groupDocRef, { name: newName });
  },

  // Conversation Management
  handleSetConversation: (id: string | null) => {
    const { user, activeGroupId } = get();
    listeners.conversation?.(); // Unsubscribe from previous conversation listener
    set({ activeConversationId: id, chatMessages: [] });

    if (id && activeGroupId && user?.uid) {
      const messagesQuery = query(collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', id, 'messages'), orderBy('timestamp', 'asc'));
      const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
        set({ chatMessages: fetchedMessages });
      });
      listeners.conversation = unsubMessages;
    }
  },
  handleNewConversation: () => set({ activeConversationId: null, chatMessages: [] }),
  handleDeleteConversation: async (id, user) => {
    const { activeGroupId, activeConversationId } = get();
    if (!activeGroupId) return;
    const convoDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', id);
    const messagesRef = collection(convoDocRef, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);
    const batch = writeBatch(firestore);
    messagesSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    await deleteDoc(convoDocRef);
    if (id === activeConversationId) {
      set({ activeConversationId: null, chatMessages: [] });
    }
  },
  handleClearAllConversations: async (user) => {
    set({ isLoading: true });
    try {
      const groupsRef = collection(firestore, 'users', user.uid, 'groups');
      const groupsSnapshot = await getDocs(groupsRef);
      const batch = writeBatch(firestore);
      groupsSnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } catch (error) {
      console.error("Erro ao limpar dados:", error);
      throw error; // Re-throw the error to be caught by the component
    } finally {
      set({ isLoading: false });
    }
  },

  // Source Management
  handleUrlAdd: async (url, user) => {
    const { activeGroupId } = get();
    if (!activeGroupId) return;
    set({ isLoading: true });
    try {
      const newSource = await sourceManagerService.addUrlSource(url, activeGroupId);
      const sourcesCollectionRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources');
      await addDoc(sourcesCollectionRef, { ...newSource, timestamp: serverTimestamp() });
    } finally {
      set({ isLoading: false });
    }
  },
  handleFileAdd: async (file, user) => {
    const { activeGroupId } = get();
    if (!activeGroupId) return;
    set({ isLoading: true });
    try {
      const newSource = await sourceManagerService.addFileSource(file, activeGroupId);
      const sourcesCollectionRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources');
      await addDoc(sourcesCollectionRef, { ...newSource, timestamp: serverTimestamp() });
    } finally {
      set({ isLoading: false });
    }
  },
  handleRemoveSource: async (sourceId, user) => {
    const { activeGroupId } = get();
    if (!activeGroupId) return;
    const sourceDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources', sourceId);
    await deleteDoc(sourceDocRef);
  },
  handleToggleSourceSelection: async (sourceId, user) => {
    const { activeGroupId, sourcesForActiveGroup } = get();
    if (!activeGroupId) return;
    const sourceToUpdate = sourcesForActiveGroup.find(s => s.id === sourceId);
    if (!sourceToUpdate) return;
    const sourceDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'sources', sourceId);
    await updateDoc(sourceDocRef, { selected: !sourceToUpdate.selected });
  },

  // Library Management
  handleSaveToLibrary: async (message, user) => {
    const { activeGroupId, activeConversationId } = get();
    if (!activeGroupId || !activeConversationId) return;
    const newItem = {
      type: 'text',
      content: message.text,
      timestamp: serverTimestamp(),
      conversationId: activeConversationId,
      groupId: activeGroupId,
      messageId: message.id,
      sourceIds: message.sourceIds || []
    };
    const libraryCollectionRef = collection(firestore, 'users', user.uid, 'libraryItems');
    await addDoc(libraryCollectionRef, newItem);
  },
  handleDeleteLibraryItem: async (id, user) => {
    const { libraryItems } = get();
    const itemToDelete = libraryItems.find(item => item.id === id);
    if (!itemToDelete) return;

    if (itemToDelete.type === 'mindmap' && itemToDelete.messageId) {
      const messageDocRef = doc(firestore, 'users', user.uid, 'groups', itemToDelete.groupId, 'conversations', itemToDelete.conversationId, 'messages', itemToDelete.messageId);
      await updateDoc(messageDocRef, { 'mindMap.isArchived': false, 'mindMap.isVisible': false });
    }

    const libraryItemDocRef = doc(firestore, 'users', user.uid, 'libraryItems', id);
    await deleteDoc(libraryItemDocRef);

  },
  handleOpenLibraryItem: async (item) => {
    const { activeGroupId, handleSetGroup, handleSetConversation } = get();
    if (activeGroupId !== item.groupId) {
      handleSetGroup(item.groupId);
    }
    if (get().activeConversationId !== item.conversationId) { // Use get() for fresh state
      handleSetConversation(item.conversationId);
    }
    if (item.type === 'mindmap' && item.messageId) {
        set(state => ({
            chatMessages: state.chatMessages.map(msg => 
                msg.id === item.messageId ? { ...msg, mindMap: { ...msg.mindMap!, isVisible: true } } : msg
            )
        }));
    }
  },

  // Chat Actions
  handleSendMessage: async (query, sourceIds, user, actualPrompt): Promise<{ success: boolean; error?: Error }> => {
    const { activeGroupId, activeModel, sourcesForActiveGroup } = get();
    if (!query.trim() || !user || !activeGroupId) return { success: false, error: new Error("Invalid parameters for sending message.") };
    set({ isLoading: true });
    let { activeConversationId } = get();

    if (!activeConversationId) {
      const title = await geminiService.generateTitleForConversation(query);
      const convosRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations');
      const newConvoDoc = await addDoc(convosRef, { name: title, groupId: activeGroupId, timestamp: serverTimestamp() });
      activeConversationId = newConvoDoc.id;
      set({ activeConversationId });
    }

    const messagesRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', activeConversationId, 'messages');
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, conversationId: activeConversationId, text: query, sender: MessageSender.USER, timestamp: new Date(), sourceIds };
    const modelPlaceholder: ChatMessage = { id: `model-${Date.now()}`, conversationId: activeConversationId, text: 'Processando...', sender: MessageSender.MODEL, timestamp: new Date(), isLoading: true, sourceIds };
    
    set(state => ({ chatMessages: [...state.chatMessages, userMessage, modelPlaceholder] }));
    
    await addDoc(messagesRef, { ...userMessage, timestamp: serverTimestamp() });
    const modelPlaceholderDocRef = await addDoc(messagesRef, { ...modelPlaceholder, timestamp: serverTimestamp() });

    try {
      const selectedSources = sourcesForActiveGroup.filter(s => sourceIds.includes(s.id));
      const response = await geminiService.generateContentWithSources(actualPrompt || query, selectedSources, activeModel);
      const finalMessage: Partial<ChatMessage> = { text: response.text, isLoading: false, model: response.modelName, usageMetadata: response.usageMetadata, urlContext: response.urlContextMetadata };
      await updateDoc(modelPlaceholderDocRef, { ...finalMessage, timestamp: serverTimestamp() });
      return { success: true };
    } catch (e: any) {
      const errorMessage: Partial<ChatMessage> = { text: `Erro: ${e.message}`, sender: MessageSender.SYSTEM, isLoading: false };
      await updateDoc(modelPlaceholderDocRef, { ...errorMessage, timestamp: serverTimestamp() });
      return { success: false, error: e };
    } finally {
      set({ isLoading: false });
    }
  },

  handleOptimizePrompt: async (query, sourceIds, user): Promise<{ success: boolean; error?: Error }> => {
    const { activeGroupId, activeModel, sourcesForActiveGroup, handleSetConversation } = get();
    if (!query.trim() || !user || !activeGroupId) return { success: false, error: new Error("Invalid parameters") };
    set({ isLoading: true });
    let { activeConversationId } = get();

    if (!activeConversationId) {
      const title = await geminiService.generateTitleForConversation(query);
      const convosRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations');
      const newConvoDoc = await addDoc(convosRef, { name: title, groupId: activeGroupId, timestamp: serverTimestamp() });
      activeConversationId = newConvoDoc.id;
      handleSetConversation(activeConversationId);
    }

    const messagesRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', activeConversationId, 'messages');
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, conversationId: activeConversationId, text: query, sender: MessageSender.USER, timestamp: new Date(), sourceIds };
    const systemPlaceholder: ChatMessage = { id: `system-loading-${Date.now()}`, conversationId: activeConversationId, text: 'Otimizando prompt...', sender: MessageSender.SYSTEM, timestamp: new Date(), isLoading: true };
    
    set(state => ({ chatMessages: [...state.chatMessages, userMessage, systemPlaceholder] }));
    
    await addDoc(messagesRef, { ...userMessage, timestamp: serverTimestamp() });
    const systemPlaceholderDocRef = await addDoc(messagesRef, { ...systemPlaceholder, timestamp: serverTimestamp() });

    try {
      const selectedSources = sourcesForActiveGroup.filter(s => sourceIds.includes(s.id));
      const suggestions = await geminiService.generateOptimizedPrompts(query, selectedSources, activeModel);
      const systemMessage: Partial<ChatMessage> = { text: "Aqui estão algumas sugestões...", isLoading: false, optimizedPrompts: suggestions, sourceIds: sourceIds };
      await updateDoc(systemPlaceholderDocRef, { ...systemMessage, timestamp: serverTimestamp() });
      return { success: true };
    } catch (e: any) {
      const errorMessage: Partial<ChatMessage> = { text: `Erro ao otimizar: ${e.message}`, sender: MessageSender.SYSTEM, isLoading: false };
      await updateDoc(systemPlaceholderDocRef, { ...errorMessage, timestamp: serverTimestamp() });
      return { success: false, error: e };
    } finally {
      set({ isLoading: false });
      // The dismiss() call was here, but since toast is handled in the component, it's no longer needed.
    }
  },

  // Mind Map
  handleGenerateMindMap: async (firestoreDocId, user): Promise<{ success: boolean; error?: Error }> => {
    const { activeConversationId, chatMessages, activeModel, activeGroupId } = get();
    if (!activeConversationId) return { success: false, error: new Error("No active conversation") };

    const currentMessageState = chatMessages.find(msg => msg.id === firestoreDocId);
    if (!currentMessageState) return { success: false, error: new Error("Message not found") };

    const existingMindMap = currentMessageState.mindMap;
    const messageDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId!, 'conversations', activeConversationId, 'messages', firestoreDocId);

    if (existingMindMap && existingMindMap.nodes.length > 0) {
      const updatedMindMap = { ...existingMindMap, isVisible: !existingMindMap.isVisible };
      await updateDoc(messageDocRef, { mindMap: updatedMindMap });
      return { success: true };
    }

    await updateDoc(messageDocRef, { mindMap: { isVisible: true, isLoading: true, error: null, nodes: [], edges: [] } });

    try {
      const { title, nodes, edges } = await geminiService.generateMindMapFromText(currentMessageState.text, activeModel);
      if (nodes.length === 0) throw new Error("Não foi possível extrair conceitos.");
      
      const rootNode = nodes.find(n => !edges.some(e => e.target === n.id)) || nodes[0];
      const libraryItem = { type: 'mindmap', content: title, timestamp: serverTimestamp(), conversationId: activeConversationId, groupId: activeGroupId, messageId: firestoreDocId, sourceIds: currentMessageState.sourceIds || [] };
      const libraryCollectionRef = collection(firestore, 'users', user.uid, 'libraryItems');
      await addDoc(libraryCollectionRef, libraryItem);

      await updateDoc(messageDocRef, {
        mindMap: { title, isVisible: true, isLoading: false, error: null, nodes, edges, isArchived: true, expandedNodeIds: rootNode ? [rootNode.id] : [], nodePositions: {} }
      });
      return { success: true };
    } catch (e: any) {
      await updateDoc(messageDocRef, { mindMap: { isVisible: true, isLoading: false, error: e.message, nodes: [], edges: [] } });
      return { success: false, error: e };
    } 
  },
  handleMindMapLayoutChange: async (messageId, layout, user) => {
    const { activeGroupId, activeConversationId } = get();
    if (!activeGroupId || !activeConversationId) return;
    const messageDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', activeConversationId, 'messages', messageId);
    await updateDoc(messageDocRef, { 'mindMap.expandedNodeIds': layout.expandedNodeIds, 'mindMap.nodePositions': layout.nodePositions });
  },

  // Reporting
  generateUsageReport: async () => {
    const messagesCollectionGroupRef = collectionGroup(firestore, 'messages');
    const querySnapshot = await getDocs(messagesCollectionGroupRef);
    const allMessages: ChatMessage[] = querySnapshot.docs.map(doc => doc.data() as ChatMessage);

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

    return Array.from(usageMap.entries()).map(([modelName, stats]) => {
      const modelInfo = modelInfoConfig[modelName];
      const cost = modelInfo ? ((stats.totalInputTokens / 1_000_000) * modelInfo.in) + ((stats.totalOutputTokens / 1_000_000) * modelInfo.out) : 0;
      return { modelName, ...stats, totalTokens: stats.totalInputTokens + stats.totalOutputTokens, estimatedCost: cost };
    }).sort((a, b) => b.totalTokens - a.totalTokens);
  },

  // Evaluation
  handleStartEvaluation: (quizData) => set({ activeQuizData: quizData, isEvaluationPanelOpen: true }),
  handleCloseEvaluation: () => {
    set({ isEvaluationPanelOpen: false });
    setTimeout(() => set({ activeQuizData: null }), 300);
  },
}));