/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import {GoogleGenAI} from "@google/genai";
import * as logger from "firebase-functions/logger";

// Define a chave da API a partir das variáveis de ambiente.
// O Firebase Functions carrega automaticamente as variáveis de .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI: GoogleGenAI;

if (GEMINI_API_KEY) {
  // A chave da API deve ser passada dentro de um objeto de configuração.
  genAI = new GoogleGenAI({apiKey: GEMINI_API_KEY});
} else {
  logger.warn("A variável de ambiente GEMINI_API_KEY não está definida.");
}

export const generateTitle = onCall(async (request) => {
  if (!genAI) {
    logger.error("Cliente Gemini não inicializado. Verifiq a GEMINI_API_KEY.");
    throw new HttpsError("internal",
      "O serviço de IA não está configurado corretamente.");
  }

  const firstMessage = request.data.text;
  if (!firstMessage || typeof firstMessage !== "string") {
    logger.error("A requisição não continha um texto válido.",
      {data: request.data});
    throw new HttpsError("invalid-argument",
      "O payload da requisição é inválido.");
  }

  const prompt = `Gere um título curto e descritivo (máximo 5 palavras) ` +
    `em Português do Brasil para uma conversa que começa com: ` +
    `"${firstMessage}". Responda apenas com o título.`;

  try {
    // CORREÇÃO: Chamando a API da forma correta, como em geminiService.ts
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [{role: "user", parts: [{text: prompt}]}],
    });

    // CORREÇÃO: Acessando o texto diretamente do resultado e
    // tratando o caso de ser indefinido.
    const responseText = result.text;
    if (!responseText) {
      logger.error("A resposta da API do Gemini não continha texto.", {result});
      throw new HttpsError("internal", "A resposta da IA estava vazia.");
    }

    const title = responseText.trim().replace(/["*]/g, "");
    return {title: title};
  } catch (error) {
    logger.error("Erro ao gerar título na Cloud Function:", error);
    throw new HttpsError("internal", "Falha ao comunicar com a API do Gemini.");
  }
});
