/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 *
 * Descrição:
 * Este script lê arquivos Markdown de um diretório 'fontes', os combina
 * e os envia para a API do Gemini para extrair uma base de conhecimento (Knowledge Base)
 * estruturada em formato JSON. O resultado é salvo em um novo arquivo JSON.
 *
 * Como usar:
 * 1. Certifique-se de que o `ts-node` está instalado: `pnpm add -D ts-node`
 * 2. Crie um arquivo `.env` na raiz do projeto com sua `GEMINI_API_KEY`.
 * 3. Crie uma pasta `scripts/fontes` e adicione seus arquivos `.md` nela.
 * 4. Execute o script a partir da raiz do projeto: `ts-node scripts/generate-kb.ts`
 */

import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// --- 1. CONFIGURAÇÃO ---

// Carrega as variáveis de ambiente do ficheiro .env
dotenv.config();

// Escolha o modelo a ser testado
const modelToTest = 'gemini-2.5-flash-lite'; // Usando um modelo mais recente

// Carregue a API Key a partir de uma variável de ambiente para segurança.
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("ERRO: A variável de ambiente 'GEMINI_API_KEY' não foi definida.");
  console.error("Crie um ficheiro .env no diretório raiz e adicione a linha: GEMINI_API_KEY='SUA_CHAVE_AQUI'");
  process.exit(1);
}

// Configure o SDK do Gemini
const genAI = new GoogleGenAI({ apiKey: API_KEY });

// --- 2. PROMPT MESTRE DE INDEXAÇÃO (V4.2) ---
const PROMPT_TEMPLATE = `# TAREFA PRINCIPAL
Você é um sistema de extração de conhecimento. Sua tarefa é analisar os textos-fonte, identificar os **100 conceitos mais importantes e representativos** e gerar um objeto JSON estruturado com eles.
 
# REGRAS E TAREFA
- O JSON gerado deve conter **exatamente os 100 conceitos mais relevantes** encontrados nos textos.
- Todo o conteúdo de texto dentro do JSON (conceitos, pepitas, misconcepções) deve ser em **Português do Brasil**.
- O objetivo é criar um banco de "átomos de conhecimento" e "misconcepções" a partir de artigos científicos da área da saúde.
- Para cada um dos 100 conceitos selecionados, crie um objeto JSON que contenha:
1.  **conceptId:** Um identificador único para o conceito (e.g., "RAAS_in_CKD"). Use o formato \`TemaPrincipal_ConceitoEspecifico\`.
2.  **core_concept:** Uma **única frase** que sintetize a ideia central contida no array \`knowledgeNuggets\`.
3.  **knowledgeNuggets:** Um array de exatamente **quatro (4)** "pepitas de conhecimento": afirmações factuais, curtas e distintas extraídas do texto sobre aquele conceito.
4.  **potentialMisconceptions:** Um array de 3 a 5 "misconcepções potenciais": erros conceituais plausíveis relacionados com as pepitas de conhecimento.
5.  **bloomLevels:** Um array dos níveis da Taxonomia de Bloom que podem ser avaliados com base neste conceito.

# FORMATO DE SAÍDA
Responda **APENAS** com o objeto JSON, sem nenhum texto adicional. Siga estritamente a estrutura abaixo, incluindo o cabeçalho com \`version\`, \`lastUpdated\`, \`sourceDocuments\`, e o corpo principal \`knowledgeBase\`.

\`\`\`json
{
  "version": "1.0",
  "lastUpdated": "{TIMESTAMP}",
  "sourceDocuments": {SOURCE_DOCUMENTS_LIST},
  "knowledgeBase": [
    {
      "conceptId": "Exemplo_Tema_Conceito",
      "core_concept": "Exemplo de frase que sintetiza a ideia central.",
      "knowledgeNuggets": [
        "Exemplo de afirmação factual 1.",
        "Exemplo de afirmação factual 2.",
        "Exemplo de afirmação factual 3.",
        "Exemplo de afirmação factual 4."
      ],
      "potentialMisconceptions": [
        "Exemplo de erro conceitual plausível 1.",
        "Exemplo de erro conceitual plausível 2.",
        "Exemplo de erro conceitual plausível 3."
      ],
      "bloomLevels": ["Compreender", "Analisar"]
    }
  ]
}
\`\`\`

# TEXTOS-FONTE
"""
{SOURCE_TEXTS}
"""`;

async function main() {
  // --- 3. DEFINIÇÃO DE FICHEIROS E PASTAS ---
  const DT = new Date().toISOString().replace(/[:.]/g, '-');
  const currentPath = process.cwd(); // Diretório raiz do projeto
  const sourcesDirectoryPath = path.join(currentPath, 'scripts', 'fontes');
  const outputFilePath = path.join(currentPath, 'scripts', `resultado_kb_${modelToTest}_${DT}.json`);

  // --- 4. LEITURA DOS FICHEIROS DE ENTRADA ---
  console.log("Iniciando o processo...");
  console.log(`Lendo os ficheiros Markdown da pasta: ${sourcesDirectoryPath}`);

  let combinedSourcesText = "";
  let sourceDocumentNames: string[] = [];

  try {
    if (!fs.existsSync(sourcesDirectoryPath)) {
      throw new Error(`A pasta 'fontes' não foi encontrada em '${sourcesDirectoryPath}'. Crie a pasta e adicione seus arquivos .md.`);
    }

    const sourceFiles = fs.readdirSync(sourcesDirectoryPath).sort();
    if (sourceFiles.length === 0) {
      console.warn("AVISO: A pasta 'fontes' está vazia.");
    }

    for (const filename of sourceFiles) {
      if (filename.endsWith(".md")) {
        const filePath = path.join(sourcesDirectoryPath, filename);
        console.log(`  - Lendo ${filename}...`);
        sourceDocumentNames.push(filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        combinedSourcesText += `--- INÍCIO DO DOCUMENTO: ${filename} ---\n\n${content}\n\n--- FIM DO DOCUMENTO: ${filename} ---\n\n`;
      }
    }
  } catch (error) {
    console.error(`ERRO: ${(error as Error).message}`);
    process.exit(1);
  }

  // --- 5. PREPARAÇÃO E EXECUÇÃO DO PROMPT ---
  const timestampNow = new Date().toISOString();
  const sourceDocumentsListJson = JSON.stringify(sourceDocumentNames);

  const finalPrompt = PROMPT_TEMPLATE
    .replace('{TIMESTAMP}', timestampNow)
    .replace('{SOURCE_DOCUMENTS_LIST}', sourceDocumentsListJson)
    .replace('{SOURCE_TEXTS}', combinedSourcesText);

  console.log(`\nChamando o modelo: ${modelToTest}...`);
  console.log("Esta operação pode demorar alguns minutos devido ao grande volume de entrada...");

  try {
    const result = await genAI.models.generateContent({
      model: modelToTest,
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      // A configuração vai dentro de um objeto 'config'
      config: {
        responseMimeType: "application/json",
      },
    });
    const cleanedResponseText = result.text;

    // --- 6. GRAVAÇÃO DO RESULTADO ---
    console.log(`Modelo respondeu. Gravando o resultado em: ${outputFilePath}`);
    fs.writeFileSync(outputFilePath, cleanedResponseText, 'utf-8');
    console.log("\nProcesso concluído com sucesso!");
    console.log(`A Knowledge Base foi gravada em '${outputFilePath}'.`);

  } catch (error) {
    console.error("\nOcorreu um erro durante a chamada à API:", error);
  }
}

main();