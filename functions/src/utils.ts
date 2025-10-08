/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import {GoogleGenAI} from "@google/genai";
import * as logger from "firebase-functions/logger";

/**
 * Retorna uma instância do cliente GenAI, inicializada com a chave da API
 * a partir das variáveis de ambiente. Lança um erro se a chave não estiver
 * configurada.
 * @return {GoogleGenAI} Uma instância do cliente GoogleGenAI.
 */
export const getGenAIClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.error("A variável de ambiente GEMINI_API_KEY não está definida. " +
      "A função não pode operar.");
    throw new Error("Configuração de servidor incompleta: " +
      "GEMINI_API_KEY ausente.");
  }

  return new GoogleGenAI({apiKey});
};