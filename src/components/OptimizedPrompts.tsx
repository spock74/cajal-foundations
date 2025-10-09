/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState } from 'react';
import { OptimizedPrompt } from '../types';
import { Wand2, HelpCircle, X } from 'lucide-react';

const SuggestionTooltip: React.FC<{ suggestion: OptimizedPrompt; onClose: () => void }> = ({ suggestion, onClose }) => (
  <div className="absolute z-20 w-80 p-3 bg-gray-800 text-white rounded-lg shadow-lg right-0 top-full mt-2 border border-white/10">
    <button onClick={onClose} className="absolute top-1.5 right-1.5 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10">
      <X size={16} />
    </button>
    <h4 className="font-bold text-sm mb-2 pr-6">{suggestion.question_title}</h4>
    <p className="text-xs mb-2 opacity-80">{suggestion.description}</p>
    <div className="mt-2 pt-2 border-t border-white/10">
      <p className="text-xs font-semibold mb-1">Prompt Completo:</p>
      <p className="text-xs font-mono bg-black/50 p-2 rounded whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
        {suggestion.prompt}
      </p>
    </div>
  </div>
);

interface OptimizedPromptsProps {
  prompts: OptimizedPrompt[];
  sourceIds: string[];
  onSendMessage?: (query: string, sourceIds: string[], actualPrompt?: string, generatedFrom?: OptimizedPrompt) => void;
}

const OptimizedPrompts: React.FC<OptimizedPromptsProps> = ({ prompts, sourceIds, onSendMessage }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {prompts.map((suggestion) => (
        <div key={suggestion.prompt} className="relative">
          <button
            onClick={() => onSendMessage && onSendMessage(suggestion.question_title, sourceIds, suggestion.prompt, suggestion)}
            className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            <Wand2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="flex-grow pr-6">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{suggestion.question_title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {suggestion.description}
              </p>
            </div>
          </button>
          <button
            onClick={() => setActiveTooltip(activeTooltip === suggestion.prompt ? null : suggestion.prompt)}
            className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Ver detalhes da sugestão"
          >
            <HelpCircle size={16} />
          </button>
          {activeTooltip === suggestion.prompt && (
            <SuggestionTooltip suggestion={suggestion} onClose={() => setActiveTooltip(null)} />
          )}
        </div>
      ))}
    </div>
  );
};

export default OptimizedPrompts;