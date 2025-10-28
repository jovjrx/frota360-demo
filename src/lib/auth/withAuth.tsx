import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/Auth';
import { useRouter } from 'next/router';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function withAuth(WrappedComponent: React.ComponentType<any>) {
  return function AuthenticatedComponent(props: any) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push('/login');
        } else {
          setIsChecking(false);
        }
      }
    }, [user, loading, router]);

    // Se ainda está carregando, mostrar loading
    if (loading) {
      return <LoadingSpinner message="Carregando..." />;
    }

    // Se não está carregando mas não tem usuário, redirecionar
    if (!user) {
      return <LoadingSpinner message="Redirecionando..." />;
    }

    // Se tem usuário, mostrar o componente
    if (!isChecking) {
      return <WrappedComponent {...props} user={user} />;
    }

    // Estado intermediário
    return <LoadingSpinner message="Verificando autenticação..." />;
  };
}

