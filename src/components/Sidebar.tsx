/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React from 'react';
import { useAppContext } from '@/AppContext';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, setIsSidebarOpen } = useAppContext();

  return (
    <>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r bg-background transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <h1 className="text-lg font-bold">CajalFoundations</h1>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-muted-foreground">Tópicos e conversas aparecerão aqui.</p>
        </div>
      </aside>
    </>
  );
};