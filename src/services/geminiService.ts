/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import type { UrlContextMetadataItem, KnowledgeSource, OptimizedPrompt, ChatMessage } from '../types';

export interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
  usageMetadata?: { promptTokenCount: number, candidatesTokenCount: number, totalTokenCount: number };
  modelName: string;
}

// --- A CLASSE SINGLETON ---
class GeminiService {
  private static instance: GeminiService;

  private constructor() {
    // O construtor agora está vazio, pois toda a lógica de IA foi movida para o backend.
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Private helper to handle errors from the Gemini API.
   * @param error The error object caught.
   * @param context The name of the function where the error occurred.
   * @returns A new Error object.
   */
  private handleError(error: unknown, context: string): Error {
    console.error(`Erro no ${context}:`, error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Error(`Falha ao obter resposta da IA: ${message}`);
  }

  // A SER INSERIDA EM geminiService.ts

// A SER INSERIDA EM geminiService.ts

// DENTRO DA CLASSE GeminiService

public async generateContentWithSources(prompt: string, sources: KnowledgeSource[], modelName: string, history: Pick<ChatMessage, 'sender' | 'text'>[]): Promise<GeminiResponse> {
  try {
    const functions = getFunctions();
    const generateContentFn = httpsCallable<
      { prompt: string; sources: KnowledgeSource[]; modelName: string; history: Pick<ChatMessage, 'sender' | 'text'>[] },
      GeminiResponse
    >(functions, 'generateContent');

    const result = await generateContentFn({
      prompt,
      sources,
      modelName,
      history,
    });

    return result.data;
  } catch (error) {
    throw this.handleError(error, 'generateContentWithSources');
  }
}

  public async getInitialSuggestions(sources: KnowledgeSource[], modelName: string): Promise<string[]> {    
    try {
      const functions = getFunctions();
      const getSuggestionsFn = httpsCallable<
        { sources: KnowledgeSource[]; modelName: string },
        { suggestions: string[] }
      >(functions, 'getInitialSuggestions');

      const result = await getSuggestionsFn({ sources, modelName });
      return result.data.suggestions || [];
    } catch (error) {
      // Lança o erro para que a UI possa tratá-lo (ex: exibir uma mensagem).
      throw this.handleError(error, 'getInitialSuggestions');
    }
  }

  public async generateMindMapFromText(textToAnalyze: string, modelName: string): Promise<{ title: string; nodes: any[]; edges: any[] }> {
    try {
      const functions = getFunctions();
      const generateMindMapFn = httpsCallable<
        { textToAnalyze: string; modelName: string },
        { title: string; nodes: any[]; edges: any[] }
      >(functions, 'generateMindMap');

      const result = await generateMindMapFn({
        textToAnalyze,
        modelName,
      });

      const mindMapData = result.data;
      if (!mindMapData.title || !mindMapData.nodes || !mindMapData.edges) {
        throw new Error("Dados do mapa mental recebidos da Cloud Function são inválidos.");
      }
      return mindMapData;
    } catch (error) {
      throw this.handleError(error, 'generateMindMapFromText');
    }
  }

  public async generateTitleForConversation(firstMessage: string): Promise<string> {
    try {
      const functions = getFunctions();
      // Define a chamada para a Cloud Function 'generateTitle'
      const generateTitleFn = httpsCallable<{ text: string }, { title: string }>(functions, 'generateTitle');

      // Executa a função passando a primeira mensagem
      const result = await generateTitleFn({ text: firstMessage });
      
      const title = result.data.title;
      if (!title) {
        throw new Error("A resposta da Cloud Function não continha um título.");
      }
      return title;
    } catch (error) {
      // Lança o erro para que a UI possa tratá-lo. O fallback deve ser responsabilidade da UI.
      throw this.handleError(error, 'generateTitleForConversation');
    }
  }

  public async generateOptimizedPrompts(humanPrompt: string, sources: KnowledgeSource[], modelName: string): Promise<OptimizedPrompt[]> {
    try {
      // 1. Obter uma referência para o serviço de Cloud Functions.
      const functions = getFunctions();
      // 2. Criar uma referência para a função 'optimizePrompt' que fizemos deploy.
      const optimizePromptFn = httpsCallable<{ humanPrompt: string; sources: KnowledgeSource[]; modelName: string; }, { optimized_prompts: OptimizedPrompt[] }>(functions, 'optimizePrompt');

      // 3. Chamar a função com os dados necessários.
      const result = await optimizePromptFn({
        humanPrompt,
        sources,
        modelName,
      });

      // 4. A Cloud Function já retorna o objeto JSON no formato correto.
      const data = result.data;
      if (!data || !data.optimized_prompts) {
        throw new Error("A resposta da Cloud Function não contém 'optimized_prompts'.");
      }

      return data.optimized_prompts;
    } catch (error) {
      throw this.handleError(error, 'generateOptimizedPrompts');
    }
  }
}

// --- EXPORTAÇÃO DA INSTÂNCIA SINGLETON ---
export const geminiService = GeminiService.getInstance();