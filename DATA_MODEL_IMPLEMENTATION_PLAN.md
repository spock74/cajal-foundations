# Plano de Implementação do Modelo de Dados Abstraído (Revisado)

Este documento descreve o plano estratégico para implementar o novo modelo de dados "achatado" (flattened) do Firestore. Ele incorpora refinamentos arquitetônicos para garantir escalabilidade, manutenibilidade e performance.

O objetivo é criar uma arquitetura onde a UI não "saiba" que está falando com o Firestore, tornando a aplicação mais testável e flexível.

---

## O Princípio: Separação de Camadas

A implementação seguirá uma arquitetura de camadas distintas dentro do frontend:

1.  **Camada de Acesso a Dados (Data Access Layer - DAL):** Um conjunto de "serviços" responsáveis exclusivamente por se comunicar com o backend (Firestore).
2.  **Camada de Lógica de Negócios (Business Logic Layer - BLL):** "Stores" de estado (usando **Zustand**) que orquestram as ações, gerenciam o estado de domínios específicos e consomem os serviços da DAL.
3.  **Camada de Apresentação (Presentation Layer):** Os componentes React, que são "burros" e apenas exibem o estado e invocam ações fornecidas pela BLL.

O arquivo `src/types.ts` atuará como o **contrato** que garante a consistência dos dados entre todas as camadas.

```
+----------------------+       +----------------------+       +--------------------------+
|                      |       |                      |       |                          |
|  Componentes React   |------>|      AppContext      |------>|   Serviços de Dados      |
| (Presentation Layer) |       | (Business Logic Layer) |       | (Data Access Layer)      |
|                      |<------|                      |<------|                          |
----------------------+       +----------------------+       +--------------------------+
                                                                         |
                                                                         |
                                                                         v
                                                                +------------------+
                                                                |     Firestore    |
                                                                +------------------+
```

---

## Fases da Implementação

### Fase 1: Construir a Camada de Acesso a Dados (DAL)

Nesta fase, criaremos um conjunto de serviços TypeScript cuja única responsabilidade é encapsular todas as chamadas ao Firestore.

*   **Ação:** Criar novos arquivos de serviço, como `teacherService.ts`, `assessmentService.ts` e `studentService.ts` dentro de `src/services/`.
*   **Responsabilidades:**
    *   `teacherService.ts`: Conterá funções como `getTurmas(userId)`, `createTurma(data)`, `getGruposDeConhecimento(userId)`, etc. Essas funções conterão as chamadas `collection()`, `addDoc()`, `onSnapshot()`.
    *   `assessmentService.ts`: Conterá funções para CRUD de `avaliacoes` e seus `itens`.
    *   `studentService.ts`: Conterá funções para criar `submissoes` e `respostas`.
*   **Resultado:** Nenhum outro arquivo na aplicação, exceto os desta camada, importará `firebase/firestore`.

### Fase 2: Refatorar a Camada de Lógica de Negócios (`AppContext`)

O `AppContext` será modificado para parar de falar diretamente com o Firestore e, em vez disso, usar a DAL que criamos.

*   **Ação:** Editar o `AppContext.tsx`.
*   **Responsabilidades:**
    *   Remover todas as importações e chamadas diretas ao `firebase/firestore`.
    *   Importar e utilizar os novos serviços (ex: `teacherService`).
    *   Os `useEffect` que hoje contêm `onSnapshot` serão simplificados. Eles chamarão uma função do serviço (ex: `teacherService.listenForTurmas(userId, (turmas) => setTurmas(turmas))`) que retornará uma função `unsubscribe`.
    *   As funções de manipulação (ex: `handleAddGroup`) chamarão os métodos correspondentes do serviço (ex: `teacherService.createGrupo(data)`).
*   **Resultado:** O `AppContext` se torna um orquestrador puro, gerenciando o estado da aplicação sem se preocupar com os detalhes da persistência dos dados.

### Fase 3: Garantir a Pureza da Camada de Apresentação (UI)

Esta fase é uma verificação para garantir que nossos componentes React permaneçam "burros" e desacoplados.

*   **Ação:** Revisar os componentes existentes.
*   **Responsabilidades:**
    *   Confirmar que nenhum componente importa ou chama diretamente um serviço da DAL.
    *   Toda a interação com os dados deve ocorrer através do hook `useAppContext()`.
    *   Os componentes recebem dados do estado do contexto (ex: `const { turmas } = useAppContext()`) e disparam ações do contexto (ex: `onClick={() => handleCreateTurma(data)}`).
*   **Resultado:** Componentes de UI altamente reutilizáveis, fáceis de testar e que não quebram se a lógica de backend ou de estado for alterada.

### Fase 4: Formalizar o Contrato (`types.ts`)

O arquivo `src/types.ts` é a cola que une tudo. Ele garante que todas as camadas falem a mesma "língua".

*   **Ação:** Atualizar o arquivo `src/types.ts`.
*   **Responsabilidades:**
    *   Definir e exportar as interfaces TypeScript para todas as entidades do novo modelo de dados (`Turma`, `Avaliacao`, `Submissao`, etc.).
    *   Garantir que os tipos de retorno das funções da DAL, os tipos de estado no `AppContext` e os tipos de props nos componentes estejam todos alinhados com estas interfaces.
*   **Resultado:** O TypeScript atuará como um guarda, prevenindo erros de inconsistência de dados entre as camadas durante o desenvolvimento.