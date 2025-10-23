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
import useSWR from 'swr';
import { useState } from 'react';
import PageSettingsMenu from '@/components/admin/PageSettingsMenu';
import GoalsSettingsModal from '@/components/admin/modals/GoalsSettingsModal';
import { useDisclosure } from '@chakra-ui/react';


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

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

const statusColors: Record<string, string> = {
  not_started: 'gray',
  in_progress: 'blue',
  completed: 'green',
  overdue: 'red',
};

const statusLabels: Record<string, string> = {
  not_started: 'Não Iniciado',
  in_progress: 'Em Progresso',
  completed: 'Concluído',
  overdue: 'Atrasado',
};

export default function AdminGoalsPage({ translations, locale }: AdminPageProps) {
  const router = useRouter();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQuarter, setFilterQuarter] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const settingsDisclosure = useDisclosure();

  const { data, isLoading, error } = useSWR<AdminGoalsData>(
    '/api/admin/goals',
    fetcher,
    { revalidateOnFocus: false }
  );


  if (isLoading) {
    return (
      <AdminLayout title="Metas" translations={translations} side={<PageSettingsMenu items={[{ label: 'Configurações de Metas', onClick: settingsDisclosure.onOpen }]} />}>
        <Center minH="400px">
          <Spinner size="lg" color="red.500" />
        </Center>
      </AdminLayout>
    );
  }

  if (error || !data?.success) {
    return (
      <AdminLayout title="Metas" translations={translations} side={<PageSettingsMenu items={[{ label: 'Configurações de Metas', onClick: settingsDisclosure.onOpen }]} />}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Erro ao carregar metas</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados de metas.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  const rewards = data.rewards || [];

  return (
    <AdminLayout
      title="Metas/Recompensas Ativas"
      subtitle="Veja as metas/recompensas configuradas atualmente para todos os motoristas."
      translations={translations}
      side={<PageSettingsMenu items={[{ label: 'Configurações de Metas', onClick: settingsDisclosure.onOpen }]} />}
    >
      <GoalsSettingsModal isOpen={settingsDisclosure.isOpen} onClose={settingsDisclosure.onClose} />
      <Box bg="white" borderRadius="lg" shadow="sm" borderWidth="1px" borderColor="gray.200" overflow="hidden" mt={6}>
        {rewards.length === 0 ? (
          <Alert status="info" borderRadius="0" m={0}>
            <AlertIcon />
            <AlertTitle>Nenhuma meta/recompensa ativa</AlertTitle>
          </Alert>
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead bg="gray.50" borderBottomWidth="1px" borderColor="gray.200">
                <Tr>
                  <Th>Descrição</Th>
                  <Th>Critério</Th>
                  <Th>Tipo</Th>
                  <Th isNumeric>Valor</Th>
                  <Th isNumeric>Nível</Th>
                  <Th>Data Início</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rewards.map((reward, idx) => (
                  <Tr key={idx} _hover={{ bg: 'gray.50' }}>
                    <Td fontSize="sm">{reward.descricao}</Td>
                    <Td fontSize="sm">{reward.criterio === 'ganho' ? 'Ganho Bruto' : 'Viagens'}</Td>
                    <Td fontSize="sm">{reward.tipo === 'valor' ? 'Valor Fixo' : 'Percentual'}</Td>
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
  return {};
});

