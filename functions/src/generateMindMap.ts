/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import {HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getGenAIClient} from "./utils.js";
import {createAuthenticatedFunction} from "./functionWrapper.js";
import {z} from "zod";

interface GenerateMindMapData {
  textToAnalyze: string;
  modelName: string;
}

interface MindMapResponse {
  title: string;
  nodes: {id: string; label: string; type: string}[];
  edges: {id: string; source: string; target: string}[];
}

// Schema de validação com Zod para garantir a integridade da resposta da IA
const MindMapResponseSchema = z.object({
  title: z.string().min(1),
  nodes: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    type: z.string().min(1),
  })).min(1),
  edges: z.array(z.object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
  })),
});

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
  // Validação explícita do payload de entrada para maior robustez
  if (!textToAnalyze || !modelName) {
    throw new HttpsError("invalid-argument", "O payload da requisição é inválido. 'textToAnalyze' e 'modelName' são obrigatórios.");
  }

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

    const parsedJson = JSON.parse(responseText);
    // Valida o JSON recebido contra o schema do Zod
    const validationResult = MindMapResponseSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      logger.error("JSON do mapa mental inválido ou incompleto.", {error: validationResult.error});
      throw new Error("A resposta da IA não corresponde ao schema esperado.");
    }
    return validationResult.data;
  } catch (error) {
    logger.error("Erro ao executar generateMindMap:", error);
    throw new HttpsError("internal", "Falha ao gerar o mapa mental.");
  }
});