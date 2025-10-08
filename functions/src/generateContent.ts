/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import {HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getGenAIClient} from "./utils.js";
import {Content, Tool} from "@google/genai";
import {createAuthenticatedFunction} from "./functionWrapper.js";

type KnowledgeSource = {
  id: string;
  type: "url" | "file";
  value: string;
  name: string;
  content?: string;
  selected: boolean;
};

interface GenerateContentData {
  prompt: string;
  sources: KnowledgeSource[];
  modelName: string;
}

export const generateContent = createAuthenticatedFunction<GenerateContentData, Promise<any>>(async (request) => {
  const {prompt, sources, modelName} = request.data;
  if (!prompt || !sources || !modelName) {
    throw new HttpsError("invalid-argument", "O payload da requisição é inválido.");
  }

  const urls = sources.filter((s) => s.type === "url").map((s) => s.value);
  const contextText = sources
    .filter((s) => s.type === "file" && !!s.content)
    .map((source) => `Fonte (Arquivo: ${source.name}):\n---\n${source.content}\n---\n\n`)
    .join("");

  const fullPrompt = `Com base no contexto das fontes fornecidas abaixo, ` +
    `responda: "${prompt}"\n\n--- CONTEXTO ---\n${contextText}`;
  const contents: Content[] = [{role: "user", parts: [{text: fullPrompt}]}];
  const tools: Tool[] = urls.length > 0 ? [{googleSearch: {}}] : [];

  try {
    const genAI = getGenAIClient();
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: contents,
      // CORREÇÃO: A propriedade 'tools' deve estar dentro de um objeto 'config'.
      // Embora a documentação mais recente mostre 'tools' no nível superior,
      // a versão do SDK ou as definições de tipo em uso exigem esta estrutura.
      config: {
        tools: tools,
      },
    });

    const responseText = result.text;
    if (!responseText) {
      throw new Error("A resposta da API do Gemini estava vazia.");
    }

    return {
      text: responseText,
      urlContextMetadata: result.candidates?.[0]?.urlContextMetadata?.urlMetadata,
      usageMetadata: result.usageMetadata,
      modelName: modelName,
    };
  } catch (error) {
    logger.error("Erro ao executar generateContent na Cloud Function:", error);
    throw new HttpsError("internal", "Falha ao comunicar com a API do Gemini.");
  }
});