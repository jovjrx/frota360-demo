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
import { MdAdd, MdSync } from 'react-icons/md';
import AdminLayout from '@/components/layouts/AdminLayout';
import { WeeklyDataSources } from '@/schemas/weekly-data-sources';
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';
import { getTranslation } from '@/lib/translations';
import { getFirestore } from 'firebase-admin/firestore';

interface DataPageProps extends AdminPageProps {
  initialWeeks: WeeklyDataSources[];
}

export default function DataPage({ user, translations, locale, initialWeeks }: DataPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [weeks, setWeeks] = useState<WeeklyDataSources[]>(initialWeeks);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const t = (key: string, variables?: Record<string, any>) => getTranslation(translations.common, key, variables) || key;
  const tAdmin = (key: string, variables?: Record<string, any>) => getTranslation(translations.admin, key, variables) || key;

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
        title: t('error'),
        description: error.message || t('failed_to_load_data'),
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
      const response = await fetch(`/api/admin/weekly-records/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sync week');
      }
      toast({
        title: t('success'),
        description: data.message || tAdmin('week_synced_successfully'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchWeeks(); // Recarregar dados após a sincronização
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || tAdmin('failed_to_sync_week'),
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
      title={tAdmin('data_sources') || 'Fontes de Dados'}
      subtitle="Gerencie fontes de dados semanais"
      breadcrumbs={[
        { label: tAdmin('data_sources') || 'Dados' }
      ]}
    >
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="xl">{tAdmin('data_sources')}</Heading>
        <HStack spacing={4}>
          <Button leftIcon={<MdAdd />} colorScheme="green" onClick={handleAddWeek}>
            {tAdmin('add_new_week')}
          </Button>
        </HStack>
      </Flex>

      <Stack spacing={4} mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={FaSearch} color="gray.300" />
          </InputLeftElement>
          <Input type="text" placeholder={t('search')} />
        </InputGroup>
        <Select placeholder={t('filter_by_status')}>
          <option value="complete">{t('complete')}</option>
          <option value="partial">{t('partial')}</option>
          <option value="pending">{t('pending')}</option>
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
                Sincronizar
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

