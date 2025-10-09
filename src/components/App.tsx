/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados.
 */

import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useAuth } from "@/hooks/useAuth";
import ConversationManager from "./ConversationManager";
import ChatInterface from "./ChatInterface"; 
import LibraryPanel from "./LibraryPanel";
import AuthPage from "./AuthPage";
import { Toaster } from "@/components/ui/toaster";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import UsageReportPanel, { ModelUsage } from "@/components/UsageReportPanel";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";
import { sampleQuizData } from "@/data/pedagogical_content/formative_quizzes/cardiologia_basica_qf_v1";
import { useToast } from "@/hooks/use-toast";
import { User } from "firebase/auth";

/**
 * A component responsible for initializing and managing Firestore listeners
 * based on the application's state from the Zustand store.
 */
const StoreInitializer: React.FC = () => {
  const { user } = useAuth();
  const initFirestoreListeners = useAppStore(s => s.initFirestoreListeners);
  const cleanupFirestoreListeners = useAppStore(s => s.cleanupFirestoreListeners);

  useEffect(() => {
    if (user) {
      const cleanup = initFirestoreListeners(user as unknown as User);
      return cleanup;
    } else {
      cleanupFirestoreListeners();
    }
  }, [user, initFirestoreListeners, cleanupFirestoreListeners]);

  return null; // This component does not render anything.
};

const App: React.FC = () => {
  const store = useAppStore();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [reportData, setReportData] = useState<ModelUsage[]>([]);
  const [isTeacherDashboardVisible, setIsTeacherDashboardVisible] = useState(true);

  // TODO: A lógica de `role` deve vir do perfil do usuário no Firestore,
  // associado ao `useAuth` hook. Por enquanto, simulamos um professor.
  const userRole = 'teacher'; // 'student' ou 'teacher'

  // All hooks must be called at the top level of the component.
  const libraryItemsForActiveContext = useMemo(() => store.activeGroupId ? store.libraryItems.filter(item => item.groupId === store.activeGroupId) : [], [store.libraryItems, store.activeGroupId]);
  const chatPlaceholder = useMemo(() => store.sourcesForActiveGroup.filter(s => s.selected).length > 0 ? `Perguntar sobre as ${store.sourcesForActiveGroup.filter(s => s.selected).length} fontes selecionadas...` : "Comece uma nova conversa ou adicione fontes.", [store.sourcesForActiveGroup]);
  const activeConversationName = useMemo(() => store.conversations.find(c => c.id === store.activeConversationId)?.name || (store.activeConversationId === null && store.chatMessages.length === 0 ? "Nova Conversa" : "Navegador de Documentos"), [store.conversations, store.activeConversationId, store.chatMessages.length]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Handler functions can be defined after the conditional returns.
  const handleOpenReportPanel = async () => {
    if (!user) return;
    const data = await store.generateUsageReport();
    setReportData(data);
    setIsReportPanelOpen(true);
  };

  const handleClearAll = async () => {
    if (!user) return;
    const { dismiss } = toast({ title: "Limpando todos os dados...", description: "Aguarde." });
    try {
      await store.handleClearAllConversations(user as unknown as User);
      toast({ title: "Limpeza Concluída" });
    } catch (error) {
      toast({ variant: "destructive", title: "Falha na Limpeza" });
    } finally {
      dismiss();
    }
  };

  const handleOptimizePrompt = async (query: string, sourceIds: string[]) => {
    if (!user) return;
    const { dismiss } = toast({ title: "Otimizando Prompt..." });
    const result = await store.handleOptimizePrompt(query, sourceIds, user as unknown as User);
    dismiss();
    if (result.success) {
      toast({ variant: "default", title: "Sugestões Prontas!" });
    } else {
      toast({ variant: "destructive", title: "Erro ao otimizar", description: result.error?.message });
    }
  };

  const handleGenerateMindMap = async (docId: string) => {
    if (!user) return;
    const { dismiss } = toast({ title: "Gerando Mapa Mental..." });
    const result = await store.handleGenerateMindMap(docId, user as unknown as User);
    dismiss();
    if (!result.success) {
      toast({ variant: "destructive", title: "Falha ao criar o Mapa Mental", description: result.error?.message });
    } else {
      // Success is handled by the UI updating, no toast needed unless you want one.
    }
  };

  return (
    // Usando React.Fragment para permitir que o Modal seja um irmão do layout principal.
    <>
      <StoreInitializer />
      {/* Fundo principal com um gradiente sutil para dar profundidade */}
      <div className="h-screen max-h-screen antialiased relative overflow-x-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-black dark:bg-[radial-gradient(#ffffff20_1px,transparent_1px)]"></div>

        {(store.isSidebarOpen || store.isLibraryPanelOpen) && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => { store.setIsSidebarOpen(false); store.setIsLibraryPanelOpen(false); }} aria-hidden="true" />}
        
        <div className="flex h-full w-full p-2 md:p-4 gap-2 md:gap-4">
          <div className={`fixed top-0 left-0 h-full w-11/12 max-w-sm z-30 transform transition-transform ease-in-out duration-300 p-3 md:static md:p-0 md:w-1/3 xl:w-1/4 md:h-full md:max-w-sm md:translate-x-0 md:z-auto ${store.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <ConversationManager
              groups={store.groups}
              activeGroupId={store.activeGroupId}
              onSetGroupId={store.handleSetGroup}
              onAddGroup={(name) => user && store.handleAddGroup(name, user as unknown as User)}
              onDeleteGroup={(id) => user && store.handleDeleteGroup(id, user as unknown as User)}
              onUpdateGroup={(id, name) => user && store.handleUpdateGroup(id, name, user as unknown as User)}
              conversations={store.conversations}
              activeConversationId={store.activeConversationId}
              sourcesForActiveGroup={store.sourcesForActiveGroup}
              onSetConversationId={store.handleSetConversation}
              onNewConversation={store.handleNewConversation}
              onDeleteConversation={(id) => user && store.handleDeleteConversation(id, user as unknown as User)}
              onClearAll={handleClearAll}
              onCloseSidebar={() => store.setIsSidebarOpen(false)}
              onUrlAdd={(url) => user && store.handleUrlAdd(url, user as unknown as User)}
              onFileAdd={(file) => user && store.handleFileAdd(file, user as unknown as User)}
              onRemoveSource={(id) => user && store.handleRemoveSource(id, user as unknown as User)}
              onToggleSourceSelection={(id) => user && store.handleToggleSourceSelection(id, user as unknown as User)}
              activeModel={store.activeModel}
              onSetModel={store.handleSetModel}
              showModelSelect={store.showModelSelect}
            />
          </div>

          <div className="w-full h-full p-0 md:flex-1">
            {/* Se for um professor e nenhuma conversa estiver ativa, mostra o Dashboard. Caso contrário, mostra o Chat. */}
            {(userRole === 'teacher' && !store.activeConversationId && isTeacherDashboardVisible) ? (
              <div className="h-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl border border-black/5 dark:border-white/5 p-4 overflow-y-auto">
                <TeacherDashboard onExit={() => setIsTeacherDashboardVisible(false)} />
              </div>
            ) : (
              <ChatInterface 
                messages={store.chatMessages} 
                activeSources={store.sourcesForActiveGroup} 
                conversationTitle={activeConversationName} 
                onSendMessage={(query, sourceIds, actualPrompt, generatedFrom) => user && store.handleSendMessage(query, sourceIds, user as unknown as User, actualPrompt, generatedFrom)} 
                onOptimizePrompt={handleOptimizePrompt} 
                isLoading={store.isLoading} 
                placeholderText={chatPlaceholder} 
                onToggleSidebar={() => store.setIsSidebarOpen(true)} 
                onToggleMindMap={handleGenerateMindMap} 
                onMindMapLayoutChange={(msgId, layout) => user && store.handleMindMapLayoutChange(msgId, layout, user as unknown as User)} 
                onSaveToLibrary={(message) => user && store.handleSaveToLibrary(message, user as unknown as User)} 
                theme={store.theme} 
                setTheme={store.setTheme} 
                showAiAvatar={store.showAiAvatar}
              />
            )}
          </div>
          <div className={`fixed top-0 right-0 h-full w-11/12 max-w-sm z-30 transform transition-transform ease-in-out duration-300 p-3 lg:static lg:p-0 lg:w-1/3 xl:w-1/4 lg:h-full lg:max-w-sm lg:translate-x-0 lg:z-auto ${store.isLibraryPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <LibraryPanel 
              items={libraryItemsForActiveContext} 
              onDeleteItem={(id) => user && store.handleDeleteLibraryItem(id, user as unknown as User)} 
              onItemClick={store.handleOpenLibraryItem} 
              onOpenReport={handleOpenReportPanel} 
              onStartEvaluation={() => store.handleStartEvaluation(sampleQuizData)}
              onClose={() => store.setIsLibraryPanelOpen(false)}
            />
          </div>
        </div>
        
        {!store.isLibraryPanelOpen && (
          <button onClick={() => store.setIsLibraryPanelOpen(true)} className="fixed top-1/2 right-0 -translate-y-1/2 z-10 bg-card p-1 rounded-l-md border-y border-l border-border shadow-lg lg:hidden" aria-label="Abrir biblioteca">
            <ChevronLeft size={20} />
          </button>
        )}

        <Toaster />
        <UsageReportPanel 
          isOpen={isReportPanelOpen}
          onClose={() => setIsReportPanelOpen(false)}
          data={reportData}
        />
        <EvaluationPanel 
          isOpen={store.isEvaluationPanelOpen}
          onClose={store.handleCloseEvaluation}
          quizData={store.activeQuizData}
        />
      </div>
    </>
  );
};

export default App;