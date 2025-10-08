/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import { type KnowledgeSource } from '../types';
// Para instalar o pdf.js, execute: npm install pdfjs-dist
import * as pdfjsLib from 'pdfjs-dist';

// Configuração para o worker do pdf.js. O Vite irá lidar com isso.
// Você pode precisar copiar o worker do node_modules para a sua pasta 'public'.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

// --- SIMULAÇÃO DO ARQUIVO DE CONFIGURAÇÃO ---
// No futuro, isso será importado de um app.config.json
const APP_CONFIG = {
  MAX_FILE_SIZE_MB: 10,
  ACCEPTED_KNOWLEDGE_FILE_TYPES: ['application/pdf', 'text/plain', 'text/markdown'],
};
const MAX_FILE_SIZE_BYTES = (APP_CONFIG.MAX_FILE_SIZE_MB > 80 ? 80 : APP_CONFIG.MAX_FILE_SIZE_MB) * 1024 * 1024;

/**
 * Função de Hashing assíncrona usando a Web Crypto API nativa do navegador.
 * Gera um hash SHA-256 para um determinado conteúdo de texto.
 * @param text O conteúdo a ser hasheado.
 * @returns Uma string representando o hash em hexadecimal.
 */
async function generateHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks if a file is valid by verifying its MIME type or file extension.
 * This provides a fallback for file types browsers may not correctly identify, like Markdown.
 * @param file The file to validate.
 * @returns True if the file is valid, false otherwise.
 */
function isFileValid(file: File): boolean {
  const acceptedMimeTypes = APP_CONFIG.ACCEPTED_KNOWLEDGE_FILE_TYPES;
  const acceptedExtensions = ['.pdf', '.md', '.txt'];
  return acceptedMimeTypes.includes(file.type) || acceptedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

class SourceManagerService {
  private static instance: SourceManagerService;

  private constructor() {}

  public static getInstance(): SourceManagerService {
    if (!SourceManagerService.instance) {
      SourceManagerService.instance = new SourceManagerService();
    }
    return SourceManagerService.instance;
  }

  /**
   * Processa e adiciona um arquivo local (PDF, MD, TXT) como uma fonte de conhecimento.
   * Executa validação, leitura de conteúdo, hashing e persistência no DB.
   * @param file O objeto File do input do navegador.
   * @returns O objeto KnowledgeSource completo e persistido.
   * @throws Lança um erro se a validação falhar, a leitura falhar, ou o arquivo já existir no DB.
   */
  public async addFileSource(file: File, groupId: string): Promise<KnowledgeSource> {
    // 1. Validação
    if (!isFileValid(file)) {
      throw new Error(`Tipo de arquivo '${file.type || file.name.split('.').pop()}' não é suportado.`);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Arquivo excede o limite de ${APP_CONFIG.MAX_FILE_SIZE_MB}MB.`);
    }

    // 2. Leitura e Extração de Conteúdo
    let content = "";
    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const numPages = pdf.numPages;
        const textSnippets: string[] = [];
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          textSnippets.push(textContent.items.map((item: any) => ('str' in item ? item.str : '')).join(' '));
        }
        content = textSnippets.join('\n\n');
      } else { // text/plain, text/markdown
        content = await file.text();
      }
    } catch (error) {
      console.error("Erro ao ler ou processar o arquivo:", error);
      throw new Error(`Não foi possível processar o arquivo "${file.name}".`);
    }

    if (!content.trim()) {
      throw new Error(`O arquivo "${file.name}" parece estar vazio ou não contém texto extraível.`);
    }
    
    // 3. Hashing
    const hashId = await generateHash(content);

    // 4. Criação do Objeto de Metadados
    const newSource: KnowledgeSource = {
      type: 'file',
      id: hashId,
      name: file.name,
      groupId: groupId,
      timestamp: new Date(),
      userId: 'dev_user',
      selected: true,
      fileType: file.type,
      fileSize: file.size,
      content: content,
    };
    
    // 5. O salvamento no DB agora é responsabilidade do AppContext,
    // que sabe se deve usar Firestore ou Dexie.
    
    // 6. Retornar para o App.tsx
    return newSource;
  }

  /**
   * Adiciona uma fonte de URL (funcionalidade futura).
   */
  public async addUrlSource(url: string, groupId: string): Promise<KnowledgeSource> {
    // TODO: Implementar a lógica de scraping da URL, possivelmente via Cloud Function.
    console.warn("A funcionalidade de adicionar URL precisa ser implementada com scraping de backend.");
    // Placeholder para manter a UI funcionando:
    const content = `Conteúdo simulado para a URL: ${url}`;
    const hashId = await generateHash(content);
    
    const newSource: KnowledgeSource = {
      type: 'url',
      id: hashId,
      name: url,
      value: url,
      groupId: groupId,
      timestamp: new Date(),
      userId: 'dev_user',
      selected: true
    };
    
    return newSource;
  }
}

export const sourceManagerService = SourceManagerService.getInstance();