/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import {HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getGenAIClient} from "./utils.js";
import {Content, UrlMetadata} from "@google/genai";
import {createAuthenticatedFunction} from "./functionWrapper.js";

type KnowledgeSource = {
  id: string;
  type: "url" | "file";
  value: string;
  name: string;
  content?: string;
  selected: boolean;
};

type ChatMessage = {
  sender: "user" | "model";
  text: string;
  sourceIds?: string[];
}

interface GenerateContentData {
  prompt: string;
  sources: KnowledgeSource[];
  modelName: string;
  history: ChatMessage[];
}

interface UrlContextMetadataItem {
  retrievedUrl: string;
  urlRetrievalStatus: string;
}

interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}
interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
  usageMetadata?: UsageMetadata;
  modelName: string;
}

export const generateContent = createAuthenticatedFunction<GenerateContentData, Promise<GeminiResponse>>(async (request) => {
  const {prompt, sources, modelName, history} = request.data;
  if (!prompt || !sources || !modelName) {
    throw new HttpsError("invalid-argument", "O payload da requisição é inválido.");
  }

  // Constrói o histórico para a API do Gemini
  const geminiHistory: Content[] = history.map((msg: ChatMessage) => ({
    role: msg.sender,
    parts: [{text: msg.text}],
  }));
  if (geminiHistory.length > 10) { // Limita o histórico para evitar prompts muito longos
    geminiHistory.splice(0, geminiHistory.length - 10);
  }

  const contextText = sources
    .filter((s) => s.type === "file" && !!s.content)
    .map((source) => `Fonte (Arquivo: ${source.name}):\n---\n${source.content}\n---\n\n`)
    .join("");

  let contextPreamble = "Com base estritamente no contexto das fontes fornecidas abaixo, e em nenhuma outra informação, responda à seguinte pergunta.";
  if (sources.length === 0) {
    contextPreamble = "Você não recebeu nenhuma fonte de conhecimento. " + 
    "Informe ao usuário que, sem um contexto, você não pode fornecer uma resposta baseada em documentos e que ele deve selecionar as fontes relevantes.";
  }

  const fullPrompt = `${contextPreamble}\n\nPergunta do usuário: "${prompt}"\n\n--- CONTEXTO ---\n${contextText || "Nenhum contexto fornecido."}`;

  try {
    const genAI = getGenAIClient();
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [...geminiHistory, {role: "user", parts: [{text: fullPrompt}]}],
    });

    const responseText = result.text;
    if (!responseText) {
      throw new Error("A resposta da API do Gemini estava vazia.");
    }

    // Mapeia a resposta da API para a nossa interface GeminiResponse.
    const urlMetadata = result.candidates?.[0]?.urlContextMetadata?.urlMetadata;
    const mappedUrlContext = urlMetadata
      ?.map((meta: UrlMetadata) => ({
        retrievedUrl: meta.retrievedUrl,
        urlRetrievalStatus: meta.urlRetrievalStatus,
      }))
      .filter(
        (meta): meta is UrlContextMetadataItem =>
          typeof meta.retrievedUrl === "string" && typeof meta.urlRetrievalStatus === "string"
      );

    const usageMetadata = result.usageMetadata ? {
      promptTokenCount: result.usageMetadata.promptTokenCount ?? 0,
      candidatesTokenCount: result.usageMetadata.candidatesTokenCount ?? 0,
      totalTokenCount: result.usageMetadata.totalTokenCount ?? 0,
    } : undefined;

    return {
      text: responseText,
      urlContextMetadata: mappedUrlContext,
      usageMetadata: usageMetadata,
      modelName: modelName,
    };
  } catch (error) {
    logger.error("Erro ao executar generateContent na Cloud Function:", error);
    throw new HttpsError("internal", "Falha ao comunicar com a API do Gemini.");
  }
});
