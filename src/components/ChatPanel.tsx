/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React from 'react';
import { ChatHeader } from './ChatHeader';
// Placeholders for components to be created later
// import { MessageList } from './MessageList';
// import { MessageInput } from './MessageInput';

export const ChatPanel: React.FC = () => {
  return (
    <div className="flex h-full flex-col">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4">
        {/* Placeholder for MessageList */}
        <p className="text-center text-muted-foreground">A lista de mensagens aparecerá aqui.</p>
      </div>
      <div className="border-t p-4">
        {/* Placeholder for MessageInput */}
        <p className="text-center text-muted-foreground">A entrada de mensagens aparecerá aqui.</p>
      </div>
    </div>
  );
};