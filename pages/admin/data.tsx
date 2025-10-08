import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { MdAdd } from 'react-icons/md';
import AdminLayout from '@/components/layouts/AdminLayout';
import { WeeklyDataSources, createWeeklyDataSources } from '@/schemas/weekly-data-sources';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { getFirestore } from 'firebase-admin/firestore';

interface DataPageProps extends AdminPageProps {
  initialWeeks: WeeklyDataSources[];
}

export default function DataPage({ initialWeeks, tCommon, tPage }: DataPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [weeks, setWeeks] = useState<WeeklyDataSources[]>(initialWeeks);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const makeSafeT = (fn?: (key: string) => any) => (key: string, fallback?: string) => {
    if (!fn) return fallback ?? key;
    const value = fn(key);
    if (typeof value === 'string') return value;
    return fallback ?? key;
  };

  const tc = makeSafeT(tCommon);
  const t = makeSafeT(tPage);

  // useEffect para recarregar dados se necessário (ex: após sync)
  useEffect(() => {
    // Se initialWeeks estiver vazio, tentar carregar do cliente (fallback)
    if (initialWeeks.length === 0) {
      fetchWeeks();
    }
  }, []);

  const fetchWeeks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/weekly-data-sources');
      if (!response.ok) {
        throw new Error('Failed to fetch weekly data sources');
      }
      const data = await response.json();
      setWeeks(data.weeks);
    } catch (error: any) {
      toast({
        title: tc('errors.title'),
        description: error.message || t('weeklyDataSources.errors.fetch', 'Erro ao carregar semanas.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (weekId: string) => {
    setSyncing(true);
    try {
      // Primeiro, buscar os rawDataDocIds para a weekId específica
      const rawDataResponse = await fetch(`/api/admin/imports/get-raw-data-ids?weekId=${weekId}`);
      if (!rawDataResponse.ok) {
        throw new Error('Failed to fetch raw data for processing');
      }
      const { rawDataDocIds } = await rawDataResponse.json();

      if (!rawDataDocIds || rawDataDocIds.length === 0) {
        toast({
          title: tc('messages.info'),
          description: t('weeklyDataSources.messages.noRawData', 'Nenhum dado bruto disponível para processar.'),
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        setSyncing(false);
        return;
      }

      // Em seguida, chamar o endpoint de processamento com os rawDataDocIds
      const processResponse = await fetch(`/api/admin/imports/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, rawDataDocIds }),
      });
      const data = await processResponse.json();
      if (!processResponse.ok) {
        throw new Error(data.message || 'Failed to process raw data');
      }
      toast({
        title: tc('messages.success'),
        description: data.message || t('weeklyDataSources.messages.processSuccess', 'Dados processados com sucesso.'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchWeeks(); // Recarregar dados após a sincronização
    } catch (error: any) {
      toast({
        title: tc('errors.title'),
        description: error.message || t('weeklyDataSources.errors.process', 'Falha ao processar dados brutos.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleAddWeek = () => {
    router.push('/admin/weekly/import');
  };

  const filterWeeks = (weeksToFilter: WeeklyDataSources[]) => {
    // Implementar lógica de filtro aqui se necessário
    return weeksToFilter;
  };

  return (
    <AdminLayout
      title={t('weeklyDataSources.title', 'Fontes de dados')}
      subtitle={t('weeklyDataSources.subtitle', 'Gerencie fontes de dados semanais')}
      breadcrumbs={[
        { label: t('weeklyDataSources.breadcrumb', 'Fontes de dados') }
      ]}
    >
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="xl">{t('weeklyDataSources.title', 'Fontes de dados')}</Heading>
        <HStack spacing={4}>
          <Button leftIcon={<MdAdd />} colorScheme="green" onClick={handleAddWeek}>
            {t('weeklyDataSources.actions.addWeek', 'Adicionar semana')}
          </Button>
        </HStack>
      </Flex>

      <Stack spacing={4} mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={FaSearch} color="gray.300" />
          </InputLeftElement>
          <Input type="text" placeholder={t('weeklyDataSources.filters.search', 'Pesquisar semanas')} />
        </InputGroup>
        <Select placeholder={t('weeklyDataSources.filters.statusPlaceholder', 'Filtrar por status')}>
          <option value="complete">{t('weeklyDataSources.filters.status.complete', 'Completo')}</option>
          <option value="partial">{t('weeklyDataSources.filters.status.partial', 'Parcial')}</option>
          <option value="pending">{tc('status.pending')}</option>
        </Select>
      </Stack>

      {loading ? (
        <Flex justifyContent="center" alignItems="center" minH="200px">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filterWeeks(weeks).map((week) => (
            <Box
              key={week.id}
              p={4}
              borderWidth={1}
              borderRadius="md"
              _hover={{ shadow: 'md' }}
            >
              <Text fontWeight="bold">{week.weekId}</Text>
              <Text fontSize="sm">{week.weekStart} - {week.weekEnd}</Text>
              <Button
                size="sm"
                mt={2}
                onClick={() => handleSync(week.id)}
                isLoading={syncing}
              >
                {t('weeklyDataSources.actions.sync', 'Sincronizar')}
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </AdminLayout>
  );
}

// SSR com autenticação, traduções e dados iniciais
export const getServerSideProps = withAdminSSR(async (context, user) => {
  const db = getFirestore();

  try {
    const weeksSnapshot = await db.collection('weeklyDataSources').orderBy('weekStart', 'desc').get();
    const initialWeeks = weeksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        weekId: data.weekId,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        sources: data.sources,
        isComplete: data.isComplete,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        notes: data.notes,
      };
    });

    return {
      initialWeeks,
    };
  } catch (error) {
    console.error('Error fetching weekly data sources:', error);
    return {
      initialWeeks: [],
    };
  }
});

