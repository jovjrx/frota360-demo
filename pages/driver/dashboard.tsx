import { Box, Heading, Text, VStack, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, useColorModeValue, Spinner, Center, Alert, AlertIcon } from '@chakra-ui/react';
import { withDriverSSR } from '@/lib/auth/withDriverSSR';
import { getTranslation } from '@/lib/translations';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';
import { SessionData } from '@/lib/session/ironSession';
import { DriverWeeklySummary } from '@/types'; // Assuming you have this type defined
import PainelLayout from '@/components/layouts/PainelLayout';
import CartrackWidget from '@/components/driver/CartrackWidget';

interface DashboardPageProps {
  user: SessionData['user'];
  translations: Record<string, any>;
  locale: string;
  initialWeeklySummary?: DriverWeeklySummary;
}

export default function DriverDashboardPage({ user, translations, locale, initialWeeklySummary }: DashboardPageProps) {
  const t = (key: string, variables?: Record<string, any>) => getTranslation(translations.common, key, variables) || key;
  const tPage = (key: string, variables?: Record<string, any>) => getTranslation(translations.page, key, variables) || key;

  const { data: weeklySummary, error } = useSWR<DriverWeeklySummary>(
    `/api/driver/weekly-summary?driverId=${user?.id}`,
    fetcher,
    { fallbackData: initialWeeklySummary }
  );

  const cardBg = useColorModeValue('white', 'gray.700');

  if (error) {
    return (
      <PainelLayout user={user} translations={translations} locale={locale}>
        <Center py={10}>
          <Alert status='error' variant='left-accent'>
            <AlertIcon />
            {tPage('dashboard.error_loading_summary')}
          </Alert>
        </Center>
      </PainelLayout>
    );
  }

  if (!weeklySummary) {
    return (
      <PainelLayout user={user} translations={translations} locale={locale}>
        <Center py={10}>
          <Spinner size='xl' />
          <Text ml={4}>{tPage('dashboard.loading_summary')}</Text>
        </Center>
      </PainelLayout>
    );
  }

  return (
    <PainelLayout user={user} translations={translations} locale={locale}>
      <VStack spacing={8} align="stretch" p={5}>
        <Heading as="h1" size="xl">
          {tPage('dashboard.welcome', { name: user?.name || user?.email })}
        </Heading>
        <Text fontSize="lg" color="gray.600">
          {tPage('dashboard.summary_intro')}
        </Text>

        <Box>
          <Heading as="h2" size="lg" mb={4}>
            {tPage('dashboard.last_week_summary')}
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" bg={cardBg}>
              <StatLabel>{tPage('dashboard.gross_earnings')}</StatLabel>
              <StatNumber>{weeklySummary.grossEarnings?.toFixed(2) || '0.00'} €</StatNumber>
              <StatHelpText>{tPage('dashboard.uber_bolt_total')}</StatHelpText>
            </Stat>

            <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" bg={cardBg}>
              <StatLabel>{tPage('dashboard.net_earnings')}</StatLabel>
              <StatNumber>{weeklySummary.netEarnings?.toFixed(2) || '0.00'} €</StatNumber>
              <StatHelpText>{tPage('dashboard.after_expenses')}</StatHelpText>
            </Stat>

            <Stat p={5} shadow="md" border="1px" borderColor="gray.200" borderRadius="md" bg={cardBg}>
              <StatLabel>{tPage('dashboard.total_expenses')}</StatLabel>
              <StatNumber>{weeklySummary.totalExpenses?.toFixed(2) || '0.00'} €</StatNumber>
              <StatHelpText>{tPage('dashboard.prio_viaverde_admin')}</StatHelpText>
            </Stat>

            {/* Add more stats as needed, e.g., number of trips, average rating */}
          </SimpleGrid>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={4}>
            {tPage('dashboard.cartrack_data')}
          </Heading>
          <CartrackWidget driverId={user?.id || ''} translations={translations.page} />
        </Box>

        {/* Add more sections like recent trips, notifications, etc. */}
      </VStack>
    </PainelLayout>
  );
}

export const getServerSideProps = withDriverSSR(async (context, user) => {
  const { req, res } = context;
  const locale = context.locale || 'pt';

  // Fetch initial weekly summary data for the logged-in driver
  try {
    const response = await fetcher(`/api/driver/weekly-summary?driverId=${user?.id}`, req, res);
    return { props: { initialWeeklySummary: response } };
  } catch (error) {
    console.error('Error fetching initial driver weekly summary:', error);
    return { props: { initialWeeklySummary: null } };
  }
});

