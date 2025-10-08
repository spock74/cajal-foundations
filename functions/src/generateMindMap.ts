/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import {HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getGenAIClient} from "./utils.js";
import {createAuthenticatedFunction} from "./functionWrapper.js";

interface GenerateMindMapData {
  textToAnalyze: string;
  modelName: string;
}

interface MindMapResponse {
  title: string;
  nodes: {id: string; label: string; type: string}[];
  edges: {id: string; source: string; target: string}[];
}

const structuredPrompt = `
  Analise o texto a seguir e estruture as informações como um mapa mental.
  Sua resposta DEVE ser um objeto JSON contendo três chaves: "title", "nodes" e "edges".
  - "title": Uma string com um título curto e descritivo para o mapa mental
    (máximo 7 palavras).
  - "nodes": Um array de objetos, onde cada objeto tem "id" (string), "label" (string),
    e "type" (string, ex: 'main', 'subtopic').
  - "edges": Um array de objetos, onde cada objeto tem "id" (string), "source" (o 'id' de um nó),
    e "target" (o 'id' de outro nó).
  Texto para análise:
  ---
  {textToAnalyze}
  ---
`;

export const generateMindMap = createAuthenticatedFunction<GenerateMindMapData, Promise<MindMapResponse>>(async (request) => {
  const {textToAnalyze, modelName} = request.data;
  // A validação de payload permanece aqui, pois é específica da função.
  const prompt = structuredPrompt.replace("{textToAnalyze}", textToAnalyze);

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

    const parsed = JSON.parse(responseText);
    if (!parsed.title || !parsed.nodes || !parsed.edges) {
      throw new Error("JSON do mapa mental inválido ou incompleto.");
    }
    return parsed;
  } catch (error) {
    logger.error("Erro ao executar generateMindMap:", error);
    throw new HttpsError("internal", "Falha ao gerar o mapa mental.");
  }
});