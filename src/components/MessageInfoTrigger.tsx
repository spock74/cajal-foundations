/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatMessage, LibraryItem, UsageMetadata } from '../types';
import { useAppStore } from '@/stores/appStore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageInfoTriggerProps {
  item: ChatMessage | LibraryItem;
}

/**
 * Formata o nome de um arquivo de fonte para melhor legibilidade.
 * Remove a extensão e substitui underscores e hífens por espaços.
 */
const formatSourceName = (name: string): string => {
  try {
    const nameWithoutExt = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name;
    return nameWithoutExt.replace(/[_.-]/g, ' ');
  } catch (e) {
    return name; // Retorna o nome original em caso de erro.
  }
};

const MessageInfoTrigger: React.FC<MessageInfoTriggerProps> = ({ item }) => {
  const sourcesForActiveGroup = useAppStore(s => s.sourcesForActiveGroup);

  const usedSources = sourcesForActiveGroup.filter(source => item.sourceIds?.includes(source.id) ?? false);
  const usage: UsageMetadata | undefined = item.usageMetadata;

  // O estado agora serve apenas para a animação do ícone.
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          className={`w-5 h-5 rounded-full flex items-center justify-center text-white transition-all duration-300 ${isOpen ? 'shadow-lg shadow-blue-400/50' : ''}`}
          style={{ backgroundColor: isOpen ? '#465DDE' : '#91868E' }}
          title="Ver informações da mensagem"
        >
          <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1V11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M1 6H11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </motion.div>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-gray-800 text-white border-white/10" side="top" align="end">
        <div className="space-y-2">
          <div>
            <p className="text-xs font-bold mb-1">Fontes Usadas:</p>
            {usedSources.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {usedSources.map(source => (
                  <li key={source.id} className="text-xs opacity-80 capitalize" title={source.name}>{formatSourceName(source.name)}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs opacity-80">Nenhuma fonte de contexto foi usada.</p>
            )}
          </div>
          {(usage || ('model' in item && item.model)) && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs font-bold mb-1">Metadados:</p>
              {'model' in item && item.model && <p className="text-xs opacity-80">Modelo: {item.model}</p>}
              {usage && <p className="text-xs opacity-80">Tokens Totais: {usage.totalTokenCount}</p>}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MessageInfoTrigger;