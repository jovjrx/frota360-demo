import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { loadTranslations, createTranslationFunction } from '../lib/translations';
import LanguageSelector from '../components/LanguageSelector';

interface LoginPageProps {
  translations: Record<string, any>;
}

export default function LoginPage({ translations }: LoginPageProps) {
  const router = useRouter();
  const t = createTranslationFunction(translations.common);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'driver' as 'driver' | 'admin',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulação de autenticação para demonstração
      if (
        (formData.userType === 'admin' && formData.email === 'admin@conduz.pt' && formData.password === 'admin123') ||
        (formData.userType === 'driver' && formData.email === 'motorista@conduz.pt' && formData.password === 'driver123')
      ) {
        // Definir cookies de autenticação
        document.cookie = `auth-token=demo-token-${formData.userType}; path=/; max-age=86400; secure; samesite=strict`;
        document.cookie = `user-type=${formData.userType}; path=/; max-age=86400; secure; samesite=strict`;

        // Redirecionar baseado no tipo de usuário
        const redirectPath = router.query.redirect as string;
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.push(formData.userType === 'admin' ? '/admin/dashboard' : '/drivers/dashboard');
        }
      } else {
        setError('Credenciais inválidas. Use as credenciais de demonstração.');
      }
    } catch (err) {
      setError(t('messages.error.network'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <Head>
        <title>{t('navigation.login')} - Conduz.pt</title>
        <meta name="description" content="Faça login na plataforma Conduz.pt" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img
                className="h-12 w-auto"
                src="/img/conduz.png"
                alt="Conduz.pt"
              />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              {t('navigation.login')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Acesse a sua conta na plataforma
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex justify-center">
            <LanguageSelector />
          </div>

          {/* Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              {/* User Type Selection */}
              <div>
                <label htmlFor="userType" className="block text-sm font-medium text-gray-700">
                  Tipo de Utilizador
                </label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="driver">Motorista</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t('user.email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="seu@email.com"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('user.password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('navigation.loading')}
                  </div>
                ) : (
                  t('navigation.login')
                )}
              </button>
            </div>

            {/* Links */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Esqueceu a palavra-passe?
                </Link>
              </div>
              <div className="text-sm">
                <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Criar conta
                </Link>
              </div>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Credenciais de Demonstração:</h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <p><strong>Admin:</strong> admin@conduz.pt / admin123</p>
              <p><strong>Motorista:</strong> motorista@conduz.pt / driver123</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const translations = await loadTranslations(locale || 'pt', ['common']);

  return {
    props: {
      translations,
    },
  };
};
