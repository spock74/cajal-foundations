/**
 * @author José E. Moraes
 * @copyright 2025 - Todos os direitos reservados
 */

import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebaseConfig';

// Define a forma do nosso objeto de usuário customizado, que inclui o papel.
export interface AppUser {
  uid: string;
  email: string | null;
  role: 'student' | 'teacher' | 'admin' | null; // Adicione outros papéis conforme necessário
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
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

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};