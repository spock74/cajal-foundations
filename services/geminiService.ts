/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, GenerateContentResponse, Tool, HarmCategory, HarmBlockThreshold, Content, Part, Type } from "@google/genai";
import { UrlContextMetadataItem, KnowledgeSource } from '../types';

// IMPORTANT: The API key MUST be set as an environment variable `process.env.API_KEY`
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI;

// Model supporting URL context, consistent with user examples and documentation.
const MODEL_NAME = "gemini-2.5-flash"; 

const getAiInstance = (): GoogleGenAI => {
  if (!API_KEY) {
    console.error("API_KEY is not set in environment variables. Please set process.env.API_KEY.");
    throw new Error("Chave da API Gemini não configurada. Defina process.env.API_KEY.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
}

export const generateContentWithSources = async (
  prompt: string,
  sources: KnowledgeSource[]
): Promise<GeminiResponse> => {
  const currentAi = getAiInstance();
  
  const urls = sources.filter(s => s.type === 'url').map(s => (s as { value: string }).value);
  const files = sources.filter(s => s.type === 'file') as { mimeType: string; content: string }[];

  let textPrompt = prompt;
  if (urls.length > 0) {
    const urlList = urls.join('\n');
    textPrompt = `${prompt}\n\nURLs relevantes para contexto:\n${urlList}`;
  }

  const userParts: Part[] = [{ text: textPrompt }];
  for (const file of files) {
    userParts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.content,
      }
    });
  }

  const contents: Content[] = [{ role: "user", parts: userParts }];
  const tools: Tool[] = urls.length > 0 ? [{ urlContext: {} }] : [];

  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: { 
        tools: tools.length > 0 ? tools : undefined,
        safetySettings: safetySettings,
      },
    });

    const text = response.text;
    const candidate = response.candidates?.[0];
    let extractedUrlContextMetadata: UrlContextMetadataItem[] | undefined = undefined;

    if (candidate?.urlContextMetadata?.urlMetadata && Array.isArray(candidate.urlContextMetadata.urlMetadata)) {
      console.log("Raw candidate.urlContextMetadata.urlMetadata from API/SDK:", JSON.stringify(candidate.urlContextMetadata.urlMetadata, null, 2));
      // Manually map properties to ensure camelCase, as the API response might use snake_case.
      extractedUrlContextMetadata = candidate.urlContextMetadata.urlMetadata.map((meta: any) => ({
        retrievedUrl: meta.retrievedUrl || meta.retrieved_url,
        urlRetrievalStatus: meta.urlRetrievalStatus || meta.url_retrieval_status,
      }));
    } else if (candidate?.urlContextMetadata) {
      console.warn("candidate.urlContextMetadata is present, but 'urlMetadata' field is missing or empty:", JSON.stringify(candidate.urlContextMetadata, null, 2));
    }
    
    return { text, urlContextMetadata: extractedUrlContextMetadata };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      const googleError = error as any; 
      if (googleError.message && googleError.message.includes("API key not valid")) {
         throw new Error("Chave de API inválida. Verifique sua variável de ambiente API_KEY.");
      }
      if (googleError.message && googleError.message.includes("quota")) {
        throw new Error("Cota da API excedida. Verifique sua cota da API Gemini.");
      }
      if (googleError.type === 'GoogleGenAIError' && googleError.message) {
        throw new Error(`Erro da API Gemini: ${googleError.message}`);
      }
      throw new Error(`Falha ao obter resposta da IA: ${error.message}`);
    }
    throw new Error("Falha ao obter resposta da IA devido a um erro desconhecido.");
  }
};

export const getInitialSuggestions = async (urls: string[]): Promise<GeminiResponse> => {
  if (urls.length === 0) {
    return { text: JSON.stringify({ suggestions: ["Adicione algumas URLs para obter sugestões de tópicos."] }) };
  }
  const currentAi = getAiInstance();
  const urlList = urls.join('\n');
  
  const promptText = `Com base no conteúdo das seguintes URLs de documentação, forneça 3-4 perguntas concisas e práticas que um desenvolvedor poderia fazer para explorar estes documentos. Estas perguntas devem ser adequadas como sugestões de início rápido. Retorne APENAS um objeto JSON com uma chave "suggestions" contendo um array destas strings de perguntas. Por exemplo: {"suggestions": ["Quais são os limites de taxa?", "Como obtenho uma chave de API?", "Explique o modelo X."]}

URLs Relevantes:
${urlList}`;

  const contents: Content[] = [{ role: "user", parts: [{ text: promptText }] }];

  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        safetySettings: safetySettings,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    
    return { text };

  } catch (error) {
    console.error("Error calling Gemini API for initial suggestions:", error);
     if (error instanceof Error) {
      const googleError = error as any; 
      if (googleError.message && googleError.message.includes("API key not valid")) {
         throw new Error("Chave de API inválida para sugestões. Verifique sua variável de ambiente API_KEY.");
      }
      if (googleError.message && googleError.message.includes("Tool use with a response mime type: 'application/json' is unsupported")) {
        throw new Error("Erro de configuração: Não é possível usar ferramentas com o tipo de resposta JSON para sugestões. Isso deve ser corrigido no código.");
      }
      throw new Error(`Falha ao obter sugestões iniciais da IA: ${error.message}`);
    }
    throw new Error("Falha ao obter sugestões iniciais da IA devido a um erro desconhecido.");
  }
};


export const generateMindMapFromText = async (textToAnalyze: string): Promise<{ nodes: any[], edges: any[] }> => {
  const currentAi = getAiInstance();
  const prompt = `Analise o texto a seguir e extraia os conceitos-chave e suas relações como um mapa mental. Retorne APENAS um objeto JSON com duas chaves: "nodes" e "edges".
- O array "nodes" deve conter objetos com "id" (uma string única, simples e em minúsculas) e "label" (um título conciso e legível para o conceito).
- O array "edges" deve conter objetos com "id" (ex: "e1-2"), "source" (o ID do nó de origem) e "target" (o ID do nó de destino).
- Garanta que todos os IDs de "source" e "target" no array de arestas correspondam a um ID na lista de nós. O grafo deve ser uma árvore ou um grafo acíclico direcionado (DAG).

Texto para analisar:
\`\`\`
${textToAnalyze}
\`\`\``;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      nodes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            label: { type: Type.STRING },
          },
          required: ['id', 'label'],
        },
      },
      edges: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            source: { type: Type.STRING },
            target: { type: Type.STRING },
          },
          required: ['id', 'source', 'target'],
        },
      },
    },
    required: ['nodes', 'edges'],
  };

  try {
    const response = await currentAi.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        safetySettings: safetySettings,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    return {
      nodes: parsed.nodes || [],
      edges: parsed.edges || [],
    };
  } catch (error) {
    console.error("Error calling Gemini API for mind map generation:", error);
    if (error instanceof Error) {
       throw new Error(`Falha ao gerar mapa mental da IA: ${error.message}`);
    }
    throw new Error("Falha ao gerar mapa mental da IA devido a um erro desconhecido.");
  }
};