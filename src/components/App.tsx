/**
 * @author José E. Moraes // NOSONAR
 * @copyright 2025 - Todos os direitos reservados.
 */

import React, { useState, useEffect } from "react";
import { ChevronLeft, Loader2, Trash2 } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useAuth } from "@/hooks/useAuth";
import ConversationManager from "./ConversationManager";
import ChatInterface from "./ChatInterface"; 
import LibraryPanel from "./LibraryPanel";
import AuthPage from "./AuthPage";
import { Toaster } from "@/components/ui/toaster";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import UsageReportPanel, { ModelUsage } from "@/components/UsageReportPanel";
// import { User } from "firebase/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "./ui/button"; 

const App: React.FC = () => {
  const store = useAppStore();
  const { user, loading: authLoading } = useAuth();

  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [reportData, setReportData] = useState<ModelUsage[]>([]);

  useEffect(() => {
    store.setUser(user);
  }, [user, store.setUser]);

  // Efeito para inicializar os listeners do Firestore quando o usuário é autenticado.
  useEffect(() => {
    if (user) {
      const unsubscribe = store.initGroupsListener();
      return () => unsubscribe(); // Limpa o listener quando o componente é desmontado ou o usuário muda.
    }
  }, [user, store.initGroupsListener]);

  // Efeito para inicializar o listener da biblioteca do usuário.
  useEffect(() => {
    if (user) {
      const unsubscribe = store.initLibraryListener();
      return () => unsubscribe(); // Limpa o listener ao fazer logout.
    }
  }, [user, store.initLibraryListener]);

  // Efeito para inicializar o listener das fontes do grupo ativo.
  useEffect(() => {
    if (user && store.activeGroupId) {
      const unsubscribe = store.initSourcesListener(store.activeGroupId);
      return () => unsubscribe(); // Limpa o listener ao trocar de grupo ou desmontar.
    }
  }, [user, store.activeGroupId, store.initSourcesListener]);

  // Efeito para inicializar o listener das conversas do grupo ativo.
  useEffect(() => {
    if (user && store.activeGroupId) {
      const unsubscribe = store.initConversationsListener(store.activeGroupId);
      return () => unsubscribe(); // Limpa o listener ao trocar de grupo ou desmontar.
    }
  }, [user, store.activeGroupId, store.initConversationsListener]);

  // Efeito para inicializar o listener das mensagens da conversa ativa.
  useEffect(() => {
    if (user && store.activeGroupId && store.activeConversationId) {
      const unsubscribe = store.initMessagesListener(store.activeGroupId, store.activeConversationId);
      return () => unsubscribe(); // Limpa o listener ao trocar de conversa ou grupo.
    }
  }, [user, store.activeGroupId, store.activeConversationId, store.initMessagesListener]);

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

  const handleOpenReportPanel = async () => {
    const data = await store.generateUsageReport();
    setReportData(data);
    setIsReportPanelOpen(true);
  };

  return (
    // Usando React.Fragment para permitir que o Modal seja um irmão do layout principal.
    <>
      {/* Fundo principal com um gradiente sutil para dar profundidade */}
      <div className="h-screen max-h-screen antialiased relative overflow-x-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-black dark:bg-[radial-gradient(#ffffff20_1px,transparent_1px)]"></div>

        {(store.isSidebarOpen || store.isLibraryPanelOpen) && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => { store.setIsSidebarOpen(false); store.setIsLibraryPanelOpen(false); }} aria-hidden="true" />}
        
        <div className="flex h-full w-full p-2 md:p-4 gap-2 md:gap-4">
          <div className={`fixed top-0 left-0 h-full w-11/12 max-w-sm z-30 transform transition-transform ease-in-out duration-300 p-3 md:static md:p-0 md:w-1/3 xl:w-1/4 md:h-full md:max-w-sm md:translate-x-0 md:z-auto ${store.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <ConversationManager onCloseSidebar={() => store.setIsSidebarOpen(false)} />
          </div>

          <div className="w-full h-full p-0 md:flex-1">
            <ChatInterface />
          </div>
          <div className={`fixed top-0 right-0 h-full w-11/12 max-w-sm z-30 transform transition-transform ease-in-out duration-300 p-3 lg:static lg:p-0 lg:w-1/3 xl:w-1/4 lg:h-full lg:max-w-sm lg:translate-x-0 lg:z-auto ${store.isLibraryPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <LibraryPanel 
              items={store.libraryItems.filter(item => item.groupId === store.activeGroupId)} 
              onDeleteItem={store.handleDeleteLibraryItem} 
              onItemClick={store.handleOpenLibraryItem} 
              onOpenReport={handleOpenReportPanel}
              onStartEvaluation={() => { /* Lógica a ser implementada */ }}
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
        <AlertDialog open={store.deleteDialog.isOpen} onOpenChange={(isOpen) => !isOpen && store.cancelDeleteMessage()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="text-destructive" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja apagar esta mensagem e todos os seus dados associados (mapas mentais, itens na biblioteca, etc.)? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={store.cancelDeleteMessage}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={store.confirmDeleteMessage} className={buttonVariants({ variant: "destructive" })}>Apagar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default App;