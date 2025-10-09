# Plano de Refatoração da Aplicação

Este documento descreve um plano para refatorar componentes-chave da aplicação com o objetivo de melhorar a organização, a manutenibilidade e a clareza do código. As mudanças propostas não alteram a funcionalidade existente.

## Visão Geral

O projeto já possui uma boa estrutura, com uma clara separação entre o estado global (Zustand), os componentes de UI e os serviços. As sugestões abaixo visam refinar essa estrutura, dividindo componentes que cresceram e se tornaram complexos em partes menores e mais focadas.

---

### 1. Refatorar `ConversationManager.tsx`

**Problema Atual:** Este componente gerencia a lógica de Tópicos (Grupos), Conversas e a Base de Conhecimento, acumulando muitas responsabilidades.

**Plano:**

1.  **Criar `GroupManager.tsx`:**
    *   **Responsabilidade:** Gerenciar a seleção, criação, edição e exclusão de "Tópicos de Pesquisa" (Grupos).
    *   **Código a ser movido:** A lógica de `isCreatingGroup`, `editingGroupId`, o `Select` de grupos e os modais de confirmação relacionados a grupos.
    *   **Props:** Receberá `groups`, `activeGroupId` e as funções `onSetGroupId`, `onAddGroup`, etc.

2.  **Criar `ConversationList.tsx`:**
    *   **Responsabilidade:** Listar as conversas do tópico ativo e gerenciar a exclusão de conversas individuais.
    *   **Código a ser movido:** O `<ul>` que itera sobre `conversations` e o botão de exclusão de cada item.
    *   **Props:** Receberá `conversations`, `activeConversationId`, `onSetConversationId` e `onDeleteConversation`.

3.  **Atualizar `ConversationManager.tsx`:**
    *   O componente `ConversationManager` se tornará um orquestrador, importando e renderizando `GroupManager`, `ConversationList` e `KnowledgeBaseManager`.
    *   Ele continuará a gerenciar a lógica de "Nova Conversa" e "Limpar Tudo", que afetam múltiplos subcomponentes.

---

### 2. Refatorar `ChatInterface.tsx`

**Problema Atual:** O componente gerencia o cabeçalho, a lista de mensagens e o campo de input. O campo de input e seus botões associados têm lógica suficiente para se tornarem um componente próprio.

**Plano:**

1.  **Criar `ChatInput.tsx`:**
    *   **Responsabilidade:** Gerenciar o `textarea`, o estado `userQuery` e a lógica dos botões "Enviar" e "Otimizar".
    *   **Código a ser movido:** O `div` final que contém o `textarea` e os botões, junto com os handlers `handleSend` e `handleOptimize`.
    *   **Props:** Receberá `isLoading`, `isInputDisabled`, `onSendMessage`, `onOptimizePrompt`, etc.

2.  **Atualizar `ChatInterface.tsx`:**
    *   Importará e renderizará o novo componente `ChatInput`.
    *   A lógica de `userQuery` será movida para dentro de `ChatInput`, simplificando o estado de `ChatInterface`.

---

### 3. Refatorar `MessageItem.tsx`

**Problema Atual:** Este componente é complexo, pois renderiza diferentes tipos de conteúdo (texto, markdown, sugestões de prompt, mapa mental) e ações (copiar, salvar, etc.).

**Plano:**

1.  **Criar `MessageActions.tsx`:**
    *   **Responsabilidade:** Renderizar a barra de ações que aparece abaixo de uma mensagem do modelo (Copiar, Mapa Mental, Salvar na Biblioteca).
    *   **Código a ser movido:** O `div` que contém os botões de ação e a lógica de `handleCopy`.
    *   **Props:** Receberá `message`, `firestoreDocId`, `onCopy`, `onToggleMindMap`, `onSaveToLibrary`.

2.  **Criar `OptimizedPrompts.tsx`:**
    *   **Responsabilidade:** Renderizar a lista de sugestões de prompts otimizados.
    *   **Código a ser movido:** O `div` que mapeia `message.optimizedPrompts` e renderiza os botões de sugestão.
    *   **Props:** Receberá `prompts`, `sourceIds`, `onSendMessage`.

3.  **Atualizar `MessageItem.tsx`:**
    *   O `renderMessageContent` será simplificado, delegando a renderização das sugestões para `OptimizedPrompts`.
    *   O JSX principal renderizará `MessageActions` condicionalmente, limpando a estrutura do componente.

---

## To-Do List (Plano de Ação)

- [ ] **Etapa 1: `ConversationManager`**
  - [ ] Criar o arquivo `src/components/GroupManager.tsx`.
  - [ ] Mover a lógica de gerenciamento de grupos de `ConversationManager.tsx` para `GroupManager.tsx`.
  - [ ] Criar o arquivo `src/components/ConversationList.tsx`.
  - [ ] Mover a lista de conversas de `ConversationManager.tsx` para `ConversationList.tsx`.
  - [ ] Atualizar `ConversationManager.tsx` para importar e usar `GroupManager` e `ConversationList`.
- [ ] **Etapa 2: `ChatInterface`**
  - [ ] Criar o arquivo `src/components/ChatInput.tsx`.
  - [ ] Mover a área de input e os botões de `ChatInterface.tsx` para `ChatInput.tsx`.
  - [ ] Atualizar `ChatInterface.tsx` para usar o novo componente `ChatInput`.
- [ ] **Etapa 3: `MessageItem`**
  - [ ] Criar o arquivo `src/components/MessageActions.tsx`.
  - [ ] Mover a barra de ações da mensagem de `MessageItem.tsx` para `MessageActions.tsx`.
  - [ ] Criar o arquivo `src/components/OptimizedPrompts.tsx`.
  - [ ] Mover a renderização das sugestões de prompt de `MessageItem.tsx` para `OptimizedPrompts.tsx`.
  - [ ] Atualizar `MessageItem.tsx` para usar os novos componentes `MessageActions` e `OptimizedPrompts`.