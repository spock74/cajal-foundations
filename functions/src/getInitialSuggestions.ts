/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import {HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getGenAIClient} from "./utils.js"; // NOSONAR
import {createAuthenticatedFunction} from "./functionWrapper.js"; // NOSONAR

type KnowledgeSource = {
  type: "url" | "file";
  value: string;
};

interface InitialSuggestionsData {
  sources: KnowledgeSource[];
  modelName: string;
}

export const getInitialSuggestions = createAuthenticatedFunction<InitialSuggestionsData, Promise<{suggestions: string[]}>>(async (request) => {
  const {sources, modelName} = request.data;
  const urls = sources.filter((s) => s.type === "url").map((s) => s.value);
  if (urls.length === 0) return {suggestions: []};

  const prompt = `Com base no conteúdo das URLs: ${urls.join("\n")}, ` +
    "gere 3 perguntas. Retorne APENAS um array de strings JSON.";
  
  try {
    const genAI = getGenAIClient();
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [{role: "user", parts: [{text: prompt}]}],
      config: {responseMimeType: "application/json"},
    });

    const responseText = result.text;
    if (!responseText) {
      throw new Error("A resposta da API do Gemini estava vazia.");
    }

    const suggestions = JSON.parse(responseText);
    return {suggestions};
  } catch (error) {
    logger.error("Erro ao executar getInitialSuggestions:", error);
    // Lança um erro padronizado para que o cliente possa tratar a falha.
    throw new HttpsError("internal", "Falha ao gerar sugestões iniciais.");
  }
});