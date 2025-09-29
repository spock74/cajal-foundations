/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { FileText, Trash2, FileSearch, Settings, HelpCircle, Bot, Code, Share2 } from 'lucide-react';
import { LibraryItem } from '../types';

interface LibraryPanelProps {
  items: LibraryItem[];
  onDeleteItem: (id: number) => void;
}

const ActionButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <button className="flex flex-col items-center justify-center gap-1 p-2 text-xs text-center text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors">
    {icon}
    <span className="truncate">{label}</span>
  </button>
);

const LibraryPanel: React.FC<LibraryPanelProps> = ({ items, onDeleteItem }) => {
  return (
    <div className="p-4 bg-white dark:bg-[#1E1E1E] shadow-lg rounded-xl h-full flex flex-col border border-gray-200 dark:border-[rgba(255,255,255,0.05)] transition-colors duration-200">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-[#E2E2E2] mb-3">Biblioteca</h2>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        <ActionButton icon={<FileSearch size={20} />} label="Buscar" />
        <ActionButton icon={<Share2 size={20} />} label="Compart." />
        <ActionButton icon={<Code size={20} />} label="Exportar" />
        <ActionButton icon={<Bot size={20} />} label="Ações" />
        <ActionButton icon={<Settings size={20} />} label="Config." />
        <ActionButton icon={<HelpCircle size={20} />} label="Ajuda" />
      </div>

      <div className="flex-grow overflow-y-auto space-y-2 chat-container -mr-2 pr-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-500">
            <FileText size={32} className="mb-2" />
            <p className="text-sm font-medium">Sua biblioteca está vazia.</p>
            <p className="text-xs">Salve respostas do chat para vê-las aqui.</p>
          </div>
        ) : (
          items.map(item => (
            <div 
              key={item.id} 
              className="p-2.5 bg-gray-100 dark:bg-[#2C2C2C] border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-lg group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <FileText size={16} className="text-gray-500 dark:text-[#A8ABB4] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
                    {item.content}
                  </p>
                </div>
                <button
                  onClick={() => item.id && onDeleteItem(item.id)}
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