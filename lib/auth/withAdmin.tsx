import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/auth';

export function withAdmin(WrappedComponent: React.ComponentType<any>) {
  return function AdminComponent(props: any) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
      if (!loading && user?.uid) {
        // Verificar se o usuário está na coleção admins
        fetch('/api/auth/check-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uid: user.uid }),
        })
        .then(res => res.json())
        .then(data => {
          setIsAdmin(data.isAdmin || false);
        })
        .catch(() => {
          setIsAdmin(false);
        });
      }
    }, [user, loading]);

    useEffect(() => {
      if (isAdmin === false) {
        router.push('/painel');
      }
    }, [isAdmin, router]);

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
    if (isAdmin === null) {
      return <LoadingSpinner message="Verificando permissões..." />;
    }

    // Se não é admin, redirecionar
    if (isAdmin === false) {
      return <LoadingSpinner message="Redirecionando..." />;
    }

    // Se é admin, mostrar o componente
    return <WrappedComponent {...props} user={user} />;
  };
}