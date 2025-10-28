import { useMemo, useState } from 'react';
import { Box, Button, useDisclosure, Icon, HStack } from '@chakra-ui/react';
import { FiPlus, FiSettings } from 'react-icons/fi';
import useSWR, { SWRConfig } from 'swr';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { getWeeklyWeeks } from '@/lib/admin/adminQueries';
import { serializeDatasets } from '@/lib/utils/serializeFirestore';
import { GlobalTabs, TabConfig } from '@/components/GlobalTabs';
import { GlobalSelect, SelectOption } from '@/components/GlobalSelect';
import PaymentsTabContent from '@/components/admin/payments/PaymentsTabContent';
import WeeklyDataSourcesTabContent from '@/components/admin/payments/WeeklyDataSourcesTabContent';
import AddWeekModal from '@/components/admin/payments/AddWeekModal';
import AdminFeeSettingsModal from '@/components/admin/modals/AdminFeeSettingsModal';

interface WeeklyWeek {
  weekId: string;
  weekStart: string;
  weekEnd: string;
  status: 'open' | 'closed' | 'paid';
  createdAt?: string;
}

interface PaymentsPageProps extends AdminPageProps {
  initialWeeks: WeeklyWeek[];
  initialPayments?: any[];
  initialWeeklyData?: any;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

function PaymentsPageContent({
  user,
  locale,
  initialWeeks,
  initialPayments = [],
  initialWeeklyData,
  tCommon,
  tPage,
  translations,
}: PaymentsPageProps) {
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const { isOpen: isAddWeekOpen, onOpen: onOpenAddWeek, onClose: onCloseAddWeek } = useDisclosure();
  const { isOpen: isFeeSettingsOpen, onOpen: onOpenFeeSettings, onClose: onCloseFeeSettings } = useDisclosure();

  const [selectedWeekId, setSelectedWeekId] = useState<string | undefined>(initialWeeks?.[0]?.weekId);

  const { data: weeksData, mutate: mutateWeeks } = useSWR(
    '/api/admin/weekly/weeks',
    fetcher,
    { fallbackData: { weeks: initialWeeks } }
  );

  const weeks = weeksData?.weeks || initialWeeks || [];
  const selectedWeek = weeks.find((w: any) => w.weekId === selectedWeekId) || weeks[0];

  const handleWeekChange = (weekId: string) => {
    setSelectedWeekId(weekId);
    mutateWeeks();
  };

  // Buscar pagamentos da semana selecionada para calcular totais
  const { data: paymentsData } = useSWR(
    selectedWeekId ? `/api/admin/weekly/payments?weekId=${selectedWeekId}` : null,
    fetcher,
    { fallbackData: { records: [] } }
  );

  const payments = paymentsData?.records || [];
  const totalAmount = payments.reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);
  const driverCount = payments.length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      // Se for string YYYY-MM-DD, apenas formatar sem converter pra Date
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        // Formatar como DD/MM/YYYY mantendo a data original
        return `${day}/${month}/${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'green';
      case 'closed':
        return 'yellow';
      case 'open':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Paga',
      closed: 'Fechada',
      open: 'Aberta',
    };
    return labels[status] || status;
  };

  // Converter weeks para SelectOption
  const selectOptions: SelectOption[] = weeks.map((week: any) => ({
    id: week.weekId,
    label: week.weekId,
    description: `${formatDate(week.weekStart)} - ${formatDate(week.weekEnd)}`,
    badge: {
      text: getStatusLabel(week.status),
      colorScheme: getStatusColor(week.status),
    },
  }));

  const tabsConfig: TabConfig[] = [
    {
      key: 'pagamentos',
      label: t('weekly.payments', 'Pagamentos') || 'Pagamentos',
      content: selectedWeekId ? (
        <PaymentsTabContent
          weekId={selectedWeekId}
          initialRecords={initialPayments || []}
          tCommon={tCommon}
          tPage={tPage}
          user={user}
        />
      ) : null,
    },
    {
      key: 'dados',
      label: t('weekly.data', 'Dados') || 'Dados',
      content: selectedWeekId ? (
        <WeeklyDataSourcesTabContent weekId={selectedWeekId} />
      ) : null,
    },
  ];

  return (
    <AdminLayout
      translations={translations}
      title={t('weekly.title') || 'Controle Semanal'}
      subtitle={t('weekly.subtitle') || 'Gestao semanal de dados TVDE'}
      breadcrumbs={[{ label: tc('menu.weekly_control', 'Controle Semanal') }]}
      side={
        <HStack spacing={2} width="full">
          <GlobalSelect
            options={selectOptions}
            selectedId={selectedWeekId}
            onChange={handleWeekChange}
            placeholder="Selecionar semana"
            buttonLabel={selectedWeek ? `${formatDate(selectedWeek.weekStart)} - ${formatDate(selectedWeek.weekEnd)}` : 'Selecionar semana'}
            size="sm"
          />
          <Button leftIcon={<Icon as={FiPlus} />} iconSpacing={0} width="full" colorScheme="blue" size="sm" onClick={onOpenAddWeek} />
          <Button leftIcon={<Icon as={FiSettings} />} iconSpacing={0} width="full" colorScheme="gray" size="sm" onClick={onOpenFeeSettings} />
        </HStack>
      }
    >
      {selectedWeekId && <GlobalTabs simple tabs={tabsConfig} />}

      <AddWeekModal isOpen={isAddWeekOpen} onClose={onCloseAddWeek} onSuccess={() => mutateWeeks()} tCommon={tCommon} tPage={tPage} />
      <AdminFeeSettingsModal isOpen={isFeeSettingsOpen} onClose={onCloseFeeSettings} />
    </AdminLayout>
  );
}

export default function PaymentsPage(props: PaymentsPageProps) {
  return (
    <SWRConfig value={{ dedupingInterval: 0 }}>
      <PaymentsPageContent {...props} />
    </SWRConfig>
  );
}

export const getServerSideProps = withAdminSSR(async (context, user) => {
  try {
    const weeks = await getWeeklyWeeks();
    const currentWeekId = weeks?.[0]?.weekId;

    let initialRecords = [];

    // Fetch initial records for the first week if available - use payments endpoint (driverPayments-only)
    if (currentWeekId) {
      try {
        const recordsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/weekly/payments?weekId=${currentWeekId}`, {
          headers: {
            'Cookie': context.req?.headers.cookie || '',
            'Authorization': `Bearer ${user?.uid || ''}`,
          },
        });

        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          initialRecords = recordsData?.records || [];
        }
      } catch (error) {
        console.error('[admin/payments] Error fetching initial records:', error);
      }
    }

    const initialData = serializeDatasets({
      initialWeeks: weeks || [],
      initialPayments: initialRecords,
      initialWeeklyData: initialRecords, // keep same fallback; Dados tab fetches its own data later
    });
    return initialData;
  } catch (error) {
    console.error('[admin/payments] SSR error:', error);
    return { initialWeeks: [], initialPayments: [], initialWeeklyData: [] };
  }
});
