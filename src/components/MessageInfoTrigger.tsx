/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, UsageMetadata } from '../types';
import { useAppStore } from '@/stores/appStore';

interface MessageInfoTriggerProps {
  message: ChatMessage;
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

const MessageInfoTrigger: React.FC<MessageInfoTriggerProps> = ({ message }) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const sourcesForActiveGroup = useAppStore(s => s.sourcesForActiveGroup);

  const usedSources = sourcesForActiveGroup.filter(source => message.sourceIds?.includes(source.id) ?? false);
  const usage: UsageMetadata | undefined = message.usageMetadata;

  return (
    // O container agora é relativo para se posicionar corretamente dentro do flexbox.
    <div className="relative">
      <motion.button
        onClick={() => setIsInfoOpen(!isInfoOpen)}
        className={`w-5 h-5 rounded-full flex items-center justify-center text-white transition-colors`}
        style={{ backgroundColor: isInfoOpen ? '#465DDE' : '#91868E' }}
        title="Ver informações da mensagem"
      >
        <motion.div animate={{ rotate: isInfoOpen ? 45 : 0 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 1V11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M1 6H11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isInfoOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 w-64 bg-[#132f10] text-white p-3 rounded-lg shadow-lg border border-white/10 z-10"
          >
            <div className="space-y-2">
              <div>
                <p className="text-xs font-bold mb-1">Fontes Usadas:</p>
                {usedSources.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {usedSources.map(source => (
                      <li key={source.id} className="text-xs opacity-80 capitalize">{formatSourceName(source.name)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs opacity-80">Nenhuma fonte de contexto foi usada.</p>
                )}
              </div>
              {usage && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs font-bold mb-1">Metadados:</p>
                  {/* <p className="text-xs opacity-80">Modelo: {message.model || 'N/A'}</p> */}
                  <p className="text-xs opacity-80">Modelo: XxxxxXXxx</p>
                  <p className="text-xs opacity-80">Tokens Totais: {usage.totalTokenCount}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageInfoTrigger;