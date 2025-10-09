/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

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

// Conecta-se aos emuladores do Firebase se estiver em ambiente de desenvolvimento.
// Isso é crucial para que o app funcione corretamente no Cloud Workstations.
if (import.meta.env.DEV) {
  console.log("Ambiente de desenvolvimento detectado. Conectando aos emuladores do Firebase...");
  // As portas devem corresponder às do seu firebase.json
  connectAuthEmulator(auth, "127.0.0.1", 9099);
  connectFirestoreEmulator(firestore, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}

// Exporta os serviços que serão utilizados na aplicação
export { auth, firestore, storage, functions };

export default app;