# Fluxo de Trabalho de Desenvolvimento com Emuladores do Firebase

Este documento descreve o fluxo de trabalho ideal para desenvolver e testar a aplicação localmente, utilizando o Firebase Emulator Suite. Este setup proporciona um ambiente rápido, seguro e isolado, sem afetar os dados de produção.

## Visão Geral

O segredo é rodar três processos simultaneamente em terminais separados:
1.  **Compilador do Backend:** Observa e compila o código TypeScript das Cloud Functions.
2.  **Emuladores do Firebase:** Executa versões locais de todos os serviços do Firebase (Auth, Firestore, Functions, etc.).
3.  **Servidor de Desenvolvimento do Frontend:** Executa a aplicação React com Vite, configurada para se conectar aos emuladores.

---

## Passo 1: Iniciar o Compilador do Backend (Terminal 1)

As Cloud Functions são escritas em TypeScript e precisam ser compiladas para JavaScript para que o emulador possa executá-las. O modo "watch" automatiza este processo.

1.  Navegue até o diretório `functions`:
    ```bash
    cd functions
    ```
2.  Inicie o compilador do TypeScript em modo "watch":
    ```bash
    npm run build:watch
    ```

> **Deixe este terminal rodando.** Ele irá recompilar automaticamente seu código de backend sempre que você salvar uma alteração em um arquivo `.ts`.

---

## Passo 2: Iniciar os Emuladores do Firebase (Terminal 2)

Este comando ativa todo o ambiente de backend local.

1.  Em um **novo terminal**, a partir da **raiz do projeto**, execute:
    ```bash
    firebase emulators:start
    ```
2.  Este comando irá:
    *   Iniciar todos os serviços emulados (Auth, Functions, Firestore, etc.).
    *   Carregar o código JavaScript do diretório `functions/lib/`.
    *   Disponibilizar a **Emulator UI** em `http://127.0.0.1:4000`.

> **Deixe este terminal rodando.** A Emulator UI é uma ferramenta visual indispensável para inspecionar dados, ver logs e gerenciar usuários de teste.

---

## Passo 3: Conectar e Iniciar o Frontend (Terminal 3)

Primeiro, precisamos garantir que o código do seu frontend saiba como se conectar aos emuladores em vez dos serviços de produção.

1.  **Verifique seu arquivo `src/firebaseConfig.ts`:**
    Ele deve conter uma lógica para se conectar aos emuladores quando o app estiver rodando localmente. Se não tiver, adicione o seguinte bloco de código:

    ```typescript
    // Em src/firebaseConfig.ts, após a inicialização dos serviços
    import { connectAuthEmulator } from "firebase/auth";
    import { connectFirestoreEmulator } from "firebase/firestore";
    import { connectFunctionsEmulator } from "firebase/functions";
    import { connectStorageEmulator } from "firebase/storage";

    // Conecta aos emuladores se estiver em ambiente de desenvolvimento
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      console.log("Ambiente de desenvolvimento detectado. Conectando aos emuladores...");
      
      // As portas devem corresponder às do seu firebase.json
      connectAuthEmulator(auth, "http://127.0.0.1:9099");
      connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
      connectFunctionsEmulator(functions, "127.0.0.1", 5001);
      connectStorageEmulator(storage, "127.0.0.1", 9199);
    }
    ```

2.  **Inicie o servidor de desenvolvimento:**
    Em um **terceiro terminal**, a partir da **raiz do projeto**, execute:
    ```bash
    pnpm run dev
    ```

Seu navegador abrirá com a aplicação React, que agora está totalmente conectada ao seu ambiente de backend local.

---

Com este setup, você pode desenvolver e testar funcionalidades de ponta a ponta de forma rápida e segura.