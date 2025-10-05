import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LoggedInLayout from '@/components/LoggedInLayout';

export default function UberIntegrationPage() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { success, error } = router.query;

  useEffect(() => {
    // Verificar se Uber já está conectado
    checkUberConnection();
  }, []);

  useEffect(() => {
    if (success) {
      setIsConnected(true);
      // Remover query params
      setTimeout(() => {
        router.replace('/admin/integrations/uber', undefined, { shallow: true });
      }, 3000);
    }
  }, [success]);

  const checkUberConnection = async () => {
    try {
      const response = await fetch('/api/admin/integrations/uber/status');
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      console.error('Error checking Uber connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirecionar para iniciar fluxo OAuth
    window.location.href = '/api/admin/integrations/uber/connect';
  };

  const handleDisconnect = async () => {
    if (!confirm('Desconectar integração Uber?')) return;

    try {
      const response = await fetch('/api/admin/integrations/uber/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error disconnecting Uber:', error);
    }
  };

  if (loading) {
    return (
      <LoggedInLayout>
        <div className="p-6">
          <p>Carregando...</p>
        </div>
      </LoggedInLayout>
    );
  }

  return (
    <LoggedInLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Integração Uber</h1>

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            ✅ Uber conectado com sucesso!
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            ❌ Erro ao conectar: {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Status da Integração</h2>
              <p className="text-gray-600 mt-1">
                {isConnected
                  ? '🟢 Conectado - Dados de viagens e ganhos sendo sincronizados'
                  : '🔴 Desconectado - Clique em conectar para autorizar o acesso'}
              </p>
            </div>
            <div>
              {isConnected ? (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Desconectar
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  Conectar Uber
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className="font-semibold mb-3">O que será sincronizado:</h3>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Histórico de viagens</li>
              <li>✓ Ganhos e receitas</li>
              <li>✓ Motoristas da organização</li>
              <li>✓ Métricas consolidadas</li>
            </ul>
          </div>

          {!isConnected && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold mb-3">Como funciona:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Clique em "Conectar Uber"</li>
                <li>Faça login com sua conta Uber Business</li>
                <li>Autorize o acesso aos dados da sua frota</li>
                <li>Pronto! Os dados serão sincronizados automaticamente</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </LoggedInLayout>
  );
}
