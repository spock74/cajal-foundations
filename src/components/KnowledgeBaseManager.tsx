/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Upload, FileText, AlertCircle, CheckCircle, Link } from 'lucide-react';
import { KnowledgeSource } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        <div className="relative flex-grow">
          <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="url"
            value={currentUrlInput}
            onChange={(e) => setCurrentUrlInput(e.target.value)}
            placeholder="https://exemplo.com/artigo.pdf"
            className="h-9 pl-8"
            onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
            disabled={sources.length >= maxSources}
          />
        </div>
        <Button onClick={handleAddUrl} disabled={sources.length >= maxSources} size="icon" className="h-9 w-9 flex-shrink-0">
          <Plus size={16} />
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.txt,.md,text/plain,text/markdown" className="hidden" aria-hidden="true" />
        <Button onClick={handleUploadClick} disabled={sources.length >= maxSources} size="icon" variant="outline" className="h-9 w-9 flex-shrink-0">
          <Upload size={16} />
        </Button>
      </div>
      
      {successMessage && ( <div className="flex items-start gap-1.5 text-xs text-green-600 dark:text-green-400 mb-2 p-2 bg-green-500/10 dark:bg-green-500/10 rounded-md border border-green-500/20"><CheckCircle size={16} /><span>{successMessage}</span></div> )}
      {error && ( <div className="flex items-start gap-1.5 text-xs text-red-500 dark:text-[#f87171] mb-2 p-2 bg-red-500/10 dark:bg-[#f87171]/10 rounded-md border border-red-500/20"><AlertCircle size={16} /><span>{error}</span></div> )}
      {sources.length >= maxSources && ( <div className="flex items-start gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 mb-2 p-2 bg-yellow-500/10 rounded-md border border-yellow-500/20"><AlertCircle size={16} /><span>Máximo de {maxSources} fontes atingido.</span></div> )}
      
      <div className="flex-grow overflow-y-auto space-y-2 chat-container min-h-0">
        {sources.length === 0 && (
          <p className="text-gray-500 dark:text-[#777777] text-center py-3 text-sm">Adicione fontes a este tópico para começar.</p>
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
            <Button onClick={() => onRemoveSource(source.id)} variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 ml-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeBaseManager;