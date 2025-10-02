/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import {
  GoogleGenAI,
  HarmCategory,
  HarmBlockThreshold,
  // CORREÇÃO: Removendo importações de tipos não públicos para o frontend.
  type SafetySetting,
} from "@google/genai";
import type { UrlContextMetadataItem, KnowledgeSource } from '../types';

// --- DEFINIÇÕES DE TIPO E CONSTANTES ---
const MODEL_NAME = "gemini-2.5-flash-lite";
// CORREÇÃO: Lendo a API Key do ambiente Vite.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
  usageMetadata?: any;
}

// --- A CLASSE SINGLETON ---
class GeminiService {
  private static instance: GeminiService;
  private genAI: GoogleGenAI;
  private safetySettings: SafetySetting[];

  private constructor() {
    if (!API_KEY) {
      throw new Error("Chave da API Gemini não configurada. Verifique VITE_GEMINI_API_KEY no seu arquivo .env.");
    }
    // CORREÇÃO: A instanciação correta espera um objeto de opções.
    this.genAI = new GoogleGenAI({ apiKey: API_KEY });

    this.safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  // A SER INSERIDA EM geminiService.ts

// A SER INSERIDA EM geminiService.ts

// DENTRO DA CLASSE GeminiService

public async generateContentWithSources(prompt: string, sources: KnowledgeSource[]): Promise<GeminiResponse> {
  // --- Bloco de construção do prompt (permanece o mesmo) ---
  const urls = sources.filter((s) => s.type === "url").map(s => s.value);
  let contextText = "";
  for (const source of sources) {
    if (source.type === 'file') {
      contextText += `Fonte (Arquivo: ${source.name}):\n---\n${source.content}\n---\n\n`;
    }
    // Adicionar lógica de URL aqui se necessário
  }
  const fullPrompt = `Com base no contexto das fontes fornecidas abaixo, responda: "${prompt}"\n\n--- CONTEXTO ---\n${contextText}`;
  const contents: any[] = [{ role: "user", parts: [{ text: fullPrompt }] }];
  const tools: any[] = urls.length > 0 ? [{ googleSearch: {} }] : [];
  // --- Fim do bloco de construção ---

  try {
    const result = await this.genAI.models.generateContent({
      model: MODEL_NAME,
      contents: contents, // A variável 'contents' está definida aqui. (Corrige o erro 1)
      config: {
        tools: tools,
        safetySettings: this.safetySettings,
      },
    });

    // CORREÇÃO FINAL E DEFINITIVA (Corrige o erro 2)
    // O objeto 'result' é a própria resposta. Não há subpropriedade 'response'.
    
    if (!result) {
      throw new Error("A API retornou uma resposta inválida ou vazia.");
    }
    
    const text = result.text; // Acessa o getter .text diretamente do resultado.
    const candidate = result.candidates?.[0];
    const usageMetadata = result.usageMetadata;

    let extractedUrlContextMetadata: UrlContextMetadataItem[] | undefined = undefined;
    if (candidate?.urlContextMetadata?.urlMetadata) {
      extractedUrlContextMetadata = candidate.urlContextMetadata.urlMetadata.map((meta: any) => ({
        retrievedUrl: meta.retrievedUrl || meta.retrieved_url,
        urlRetrievalStatus: meta.urlRetrievalStatus || meta.url_retrieval_status,
      }));
    }

    return { text, urlContextMetadata: extractedUrlContextMetadata, usageMetadata };
  } catch (error) {
    console.error("Erro no generateContentWithSources:", error);
    throw new Error(`Falha ao obter resposta da IA: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}

  //public async generateContentWithSources(prompt: string, sources: KnowledgeSource[]): Promise<GeminiResponse> {
  //  const urls = sources.filter(s => s.type === 'url').map(s => s.value);
  //  
  //  const textPrompt = urls.length > 0 ? `${prompt}\n\nFontes:\n${urls.join('\n')}` : prompt;
  //  const userParts: any[] = [{ text: textPrompt }];
  //  const contents: any[] = [{ role: "user", parts: userParts }];
  //  const tools: any[] = urls.length > 0 ? [{ googleSearch: {} }] : []; // CORREÇÃO: A ferramenta é `googleSearch`.
//
  //  try {
  //    const result = await this.genAI.models.generateContent({
  //      model: MODEL_NAME,
  //      contents: contents,
  //      config: {
  //        tools: tools.length > 0 ? tools : undefined,
  //        safetySettings: this.safetySettings,
  //      },
  //    });
//
  //    const response = result.response;
  //    const text = response.text;
  //    const candidate = response.candidates?.[0];
  //    let extractedUrlContextMetadata: UrlContextMetadataItem[] | undefined = undefined;
//
  //    if (candidate?.urlContextMetadata?.urlMetadata) {
  //      extractedUrlContextMetadata = candidate.urlContextMetadata.urlMetadata.map((meta: any) => ({
  //        retrievedUrl: meta.retrievedUrl || meta.retrieved_url,
  //        urlRetrievalStatus: meta.urlRetrievalStatus || meta.url_retrieval_status,
  //      }));
  //    }
//
  //    return { text, urlContextMetadata: extractedUrlContextMetadata, usageMetadata: response.usageMetadata };
  //  } catch (error) {
  //    console.error("Erro no generateContentWithSources:", error);
  //    throw new Error(`Falha ao obter resposta da IA: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  //  }
  //}

  public async getInitialSuggestions(sources: KnowledgeSource[]): Promise<string[]> {
    const urls = sources.filter(s => s.type === 'url').map(s => s.value);
    if (urls.length === 0) return [];
    
    const prompt = `Com base no conteúdo das URLs: ${urls.join('\n')}, gere 3 perguntas. Retorne APENAS um array de strings JSON.`;
    
    try {
      const result = await this.genAI.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          safetySettings: this.safetySettings,
          responseMimeType: "application/json",
        }
      });
      
      return JSON.parse(result.text);
    } catch (error) {
      console.error("Erro no getInitialSuggestions:", error);
      return [];
    }
  }

  public async generateMindMapFromText(textToAnalyze: string): Promise<{ nodes: any[], edges: any[] }> {
    const prompt = `Analise o texto: "${textToAnalyze}" e gere um mapa mental em JSON (nodes, edges)...`;

    try {
      const result = await this.genAI.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          safetySettings: this.safetySettings,
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(result.text);
      if (!parsed.nodes || !parsed.edges) throw new Error("JSON do mapa mental inválido.");
      return { nodes: parsed.nodes, edges: parsed.edges };
    } catch (error) {
      console.error("Erro no generateMindMapFromText:", error);
      throw new Error("Falha ao gerar o mapa mental.");
    }
  }
}

// --- EXPORTAÇÃO DA INSTÂNCIA SINGLETON ---
export const geminiService = GeminiService.getInstance();