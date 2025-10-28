/**
 * Componentes de Seções Reutilizáveis para Dashboard do Motorista
 * 
 * Padrão unificado para mostrar:
 * - Contratos pendentes de assinatura
 * - Documentos solicitados
 * - Preview de indicações
 * - Preview de metas/bônus
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Divider,
  Badge,
  SimpleGrid,
  Progress,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiCheckCircle,
  FiUsers,
  FiTrendingUp,
  FiArrowRight,
  FiAlertCircle,
  FiClock,
  FiX,
} from 'react-icons/fi';
import Link from 'next/link';

/**
 * Card genérico para uma seção do dashboard
 */
interface SectionCardProps {
  title: string;
  icon: any;
  iconColor: string;
  children: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function SectionCard({
  title,
  icon,
  iconColor,
  children,
  actionLabel,
  actionHref,
  isEmpty = false,
  emptyMessage = 'Nenhum item',
}: SectionCardProps) {
  return (
    <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
      <HStack mb={4} justify="space-between">
        <HStack>
          <Icon as={icon} boxSize={5} color={iconColor} />
          <Text fontSize="lg" fontWeight="bold">{title}</Text>
        </HStack>
      </HStack>

      {isEmpty ? (
        <VStack align="stretch" h="full" justify="center" spacing={3}>
          <Text color="gray.500" fontSize="sm" textAlign="center">
            {emptyMessage}
          </Text>
          {actionHref && actionLabel && (
            <Button
              as={Link}
              href={actionHref}
              size="sm"
              width="full"
              colorScheme="blue"
              variant="outline"
              rightIcon={<Icon as={FiArrowRight} />}
            >
              {actionLabel}
            </Button>
          )}
        </VStack>
      ) : (
        <>
          {children}
          {actionHref && actionLabel && (
            <>
              <Divider my={4} />
              <Button
                as={Link}
                href={actionHref}
                size="sm"
                width="full"
                colorScheme="blue"
                variant="outline"
                rightIcon={<Icon as={FiArrowRight} />}
              >
                {actionLabel}
              </Button>
            </>
          )}
        </>
      )}
    </Box>
  );
}

/**
 * Card para contratos pendentes de assinatura
 */
interface PendingContractsCardProps {
  contracts: Array<{
    id: string;
    contractType: 'affiliate' | 'renter';
    category?: string;
    status: string;
    createdAt?: number;
    dueDate?: number;
  }>;
  translations?: any;
}

export function PendingContractsCard({ contracts = [], translations }: PendingContractsCardProps) {
  const isEmpty = !contracts || contracts.length === 0;
  const t = (key: string) => translations?.[key] || key;

  const typeLabel = (type: string) => {
    return type === 'renter' ? 'Locatário' : 'Afiliado';
  };

  return (
    <SectionCard
      title={t('dashboard.sections.pending_contracts') || 'Contratos Pendentes'}
      icon={FiFileText}
      iconColor="orange.500"
      isEmpty={isEmpty}
      emptyMessage={t('dashboard.sections.no_pending_contracts') || 'Nenhum contrato pendente'}
      actionLabel={t('dashboard.sections.view_all') || 'Ver Todos'}
      actionHref="/dashboard/contracts"
    >
      <VStack align="stretch" spacing={3}>
        {contracts.map((contract) => (
          <Box key={contract.id} p={3} bg="gray.50" borderRadius="md">
            <HStack justify="space-between" mb={2}>
              <VStack align="start" spacing={0}>
                <HStack spacing={2}>
                  <Badge colorScheme="orange" fontSize="xs">
                    {typeLabel(contract.contractType)}
                  </Badge>
                  {contract.category && (
                    <Text fontSize="xs" color="gray.600">{contract.category}</Text>
                  )}
                </HStack>
              </VStack>
              <Badge colorScheme="yellow" fontSize="xs">
                {t('dashboard.status.pending') || 'Pendente'}
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              {t('dashboard.sections.received')} {new Date(contract.createdAt || 0).toLocaleDateString('pt-PT')}
            </Text>
          </Box>
        ))}
      </VStack>
    </SectionCard>
  );
}

/**
 * Card para documentos solicitados
 */
interface PendingDocumentsCardProps {
  documents: Array<{
    id: string;
    documentType: string;
    documentName: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    dueDate?: number;
    uploadCount: number;
    rejectionReason?: string;
  }>;
  translations?: any;
}

export function PendingDocumentsCard({ documents = [], translations }: PendingDocumentsCardProps) {
  const isEmpty = !documents || documents.length === 0;
  const t = (key: string) => translations?.[key] || key;

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'red';
      case 'submitted': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  return (
    <SectionCard
      title={t('dashboard.sections.pending_documents') || 'Documentos Solicitados'}
      icon={FiCheckCircle}
      iconColor="blue.500"
      isEmpty={isEmpty}
      emptyMessage={t('dashboard.sections.no_pending_documents') || 'Nenhum documento solicitado'}
      actionLabel={t('dashboard.sections.view_all') || 'Ver Todos'}
      actionHref="/dashboard/documents"
    >
      <VStack align="stretch" spacing={3}>
        {documents.map((doc) => (
          <Box key={doc.id} p={3} bg="gray.50" borderRadius="md">
            <HStack justify="space-between" mb={2}>
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="semibold">{doc.documentName}</Text>
                <Text fontSize="xs" color="gray.600">{doc.documentType}</Text>
              </VStack>
              <Badge colorScheme={statusColor(doc.status)} fontSize="xs">
                {t(`dashboard.status.${doc.status}`) || doc.status}
              </Badge>
            </HStack>

            {doc.status === 'rejected' && doc.rejectionReason && (
              <Alert status="warning" variant="subtle" py={2} mb={2} fontSize="xs" borderRadius="md">
                <AlertIcon boxSize={3} />
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" mb={1}>
                    {t('dashboard.sections.rejection_reason') || 'Motivo da rejeição:'}
                  </Text>
                  <Text>{doc.rejectionReason}</Text>
                </Box>
              </Alert>
            )}

            <HStack justify="space-between" fontSize="xs" color="gray.500">
              <Text>
                {t('dashboard.sections.attempts')} {doc.uploadCount}
              </Text>
              {doc.status === 'pending' && (
                <Text color="orange.500" fontWeight="semibold">
                  {t('dashboard.sections.awaiting_submission') || 'Aguardando envio'}
                </Text>
              )}
            </HStack>
          </Box>
        ))}
      </VStack>
    </SectionCard>
  );
}

/**
 * Card para preview de indicações
 */
interface ReferralsPreviewCardProps {
  referrals?: {
    total: number;
    pending: number;
    approved: number;
    earned: number;
  };
  translations?: any;
}

export function ReferralsPreviewCard({ referrals, translations }: ReferralsPreviewCardProps) {
  const t = (key: string) => translations?.[key] || key;
  const data = referrals || { total: 0, pending: 0, approved: 0, earned: 0 };

  return (
    <SectionCard
      title={t('dashboard.sections.referrals') || 'Indicações'}
      icon={FiUsers}
      iconColor="purple.500"
      isEmpty={data.total === 0}
      emptyMessage={t('dashboard.sections.no_referrals') || 'Nenhuma indicação ainda'}
      actionLabel={t('dashboard.sections.view_all') || 'Ver Todas'}
      actionHref="/dashboard/commissions"
    >
      <SimpleGrid columns={4} spacing={3}>
        <Box textAlign="center">
          <Text fontSize="xs" color="gray.600" mb={2} fontWeight="medium">
            {t('dashboard.sections.total') || 'Total'}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="purple.600">
            {data.total}
          </Text>
        </Box>
        <Box textAlign="center">
          <Text fontSize="xs" color="gray.600" mb={2} fontWeight="medium">
            {t('dashboard.sections.pending') || 'Pendentes'}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="yellow.600">
            {data.pending}
          </Text>
        </Box>
        <Box textAlign="center">
          <Text fontSize="xs" color="gray.600" mb={2} fontWeight="medium">
            {t('dashboard.sections.approved') || 'Aprovadas'}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="green.600">
            {data.approved}
          </Text>
        </Box>
        <Box textAlign="center">
          <Text fontSize="xs" color="gray.600" mb={2} fontWeight="medium">
            {t('dashboard.sections.earned') || 'Ganhos'}
          </Text>
          <Text fontSize="xl" fontWeight="bold" color="green.600">
            €{data.earned.toFixed(0)}
          </Text>
        </Box>
      </SimpleGrid>
    </SectionCard>
  );
}

/**
 * Card para preview de metas/bônus
 */
interface GoalsPreviewCardProps {
  goals?: {
    activeGoals: number;
    completedGoals: number;
    totalRewards: number;
    nextMilestone?: {
      name: string;
      progress: number;
      target: number;
      reward: number;
    } | null;
  };
  translations?: any;
}

export function GoalsPreviewCard({ goals, translations }: GoalsPreviewCardProps) {
  const t = (key: string) => translations?.[key] || key;
  const data = goals || {
    activeGoals: 0,
    completedGoals: 0,
    totalRewards: 0,
    nextMilestone: null,
  };

  const progressPercent = data.nextMilestone
    ? Math.min(100, (data.nextMilestone.progress / data.nextMilestone.target) * 100)
    : 0;

  return (
    <SectionCard
      title={t('dashboard.sections.goals_rewards') || 'Metas & Bônus'}
      icon={FiTrendingUp}
      iconColor="green.500"
      isEmpty={data.activeGoals === 0 && data.completedGoals === 0}
      emptyMessage={t('dashboard.sections.no_goals') || 'Nenhuma meta ativa'}
      actionLabel={t('dashboard.sections.view_all') || 'Ver Metas'}
      actionHref="/dashboard/goals"
    >
      <SimpleGrid columns={3} spacing={3} mb={4}>
        <Box>
          <Text fontSize="xs" color="gray.600" mb={1}>Ativas</Text>
          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
            {data.activeGoals}
          </Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.600" mb={1}>Completas</Text>
          <Text fontSize="2xl" fontWeight="bold" color="green.600">
            {data.completedGoals}
          </Text>
        </Box>
        <Box>
          <Text fontSize="xs" color="gray.600" mb={1}>Ganhos</Text>
          <Text fontSize="xl" fontWeight="bold" color="green.600">
            €{data.totalRewards.toFixed(0)}
          </Text>
        </Box>
      </SimpleGrid>

      {data.nextMilestone && (
        <Box p={3} bg="blue.50" borderRadius="md">
          <HStack justify="space-between" mb={2}>
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="semibold">{data.nextMilestone.name}</Text>
              <Text fontSize="xs" color="gray.600">
                €{data.nextMilestone.reward} de prêmio
              </Text>
            </VStack>
            <Text fontSize="xs" fontWeight="bold" color="blue.600">
              {Math.round(progressPercent)}%
            </Text>
          </HStack>
          <Progress
            value={progressPercent}
            size="sm"
            colorScheme="blue"
            borderRadius="full"
            mb={1}
          />
          <Text fontSize="xs" color="gray.500">
            {Math.round(data.nextMilestone.progress)} / {data.nextMilestone.target}
          </Text>
        </Box>
      )}
    </SectionCard>
  );
}

