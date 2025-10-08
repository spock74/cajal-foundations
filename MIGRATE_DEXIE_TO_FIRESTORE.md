# Plano de Migração: Dexie.js para Firestore Offline

Este documento descreve o plano de ação para substituir completamente o `Dexie.js` pela funcionalidade de persistência offline nativa do Firestore. O objetivo é simplificar a arquitetura, remover a complexidade da sincronização manual e unificar o acesso aos dados em uma única fonte de verdade.

## Fase 0: Habilitar a Persistência Offline

O primeiro passo é "ligar" o cache offline do Firestore. Isso fará com que o SDK do Firebase gerencie automaticamente um cache local usando IndexedDB.

- [x] **Habilitar a persistência offline:** Modificar `src/firebaseConfig.ts` para chamar a função `enableIndexedDbPersistence(firestore)`. Isso instrui o Firestore a armazenar dados localmente para acesso offline e sincronização automática.

## Fase 1: Remover a Camada do Dexie.js

Esta fase consiste em remover completamente o Dexie do projeto. Isso irá, intencionalmente, quebrar a compilação, nos mostrando exatamente quais partes do código precisam ser refatoradas.

- [x] **Desinstalar dependências:** Executar `pnpm remove dexie dexie-react-hooks` para remover os pacotes do projeto.
- [x] **Excluir o serviço do DB:** Apagar o arquivo `src/services/dbService.ts`.

## Fase 2: Refatorar a Lógica de Dados no `AppContext`

O `AppContext` atualmente orquestra a lógica de negócios, interagindo tanto com o Dexie quanto com o Firestore. O objetivo desta fase é fazer com que ele interaja **apenas** com o Firestore, confiando no cache offline para operações locais.

Para cada entidade de dados, vamos refatorar os handlers para usar exclusivamente o Firestore.

- [x] **Refatorar `Knowledge Groups`:**
  - A lógica para `Knowledge Groups` já estava utilizando o Firestore. Nenhuma ação necessária.

- [x] **Refatorar `Conversations`:**
  - A maior parte da lógica já usava Firestore (criação, exclusão, listeners).
  - Removida a chamada residual ao `db.clearAllData()` em `handleClearAllConversations`.

- [x] **Refatorar `Chat Messages`:**
  - Removida a importação de `dbService`.
  - `handleSendMessage` e `handleOptimizePrompt` já usavam Firestore.
  - `useEffect` para `chatMessages` já usava `onSnapshot`.
  - Atualizada a lógica de `mindMap` em `handleDeleteLibraryItem`, `handleGenerateMindMap`, `handleMindMapLayoutChange` para usar `updateDoc` do Firestore.
  - Atualizada a lógica de `generateUsageReport` para usar `collectionGroup` do Firestore para buscar todas as mensagens.
  - Adicionado `useEffect` para `libraryItems` para ouvir do Firestore.

- [x] **Refatorar `Knowledge Sources` (Fontes):**
  - Movida a lógica de armazenamento de `sources` de um array no documento do grupo para uma subcoleção `sources` dedicada.
  - Adicionado `useEffect` para carregar as fontes da subcoleção em tempo real.
  - Atualizadas as funções `handleFileAdd`, `handleUrlAdd`, e `handleRemoveSource` para usar `addDoc` e `deleteDoc` na nova subcoleção.

- [x] **Refatorar `Library` (Itens Salvos):**
  - A lógica para `handleSaveToLibrary` e `handleDeleteLibraryItem` já interagia com a coleção `libraryItems` no Firestore.
  - Corrigido um bug em `handleDeleteLibraryItem` onde o tipo do `id` estava incorreto (`number` em vez de `string`) e uma variável estava indefinida.

## Fase 3: Unificar a Leitura de Dados

- [x] **Remover `useLiveQuery`:** Uma busca no código confirmou que não há mais instâncias do hook `useLiveQuery`. A refatoração para `onSnapshot` na Fase 2 removeu todas as suas utilizações.

## Fase 4: Limpeza e Verificação

- [x] **Remover importações residuais:** Removida a importação de `StoredSource` em `AppContext.tsx` e a dependência `dexie` do `package.json`.
- [ ] **Teste de funcionalidade:** Validar que toda a aplicação funciona como esperado, tanto online quanto offline (usando as ferramentas de desenvolvedor do navegador para simular a perda de conexão).