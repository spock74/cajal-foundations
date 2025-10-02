/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { KnowledgeSource } from '../types';

interface KnowledgeBaseManagerProps {
  sources: KnowledgeSource[];
  onUrlAdd: (url: string) => void;
  onFileAdd: (file: File) => void;
  onRemoveSource: (sourceId: string) => void;
  onToggleSourceSelection: (sourceId: string) => void;
  maxSources?: number;
}

const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ 
  sources, 
  onUrlAdd,
  onFileAdd,
  onRemoveSource, 
  onToggleSourceSelection,
  maxSources = 20,
}) => {
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  const handleAddUrl = () => {
    setError(null);
    setSuccessMessage(null);
    if (!currentUrlInput.trim() || !isValidUrl(currentUrlInput)) {
      setError('Formato de URL inválido.');
      return;
    }
    if (sources.find(s => s.type === 'url' && s.value === currentUrlInput)) {
      setError('Esta URL já foi adicionada ao grupo atual.');
      return;
    }
    onUrlAdd(currentUrlInput);
    setCurrentUrlInput('');
    setSuccessMessage('URL enviada para processamento.');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMessage(null);
    onFileAdd(file);
    setSuccessMessage(`Arquivo "${file.name}" enviado para processamento.`);
    
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 h-full flex flex-col transition-colors duration-200">
      <h3 className="text-base font-semibold text-gray-800 dark:text-[#E2E2E2] mb-3 flex-shrink-0">Fontes da Conversa</h3>
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <input
          type="url"
          value={currentUrlInput}
          onChange={(e) => setCurrentUrlInput(e.target.value)}
          placeholder="https://exemplo.com/artigo.pdf"
          className="flex-grow h-8 py-1 px-2.5 border border-gray-300 dark:border-[rgba(255,255,255,0.1)] bg-gray-100 dark:bg-[#2C2C2C] text-gray-800 dark:text-[#E2E2E2] placeholder-gray-400 dark:placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-blue-500 dark:focus:ring-white/20 transition-shadow text-sm"
          onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
          disabled={sources.length >= maxSources}
        />
        <button onClick={handleAddUrl} disabled={sources.length >= maxSources} className="h-8 w-8 p-1.5 bg-gray-800 hover:bg-black dark:bg-white/[.12] dark:hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-gray-300 dark:disabled:bg-[#4A4A4A] flex items-center justify-center flex-shrink-0"><Plus size={16} /></button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.txt,.md,text/plain,text/markdown" className="hidden" aria-hidden="true" />
        <button onClick={handleUploadClick} disabled={sources.length >= maxSources} className="h-8 w-8 p-1.5 bg-gray-800 hover:bg-black dark:bg-white/[.12] dark:hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-gray-300 dark:disabled:bg-[#4A4A4A] flex items-center justify-center flex-shrink-0">
          <Upload size={16} />
        </button>
      </div>
      
      {successMessage && ( <div className="flex items-start gap-1.5 text-xs text-green-600 dark:text-green-400 mb-2 p-2 bg-green-500/10 dark:bg-green-500/10 rounded-md border border-green-500/20"><CheckCircle size={16} /><span>{successMessage}</span></div> )}
      {error && ( <div className="flex items-start gap-1.5 text-xs text-red-500 dark:text-[#f87171] mb-2 p-2 bg-red-500/10 dark:bg-[#f87171]/10 rounded-md border border-red-500/20"><AlertCircle size={16} /><span>{error}</span></div> )}
      {sources.length >= maxSources && ( <div className="flex items-start gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 mb-2 p-2 bg-yellow-500/10 rounded-md border border-yellow-500/20"><AlertCircle size={16} /><span>Máximo de {maxSources} fontes atingido.</span></div> )}
      
      <div className="flex-grow overflow-y-auto space-y-2 chat-container min-h-0">
        {sources.length === 0 && (
          <p className="text-gray-500 dark:text-[#777777] text-center py-3 text-sm">Adicione fontes a esta conversa para começar.</p>
        )}
        {sources.map((source) => (
          <div key={source.id} className="flex items-center justify-between p-2.5 bg-gray-100 dark:bg-[#2C2C2C] border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={source.selected}
                  onChange={() => onToggleSourceSelection(source.id)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent flex-shrink-0"
                />
                <div className="flex items-center gap-2 min-w-0">
                  {source.type === 'file' && <FileText size={16} className="text-gray-500 dark:text-[#A8ABB4] flex-shrink-0" />}
                  {source.type === 'url' ? (
                      <a href={source.value} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-[#79B8FF] hover:underline truncate" title={source.value}>
                        {source.value}
                      </a>
                  ) : (
                      <span className="text-xs text-gray-800 dark:text-white truncate" title={source.name}>
                        {source.name}
                      </span>
                  )}
                </div>
            </div>
            <button onClick={() => onRemoveSource(source.id)} className="p-1 text-gray-500 dark:text-[#A8ABB4] hover:text-red-500 dark:hover:text-[#f87171] rounded-md hover:bg-red-500/10 dark:hover:bg-[rgba(255,0,0,0.1)] transition-colors flex-shrink-0 ml-2">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeBaseManager;