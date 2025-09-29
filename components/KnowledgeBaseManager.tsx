/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
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
      }, 4000); // Clear after 4 seconds
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
      setError('URL cannot be empty.');
      return;
    }
    if (!isValidUrl(currentUrlInput)) {
      setError('Invalid URL format. Please include http:// or https://');
      return;
    }
    if (sources.find(s => s.id === currentUrlInput)) {
      setError('This URL has already been added to the current group.');
      return;
    }
    onAddSource({ type: 'url', id: currentUrlInput, value: currentUrlInput });
    setCurrentUrlInput('');
    setSuccessMessage('URL added successfully.');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMessage(null);
    
    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      setError(`Unsupported file type for "${file.name}". Only PDF, DOCX, and TXT files are supported.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File "${file.name}" is too large. The maximum file size is ${MAX_FILE_SIZE_MB}MB.`);
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
      setSuccessMessage(`File "${file.name}" added successfully.`);
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setError(`Failed to read the file "${file.name}". Please try again or select a different file.`);
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
      setError("Group name cannot be empty.");
      return;
    }
    if (knowledgeGroups.some(g => g.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError("A group with this name already exists.");
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

  const activeGroupName = knowledgeGroups.find(g => g.id === activeGroupId)?.name || "Unknown Group";

  return (
    <div className="p-4 bg-[#1E1E1E] shadow-md rounded-xl h-full flex flex-col border border-[rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-[#E2E2E2]">Knowledge Base</h2>
        {onCloseSidebar && (
          <button
            onClick={onCloseSidebar}
            className="p-1 text-[#A8ABB4] hover:text-white rounded-md hover:bg-white/10 transition-colors md:hidden"
            aria-label="Close knowledge base"
          >
            <X size={24} />
          </button>
        )}
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="url-group-select-kb" className="block text-sm font-medium text-[#A8ABB4]">
            Active Group
          </label>
          {!isCreatingGroup && (
            <button
              onClick={() => setIsCreatingGroup(true)}
              className="text-xs text-[#79B8FF] hover:text-white font-medium"
            >
              New Group
            </button>
          )}
        </div>
        {isCreatingGroup ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name..."
              className="w-full h-8 py-1 px-2.5 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-shadow text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancelCreate}
                className="px-2.5 py-1 text-xs text-[#A8ABB4] hover:bg-white/5 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-2.5 py-1 text-xs bg-white/[.12] hover:bg-white/20 text-white rounded-md transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full">
            <select
              id="url-group-select-kb"
              value={activeGroupId}
              onChange={(e) => onSetGroupId(e.target.value)}
              className="w-full py-2 pl-3 pr-8 appearance-none border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] rounded-md focus:ring-1 focus:ring-white/20 focus:border-white/20 text-sm"
            >
              {knowledgeGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8ABB4] pointer-events-none"
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
          placeholder="https://docs.example.com"
          className="flex-grow h-8 py-1 px-2.5 border border-[rgba(255,255,255,0.1)] bg-[#2C2C2C] text-[#E2E2E2] placeholder-[#777777] rounded-lg focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-shadow text-sm"
          onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
          disabled={sources.length >= maxSources || isReadingFile || isCreatingGroup}
        />
        <button
          onClick={handleAddUrl}
          disabled={sources.length >= maxSources || isReadingFile || isCreatingGroup}
          className="h-8 w-8 p-1.5 bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] flex items-center justify-center flex-shrink-0"
          aria-label="Add URL"
        >
          <Plus size={16} />
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.txt,.docx" className="hidden" aria-hidden="true" />
        <button
          onClick={handleUploadClick}
          disabled={sources.length >= maxSources || isReadingFile || isCreatingGroup}
          className="h-8 w-8 p-1.5 bg-white/[.12] hover:bg-white/20 text-white rounded-lg transition-colors disabled:bg-[#4A4A4A] disabled:text-[#777777] flex items-center justify-center flex-shrink-0"
          aria-label="Upload file"
        >
          {isReadingFile ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Upload size={16} />
          )}
        </button>
      </div>
      
      {isReadingFile && (
        <p className="text-xs text-center text-[#A8ABB4] mb-2 animate-pulse">Processing file, please wait...</p>
      )}
      {successMessage && (
        <div className="flex items-start gap-1.5 text-xs text-[#6ee7b7] mb-2 p-2 bg-[#6ee7b7]/10 rounded-md border border-[#6ee7b7]/20">
          <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-1.5 text-xs text-[#f87171] mb-2 p-2 bg-[#f87171]/10 rounded-md border border-[#f87171]/20">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {sources.length >= maxSources && (
        <div className="flex items-start gap-1.5 text-xs text-[#fbbf24] mb-2 p-2 bg-[#fbbf24]/10 rounded-md border border-[#fbbf24]/20">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>Maximum {maxSources} sources reached. Please remove a source to add a new one.</span>
        </div>
      )}
      
      <div className="flex-grow overflow-y-auto space-y-2 chat-container">
        {sources.length === 0 && (
          <p className="text-[#777777] text-center py-3 text-sm">Add URLs or upload files to the group "{activeGroupName}" to start querying.</p>
        )}
        {sources.map((source) => (
          <div key={source.id} className="flex items-center justify-between p-2.5 bg-[#2C2C2C] border border-[rgba(255,255,255,0.05)] rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 min-w-0">
                {source.type === 'file' && <FileText size={16} className="text-[#A8ABB4] flex-shrink-0" />}
                {source.type === 'url' ? (
                    <a href={source.value} target="_blank" rel="noopener noreferrer" className="text-xs text-[#79B8FF] hover:underline truncate" title={source.value}>
                    {source.value}
                    </a>
                ) : (
                    <span className="text-xs text-white truncate" title={source.name}>
                    {source.name}
                    </span>
                )}
            </div>
            <button 
              onClick={() => onRemoveSource(source.id)}
              className="p-1 text-[#A8ABB4] hover:text-[#f87171] rounded-md hover:bg-[rgba(255,0,0,0.1)] transition-colors flex-shrink-0 ml-2"
              aria-label={`Remove ${source.type === 'url' ? source.value : source.name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {sources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.05)] flex-shrink-0">
          {isConfirmingClear ? (
            <div className="text-center">
              <p className="text-sm text-white mb-2">Clear all sources in this group?</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-3 py-1 text-xs text-[#A8ABB4] hover:bg-white/5 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClear}
                  className="px-3 py-1 text-xs bg-[#f87171]/20 hover:bg-[#f87171]/30 text-[#f87171] rounded-md transition-colors"
                >
                  Confirm Clear
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingClear(true)}
              disabled={isReadingFile || isCreatingGroup}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-[#f87171]/90 bg-[#f87171]/10 hover:bg-[#f87171]/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} />
              <span>Clear All Sources ({sources.length})</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseManager;
