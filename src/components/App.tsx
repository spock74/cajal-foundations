/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React from "react";
import { useAppContext } from "../AppContext";
import ConversationManager from "./ConversationManager";
import ChatInterface from "./ChatInterface"; 
import LibraryPanel from "./LibraryPanel";

const App: React.FC = () => {
  const {
    groups, activeGroupId, handleSetGroup, handleAddGroup,
    conversations, activeConversationId, handleSetConversation, handleNewConversation, handleDeleteConversation, handleClearAllConversations,
    sourcesForActiveGroup, handleUrlAdd, handleFileAdd, handleRemoveSource, handleToggleSourceSelection,
    chatMessages, isLoading, handleSendMessage,
    libraryItems, handleDeleteLibraryItem, handleSaveToLibrary,
    theme, setTheme,
    isSidebarOpen, setIsSidebarOpen,
    chatPlaceholder, activeConversationName, handleGenerateMindMap,
    handleMindMapLayoutChange
  } = useAppContext();

  return (
    // Usando React.Fragment para permitir que o Modal seja um irmão do layout principal.
    <>
      <div className="h-screen max-h-screen antialiased relative overflow-x-hidden bg-gray-100 dark:bg-[#121212] dark:text-[#E2E2E2]">
        {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />}
        
        <div className="flex h-full w-full md:p-4 md:gap-4">
          <div className={`fixed top-0 left-0 h-full w-11/12 max-w-sm z-30 transform transition-transform ease-in-out duration-300 p-3 md:static md:p-0 md:w-1/4 xl:w-1/5 md:h-full md:max-w-xs md:translate-x-0 md:z-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <ConversationManager
              groups={groups}
              activeGroupId={activeGroupId}
              onSetGroupId={handleSetGroup}
              onAddGroup={handleAddGroup}
              conversations={conversations}
              activeConversationId={activeConversationId}
              activeConversationSources={sourcesForActiveGroup} // Esta prop vem do contexto agora
              onSetConversationId={handleSetConversation}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              onClearAll={handleClearAllConversations}
              onCloseSidebar={() => setIsSidebarOpen(false)}
              onUrlAdd={handleUrlAdd}
              onFileAdd={handleFileAdd}
              onRemoveSource={handleRemoveSource}
              onToggleSourceSelection={handleToggleSourceSelection}
            />
          </div>

          <div className="w-full h-full p-3 md:p-0 md:flex-1">
            <ChatInterface
              messages={chatMessages}
              conversationTitle={activeConversationName}
              onSendMessage={handleSendMessage}
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
          <div className="hidden lg:block lg:w-1/4 xl:w-1/5 h-full">
            <LibraryPanel items={libraryItems} onDeleteItem={handleDeleteLibraryItem} />
          </div>
        </div>
      </div>
    </>
  );
};

export default App;