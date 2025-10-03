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
  type Content,
  type Tool,
  type GenerateContentResponse,
} from "@google/genai";
import type { UrlContextMetadataItem, KnowledgeSource, OptimizedPrompt } from '../types';

// --- DEFINIÇÕES DE TIPO E CONSTANTES ---
// CORREÇÃO: Lendo a API Key do ambiente Vite.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
  usageMetadata?: { promptTokenCount: number, candidatesTokenCount: number, totalTokenCount: number };
  modelName: string;
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

public async generateContentWithSources(prompt: string, sources: KnowledgeSource[], modelName: string): Promise<GeminiResponse> {
  // --- Bloco de construção do prompt (permanece o mesmo) ---
  const urls = sources.filter((s) => s.type === "url").map(s => s.value);
  
  // Sugestão: Construção de contexto mais funcional e legível.
  const contextText = sources
    .filter((s): s is Extract<KnowledgeSource, { type: 'file' }> => s.type === 'file')
    .map(source => `Fonte (Arquivo: ${source.name}):\n---\n${source.content}\n---\n\n`)
    .join('');

  const fullPrompt = `Com base no contexto das fontes fornecidas abaixo, responda: "${prompt}"\n\n--- CONTEXTO ---\n${contextText}`;
  
  // Sugestão: Usar tipos importados para maior segurança.
  const contents: Content[] = [{ role: "user", parts: [{ text: fullPrompt }] }];
  const tools: Tool[] = urls.length > 0 ? [{ googleSearch: {} }] : [];
  // --- Fim do bloco de construção ---

  try {
    // Sugestão: Tipar o resultado da chamada da API.
    const result: GenerateContentResponse = await this.genAI.models.generateContent({
      model: modelName,
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
    const usageMetadata = result.usageMetadata ? {
      promptTokenCount: result.usageMetadata.promptTokenCount ?? 0,
      candidatesTokenCount: result.usageMetadata.candidatesTokenCount ?? 0,
      totalTokenCount: result.usageMetadata.totalTokenCount ?? 0,
    } : undefined;

    let extractedUrlContextMetadata: UrlContextMetadataItem[] | undefined = undefined;
    if (candidate?.urlContextMetadata?.urlMetadata) {
      // Sugestão: Tipar o objeto 'meta' para maior clareza.
      extractedUrlContextMetadata = candidate.urlContextMetadata.urlMetadata.map((meta: { retrievedUrl?: string, retrieved_url?: string, urlRetrievalStatus?: string, url_retrieval_status?: string }) => ({
        retrievedUrl: meta.retrievedUrl || meta.retrieved_url,
        urlRetrievalStatus: meta.urlRetrievalStatus || meta.url_retrieval_status,
      }));
    }

    return { text, urlContextMetadata: extractedUrlContextMetadata, usageMetadata, modelName: modelName };
  } catch (error) {
    // Sugestão: Usar o helper de erro centralizado.
    throw this.handleError(error, 'generateContentWithSources');
  }
}

  public async getInitialSuggestions(sources: KnowledgeSource[], modelName: string): Promise<string[]> {
    const urls = sources.filter(s => s.type === 'url').map(s => s.value);
    if (urls.length === 0) return [];
    
    const prompt = `Com base no conteúdo das URLs: ${urls.join('\n')}, gere 3 perguntas. Retorne APENAS um array de strings JSON.`;
    
    try {
      const result = await this.genAI.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          safetySettings: this.safetySettings,
          responseMimeType: "application/json",
        }
      });
      
      return JSON.parse(result.text);
    } catch (error) {
      this.handleError(error, 'getInitialSuggestions');
      return [];
    }
  }

  public async generateMindMapFromText(textToAnalyze: string, modelName: string): Promise<{ title: string, nodes: any[], edges: any[] }> {
    const prompt = `Analise o texto: "${textToAnalyze}" e gere um mapa mental em JSON (nodes, edges)...`;

    // Sugestão: Prompt mais detalhado para garantir um formato de saída consistente.
    const structuredPrompt = `
      Analise o texto a seguir e estruture as informações como um mapa mental.
      Sua resposta DEVE ser um objeto JSON contendo três chaves: "title", "nodes" e "edges".
      - "title": Uma string contendo um título curto e descritivo para o mapa mental (máximo 7 palavras).
      - "nodes": Um array de objetos, onde cada objeto tem "id" (string), "label" (string), e "type" (string, ex: 'main', 'subtopic').
      - "edges": Um array de objetos, onde cada objeto tem "id" (string), "source" (o 'id' de um nó), e "target" (o 'id' de outro nó).
      Texto para análise:
      ---
      ${textToAnalyze}
      ---
    `;
    try {
      const result = await this.genAI.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: structuredPrompt }] }],
        config: {
          safetySettings: this.safetySettings,
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(result.text);
      if (!parsed.title || !parsed.nodes || !parsed.edges) throw new Error("JSON do mapa mental inválido ou incompleto.");
      return { title: parsed.title, nodes: parsed.nodes, edges: parsed.edges };
    } catch (error) {
      throw this.handleError(error, 'generateMindMapFromText');
    }
  }

  public async generateTitleForConversation(firstMessage: string, modelName: string): Promise<string> {
    const prompt = `Gere um título curto e descritivo (máximo 5 palavras) para uma conversa que começa com a seguinte pergunta: "${firstMessage}". Responda apenas com o título.`;
    try {
      const result = await this.genAI.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          safetySettings: this.safetySettings,
        },
      });
      // Limpa a resposta para garantir que seja apenas texto.
      let title = result.text.trim().replace(/["*]/g, '');
      if (title.length > 50) title = title.substring(0, 47) + '...';
      return title;
    } catch (error) {
      console.error("Falha ao gerar título, usando fallback:", error);
      return "Nova Conversa";
    }
  }

  public async generateOptimizedPrompts(humanPrompt: string, sources: KnowledgeSource[], modelName: string): Promise<OptimizedPrompt[]> {
    const sourcesContent = sources
      .filter((s): s is Extract<KnowledgeSource, { type: 'file' }> => s.type === 'file' && !!s.content)
      .map(source => `Fonte (Arquivo: ${source.name}):\n---\n${source.content}\n---\n\n`)
      .join('');

    const metaPromptTemplate = `# CONTEXTO E OBJETIVO
Você é um assistente de pesquisa especialista em engenharia de prompt. Sua função é analisar um prompt inicial de um usuário e, com base em um conjunto de documentos científicos, gerar múltiplas opções de prompts refinados para que o usuário possa escolher a abordagem que melhor atende à sua necessidade.

# FONTES DE DADOS
Considere estritamente os textos abaixo como sua única fonte de conhecimento:
{sources_content}

# PROMPT ORIGINAL DO USUÁRIO
Agora, analise o seguinte prompt do usuário:
{human_prompt}

# SUAS INSTRUÇÕES

1.  **Pense Passo a Passo:** Primeiro, analise o \`{human_prompt}\` e identifique as possíveis intenções, ambiguidades ou direções que ele pode tomar, sempre em relação ao conteúdo disponível em \`{sources_content}\`.

2.  **Identifique Aspectos Distintos:** Elabore até 5 "aspectos" ou interpretações diferentes para a solicitação do usuário, variando em foco analítico, intenção, formato, etc.

3.  **Crie Prompts Otimizados:** Para cada aspecto identificado, componha um "prompt otimizado" que seja auto-contido e inclua persona, instrução clara e formato de saída.

4.  **Crie um Título para a Pergunta (\`question_title\`):** Para cada aspecto, crie um título curto e direto (2 a 4 palavras) que resuma a natureza da resposta. Este título será usado como o texto de um botão na interface do chat, então ele deve ser claro e conciso. Pense nele como uma "etiqueta" para a opção. Bons exemplos: "Resumo Técnico", "Análise de Implicações", "Explicação Simplificada", "Comparativo de Modelos".

5.  **Escreva Descrições Focadas na Ação e no Benefício (\`description\`):** Para cada aspecto, crie uma descrição que siga as seguintes regras:
    * **Comece com Ação:** Inicie com um verbo de ação (Ex: "Receba", "Analise") ou descrevendo o resultado (Ex: "Um resumo técnico...").
    * **Oculte a Mecânica:** NUNCA use as palavras "prompt", "opção", "alternativa", ou "escolha".
    * **Foque no Benefício:** Em vez de nomear um público (Ex: "para especialistas"), descreva o interesse que a resposta satisfaz (Ex: "Ideal se você precisa dos detalhes técnicos...").

6.  **Tratamento de Exceção:** Se o \`{human_prompt}\` for vago ou desconectado do \`{sources_content}\`, gere apenas uma opção de prompt com um título e descrição apropriados que sugiram um resumo geral.

7.  **Formato de Saída:** Sua resposta final deve ser um objeto JSON válido, sem nenhum texto ou explicação adicional fora dele. A estrutura deve ser exatamente:
{"optimized_prompts": [
    {
        "question_title": "...",
        "description": "...",
        "prompt": "..."
    }
]}`;

    const metaPrompt = metaPromptTemplate
      .replace('{sources_content}', sourcesContent || "Nenhuma fonte de arquivo fornecida.")
      .replace('{human_prompt}', humanPrompt);

    try {
      const result = await this.genAI.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: metaPrompt }] }],
        config: {
          safetySettings: this.safetySettings,
          responseMimeType: "application/json",
        },
      });

      // Limpa a resposta para extrair apenas o JSON, removendo blocos de código Markdown.
      let jsonString = result.text;
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonString);
      if (!parsed.optimized_prompts) throw new Error("A resposta da IA não contém 'optimized_prompts'.");
      return parsed.optimized_prompts;
    } catch (error) {
      throw this.handleError(error, 'generateOptimizedPrompts');
    }
  }
}

// --- EXPORTAÇÃO DA INSTÂNCIA SINGLETON ---
export const geminiService = GeminiService.getInstance();