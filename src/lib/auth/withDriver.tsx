import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/components/providers/Auth';

export function withDriver(WrappedComponent: React.ComponentType<any>) {
  return function DriverComponent(props: any) {
    const { user, loading, isDriver, userData } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && user && !isDriver) {
        // Se não é driver, redirecionar para admin se for admin, senão para home
        if (userData?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    }, [loading, user, isDriver, userData, router]);

    // Se ainda está carregando
    if (loading) {
      return <LoadingSpinner message="Carregando..." />;
    }

    // Se não tem usuário, redirecionar para login
    if (!user) {
      router.push('/login');
      return <LoadingSpinner message="Redirecionando..." />;
    }

    // Se não é driver, mostrar loading (redirecionamento em andamento)
    if (!isDriver) {
      return <LoadingSpinner message="Redirecionando..." />;
    }

    // Se é driver, mostrar o componente
    return <WrappedComponent {...props} user={user} userData={userData} />;
  };
}

