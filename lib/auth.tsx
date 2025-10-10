"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { auth } from './firebase';

interface UserData {
  uid: string;
  email: string;
  role: 'admin' | 'driver';
  name: string;
  driverId?: string;
  [key: string]: any;
}

interface AuthContextValue {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isDriver: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userData: null,
  loading: true,
  signOut: async () => {},
  isAdmin: false,
  isDriver: false,
});

interface AuthProviderProps {
  children: ReactNode;
  initialUserData?: UserData | null;
}

export function AuthProvider({ children, initialUserData }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(initialUserData || null);
  const [loading, setLoading] = useState(!initialUserData);

  // Flag para indicar que viemos do SSR
  const [hasSSRData] = useState(!!initialUserData);

  // Sincronizar userData quando initialUserData mudar (navegação entre páginas SSR)
  useEffect(() => {
    if (initialUserData) {
      console.log('✅ SSR: Dados recebidos do servidor, usando sem fetch');
      setUserData(initialUserData);
      setLoading(false);
    }
  }, [initialUserData]);

  useEffect(() => {
    // 🚀 SSR FIRST: Se já temos dados do SSR, não fazer nenhuma requisição
    if (hasSSRData) {
      console.log('🎯 SSR MODE: Usando dados do servidor, pulando client-side auth checks');
      setLoading(false);
      return;
    }

    // ⚠️ FALLBACK: Apenas para páginas públicas sem SSR (raro)
    console.log('⚠️ Client-side auth: Sem dados SSR, iniciando listener Firebase');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Páginas públicas com usuário logado - apenas setar loading false
        // As páginas protegidas devem usar SSR (withAdminSSR/withDashboardSSR)
        console.log('ℹ️ Usuário detectado no Firebase Auth (client-side)');
        setLoading(false);
      } else {
        // Usuário não está logado
        setUserData(null);
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, [hasSSRData]); // Só depende da flag hasSSRData

  const signOut = async () => {
    try {
      // 1. Chamar API para destruir sessão iron-session
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // 2. Logout do Firebase
      await fbSignOut(auth);
      
      // 3. Limpar estado local
      setUserData(null);
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, limpar estado local
      setUserData(null);
      setUser(null);
    }
  };

  const isAdmin = userData?.role === 'admin';
  const isDriver = userData?.role === 'driver';

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      signOut, 
      isAdmin, 
      isDriver 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
