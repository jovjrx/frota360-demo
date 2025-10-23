import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Center,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  Select,
  Progress,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  FiTarget,
  FiDownload,
  FiSearch,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { useState, useMemo } from 'react';
import PageSettingsMenu from '@/components/admin/PageSettingsMenu';
import GoalsSettingsModal from '@/components/admin/modals/GoalsSettingsModal';
import { useDisclosure } from '@chakra-ui/react';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';


interface RewardConfig {
  criterio: 'ganho' | 'viagens';
  tipo: 'valor' | 'percentual';
  valor: number;
  nivel: number;
  descricao: string;
  dataInicio?: number;
}

interface AdminGoalsData {
  success: boolean;
  rewards: RewardConfig[];
}

interface AdminGoalsPageProps extends AdminPageProps {
  goalsData: AdminGoalsData;
}

export default function AdminGoalsPage({ translations, locale, goalsData, tPage, tCommon }: AdminGoalsPageProps) {
  const router = useRouter();
  const toast = useToast();
  const settingsDisclosure = useDisclosure();
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);

  if (!goalsData?.success) {
    return (
      <AdminLayout title={t('goals.title', 'Metas')} translations={translations} side={<PageSettingsMenu items={[{ label: t('goals.settings', 'Configurações de Metas'), onClick: settingsDisclosure.onOpen }]} />}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>{t('goals.error_title', 'Erro ao carregar metas')}</AlertTitle>
          <AlertDescription>
            {t('goals.error_description', 'Não foi possível carregar os dados de metas.')}
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  const rewards = goalsData.rewards || [];

  return (
    <AdminLayout
      title={t('goals.title', 'Metas/Recompensas Ativas')}
      subtitle={t('goals.subtitle', 'Veja as metas/recompensas configuradas atualmente para todos os motoristas.')}
      translations={translations}
      side={<PageSettingsMenu items={[{ label: t('goals.settings', 'Configurações de Metas'), onClick: settingsDisclosure.onOpen }]} />}
    >
      <GoalsSettingsModal isOpen={settingsDisclosure.isOpen} onClose={settingsDisclosure.onClose} />
      <Box bg="white" borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" overflow="hidden" mt={6}>
        {rewards.length === 0 ? (
          <Alert status="info" borderRadius="0" m={0}>
            <AlertIcon />
            <AlertTitle>{t('goals.no_goals_title', 'Nenhuma meta/recompensa ativa')}</AlertTitle>
          </Alert>
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50" borderBottomWidth="1px" borderColor="gray.200">
                <Tr>
                  <Th>{t('goals.columns.descricao', 'Descrição')}</Th>
                  <Th>{t('goals.columns.criterio', 'Critério')}</Th>
                  <Th>{t('goals.columns.tipo', 'Tipo')}</Th>
                  <Th isNumeric>{t('goals.columns.valor', 'Valor')}</Th>
                  <Th isNumeric>{t('goals.columns.nivel', 'Nível')}</Th>
                  <Th>{t('goals.columns.data_inicio', 'Data Início')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rewards.map((reward, idx) => (
                  <Tr key={idx} _hover={{ bg: 'gray.50' }}>
                    <Td fontSize="sm">{reward.descricao}</Td>
                    <Td fontSize="sm">{reward.criterio === 'ganho' ? t('goals.criterio_ganho', 'Ganho Bruto') : t('goals.criterio_viagens', 'Viagens')}</Td>
                    <Td fontSize="sm">{reward.tipo === 'valor' ? t('goals.tipo_valor', 'Valor Fixo') : t('goals.tipo_percentual', 'Percentual')}</Td>
                    <Td isNumeric fontSize="sm">{reward.tipo === 'percentual' ? `${reward.valor}%` : `R$ ${reward.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</Td>
                    <Td isNumeric fontSize="sm">{reward.nivel}</Td>
                    <Td fontSize="sm">{reward.dataInicio ? new Date(reward.dataInicio).toLocaleDateString('pt-BR') : '-'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>
      <Alert status="info" borderRadius="lg" bg="blue.50" borderColor="blue.200" mt={6}>
        <AlertIcon />
        <VStack align="start" spacing={1}>
          <AlertTitle>Sobre as Metas/Recompensas</AlertTitle>
          <AlertDescription fontSize="sm">As metas/recompensas são configuradas pela administração e aplicadas a todos os motoristas a partir da data de início definida.</AlertDescription>
        </VStack>
      </Alert>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async (context, user) => {
  try {
    const { getActiveRewards } = await import('@/lib/goals/service');
    
    const rewards = await getActiveRewards();
    
    return {
      goalsData: {
        success: true,
        rewards,
      },
    };
  } catch (error) {
    console.error('[admin/goals SSR] error:', error);
    return {
      goalsData: {
        success: false,
        rewards: [],
      },
    };
  }
});

