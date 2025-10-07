import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
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
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { WeeklyDataSourceCard } from '@/components/admin/WeeklyDataSourceCard';
import { WeeklyDataSources } from '@/schemas/weekly-data-sources';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from 'next-auth/react';
import { loadTranslations } from '@/lib/translations';
import { useTranslations } from 'next-intl';
import { getTranslation } from '@/lib/translations';

interface DataPageProps {
  initialWeeks: WeeklyDataSources[];
  locale: string;
  translations: any;
}

export default function DataPage({ initialWeeks, locale, translations }: DataPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [weeks, setWeeks] = useState<WeeklyDataSources[]>(initialWeeks); // Inicializar com dados do SSR
  const [loading, setLoading] = useState(false); // Já carregado pelo SSR
  const [syncing, setSyncing] = useState(false);

  // Funções de tradução
  const { t: tCommon } = useTranslations({
    translations: translations.common,
    namespace: 'common'
  });

  // Fallback para traduções
  const t = tCommon || ((key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.common, key, variables) || key;
  });

  const tAdmin = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations.page, key, variables) || key;
  };

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
    <AdminLayout locale={locale} translations={translations}>
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
            <WeeklyDataSourceCard
              key={week.id}
              week={week}
              onSync={handleSync}
              syncing={syncing}
              t={t}
              tAdmin={tAdmin}
            />
          ))}
        </SimpleGrid>
      )}
    </AdminLayout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<DataPageProps>> {
  const { req, res, locale } = context;
  const session = await getSession({ req });

  // Redirecionar se não estiver logado ou não for admin
  if (!session || session.role !== 'admin') {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  let initialWeeks: WeeklyDataSources[] = [];
  let translations: any = {};

  try {
    const weeksSnapshot = await adminDb.collection('weeklyDataSources').orderBy('weekStart', 'desc').get();
    initialWeeks = weeksSnapshot.docs.map(doc => {
      const data = doc.data() as WeeklyDataSources;
      return {
        id: doc.id,
        weekId: data.weekId,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        sources: data.sources, // Garantir que o objeto sources seja incluído
        isComplete: data.isComplete,
        createdAt: data.createdAt, // Garantir que createdAt seja incluído
        updatedAt: data.updatedAt, // Adicionar updatedAt para exibição
        notes: data.notes, // Incluir notes
      } as WeeklyDataSources;
    });

    translations = await loadTranslations(locale || 'pt', ['common', 'admin-data']);

  } catch (error) {
    console.error('Error fetching initial weeks or translations:', error);
    // Em caso de erro, ainda retornar props válidas para evitar falha na página
    translations = await loadTranslations(locale || 'pt', ['common', 'admin-data']); // Tentar carregar traduções mesmo com erro
    return {
      props: {
        initialWeeks: [],
        locale: locale || 'pt',
        translations,
      },
    };
  }

  return {
    props: {
      initialWeeks,
      locale: locale || 'pt',
      translations,
    },
  };
}

