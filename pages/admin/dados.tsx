import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  Box,
  Button,
  Badge,
  VStack,
  HStack,
  Text,
  Spinner,
  Icon,
  useToast,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Card,
  CardBody,
  CardHeader,
  Heading,
} from '@chakra-ui/react';
import {
  FiUpload,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
} from 'react-icons/fi';

interface WeeklyDataSources {
  weekId: string;
  weekStart: string;
  weekEnd: string;
  status: 'complete' | 'partial' | 'pending';
  origin: 'auto' | 'manual';
  isComplete: boolean;
  lastSync?: string;
}

export default function DadosPage() {
  const router = useRouter();
  const toast = useToast();
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
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        status: 'error',
        duration: 3000,
      });
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
        toast({
          title: 'Sucesso',
          description: 'Sincronização concluída',
          status: 'success',
          duration: 3000,
        });
        loadWeeks();
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao sincronizar dados',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSyncing(null);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'complete':
        return <Icon as={FiCheckCircle} color="green.600" />;
      case 'partial':
        return <Icon as={FiAlertCircle} color="yellow.600" />;
      case 'pending':
        return <Icon as={FiClock} color="gray.400" />;
      default:
        return null;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'complete':
        return <Badge colorScheme="green">Completo</Badge>;
      case 'partial':
        return <Badge colorScheme="yellow">Parcial</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return null;
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
  }

  if (loading) {
    return (
      <AdminLayout
        title="Dados Semanais"
        breadcrumbs={[{ label: 'Dados' }]}
      >
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="red.500" />
          <Text mt={4} color="gray.600">Carregando...</Text>
        </Box>
      </AdminLayout>
    );
  }

  const completeWeeks = weeks.filter(w => w.isComplete).length;
  const partialWeeks = weeks.filter(w => w.status === 'partial').length;
  const pendingWeeks = weeks.filter(w => w.status === 'pending').length;

  return (
    <AdminLayout
      title="Dados Semanais"
      subtitle="Gerencie importações e sincronizações de dados"
      breadcrumbs={[{ label: 'Dados' }]}
      side={
        <Button
          leftIcon={<Icon as={FiRefreshCw} />}
          onClick={loadWeeks}
          variant="outline"
        >
          Atualizar
        </Button>
      }
    >
      <VStack spacing={6} align="stretch">
        {/* Stats */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <StatLabel>Semanas Completas</StatLabel>
                  <Icon as={FiCheckCircle} color="green.600" boxSize={5} />
                </HStack>
                <StatNumber fontSize="3xl" mt={2}>{completeWeeks}</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <StatLabel>Parcialmente Completas</StatLabel>
                  <Icon as={FiAlertCircle} color="yellow.600" boxSize={5} />
                </HStack>
                <StatNumber fontSize="3xl" mt={2}>{partialWeeks}</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <StatLabel>Pendentes</StatLabel>
                  <Icon as={FiClock} color="gray.400" boxSize={5} />
                </HStack>
                <StatNumber fontSize="3xl" mt={2}>{pendingWeeks}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Lista de Semanas */}
        <Card>
          <CardHeader>
            <Heading size="md">Semanas Registradas</Heading>
          </CardHeader>
          <CardBody>
            {weeks.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={8}>
                Nenhuma semana registrada ainda
              </Text>
            ) : (
              <VStack spacing={3} align="stretch">
                {weeks.map((week) => (
                  <Box
                    key={week.weekId}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    bg="gray.50"
                  >
                    <HStack justify="space-between">
                      <HStack spacing={3}>
                        {getStatusIcon(week.status)}
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold">
                            {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {week.weekId}
                          </Text>
                        </VStack>
                      </HStack>

                      <HStack spacing={2}>
                        {getStatusBadge(week.status)}
                        <Button
                          size="sm"
                          leftIcon={<Icon as={FiRefreshCw} />}
                          onClick={() => handleSync(week.weekId)}
                          isLoading={syncing === week.weekId}
                          variant="outline"
                        >
                          Sincronizar
                        </Button>
                        <Button
                          size="sm"
                          leftIcon={<Icon as={FiUpload} />}
                          onClick={() => router.push(`/admin/weekly/import?week=${week.weekId}`)}
                          colorScheme="red"
                        >
                          Importar
                        </Button>
                      </HStack>
                    </HStack>

                    {week.lastSync && (
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        Última sincronização: {new Date(week.lastSync).toLocaleString('pt-PT')}
                      </Text>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>
      </VStack>
    </AdminLayout>
  );
}
