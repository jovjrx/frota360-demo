import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FiUpload,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
} from 'react-icons/fi';
import { loadTranslations, getTranslation } from '@/lib/translations';
import { PageProps } from '@/interface/Global';
import { useTranslations } from '@/hooks/useTranslations';

interface WeeklyDataSources {
  weekId: string;
  weekStart: string;
  weekEnd: string;
  status: 'complete' | 'partial' | 'pending';
  origin: 'auto' | 'manual';
  isComplete: boolean;
  lastSync?: string;
}

interface DataPageProps extends PageProps {
  translations: {
    common: any;
    page: any;
  };
}

export default function DataPage({ translations, locale }: DataPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [weeks, setWeeks] = useState<WeeklyDataSources[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Funções de tradução
  const { t: tCommon } = useTranslations({ 
    translations: { common: translations.common }, 
    namespace: 'common' 
  });
  
  // Fallback para traduções
  const t = tCommon || ((key: string, variables?: Record<string, any>) => {
    return getTranslation(translations?.common, key, variables) || key;
  });

  const tAdmin = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations?.page, key, variables) || key;
  };

  useEffect(() => {
    loadWeeklyData();
  }, []);

  async function loadWeeklyData() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/weekly/data-sources');
      
      if (!response.ok) {
        throw new Error('Failed to load weekly data');
      }
      
      const data = await response.json();
      setWeeks(data.weeks || []);
    } catch (error: any) {
      console.error('Error loading weekly data:', error);
      toast({
        title: tAdmin('data.error.load_title') || 'Erro ao carregar dados',
        description: error.message || tAdmin('data.error.load_desc') || 'Não foi possível carregar os dados semanais',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  async function syncPlatformData() {
    try {
      setSyncing(true);
      const response = await fetch('/api/admin/sync/platforms', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      
      toast({
        title: tAdmin('data.sync.success_title') || 'Sincronização iniciada',
        description: tAdmin('data.sync.success_desc') || 'A sincronização dos dados das plataformas foi iniciada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Recarregar dados após sync
      setTimeout(() => {
        loadWeeklyData();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error syncing data:', error);
      toast({
        title: tAdmin('data.sync.error_title') || 'Erro na sincronização',
        description: error.message || tAdmin('data.sync.error_desc') || 'Não foi possível sincronizar os dados',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncing(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'complete': return 'green';
      case 'partial': return 'yellow';
      case 'pending': return 'red';
      default: return 'gray';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'complete': return tAdmin('data.status.complete') || 'Completo';
      case 'partial': return tAdmin('data.status.partial') || 'Parcial';
      case 'pending': return tAdmin('data.status.pending') || 'Pendente';
      default: return tAdmin('data.status.unknown') || 'Desconhecido';
    }
  }

  function getOriginLabel(origin: string) {
    switch (origin) {
      case 'auto': return tAdmin('data.origin.auto') || 'Automático';
      case 'manual': return tAdmin('data.origin.manual') || 'Manual';
      default: return tAdmin('data.origin.unknown') || 'Desconhecido';
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  const completeWeeks = weeks.filter(w => w.status === 'complete').length;
  const partialWeeks = weeks.filter(w => w.status === 'partial').length;
  const pendingWeeks = weeks.filter(w => w.status === 'pending').length;

  return (
    <AdminLayout 
      title={tAdmin('data.title') || 'Gestão de Dados'}
      subtitle={tAdmin('data.subtitle') || 'Monitorize e gerencie as fontes de dados semanais'}
    >
      {/* Header com ações */}
      <Box mb={6}>
        <HStack justify="space-between" mb={4}>
          <VStack align="start" spacing={1}>
            <Heading size="lg">
              {tAdmin('data.weekly_sources') || 'Fontes de Dados Semanais'}
            </Heading>
            <Text color="gray.600">
              {tAdmin('data.description') || 'Acompanhe o status das integrações e sincronizações de dados'}
            </Text>
          </VStack>
          
          <HStack>
            <Button
              leftIcon={<Icon as={FiRefreshCw} />}
              onClick={loadWeeklyData}
              isLoading={loading}
              variant="outline"
            >
              {t('common.refresh') || 'Atualizar'}
            </Button>
            
            <Button
              leftIcon={<Icon as={FiUpload} />}
              onClick={syncPlatformData}
              isLoading={syncing}
              colorScheme="blue"
            >
              {tAdmin('data.sync.button') || 'Sincronizar'}
            </Button>
          </HStack>
        </HStack>

        {/* Estatísticas */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
          <Stat>
            <StatLabel>{tAdmin('data.stats.total') || 'Total de Semanas'}</StatLabel>
            <StatNumber>{weeks.length}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>{tAdmin('data.stats.complete') || 'Completas'}</StatLabel>
            <StatNumber color="green.500">{completeWeeks}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>{tAdmin('data.stats.partial') || 'Parciais'}</StatLabel>
            <StatNumber color="yellow.500">{partialWeeks}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>{tAdmin('data.stats.pending') || 'Pendentes'}</StatLabel>
            <StatNumber color="red.500">{pendingWeeks}</StatNumber>
          </Stat>
        </SimpleGrid>
      </Box>

      {/* Lista de semanas */}
      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="blue.500" />
          <Text mt={4} color="gray.600">
            {t('common.loading') || 'A carregar...'}
          </Text>
        </Box>
      ) : weeks.length === 0 ? (
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>{tAdmin('data.no_data.title') || 'Nenhum dado encontrado'}</AlertTitle>
          <AlertDescription>
            {tAdmin('data.no_data.desc') || 'Não foram encontrados dados semanais. Execute uma sincronização para começar.'}
          </AlertDescription>
        </Alert>
      ) : (
        <VStack spacing={4} align="stretch">
          {weeks.map((week) => (
            <Card key={week.weekId} variant="outline">
              <CardBody>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Text fontWeight="semibold">
                        {tAdmin('data.week') || 'Semana'} {week.weekId}
                      </Text>
                      <Badge colorScheme={getStatusColor(week.status)}>
                        {getStatusLabel(week.status)}
                      </Badge>
                      <Badge variant="outline">
                        {getOriginLabel(week.origin)}
                      </Badge>
                    </HStack>
                    
                    <Text fontSize="sm" color="gray.600">
                      {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                    </Text>
                    
                    {week.lastSync && (
                      <Text fontSize="xs" color="gray.500">
                        {tAdmin('data.last_sync') || 'Última sincronização'}: {formatDate(week.lastSync)}
                      </Text>
                    )}
                  </VStack>
                  
                  <HStack>
                    <Icon 
                      as={week.isComplete ? FiCheckCircle : FiAlertCircle} 
                      color={week.isComplete ? 'green.500' : 'yellow.500'}
                      boxSize={5}
                    />
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/admin/weekly/import?week=${week.weekId}`)}
                    >
                      {tAdmin('data.view_details') || 'Ver Detalhes'}
                    </Button>
                  </HStack>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  return checkAdminAuth(context);
};