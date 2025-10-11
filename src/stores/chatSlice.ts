/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */
import { StateCreator } from 'zustand';
import { ChatMessage, KnowledgeSource, MessageSender, OptimizedPrompt, QuizData } from '../types';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { User } from 'firebase/auth';
import { DEFAULT_MODEL } from '@/components/models';
import { toast } from '@/hooks/use-toast';
import { addDoc, collection, doc, serverTimestamp, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore, auth } from '@/firebaseConfig';
import { ModelUsage } from '@/components/UsageReportPanel';
import { GroupSlice } from './groupSlice';
import { signOut } from 'firebase/auth';

// Funções da Cloud Function para uma chamada mais limpa

export interface ChatSlice {
  user: User | null; // Adicionado para que os slices possam acessar o usuário
  chatMessages: ChatMessage[];
  activeConversationId: string | null;
  isLoading: boolean;
  isInputDisabled: boolean;
  activeModel: string;
  showModelSelect: boolean; // NOSONAR
  showAiAvatar: boolean;
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  isEvaluationPanelOpen: boolean;
  activeQuizData: QuizData | null;
  isLibraryPanelOpen: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  deleteDialog: {
    isOpen: boolean;
    messageId?: string;
    messageText?: string;
  };
  setUser: (user: any | null) => void; // Alterado para 'any' para compatibilidade
  setMessages: (messages: ChatMessage[]) => void;
  handleSetConversation: (conversationId: string | null) => void;
  handleNewConversation: () => void;
  handleSetModel: (modelName: string) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsLibraryPanelOpen: (isOpen: boolean) => void;
  handleStartEvaluation: (quizData: QuizData) => void;
  initMessagesListener: (groupId: string, conversationId: string) => () => void;
  handleCloseEvaluation: () => void;
  logOut: () => Promise<void>;
  handleGenerateMindMap: (firestoreDocId: string) => Promise<void>;
  handleMindMapLayoutChange: (messageId: string, layout: { expandedNodeIds?: string[], nodePositions?: { [nodeId: string]: { x: number, y: number } } }) => Promise<void>;
  requestDeleteMessage: (messageId: string, messageText: string) => void;
  confirmDeleteMessage: () => Promise<void>;
  cancelDeleteMessage: () => void;
  generateUsageReport: () => Promise<ModelUsage[]>;
  sendMessage: (query: string, sources: KnowledgeSource[], history: ChatMessage[], modelName: string, actualPrompt?: string, generatedFrom?: OptimizedPrompt) => Promise<void>;
  optimizePrompt: (query: string, sources: KnowledgeSource[], modelName: string) => Promise<void>;
}

export const createChatSlice: StateCreator<
  ChatSlice & GroupSlice, // Informa ao slice sobre o estado completo da aplicação
  [],
  [],
  ChatSlice
> = (set, get) => ({
  user: null,
  chatMessages: [],
  activeConversationId: null,
  isLoading: false,
  isInputDisabled: false,
  showModelSelect: import.meta.env.VITE_SHOW_MODEL_SELECT === 'true',
  showAiAvatar: import.meta.env.VITE_SHOW_AI_AVATAR === 'true',
  isSidebarOpen: false,
  theme: 'light', // O valor inicial será ajustado por um hook no App.tsx
  isEvaluationPanelOpen: false,
  activeQuizData: null,
  isLibraryPanelOpen: false,
  deleteDialog: { isOpen: false },
  activeModel: localStorage.getItem('activeModel') || DEFAULT_MODEL,
  setUser: (user) => set({ user: user as User | null }),
  setMessages: (messages) => set({ chatMessages: messages }),
  handleSetConversation: (conversationId) => {
    if (get().activeConversationId !== conversationId) {
      set({ activeConversationId: conversationId, chatMessages: [] });
    }
  },
  handleSetModel: (modelName: string) => {
    set({ activeModel: modelName });
    if (get().showModelSelect) {
      localStorage.setItem('activeModel', modelName);
    }
  },
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },
  setIsLibraryPanelOpen: (isOpen) => set({ isLibraryPanelOpen: isOpen }),
  handleStartEvaluation: (quizData) => {
    set({ activeQuizData: quizData, isEvaluationPanelOpen: true });
  },
  handleCloseEvaluation: () => {
    set({ isEvaluationPanelOpen: false });
    setTimeout(() => set({ activeQuizData: null }), 300); // Atraso para animação
  },
  handleNewConversation: () => set({ activeConversationId: null, chatMessages: [] }),
  logOut: async () => {
    await signOut(auth);
    // Limpa todo o estado da aplicação ao fazer logout.
    set({ user: null, activeGroupId: null, activeConversationId: null, chatMessages: [], groups: [], conversations: [], sourcesForActiveGroup: [], libraryItems: [] });
  },
  handleGenerateMindMap: async (firestoreDocId) => {
    const { activeConversationId, chatMessages, activeModel, activeGroupId, user } = get();
    if (!activeConversationId || !user) return;

    const currentMessageState = chatMessages.find(msg => msg.id === firestoreDocId);
    if (!currentMessageState) return;

    const { dismiss } = toast({ title: "Gerando Mapa Mental..." });

    const updateMindMapState = async (update: Partial<ChatMessage>) => {
      set(state => ({
        chatMessages: state.chatMessages.map(msg => msg.id === firestoreDocId ? { ...msg, ...update } : msg)
      }));
      // Garante que a atualização só ocorra se houver um mindMap para atualizar.
      if (update.mindMap) {
        const messageDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId!, 'conversations', activeConversationId, 'messages', firestoreDocId);
        await updateDoc(messageDocRef, { mindMap: update.mindMap });
      }
    };

    // Se o mapa mental já existe e tem nós, apenas alterna a visibilidade.
    if (currentMessageState.mindMap && currentMessageState.mindMap.nodes.length > 0) {
      await updateMindMapState({
        mindMap: {
          ...currentMessageState.mindMap,
          isVisible: !currentMessageState.mindMap.isVisible,
        },
      });
      dismiss();
      return;
    }

    await updateMindMapState({ mindMap: { isVisible: true, isLoading: true, error: null, nodes: [], edges: [] } });

    try {
      const generateMindMapFn = httpsCallable<any, any>(functions, 'generateMindMap');
      const result = await generateMindMapFn({ textToAnalyze: currentMessageState.text, modelName: activeModel, sources: [] });
      const { title, nodes, edges } = result.data;

      if (nodes.length === 0) throw new Error("Não foi possível extrair conceitos para o mapa mental.");

      const rootNode = nodes.find((n: any) => !edges.some((e: any) => e.target === n.id)) || nodes[0];

      const newMindMapState = {
        title,
        isVisible: true,
        isLoading: false,
        error: null,
        nodes,
        edges,
        isArchived: true,
        expandedNodeIds: rootNode ? [rootNode.id] : [],
        nodePositions: {},
      };

      await updateMindMapState({ mindMap: newMindMapState });

      const libraryItem = {
        type: 'mindmap',
        content: title,
        timestamp: new Date(),
        conversationId: activeConversationId,
        groupId: activeGroupId,
        messageId: firestoreDocId,
        sourceIds: currentMessageState.sourceIds || []
      };
      const libraryCollectionRef = collection(firestore, 'users', user.uid, 'libraryItems');
      await addDoc(libraryCollectionRef, { ...libraryItem, timestamp: serverTimestamp() });

    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro no Mapa Mental", description: e.message });
      await updateMindMapState({ mindMap: { isVisible: true, isLoading: false, error: e.message, nodes: [], edges: [] } });
    } finally {
      dismiss();
    }
  },
  handleMindMapLayoutChange: async (messageId, layout) => {
    const { user, activeGroupId, activeConversationId } = get();
    if (!user || !activeGroupId || !activeConversationId) return;
    const messageDocRef = doc(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', activeConversationId, 'messages', messageId);
    await updateDoc(messageDocRef, { 'mindMap.expandedNodeIds': layout.expandedNodeIds, 'mindMap.nodePositions': layout.nodePositions });
  },
  initMessagesListener: (groupId, conversationId) => {
    const user = get().user;
    if (!user) return () => {};

    const messagesQuery = query(
      collection(firestore, 'users', user.uid, 'groups', groupId, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date() // Converte o Timestamp do Firestore para Date
        } as ChatMessage;
      });
      set({ chatMessages: newMessages });
    });
    return unsubscribe;
  },
  requestDeleteMessage: (messageId, messageText) => {
    set({ deleteDialog: { isOpen: true, messageId, messageText } });
  },
  cancelDeleteMessage: () => {
    set({ deleteDialog: { isOpen: false } });
  },
  confirmDeleteMessage: async () => {
    const { user, activeGroupId, activeConversationId, deleteDialog, chatMessages } = get();
    if (!user || !activeGroupId || !activeConversationId || !deleteDialog.messageId) {
      toast({ variant: "destructive", title: "Erro", description: "Contexto inválido para apagar a mensagem." });
      return;
    }

    // Encontra a mensagem completa no estado para obter o generatedFromId
    const messageToDelete = chatMessages.find(msg => msg.id === deleteDialog.messageId);

    const { dismiss } = toast({ title: "Apagando mensagem..." });
    const deleteMessageFn = httpsCallable(functions, 'deleteMessageCascade');
    try {
      // Envia o generatedFromId para a Cloud Function
      await deleteMessageFn({ groupId: activeGroupId, conversationId: activeConversationId, messageId: deleteDialog.messageId, generatedFromId: messageToDelete?.generatedFromId });
      toast({ title: "Mensagem apagada com sucesso." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao apagar mensagem", description: error.message || "Ocorreu um erro." });
    } finally {
      dismiss();
      set({ deleteDialog: { isOpen: false } });
    }
  },
  generateUsageReport: async () => {
    // This logic is simplified. In a real app, you'd query Firestore.
    // For now, we'll just return a placeholder.
    console.log("Gerando relatório de uso...");
    return [];
  },
  sendMessage: async (query, sources, history, modelName, actualPrompt, generatedFrom) => {
    const { activeGroupId, activeConversationId, user, handleSetConversation } = get();
    if (!user || !activeGroupId) return;

    set({ isLoading: true, isInputDisabled: true });

    const promptForAI = actualPrompt || query;
    let currentConversationId = activeConversationId;

    // Se não houver uma conversa ativa, cria uma nova.
    if (!currentConversationId) {
      const generateTitleFn = httpsCallable<any, { title: string }>(functions, 'generateTitle');
      const { data } = await generateTitleFn({ text: query });
      const convosRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations');
      const newConvoDoc = await addDoc(convosRef, { name: data.title, groupId: activeGroupId, timestamp: serverTimestamp() });
      currentConversationId = newConvoDoc.id;
      handleSetConversation(currentConversationId); // Atualiza o ID da conversa ativa no estado
    }

    const messagesRef = collection(firestore, 'users', user.uid, 'groups', activeGroupId, 'conversations', currentConversationId, 'messages');

    const userMessage: Partial<ChatMessage> = { 
      conversationId: currentConversationId,
      sender: MessageSender.USER, 
      text: query, 
      timestamp: serverTimestamp() as any, // Usa 'as any' para compatibilidade de tipo
      generatedFrom: generatedFrom, // Salva a origem da sugestão na mensagem
      sourceIds: sources.map(s => s.id),
    };

    // Salva a mensagem do usuário no Firestore e obtém sua referência
    const userMessageDocRef = await addDoc(messagesRef, userMessage);

    const modelPlaceholder: Partial<ChatMessage> = { 
      conversationId: currentConversationId, 
      text: 'Processando...', 
      sender: MessageSender.MODEL, 
      timestamp: serverTimestamp() as any, // Usa 'as any' para compatibilidade de tipo
      isLoading: true, 
      sourceIds: sources.map(s => s.id),
      generatedFromId: userMessageDocRef.id, // Vincula a resposta à pergunta
    };

    // Salva o placeholder do modelo no Firestore e obtém sua referência
    const modelPlaceholderDocRef = await addDoc(messagesRef, modelPlaceholder);

    try {
      const generateContent = httpsCallable<any, any>(functions, 'generateContent');
      const result = await generateContent({ prompt: promptForAI, sources, modelName, history });
      const modelMessage: Partial<ChatMessage> = { 
        text: result.data.text, 
        isLoading: false,
        ...result.data 
      };
      
      // Atualiza o placeholder no Firestore com a resposta real da IA
      await updateDoc(modelPlaceholderDocRef, modelMessage);

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage: Partial<ChatMessage> = { sender: MessageSender.SYSTEM, text: 'Ocorreu um erro ao processar sua solicitação.', timestamp: new Date() };
      // Atualiza o placeholder no Firestore com a mensagem de erro
      await updateDoc(modelPlaceholderDocRef, { ...errorMessage, isLoading: false });
    } finally {
      set({ isLoading: false, isInputDisabled: false });
    }
  },
  optimizePrompt: async (query, sources, modelName) => {
    set({ isLoading: true, isInputDisabled: true });
    try {
      const optimizePrompt = httpsCallable<any, any>(functions, 'optimizePrompt');
      const result = await optimizePrompt({ humanPrompt: query, sources, modelName });
      const systemMessage: Partial<ChatMessage> = {
        sender: MessageSender.SYSTEM,
        text: 'Recebemos as sugestões de prompt otimizado.',
        timestamp: new Date(),
        optimizedPrompts: result.data.optimized_prompts,
      };
      set(state => ({ chatMessages: [...state.chatMessages, systemMessage as ChatMessage] }));
    } catch (error) {
      console.error("Erro ao otimizar prompt:", error);
      const errorMessage: Partial<ChatMessage> = { sender: MessageSender.SYSTEM, text: 'Ocorreu um erro ao otimizar o prompt.', timestamp: new Date() };
      set(state => ({ chatMessages: [...state.chatMessages, errorMessage as ChatMessage] }));
    } finally {
      set({ isLoading: false, isInputDisabled: false });
    }
  },
});