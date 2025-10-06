import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  FileText,
  TrendingUp
} from 'lucide-react';
import type { WeeklyDataSources } from '@/schemas/weekly-data-sources';

export default function DadosPage() {
  const router = useRouter();
  const [weeks, setWeeks] = useState<WeeklyDataSources[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadWeeks();
  }, []);

  async function loadWeeks() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/weekly/sources');
      if (res.ok) {
        const data = await res.json();
        setWeeks(data.weeks || []);
      }
    } catch (error) {
      console.error('Erro ao carregar semanas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(weekId: string) {
    try {
      setSyncing(weekId);
      const res = await fetch(`/api/admin/weekly/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId }),
      });
      
      if (res.ok) {
        await loadWeeks();
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    } finally {
      setSyncing(null);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'complete':
        return <Badge variant="default" className="bg-green-600">Completo</Badge>;
      case 'partial':
        return <Badge variant="default" className="bg-yellow-600">Parcial</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return null;
    }
  }

  function getOriginBadge(origin: string) {
    return origin === 'auto' ? (
      <Badge variant="outline" className="text-blue-600">Automático</Badge>
    ) : (
      <Badge variant="outline">Manual</Badge>
    );
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dados Semanais</h1>
            <p className="text-muted-foreground">
              Gerencie importações e sincronizações de dados
            </p>
          </div>
          <Button onClick={loadWeeks} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Semanas Completas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weeks.filter(w => w.isComplete).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weeks.filter(w => !w.isComplete).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Semanas</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeks.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Weeks List */}
        <div className="space-y-4">
          {weeks.map((week) => (
            <Card key={week.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>
                      Semana {week.weekId.split('-W')[1]} ({formatDate(week.weekStart)} - {formatDate(week.weekEnd)})
                    </CardTitle>
                    {getStatusBadge(week.isComplete ? 'complete' : 'partial')}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/weekly/import?week=${week.weekId}`)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Importar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(week.weekId)}
                      disabled={syncing === week.weekId}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${syncing === week.weekId ? 'animate-spin' : ''}`} />
                      Sincronizar
                    </Button>
                    {week.isComplete && (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/admin/weekly?week=${week.weekId}`)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Controle
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Última atualização: {new Date(week.updatedAt).toLocaleString('pt-PT')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {/* Uber */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(week.sources.uber.status)}
                      <div>
                        <p className="font-medium text-sm">Uber</p>
                        <p className="text-xs text-muted-foreground">
                          {week.sources.uber.driversCount} motoristas
                        </p>
                      </div>
                    </div>
                    {getOriginBadge(week.sources.uber.origin)}
                  </div>

                  {/* Bolt */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(week.sources.bolt.status)}
                      <div>
                        <p className="font-medium text-sm">Bolt</p>
                        <p className="text-xs text-muted-foreground">
                          {week.sources.bolt.driversCount} motoristas
                        </p>
                      </div>
                    </div>
                    {getOriginBadge(week.sources.bolt.origin)}
                  </div>

                  {/* myprio */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(week.sources.myprio.status)}
                      <div>
                        <p className="font-medium text-sm">myprio</p>
                        <p className="text-xs text-muted-foreground">
                          {week.sources.myprio.recordsCount} registros
                        </p>
                      </div>
                    </div>
                    {getOriginBadge(week.sources.myprio.origin)}
                  </div>

                  {/* ViaVerde */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(week.sources.viaverde.status)}
                      <div>
                        <p className="font-medium text-sm">ViaVerde</p>
                        <p className="text-xs text-muted-foreground">
                          {week.sources.viaverde.recordsCount} registros
                        </p>
                      </div>
                    </div>
                    {getOriginBadge(week.sources.viaverde.origin)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {weeks.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900">Nenhuma semana encontrada</p>
                <p className="text-sm text-gray-500 mt-1">
                  Importe dados para começar
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/admin/weekly/import')}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Dados
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
