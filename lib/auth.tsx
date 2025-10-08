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

  // Sincronizar userData quando initialUserData mudar (navegação entre páginas)
  useEffect(() => {
    if (initialUserData) {
      const currentDataStr = JSON.stringify(userData);
      const newDataStr = JSON.stringify(initialUserData);
      if (currentDataStr !== newDataStr) {
        console.log('🔄 Atualizando userData do SSR:', initialUserData);
        setUserData(initialUserData);
        setLoading(false);
      }
    }
  }, [initialUserData]); // Não incluir userData nas dependências para evitar loop

  // Buscar dados completos do usuário e criar sessão se necessário
  const fetchUserData = async (firebaseUser: User) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      
      const response = await fetch('/api/auth/user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        
        // Verificar se precisa criar sessão Iron Session
        const sessionResponse = await fetch('/api/auth/session-status');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (!sessionData.authenticated) {
            console.log('🔄 Criando sessão Iron Session...');
            // Criar sessão Iron Session
            const syncResponse = await fetch('/api/auth/sync-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ idToken }),
            });
            
            if (syncResponse.ok) {
              console.log('✅ Sessão Iron Session criada com sucesso');
            } else {
              console.error('❌ Erro ao criar sessão Iron Session');
            }
          }
        }
      } else {
        console.error('Erro ao buscar dados do usuário:', await response.text());
        setUserData(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Se já temos userData (do SSR ou de fetch anterior), não buscar novamente
        if (!userData) {
          console.log('🔍 Buscando dados do usuário (não tem userData)');
          await fetchUserData(firebaseUser);
        } else {
          console.log('✅ Já temos userData, pulando fetch');
          setLoading(false);
        }
      } else {
        // Usuário não está logado
        setUserData(null);
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, []); // Lista de dependências vazia - só executa na montagem

  const signOut = async () => {
    await fbSignOut(auth);
    setUserData(null);
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
