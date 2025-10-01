/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, X, Upload, FileText, AlertCircle, CheckCircle, Pencil } from 'lucide-react';
import { KnowledgeGroup, KnowledgeSource } from '../types';

interface KnowledgeBaseManagerProps {
  sources: KnowledgeSource[];
  onAddSource: (source: KnowledgeSource) => void;
  onRemoveSource: (sourceId: string) => void;
  maxSources?: number;
  knowledgeGroups: KnowledgeGroup[];
  activeGroupId: string;
  onSetGroupId: (id: string) => void;
  onAddGroup: (groupName: string) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onCloseSidebar?: () => void;
  onClearAllSources: () => void;
}

const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ 
  sources, 
  onAddSource, 
  onRemoveSource, 
  maxSources = 20,
  knowledgeGroups,
  activeGroupId,
  onSetGroupId,
  onAddGroup,
  onRenameGroup,
  onDeleteGroup,
  onCloseSidebar,
  onClearAllSources,
}) => {
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isManagingGroups, setIsManagingGroups] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [manageError, setManageError] = useState<string | null>(null);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const SUPPORTED_FILE_TYPES = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    setIsConfirmingClear(false);
  }, [activeGroupId, sources.length]);

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
    if (!currentUrlInput.trim()) {
      setError('A URL não pode estar vazia.');
      return;
    }
    if (!isValidUrl(currentUrlInput)) {
      setError('Formato de URL inválido. Por favor, inclua http:// ou https://');
      return;
    }
    if (sources.find(s => s.id === currentUrlInput)) {
      setError('Esta URL já foi adicionada ao grupo atual.');
      return;
    }
    onAddSource({ type: 'url', id: currentUrlInput, value: currentUrlInput });
    setCurrentUrlInput('');
    setSuccessMessage('URL adicionada com sucesso.');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMessage(null);
    
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      setError(`Tipo de arquivo não suportado para "${file.name}". Apenas arquivos PDF, DOCX e TXT são suportados.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`O arquivo "${file.name}" é muito grande. O tamanho máximo é de ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      const newSource: KnowledgeSource = {
        type: 'file',
        id: `${file.name}-${file.lastModified}-${file.size}`,
        name: file.name,
        mimeType: file.type,
        content: base64,
      };
      onAddSource(newSource);
      setSuccessMessage(`Arquivo "${file.name}" adicionado com sucesso.`);
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setError(`Falha ao ler o arquivo "${file.name}". Por favor, tente novamente ou selecione um arquivo diferente.`);
      setIsReadingFile(false);
    };
    reader.readAsDataURL(file);

    if (event.target) {
        event.target.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCreateGroup = () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      setError("O nome do grupo não pode estar vazio.");
      return;
    }
    if (knowledgeGroups.some(g => g.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError("Já existe um grupo com este nome.");
      return;
    }
    setError(null);
    onAddGroup(trimmedName);
    setNewGroupName('');
    setIsCreatingGroup(false);
  };
  
  const handleCancelCreate = () => {
    setError(null);
    setNewGroupName('');
    setIsCreatingGroup(false);
  };

  const handleConfirmClear = () => {
    onClearAllSources();
    setIsConfirmingClear(false);
  };
  
  const handleSaveRename = (groupId: string) => {
    const trimmedName = editingGroupName.trim();
    if (!trimmedName) {
      setManageError("O nome do grupo não pode estar vazio.");
      return;
    }
    if (knowledgeGroups.some(g => g.id !== groupId && g.name.toLowerCase() === trimmedName.toLowerCase())) {
      setManageError("Já existe um grupo com este nome.");
      return;
    }
    onRenameGroup(groupId, trimmedName);
    setEditingGroupId(null);
    setEditingGroupName('');
    setManageError(null);
  };
  
  const handleConfirmDelete = (groupId: string) => {
    onDeleteGroup(groupId);
    setDeletingGroupId(null);
  };

  const isDefaultGroup = (groupId: string) => ['gemini-overview', 'model-capabilities', 'artigo-cientifico'].includes(groupId);
  const activeGroupName = knowledgeGroups.find(g => g.id === activeGroupId)?.name || "Grupo Desconhecido";

  const renderManageGroupsView = () => (
    <>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Gerenciar Grupos</h3>
        <button
          onClick={() => { setIsManagingGroups(false); setManageError(null); }}
          className="text-sm text-blue-600 dark:text-[#79B8FF] hover:text-black dark:hover:text-white font-medium"
        >
          Concluir
        </button>
      </div>
      {manageError && (
        <div className="flex items-start gap-1.5 text-xs text-red-500 dark:text-[#f87171] mb-2 p-2 bg-red-500/10 dark:bg-[#f87171]/10 rounded-md border border-red-500/20 dark:border-[#f87171]/20">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{manageError}</span>
        </div>
      )}
      <div className="flex-grow overflow-y-auto space-y-2 chat-container">
        {knowledgeGroups.map(group => (
          <div key={group.id} className="p-2.5 bg-gray-100 dark:bg-[#2C2C2C] border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-lg">
            {deletingGroupId === group.id ? (
              <div className="text-center">
                <p className="text-sm text-gray-800 dark:text-white mb-2">Excluir "{group.name}"?</p>
                <div className="flex justify-center gap-2">
                   <button onClick={() => setDeletingGroupId(null)} className="px-3 py-1 text-xs text-gray-600 dark:text-[#A8ABB4] hover:bg-gray-200 dark:hover:bg-white/5 rounded-md">Cancelar</button>
                   <button onClick={() => handleConfirmDelete(group.id)} className="px-3 py-1 text-xs bg-red-500/10 text-red-600 dark:bg-[#f87171]/20 dark:text-[#f87171] hover:bg-red-500/20 dark:hover:bg-[#f87171]/30 rounded-md">Confirmar Exclusão</button>
                </div>
              </div>
            ) : editingGroupId === group.id ? (
               <div className="space-y-2">
                 <input
                   type="text"
                   value={editingGroupName}
                   onChange={e => setEditingGroupName(e.target.value)}
                   className="w-full h-8 py-1 px-2.5 border border-gray-300 dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#1E1E1E] text-gray-800 dark:text-[#E2E2E2] rounded-lg focus:ring-1 focus:ring-blue-500 dark:focus:ring-white/20 text-sm"
                   onKeyPress={e => e.key === 'Enter' && handleSaveRename(group.id)}
                   autoFocus
                 />
                 <div className="flex justify-end gap-2">
                   <button onClick={() => setEditingGroupId(null)} className="px-2.5 py-1 text-xs text-gray-600 dark:text-[#A8ABB4] hover:bg-gray-200 dark:hover:bg-white/5 rounded-md">Cancelar</button>
                   <button onClick={() => handleSaveRename(group.id)} className="px-2.5 py-1 text-xs bg-gray-800 text-white dark:bg-white/[.12] dark:text-white hover:bg-black dark:hover:bg-white/20 rounded-md">Salvar</button>
                 </div>
               </div>
             ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-800 dark:text-white truncate" title={group.name}>{group.name}</span>
                {isDefaultGroup(group.id) ? (
                  <span className="text-xs text-gray-500 dark:text-[#777777] px-2 py-0.5 bg-gray-200 dark:bg-white/5 rounded-full">Padrão</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingGroupId(group.id); setEditingGroupName(group.name); setManageError(null); }}
                      className="p-1 text-gray-500 dark:text-[#A8ABB4] hover:text-black dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-white/10"
                      aria-label={`Renomear ${group.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => { setDeletingGroupId(group.id); setManageError(null); }}
                      className="p-1 text-gray-500 dark:text-[#A8ABB4] hover:text-red-500 dark:hover:text-[#f87171] rounded-md hover:bg-red-500/10 dark:hover:bg-[rgba(255,0,0,0.1)]"
                      aria-label={`Excluir ${group.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  const renderDefaultView = () => (
    <>
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="url-group-select-kb" className="block text-sm font-medium text-gray-500 dark:text-[#A8ABB4]">
            Grupo Ativo
          </label>
           <div className="flex items-center gap-2">
            {!isCreatingGroup && <button onClick={() => setIsManagingGroups(true)} className="text-xs text-blue-600 dark:text-[#79B8FF] hover:text-black dark:hover:text-white font-medium">Gerenciar</button>}
            <div className="w-px h-3 bg-gray-300 dark:bg-white/20"></div>
            {!isCreatingGroup && <button onClick={() => setIsCreatingGroup(true)} className="text-xs text-blue-600 dark:text-[#79B8FF] hover:text-black dark:hover:text-white font-medium">Novo Grupo</button>}
          </div>
        </div>
        {isCreatingGroup ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nome do novo grupo..."
              className="w-full h-8 py-1 px-2.5 border border-gray-300 dark:border-[rgba(255,255,255,0.1)] bg-gray-100 dark:bg-[#2C2C2C] text-gray-800 dark:text-[#E2E2E2] placeholder-gray-400 dark:placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-blue-500 dark:focus:ring-white/20 transition-shadow text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancelCreate}
                className="px-2.5 py-1 text-xs text-gray-600 dark:text-[#A8ABB4] hover:bg-gray-200 dark:hover:bg-white/5 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-2.5 py-1 text-xs bg-gray-800 text-white dark:bg-white/[.12] dark:hover:bg-white/20 rounded-md transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full">
            <select
              id="url-group-select-kb"
              value={activeGroupId}
              onChange={(e) => onSetGroupId(e.target.value)}
              className="w-full py-2 pl-3 pr-8 appearance-none border border-gray-300 dark:border-[rgba(255,255,255,0.1)] bg-gray-100 dark:bg-[#2C2C2C] text-gray-800 dark:text-[#E2E2E2] rounded-md focus:ring-1 focus:ring-blue-500 dark:focus:ring-white/20 text-sm"
            >
              {knowledgeGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-[#A8ABB4] pointer-events-none"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <input
          type="url"
          value={currentUrlInput}
          onChange={(e) => setCurrentUrlInput(e.target.value)}
          placeholder="https://exemplo.com/documento.pdf"
          className="flex-grow h-8 py-1 px-2.5 border border-gray-300 dark:border-[rgba(255,255,255,0.1)] bg-gray-100 dark:bg-[#2C2C2C] text-gray-800 dark:text-[#E2E2E2] placeholder-gray-400 dark:placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-blue-500 dark:focus:ring-white/20 transition-shadow text-sm"
          onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
          disabled={sources.length >= maxSources || isReadingFile || isCreatingGroup}
        />
        <button
          onClick={handleAddUrl}
          disabled={sources.length >= maxSources || isReadingFile || isCreatingGroup}
          className="h-8 w-8 p-1.5 bg-gray-800 hover:bg-black dark:bg-white/[.12] dark:hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-gray-300 dark:disabled:bg-[#4A4A4A] disabled:text-gray-500 dark:disabled:text-[#777777] flex items-center justify-center flex-shrink-0"
          aria-label="Adicionar URL"
        >
          <Plus size={16} />
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.txt,.docx" className="hidden" aria-hidden="true" />
        <button
          onClick={handleUploadClick}
          disabled={sources.length >= maxSources || isReadingFile || isCreatingGroup}
          className="h-8 w-8 p-1.5 bg-gray-800 hover:bg-black dark:bg-white/[.12] dark:hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-gray-300 dark:disabled:bg-[#4A4A4A] disabled:text-gray-500 dark:disabled:text-[#777777] flex items-center justify-center flex-shrink-0"
          aria-label="Carregar arquivo"
        >
          {isReadingFile ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Upload size={16} />
          )}
        </button>
      </div>
      
      {isReadingFile && (
        <p className="text-xs text-center text-gray-500 dark:text-[#A8ABB4] mb-2 animate-pulse">Processando arquivo, por favor aguarde...</p>
      )}
      {successMessage && (
        <div className="flex items-start gap-1.5 text-xs text-green-600 dark:text-[#6ee7b7] mb-2 p-2 bg-green-500/10 dark:bg-[#6ee7b7]/10 rounded-md border border-green-500/20 dark:border-[#6ee7b7]/20">
          <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-[#f87171] mb-2 p-2 bg-red-500/10 dark:bg-[#f87171]/10 rounded-md border border-red-500/20 dark:border-[#f87171]/20">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {sources.length >= maxSources && (
        <div className="flex items-start gap-1.5 text-xs text-yellow-600 dark:text-[#fbbf24] mb-2 p-2 bg-yellow-500/10 dark:bg-[#fbbf24]/10 rounded-md border border-yellow-500/20 dark:border-[#fbbf24]/20">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>Máximo de {maxSources} fontes atingido. Remova uma fonte para adicionar uma nova.</span>
        </div>
      )}
      
      <div className="flex-grow overflow-y-auto space-y-2 chat-container">
        {sources.length === 0 && (
          <p className="text-gray-500 dark:text-[#777777] text-center py-3 text-sm">Adicione URLs ou carregue arquivos ao grupo "{activeGroupName}" para começar a consultar.</p>
        )}
        {sources.map((source) => (
          <div key={source.id} className="flex items-center justify-between p-2.5 bg-gray-100 dark:bg-[#2C2C2C] border border-gray-200 dark:border-[rgba(255,255,255,0.05)] rounded-lg hover:shadow-sm transition-shadow">
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
            <button 
              onClick={() => onRemoveSource(source.id)}
              className="p-1 text-gray-500 dark:text-[#A8ABB4] hover:text-red-500 dark:hover:text-[#f87171] rounded-md hover:bg-red-500/10 dark:hover:bg-[rgba(255,0,0,0.1)] transition-colors flex-shrink-0 ml-2"
              aria-label={`Remover ${source.type === 'url' ? source.value : source.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {sources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[rgba(255,255,255,0.05)] flex-shrink-0">
          {isConfirmingClear ? (
            <div className="text-center">
              <p className="text-sm text-gray-800 dark:text-white mb-2">Limpar todas as fontes neste grupo?</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-3 py-1 text-xs text-gray-600 dark:text-[#A8ABB4] hover:bg-gray-200 dark:hover:bg-white/5 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmClear}
                  className="px-3 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:bg-[#f87171]/20 dark:hover:bg-[#f87171]/30 dark:text-[#f87171] rounded-md transition-colors"
                >
                  Confirmar Limpeza
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingClear(true)}
              disabled={isReadingFile || isCreatingGroup}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-red-600/90 dark:text-[#f87171]/90 bg-red-500/10 dark:bg-[#f87171]/10 hover:bg-red-500/20 dark:hover:bg-[#f87171]/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} />
              <span>Limpar Todas as Fontes ({sources.length})</span>
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="p-4 bg-white dark:bg-[#1E1E1E] shadow-lg rounded-xl h-full flex flex-col border border-gray-200 dark:border-[rgba(255,255,255,0.05)] transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-[#E2E2E2]">Base de Conhecimento</h2>
        {onCloseSidebar && (
          <button
            onClick={onCloseSidebar}
            className="p-1 text-gray-500 dark:text-[#A8ABB4] hover:text-black dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors md:hidden"
            aria-label="Fechar base de conhecimento"
          >
            <X size={24} />
          </button>
        )}
      </div>
      
      {isManagingGroups ? renderManageGroupsView() : renderDefaultView()}
    </div>
  );
};

export default KnowledgeBaseManager;