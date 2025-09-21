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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar dados completos do usuário
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
        // Buscar dados completos do usuário
        await fetchUserData(firebaseUser);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

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
