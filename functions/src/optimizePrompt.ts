/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */
/* eslint-disable max-len */
import {HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {getGenAIClient} from "./utils.js"; // NOSONAR
import {createAuthenticatedFunction} from "./functionWrapper.js"; // NOSONAR

// Tipos locais para clareza, espelhando o frontend.
type KnowledgeSource = {
  id: string;
  type: "url" | "file";
  value: string;
  name: string;
  content?: string;
  selected: boolean;
};

interface OptimizePromptData {
  humanPrompt: string;
  sources: KnowledgeSource[];
  modelName: string;
}

interface OptimizedPrompt {
  question_title: string;
  description: string;
  prompt: string;
}

const metaPromptTemplate = `# CONTEXTO E OBJETIVO
Você é um assistente de pesquisa especialista em engenharia de prompt. Sua função é analisar um prompt inicial de um usuário e, com base em um conjunto de documentos científicos, gerar múltiplas opções de prompts refinados para que o usuário possa escolher a abordagem que melhor atende à sua necessidade.

# FONTES DE DADOS
Considere estritamente os textos abaixo como sua única fonte de conhecimento:
{sources_content}

# PROMPT ORIGINAL DO USUÁRIO
Agora, analise o seguinte prompt do usuário:
{human_prompt}

# SUAS INSTRUÇÕES

1.  **Pense Passo a Passo:** Primeiro, analise o \`{human_prompt}\` e identifique as possíveis intenções, ambiguidades ou direções que ele pode tomar, sempre em relação ao conteúdo disponível em \`{sources_content}\`.

2.  **Identifique Aspectos Distintos:** Elabore até 5 "aspectos" ou interpretações diferentes para a solicitação do usuário, variando em foco analítico, intenção, formato, etc.

3.  **Crie Prompts Otimizados:** Para cada aspecto identificado, componha um "prompt otimizado" que seja auto-contido e inclua persona, instrução clara e formato de saída.

4.  **Crie um Título para a Pergunta (\`question_title\`):** Para cada aspecto, crie um título curto e direto (2 a 4 palavras) que resuma a natureza da resposta. Este título será usado como o texto de um botão na interface do chat, então ele deve ser claro e conciso. Pense nele como uma "etiqueta" para a opção. Bons exemplos: "Resumo Técnico", "Análise de Implicações", "Explicação Simplificada", "Comparativo de Modelos".

5.  **Escreva Descrições Focadas na Ação e no Benefício (\`description\`):** Para cada aspecto, crie uma descrição que siga as seguintes regras:
    * **Comece com Ação:** Inicie com um verbo de ação (Ex: "Receba", "Analise") ou descrevendo o resultado (Ex: "Um resumo técnico...").
    * **Oculte a Mecânica:** NUNCA use as palavras "prompt", "opção", "alternativa", ou "escolha".
    * **Foque no Benefício:** Em vez de nomear um público (Ex: "para especialistas"), descreva o interesse que a resposta satisfaz (Ex: "Ideal se você precisa dos detalhes técnicos...").

6.  **Tratamento de Exceção:** Se o \`{human_prompt}\` for vago ou desconectado do \`{sources_content}\`, gere apenas uma opção de prompt com um título e descrição apropriados que sugiram um resumo geral.

7.  **Formato de Saída:** Sua resposta final deve ser um objeto JSON válido, sem nenhum texto ou explicação adicional fora dele. A estrutura deve ser exatamente:
{"optimized_prompts": [
    {
        "question_title": "...",
        "description": "...",
        "prompt": "..."
    }
]}`;

export const optimizePrompt = createAuthenticatedFunction<OptimizePromptData, Promise<{optimized_prompts: OptimizedPrompt[]}>>(async (request) => {
  const {humanPrompt, sources, modelName} = request.data;
  // A validação de autenticação já foi feita pelo wrapper.
  if (!humanPrompt || !sources || !modelName) {
    logger.error("Payload inválido para optimizePrompt.", {data: request.data});
    throw new HttpsError("invalid-argument", "O payload da requisição é inválido.");
  }

  // 2. Lógica de Negócio (copiada e adaptada do frontend)
  const sourcesContent = sources
    .filter((s) => s.selected && s.content) // Garante que a fonte está selecionada e tem conteúdo
    .map((source) => {
      const sourceType = source.type === "file" ? "Arquivo" : "URL";
      return `Fonte (${sourceType}: ${source.name}):\n---\n${source.content}\n---\n\n`;
    }).join("");

  const metaPrompt = metaPromptTemplate
    .replace("{sources_content}", sourcesContent || "Nenhuma fonte fornecida.")
    .replace("{human_prompt}", humanPrompt);

  try {
    const genAI = getGenAIClient();
    // CORREÇÃO: Acessar o método generateContent através da propriedade 'models'.
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: [
        {role: "user", parts: [{text: metaPrompt}]},
      ],
      config: {responseMimeType: "application/json"},
    });

    const responseText = result.text;
    if (!responseText) {
      throw new Error("A resposta da API do Gemini não continha texto."
      );
    }

    // Log da resposta bruta da API para depuração.
    logger.info("Resposta bruta da API Gemini antes do parse:", {responseText});

    // Tenta analisar o JSON, tratando possíveis erros de formato na resposta.
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      logger.error("Erro ao analisar JSON da resposta do Gemini em optimizePrompt:", {responseText, parseError});
      throw new HttpsError("internal", "A resposta da IA não estava no formato JSON esperado.");
    }
  } catch (error) {
    logger.error("Erro ao executar optimizePrompt na Cloud Function:", error);
    throw new HttpsError("internal", "Falha ao comunicar com a API do Gemini para otimizar o prompt.");
  }
});
