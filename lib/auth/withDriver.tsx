import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/auth';

export function withDriver(WrappedComponent: React.ComponentType<any>) {
  return function DriverComponent(props: any) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isDriver, setIsDriver] = useState<boolean | null>(null);

    useEffect(() => {
      if (!loading && user?.email) {
        // Verificar se não é admin (se for admin, redirecionar para admin)
        const isAdmin = user.email.endsWith('@conduz.pt') || user.email === 'conduzcontacto@gmail.com';
        
        if (isAdmin) {
          router.push('/dashboard/admin');
        } else {
          // Se não é admin, é motorista
          setIsDriver(true);
        }
      }
    }, [user, loading]);

    useEffect(() => {
      if (isDriver === false) {
        router.push('/dashboard/admin');
      }
    }, [isDriver, router]);

    // Se ainda está carregando
    if (loading) {
      return <LoadingSpinner message="Carregando..." />;
    }

    // Se não tem usuário, redirecionar para login
    if (!user) {
      router.push('/login');
      return <LoadingSpinner message="Redirecionando..." />;
    }

    // Se ainda está verificando permissões
    if (isDriver === null) {
      return <LoadingSpinner message="Verificando permissões..." />;
    }

    // Se não é motorista, redirecionar
    if (isDriver === false) {
      return <LoadingSpinner message="Redirecionando..." />;
    }

    // Se é motorista, mostrar o componente
    return <WrappedComponent {...props} user={user} />;
  };
}
