/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '@/firebaseConfig';

// Define a forma do nosso objeto de usuário customizado, que inclui o papel.
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'student' | 'teacher' | 'admin' | null; // Adicione outros papéis conforme necessário
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged retorna uma função para cancelar a inscrição (unsubscribe)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Usuário está logado. Busca os dados customizados (como o papel) do Firestore.
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        let userRole: AppUser['role'] = null;
        if (userDoc.exists()) {
          const roleFromDb = userDoc.data().role;
          // Valida se o papel do DB é um dos papéis esperados.
          if (['student', 'teacher', 'admin'].includes(roleFromDb)) {
            userRole = roleFromDb;
          }
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: userRole,
        });
      } else {
        // Usuário está deslogado
        setUser(null);
      }
      setLoading(false);
    });

    // Limpa o listener quando o componente é desmontado
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Cria um documento para o novo usuário no Firestore com um papel padrão.
    await setDoc(doc(firestore, 'users', userCredential.user.uid), {
      email: userCredential.user.email,
      role: 'student', // Papel padrão para novos usuários
      createdAt: new Date(),
    });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Verifica se o usuário já existe no Firestore. Se não, cria um novo documento.
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'student', // Papel padrão
        createdAt: new Date(),
      });
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};