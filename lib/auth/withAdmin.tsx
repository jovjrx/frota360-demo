import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/auth';

export function withAdmin(WrappedComponent: React.ComponentType<any>) {
  return function AdminComponent(props: any) {
    const { user, loading, isAdmin, userData } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && user && !isAdmin) {
        // Se não é admin, redirecionar para dashboard do driver
        router.push('/drivers');
      }
    }, [loading, user, isAdmin, router]);

    // Se ainda está carregando
    if (loading) {
      return <LoadingSpinner message="Carregando..." />;
    }

    // Se não tem usuário, redirecionar para login
    if (!user) {
      router.push('/login');
      return <LoadingSpinner message="Redirecionando..." />;
    }

    // Se não é admin, mostrar loading (redirecionamento em andamento)
    if (!isAdmin) {
      return <LoadingSpinner message="Redirecionando..." />;
    }

    // Se é admin, mostrar o componente
    return <WrappedComponent {...props} user={user} userData={userData} />;
  };
}