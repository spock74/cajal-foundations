/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React from 'react';
import { Menu } from 'lucide-react';
import { useAppContext } from '@/AppContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';

export const ChatHeader: React.FC = () => {
  const { activeConversationName, setIsSidebarOpen } = useAppContext();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4">
      {/* Grupo Esquerdo: Botão do Menu e Título */}
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden" // Mostra o botão de menu apenas em telas menores
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h2 className="truncate text-lg font-semibold">{activeConversationName}</h2>
      </div>

      {/* Grupo Direito: Ações */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
};