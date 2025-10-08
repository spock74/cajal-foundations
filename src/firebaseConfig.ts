/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Carrega as variáveis de ambiente de forma segura a partir do seu arquivo .env.local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços do Firebase
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Habilita a persistência offline para o Firestore.
// Isso permite que o app funcione offline e sincronize quando a conexão for restaurada.
enableIndexedDbPersistence(firestore).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Múltiplas abas abertas podem causar este erro.
    console.warn("A persistência do Firestore falhou em inicializar, talvez por múltiplas abas abertas.");
  } else if (err.code == 'unimplemented') {
    // Navegador não suportado.
    console.error("Este navegador não suporta persistência offline do Firestore.");
  }
});

// Exporta os serviços que serão utilizados na aplicação
export { auth, firestore, storage, functions };

export default app;