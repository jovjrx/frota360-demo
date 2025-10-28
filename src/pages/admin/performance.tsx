import React, { useMemo, useState } from 'react';
import { GetServerSideProps } from 'next';
import {
  VStack,
  Card,
  CardBody,
  Select,
  Icon,
  Spinner,
  Text,
  Box,
  useToast,
} from '@chakra-ui/react';
import { SWRConfig } from 'swr';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr/withAdminSSR';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { AdminPerformanceCharts } from '@/components/admin/performance/AdminPerformanceCharts';
import { TopDriversCard, type TopDriver } from '@/components/admin/performance/TopDriversCard';
import { getAggregatedPerformanceMetrics, PerformanceMetrics, getTopDriversRanking } from '@/lib/performance/metrics';
import { serializeDatasets } from '@/lib/utils/serializeFirestore';
import useSWR from 'swr';

interface AdminPerformancePageProps extends AdminPageProps {
  initialMetrics?: PerformanceMetrics;
  topDrivers?: TopDriver[];
  tCommon?: any;
  tPage?: any;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

function AdminPerformancePageContent({
  translations,
  initialMetrics,
  topDrivers,
  tCommon,
  tPage,
}: AdminPerformancePageProps) {
  const toast = useToast();
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const [period, setPeriod] = useState<'week' | 'month' | 'total'>('month');

  // Montar URL baseada no período
  const fetchUrl = `/api/admin/performance/metrics?period=${period}`;

  const { data, error, isLoading, mutate } = useSWR(fetchUrl, fetcher, {
    fallbackData: initialMetrics
      ? { success: true, data: initialMetrics }
      : undefined,
    revalidateOnFocus: false,
  });

  const metrics = data?.data;

  return (
    <AdminLayout
      translations={translations}
      title={t('title', 'Performance dos Motoristas')}
      subtitle={t('subtitle', 'Análise de ganhos, descontos e eficiência')}
      breadcrumbs={[{ label: tc('menu.performance', 'Performance') }]}
      side={
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'total')}
          isDisabled={isLoading}
          size="sm"
        >
          <option value="week">{t('period.week', 'Última Semana')}</option>
          <option value="month">{t('period.month', 'Último Mês')}</option>
          <option value="total">{t('period.total', 'Total (Histórico)')}</option>
        </Select>
      }
    >
      <VStack spacing={6} align="stretch" w="full">

        {/* Gráficos */}
        {isLoading ? (
          <Box textAlign="center" py={20}>
            <Spinner size="xl" color="blue.500" />
            <Text mt={4} color="gray.600">
              {t('loading', 'Carregando dados...')}
            </Text>
          </Box>
        ) : error ? (
          <Box textAlign="center" py={10}>
            <Text color="red.600">{t('error', 'Erro ao carregar dados')}</Text>
          </Box>
        ) : (
          <>
            <AdminPerformanceCharts metrics={metrics} isLoading={false} />
            
            {/* Top Drivers */}
            {topDrivers && topDrivers.length > 0 && (
              <TopDriversCard drivers={topDrivers} />
            )}
          </>
        )}
      </VStack>
    </AdminLayout>
  );
}

export default function AdminPerformancePage(props: AdminPerformancePageProps) {
  return (
    <SWRConfig value={{ dedupingInterval: 0 }}>
      <AdminPerformancePageContent {...props} />
    </SWRConfig>
  );
}

export const getServerSideProps: GetServerSideProps<AdminPerformancePageProps> = withAdminSSR(
  async (context, user) => {
    try {
      const initialMetrics = await getAggregatedPerformanceMetrics('month');
      const topDrivers = await getTopDriversRanking('month');

      const initialData = serializeDatasets({
        initialMetrics: initialMetrics || null,
        topDrivers: topDrivers || [],
      });

      return {
        props: {
          ...initialData,
          initialMetrics: initialData?.initialMetrics || null,
          topDrivers: initialData?.topDrivers || [],
        } as AdminPerformancePageProps,
      };
    } catch (error) {
      console.error('[admin/performance] SSR error:', error);
      return {
        props: {
          initialMetrics: null,
          topDrivers: [],
        } as AdminPerformancePageProps,
      };
    }
  }
);


