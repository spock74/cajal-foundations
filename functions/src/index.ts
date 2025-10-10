/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getGenAIClient} from "./utils.js"; // NOSONAR
import {createAuthenticatedFunction} from "./functionWrapper.js"; // NOSONAR
import {optimizePrompt} from "./optimizePrompt.js"; // NOSONAR
import {generateContent} from "./generateContent.js"; // NOSONAR
import {getInitialSuggestions} from "./getInitialSuggestions.js"; // NOSONAR
import {deleteMessageCascade} from "./deleteMessageCascade.js"; // NOSONAR
import {generateMindMap} from "./generateMindMap.js"; // NOSONAR

setGlobalOptions({maxInstances: 10});

const generateTitle = createAuthenticatedFunction<{text: string}, Promise<{title: string}>>(async (request) => {
  const firstMessage = request.data.text;
  if (!firstMessage || typeof firstMessage !== "string") {
    logger.error("A requisição não continha um texto válido.", {
      data: request.data, // NOSONAR
    });
    throw new HttpsError("invalid-argument", "O payload da requisição é inválido.");
  }

  const prompt = "Gere um título curto e descritivo (máximo 5 palavras) para uma" + 
      "conversa que começa com: ${firstMessage}. Responda apenas com o título.";

  try {
    const genAI = getGenAIClient();
    // CORREÇÃO: Acessar o método generateContent através da propriedade 'models'.
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite", // Usando um modelo rápido e eficiente para títulos.
      contents: [{role: "user", parts: [{text: prompt}]}],
    });
    const responseText = result.text;
    if (!responseText) {
      logger.error("A resposta da API do Gemini não continha texto.", {
        result,
      });
      throw new HttpsError("internal", "A resposta da IA estava vazia.");
    }
    const title = responseText.trim().replace(/["*]/g, "");
    return {title: title};
  } catch (error) {
    logger.error("Erro ao gerar título na Cloud Function:", error);
    throw new HttpsError("internal", "Falha ao comunicar com a API do Gemini.");
  }
});

export {
  generateTitle,
  optimizePrompt,
  generateContent,
  getInitialSuggestions,
  generateMindMap,
  deleteMessageCascade,
};
