# Plano de Migração Atômica: IA para o Backend (Cloud Functions)

Este documento descreve o plano passo a passo para migrar a lógica de IA do frontend para o backend, aumentando a segurança, o controle e a performance.

**Status Atual:**
- **Backend:** `generateTitle`
- **Frontend:** `generateOptimizedPrompts`, `generateContentWithSources`, `getInitialSuggestions`, `generateMindMapFromText`.

---

## Fase 1: Migrar `generateOptimizedPrompts`

Esta é a migração de maior prioridade, pois envolve a lógica mais complexa e o "meta-prompt" principal do sistema.

### Passos Atômicos:

1.  **[Backend] Criar a Cloud Function `optimizePrompt`:**
    *   Criar um novo arquivo em `functions/src/prompts.ts`.
    *   Definir uma nova função `onCall` chamada `optimizePrompt`.
    *   Copiar a lógica e o template do "meta-prompt" do método `generateOptimizedPrompts` em `geminiService.ts` para dentro da nova Cloud Function.
    *   A função deve receber `humanPrompt` e `sources` como argumentos via `request.data`.
    *   Implementar a chamada à API do Gemini a partir do servidor, usando o SDK do Node.js (`@google/genai`).
    *   Adicionar validação de entrada e tratamento de erros robustos.

2.  **[Deploy] Publicar a nova função:**
    *   Executar `firebase deploy --only functions` para tornar a função `optimizePrompt` disponível.

3.  **[Frontend] Refatorar `geminiService.ts`:**
    *   Modificar o método `generateOptimizedPrompts`.
    *   Remover toda a lógica de construção do meta-prompt e a chamada direta à API do Gemini.
    *   Substituir pela chamada à Cloud Function `optimizePrompt` usando o SDK do Firebase (`https/callable`).
    *   Garantir que os dados (prompt e fontes) sejam passados corretamente e que a resposta seja tratada da mesma forma que antes.

4.  **[Teste] Validação E2E (End-to-End):**
    *   Executar a aplicação e testar o fluxo de otimização de prompt.
    *   Verificar nos logs do Firebase se a Cloud Function `optimizePrompt` foi executada com sucesso.
    *   Confirmar que a UI exibe as opções de prompt otimizadas como antes.

5.  **[Merge] Finalizar a Fase 1:**
    *   Criar um Pull Request do branch da feature para o `main`.
    *   Revisar as alterações (backend e frontend).
    *   Fazer o merge e apagar o branch da feature.