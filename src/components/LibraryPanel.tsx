/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState } from 'react';
import { FileText, Trash2, FileSearch, Settings, HelpCircle, Bot, Code, Share2, BrainCircuit } from 'lucide-react';
import { LibraryItem } from '../types';

interface LibraryPanelProps {
  items: LibraryItem[];
  onDeleteItem: (id: number) => void;
}

// NOTA: Movido para fora do componente principal para evitar recriação a cada renderização, o que pode causar problemas de estado e desempenho.
const ActionButton: React.FC<{ icon: React.ReactNode; label: string; title: string }> = ({ icon, label, title }) => (
  <button 
    title={title}
    className="flex flex-col items-center justify-center gap-1 p-2 text-xs text-center text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-black/5 dark:border-white/10"
  >
    {icon}
    <span className="truncate">{label}</span>
  </button>
);

const LibraryPanel: React.FC<LibraryPanelProps> = ({ items, onDeleteItem }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(item => 
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // Efeito de vidro fosco para o painel
    <div className="p-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl h-full flex flex-col border border-black/5 dark:border-white/5 transition-colors duration-200">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-[#E2E2E2] mb-3">Biblioteca</h2>
      
      {/* Search Input */}
      <div className="relative mb-3">
        <FileSearch size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar na biblioteca..."
            className="w-full h-8 pl-8 pr-2.5 border border-gray-300 dark:border-[rgba(255,255,255,0.1)] bg-gray-100 dark:bg-[#2C2C2C] text-gray-800 dark:text-[#E2E2E2] placeholder-gray-400 dark:placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-blue-500 dark:focus:ring-white/20 transition-shadow text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <ActionButton icon={<FileSearch size={20} />} label="Pesquisar" title="Pesquisar na Biblioteca (local)" />
        <ActionButton icon={<Share2 size={20} />} label="Compart." title="Compartilhar Biblioteca (futuro)" />
        <ActionButton icon={<Code size={20} />} label="Exportar" title="Exportar Biblioteca (futuro)" />
        <ActionButton icon={<Bot size={20} />} label="Ações IA" title="Ações de IA na Biblioteca (futuro)" />
        <ActionButton icon={<Settings size={20} />} label="Config." title="Configurações da Biblioteca (futuro)" />
        <ActionButton icon={<HelpCircle size={20} />} label="Ajuda" title="Ajuda sobre a Biblioteca" />
      </div>

      <div className="flex-grow overflow-y-auto space-y-2 chat-container -mr-2 pr-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-500">
            <FileText size={32} className="mb-2" />
            <p className="text-sm font-medium">Sua biblioteca está vazia.</p>
            <p className="text-xs">Salve respostas do chat para vê-las aqui.</p>
          </div>
        ) : filteredItems.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-500">
            <FileSearch size={32} className="mb-2" />
            <p className="text-sm font-medium">Nenhum resultado encontrado.</p>
            <p className="text-xs">Tente uma busca diferente.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div 
              key={item.id} 
              className="p-2.5 bg-gray-100 dark:bg-[#2C2C2C] border border-black/5 dark:border-white/10 rounded-lg group transition-colors hover:bg-gray-200 dark:hover:bg-white/5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  {item.type === 'mindmap' ? (
                    <BrainCircuit size={16} className="text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <FileText size={16} className="text-gray-500 dark:text-[#A8ABB4] flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
                    {item.content}
                  </p>
                </div>
                <button
                  onClick={() => item.id && onDeleteItem(item.id)}
                  title="Excluir item da biblioteca"
                  className="p-1 text-gray-500 dark:text-[#A8ABB4] hover:text-red-500 dark:hover:text-[#f87171] rounded-md hover:bg-red-100/50 dark:hover:bg-[rgba(255,0,0,0.1)] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                  aria-label="Excluir item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LibraryPanel;