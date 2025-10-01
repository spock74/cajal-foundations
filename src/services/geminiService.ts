/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * @fileoverview
 * Serviço Singleton para interações com a API Google Gemini.
 * Gerencia o estado da sessão de chat (memória) e as chamadas one-shot.
 */

import {
  GoogleGenAI,
  HarmCategory,
  HarmBlockThreshold,
  type SafetySetting,
  type ChatSession,
  type Content,
} from "@google/genai";
import type { KnowledgeSource } from '../types';

// --- DEFINIÇÕES DE TIPO E CONSTANTES ---

const MODEL_NAME = "gemini-1.5-flash"; // Modelo atualizado
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- A CLASSE SINGLETON ---

class GeminiService {
  private static instance: GeminiService;

  private genAI: GoogleGenAI;
  private activeChatSession: ChatSession | null = null;
  private safetySettings: SafetySetting[];
  private systemInstruction: Content;

  private constructor() {
    if (!API_KEY) {
      throw new Error("Chave da API Gemini não configurada. Verifique seu arquivo .env.");
    }
    this.genAI = new GoogleGenAI(API_KEY);

    this.safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    this.systemInstruction = {
      role: "system",
      parts: [{ text: "Você é um assistente de pesquisa e especialista em educação médica. Sua principal função é fornecer resumos, avaliações e diagnósticos psicométricos de alta qualidade, baseados estritamente nas fontes e instruções do usuário." }]
    };
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private getModel() {
    return this.genAI.getGenerativeModel({
      model: MODEL_NAME,
      safetySettings: this.safetySettings,
      systemInstruction: this.systemInstruction,
      tools: [{ google_search: {} }], // Ferramenta de busca habilitada corretamente
    });
  }

  public async sendMessageStream(
    prompt: string,
    sources: KnowledgeSource[],
    onStreamUpdate: (chunk: string) => void
  ): Promise<void> {
    if (!this.activeChatSession) {
      const model = this.getModel();
      this.activeChatSession = model.startChat({
        history: [],
      });
    }

    const urls = sources.filter(s => s.type === 'url').map(s => s.value as string);
    let fullPrompt = prompt;

    if (urls.length > 0) {
      const urlList = urls.join(' \n');
      // A instrução explícita ajuda o modelo a focar na URL fornecida
      fullPrompt = `Com base EXCLUSIVAMENTE no conteúdo da seguinte URL: ${urlList}, responda à seguinte pergunta: ${prompt}`;
    }

    try {
      const result = await this.activeChatSession.sendMessageStream(fullPrompt);

      for await (const chunk of result.stream) {
        // A API pode retornar chunks vazios ou sem a função text()
        if (chunk && typeof chunk.text === 'function') {
          const chunkText = chunk.text();
          if (chunkText) {
            onStreamUpdate(chunkText);
          }
        }
      }
    } catch (error) {
      console.error("Erro no sendMessageStream:", error);
      this.activeChatSession = null; // Reseta a sessão em caso de erro
      throw new Error(`Falha ao obter resposta da IA. Detalhes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public endChat(): void {
    this.activeChatSession = null;
  }

  public async generateMindMapFromText(textToAnalyze: string): Promise<{ nodes: any[], edges: any[] }> {
    const model = this.getModel();
    const prompt = `Analise o texto a seguir e extraia os conceitos-chave e suas relações como um mapa mental. Retorne APENAS um objeto JSON com duas chaves: "nodes" e "edges". O formato deve ser compatível com a biblioteca reactflow. Exemplo de node: { "id": "1", "position": { "x": 0, "y": 0 }, "data": { "label": "Conceito Principal" } }. Exemplo de edge: { "id": "e1-2", "source": "1", "target": "2" }.`;

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }, {text: `Texto para analisar: ${textToAnalyze}`}] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      });
      
      const responseText = result.response.text();
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
