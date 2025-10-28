import {
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Icon,
} from '@chakra-ui/react';
import { FiDownload, FiUploadCloud, FiAlertTriangle, FiCheckCircle, FiClock } from 'react-icons/fi';
import type { DriverContract } from '@/schemas/driver-contract';

interface ContractStatusCardProps {
  contract: DriverContract | null;
  onDownloadTemplate: () => void;
  onUploadClick: () => void;
  isDownloading?: boolean;
  isUploading?: boolean;
}

const STATUS_LABELS: Record<DriverContract['status'], { label: string; color: string; icon: typeof FiClock; description: string }> = {
  pending_signature: {
    label: 'Pendente de assinatura',
    color: 'yellow',
    icon: FiClock,
    description: 'Baixe o contrato, assine e envie para concluir o processo.',
  },
  submitted: {
    label: 'Submetido',
    color: 'blue',
    icon: FiUploadCloud,
    description: 'Documento recebido. Aguarde validação da equipa administrativa.',
  },
  approved: {
    label: 'Aprovado',
    color: 'green',
    icon: FiCheckCircle,
    description: 'Contrato aprovado. Não são necessárias ações adicionais.',
  },
  rejected: {
    label: 'Rejeitado',
    color: 'red',
    icon: FiAlertTriangle,
    description: 'O documento foi rejeitado. Revise o motivo e reenviar novo arquivo.',
  },
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export function ContractStatusCard({
  contract,
  onDownloadTemplate,
  onUploadClick,
  isDownloading = false,
  isUploading = false,
}: ContractStatusCardProps) {
  const statusConfig = contract ? STATUS_LABELS[contract.status] : STATUS_LABELS.pending_signature;
  const contractType = contract?.contractType ?? 'affiliate';

  return (
    <Card variant="outline">
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <VStack align="start" spacing={1}>
            <Heading size="sm">Estado do contrato</Heading>
            <HStack spacing={2}>
              <Badge colorScheme={contractType === 'renter' ? 'purple' : 'blue'}>
                {contractType === 'renter' ? 'Locatário' : 'Afiliado'}
              </Badge>
              <Badge colorScheme={statusConfig.color}>{statusConfig.label}</Badge>
            </HStack>
            <HStack spacing={2} color="gray.600">
              <Icon as={statusConfig.icon} />
              <Text fontSize="sm">{statusConfig.description}</Text>
            </HStack>
          </VStack>

          {contract?.rejectionReason && (
            <VStack align="start" spacing={1} bg="red.50" borderRadius="md" p={3}>
              <HStack spacing={2} color="red.600">
                <Icon as={FiAlertTriangle} />
                <Text fontWeight="semibold">Motivo da rejeição</Text>
              </HStack>
              <Text fontSize="sm" color="red.700">{contract.rejectionReason}</Text>
            </VStack>
          )}

          <HStack spacing={10} flexWrap="wrap">
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500">Último envio</Text>
              <Text fontWeight="semibold">{formatDate(contract?.submittedAt ?? null)}</Text>
            </VStack>
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500">Última atualização</Text>
              <Text fontWeight="semibold">{formatDate(contract?.updatedAt ?? null)}</Text>
            </VStack>
            <VStack align="start" spacing={0}>
              <Text fontSize="xs" color="gray.500">Versão do modelo</Text>
              <Text fontWeight="semibold">{contract?.templateVersion ?? '—'}</Text>
            </VStack>
          </HStack>

          <HStack spacing={3} flexWrap="wrap">
            <Button
              leftIcon={<FiDownload />}
              colorScheme="blue"
              variant="outline"
              onClick={onDownloadTemplate}
              isLoading={isDownloading}
            >
              Baixar modelo
            </Button>
            <Button
              leftIcon={<FiUploadCloud />}
              colorScheme="green"
              onClick={onUploadClick}
              isLoading={isUploading}
            >
              Enviar contrato assinado
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
}

