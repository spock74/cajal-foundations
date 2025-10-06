/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useAppContext } from "../AppContext";
import { useAuth } from "@/hooks/useAuth";
import ConversationManager from "./ConversationManager";
import ChatInterface from "./ChatInterface"; 
import LibraryPanel from "./LibraryPanel";
import AuthPage from "./AuthPage";
import { Toaster } from "@/components/ui/toaster";
import { EvaluationPanel } from "@/components/EvaluationPanel";
import UsageReportPanel, { ModelUsage } from "@/components/UsageReportPanel";
import { sampleQuizData } from "@/data/pedagogical_content/formative_quizzes/cardiologia_basica_qf_v1";

const App: React.FC = () => {
  const {
    groups, activeGroupId, handleSetGroup, handleAddGroup, handleDeleteGroup, handleUpdateGroup,
    conversations, activeConversationId, handleSetConversation, handleNewConversation, handleDeleteConversation, handleClearAllConversations,
    sourcesForActiveGroup, handleUrlAdd, handleFileAdd, handleRemoveSource, handleToggleSourceSelection,
    chatMessages, isLoading, handleSendMessage,
    libraryItemsForActiveContext, handleDeleteLibraryItem, handleOpenLibraryItem, handleSaveToLibrary, handleOptimizePrompt, activeModel, handleSetModel, generateUsageReport, showModelSelect,
    theme, setTheme,
    isSidebarOpen, setIsSidebarOpen,
    chatPlaceholder, activeConversationName, handleGenerateMindMap, handleStartEvaluation, isLibraryPanelOpen, setIsLibraryPanelOpen,
    isEvaluationPanelOpen, activeQuizData, handleCloseEvaluation,
    handleMindMapLayoutChange
  } = useAppContext();

  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  const [reportData, setReportData] = useState<ModelUsage[]>([]);
  const { user, loading: authLoading } = useAuth();

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
    const data = await generateUsageReport();
    setReportData(data);
    setIsReportPanelOpen(true);
  };

  return (
    // Usando React.Fragment para permitir que o Modal seja um irmão do layout principal.
    <>
      {/* Fundo principal com um gradiente sutil para dar profundidade */}
      <div className="h-screen max-h-screen antialiased relative overflow-x-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-black dark:bg-[radial-gradient(#ffffff20_1px,transparent_1px)]"></div>

        {(isSidebarOpen || isLibraryPanelOpen) && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => { setIsSidebarOpen(false); setIsLibraryPanelOpen(false); }} aria-hidden="true" />}
        
        <div className="flex h-full w-full p-2 md:p-4 gap-2 md:gap-4">
          <div className={`fixed top-0 left-0 h-full w-11/12 max-w-sm z-30 transform transition-transform ease-in-out duration-300 p-3 md:static md:p-0 md:w-1/4 xl:w-1/5 md:h-full md:max-w-xs md:translate-x-0 md:z-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <ConversationManager
              groups={groups}
              activeGroupId={activeGroupId}
              onSetGroupId={handleSetGroup}
              onAddGroup={handleAddGroup}
              onDeleteGroup={handleDeleteGroup}
              onUpdateGroup={handleUpdateGroup}
              conversations={conversations}
              activeConversationId={activeConversationId}
              sourcesForActiveGroup={sourcesForActiveGroup}
              onSetConversationId={handleSetConversation}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              onClearAll={handleClearAllConversations}
              onCloseSidebar={() => setIsSidebarOpen(false)}
              onUrlAdd={handleUrlAdd}
              onFileAdd={handleFileAdd}
              onRemoveSource={handleRemoveSource}
              onToggleSourceSelection={handleToggleSourceSelection}
              activeModel={activeModel}
              onSetModel={handleSetModel}
              showModelSelect={showModelSelect}
            />
          </div>

          <div className="w-full h-full p-0 md:flex-1">
            <ChatInterface
              messages={chatMessages}
              activeSources={sourcesForActiveGroup}
              conversationTitle={activeConversationName}
              onSendMessage={handleSendMessage}
              onOptimizePrompt={handleOptimizePrompt}
              isLoading={isLoading}
              placeholderText={chatPlaceholder}
              onToggleSidebar={() => setIsSidebarOpen(true)}
              onToggleMindMap={handleGenerateMindMap}
              onMindMapLayoutChange={handleMindMapLayoutChange}
              onSaveToLibrary={handleSaveToLibrary}
              theme={theme}
              setTheme={setTheme}
            />

          </div>
          <div className={`fixed top-0 right-0 h-full w-11/12 max-w-sm z-30 transform transition-transform ease-in-out duration-300 p-3 lg:static lg:p-0 lg:w-1/4 xl:w-1/5 lg:h-full lg:max-w-xs lg:translate-x-0 lg:z-auto ${isLibraryPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <LibraryPanel 
              items={libraryItemsForActiveContext} 
              onDeleteItem={handleDeleteLibraryItem} 
              onItemClick={handleOpenLibraryItem} 
              onOpenReport={handleOpenReportPanel} 
              onStartEvaluation={() => handleStartEvaluation(sampleQuizData)}
              onClose={() => setIsLibraryPanelOpen(false)}
            />
          </div>
        </div>
        
        {!isLibraryPanelOpen && (
          <button onClick={() => setIsLibraryPanelOpen(true)} className="fixed top-1/2 right-0 -translate-y-1/2 z-10 bg-card p-1 rounded-l-md border-y border-l border-border shadow-lg lg:hidden" aria-label="Abrir biblioteca">
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
          isOpen={isEvaluationPanelOpen}
          onClose={handleCloseEvaluation}
          quizData={activeQuizData}
        />
      </div>
    </>
  );
};

export default App;