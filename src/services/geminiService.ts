/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * @fileoverview
 * Serviço Singleton para interações com a API Google Gemini.
 * Gerencia o estado da sessão de chat (com streaming) e as chamadas one-shot.
 */

import {
  GoogleGenAI,
  HarmCategory,
  HarmBlockThreshold,
  type SafetySetting,
} from "@google/genai";
import type { KnowledgeSource } from '../types';

// --- DEFINIÇÕES DE TIPO E CONSTANTES ---
const MODEL_NAME = "gemini-2.5-flash";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- A CLASSE SINGLETON ---

class GeminiService {
  private static instance: GeminiService;

  private genAI: GoogleGenAI;
  private activeChatSession: any | null = null; // Using any to simplify type issues with the chat session
  private safetySettings: SafetySetting[];
  private systemInstruction: string; // System instruction is a string

  private constructor() {
    if (!API_KEY) {
      throw new Error("Chave da API Gemini não configurada. Verifique seu arquivo .env (VITE_GEMINI_API_KEY).");
    }
    this.genAI = new GoogleGenAI({ apiKey: API_KEY });

    this.safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    this.systemInstruction = "Você é um assistente de pesquisa e especialista em educação médica. Sua principal função é fornecer resumos, avaliações e diagnósticos psicométricos de alta qualidade, baseados estritamente nas fontes e instruções do usuário.";
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public async sendMessageStream(
    prompt: string,
    sources: KnowledgeSource[],
    onStreamUpdate: (chunk: string) => void
  ): Promise<void> {
    if (!this.activeChatSession) {
      // Correct structure: use a 'config' object for settings
      this.activeChatSession = this.genAI.chats.create({
        model: MODEL_NAME,
        history: [],
        config: {
          safetySettings: this.safetySettings,
          systemInstruction: this.systemInstruction,
          tools: [{ googleSearch: {} }],
        }
      });
    }

    const urls = sources.filter(s => s.type === 'url').map(s => s.value as string);
    const fullPrompt = urls.length > 0
      ? `Com base no conteúdo da(s) seguinte(s) URL(s): ${urls.join(' \n')}, responda: ${prompt}`
      : prompt;

    try {
      // Correct structure: pass prompt as an object
      const resultStream = await this.activeChatSession.sendMessageStream({ message: fullPrompt });

      for await (const chunk of resultStream) {
        // Access text via getter
        if (chunk.text) {
          onStreamUpdate(chunk.text);
        }
      }
    } catch (error) {
      console.error("Erro no sendMessageStream:", error);
      this.activeChatSession = null;
      throw new Error(`Falha ao obter resposta da IA. Detalhes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public endChat(): void {
    this.activeChatSession = null;
  }

  public async generateMindMapFromText(textToAnalyze: string): Promise<{ nodes: any[], edges: any[] }> {
    const prompt = `Analise o texto a seguir e extraia os conceitos-chave e suas relações como um mapa mental. Retorne APENAS um objeto JSON com duas chaves: "nodes" e "edges". O formato deve ser compatível com a biblioteca reactflow. Exemplo de node: { "id": "1", "position": { "x": 0, "y": 0 }, "data": { "label": "Conceito Principal" } }. Exemplo de edge: { "id": "e1-2", "source": "1", "target": "2" }.`;

    try {
      const result = await this.genAI.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: 'user', parts: [{ text: prompt }, { text: `Texto para analisar: ${textToAnalyze}` }] }],
        // Correct structure: use a 'config' object for settings
        config: {
          safetySettings: this.safetySettings,
          responseMimeType: "application/json",
        },
      });
      
      const responseText = result.text;
      const parsed = JSON.parse(responseText);

      if (!parsed.nodes || !parsed.edges) {
        throw new Error("Resposta da IA em formato JSON inválido para o mapa mental.");
      }
      return { nodes: parsed.nodes, edges: parsed.edges };
    } catch (error) {
      console.error("Erro no generateMindMapFromText:", error);
      throw new Error("Falha ao gerar o mapa mental.");
    }
  }
}

// --- EXPORTAÇÃO DA INSTÂNCIA SINGLETON ---

export const geminiService = GeminiService.getInstance();