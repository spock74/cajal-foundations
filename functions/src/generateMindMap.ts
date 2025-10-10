/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import {HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getGenAIClient} from "./utils.js";
import {createAuthenticatedFunction} from "./functionWrapper.js";
import {z} from "zod";

type KnowledgeSource = {
  id: string;
  type: "url" | "file";
  value: string;
  name: string;
  content?: string;
  selected: boolean;
};

interface GenerateMindMapData {
  textToAnalyze: string;
  modelName: string;
  sources: KnowledgeSource[];
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
  # TAREFA
  Sua tarefa é criar um mapa mental em formato JSON a partir de um texto principal, usando os documentos-fonte como contexto adicional para enriquecer os conceitos.

  # CONTEXTO
  ## Documentos-Fonte
  {sources_content}

  ## Texto Principal para Análise
  {textToAnalyze}

  # INSTRUÇÕES
  1. Analise o "Texto Principal para Análise" e identifique os conceitos chave.
  2. Use os "Documentos-Fonte" para adicionar profundidade, contexto e relações entre os conceitos identificados.
  3. Gere um objeto JSON contendo "title", "nodes" e "edges".
  4. O "title" deve ser um título curto e descritivo para o mapa mental (máximo 7 palavras).
  5. "nodes" deve ser um array de objetos com "id", "label" e "type" (ex: 'main', 'subtopic').
  6. "edges" deve ser um array de objetos conectando os nós, com "id", "source" e "target".
  7. Responda APENAS com o objeto JSON.
`;

export const generateMindMap = createAuthenticatedFunction<GenerateMindMapData, Promise<MindMapResponse>>(async (request) => {
  const {textToAnalyze, modelName, sources} = request.data;
  // Validação explícita do payload de entrada para maior robustez
  if (!textToAnalyze || !modelName || !sources) {
    throw new HttpsError("invalid-argument", "O payload da requisição é inválido. 'textToAnalyze', 'modelName' e 'sources' são obrigatórios.");
  }

  const sourcesContent = sources
    .filter((s) => s.selected && s.content)
    .map((source) => `Fonte (${source.type}: ${source.name}):\n---\n${source.content}\n---\n\n`)
    .join("");

  const prompt = structuredPrompt
    .replace("{textToAnalyze}", textToAnalyze)
    .replace("{sources_content}", sourcesContent || "Nenhum documento-fonte fornecido.");

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