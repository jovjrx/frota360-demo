import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  Divider,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FiUser,
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiExternalLink,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import PainelLayout from '@/components/layouts/DashboardLayout';
import Link from 'next/link';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import { getTranslation } from '@/lib/translations';
import { formatDate, formatDateShort } from '@/lib/utils/format';
import { useState, useEffect } from 'react';
import { FiNavigation, FiTrendingUp } from 'react-icons/fi';
import {
  PendingContractsCard,
  PendingDocumentsCard,
  ReferralsPreviewCard,
  GoalsPreviewCard,
} from '@/components/dashboard/DashboardSections';

interface Motorista {
  id: string;
  fullName: string;
  email: string;
  status: string;
  type: 'affiliate' | 'renter';
  vehicle: {
    plate: string;
    model: string;
  } | null;
  createdAt: string;
}

interface Contracheque {
  id: string;
  weekStart: string;
  weekEnd: string;
  ganhosTotal: number;
  repasse: number;
  paymentStatus: string;
  paymentDate: string | null;
  paymentInfo?: {
    proofUrl?: string;
    proofFileName?: string;
  };
}

interface CartrackData {
  vehicle: {
    plate: string;
    make: string;
    model: string;
    year: number;
    kilometers: number;
    status: string;
  };
  weeklyStats: {
    totalKilometers: number;
    totalTrips: number;
    averageSpeed: number;
    totalDuration: number;
  };
}

interface PainelDashboardProps extends DashboardPageProps {
  motorista: Motorista;
  contracheques: Contracheque[];
  pendingContracts?: Array<{
    id: string;
    contractType: 'affiliate' | 'renter';
    category?: string;
    status: string;
    createdAt?: number;
  }>;
  pendingDocuments?: Array<{
    id: string;
    documentType: string;
    documentName: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    dueDate?: number;
    uploadCount: number;
    rejectionReason?: string;
  }>;
  referralsPreview?: {
    total: number;
    pending: number;
    approved: number;
    earned: number;
  };
  goalsPreview?: {
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
}

export default function PainelDashboard({ 
  motorista, 
  contracheques,
  pendingContracts,
  pendingDocuments,
  referralsPreview,
  goalsPreview,
  translations,
  locale 
}: PainelDashboardProps) {
  const router = useRouter();
  const toast = useToast();
  const [downloadingPayslipId, setDownloadingPayslipId] = useState<string | null>(null);
  const [cartrackData, setCartrackData] = useState<CartrackData | null>(null);
  const [loadingCartrack, setLoadingCartrack] = useState(false);
  
  // Buscar dados do Cartrack para motoristas renter
  useEffect(() => {
    if (motorista.type === 'renter') {
      setLoadingCartrack(true);
      fetch('/api/driver/cartrack-data')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCartrackData(data.data);
          }
        })
        .catch(err => console.error('Erro ao carregar dados do Cartrack:', err))
        .finally(() => setLoadingCartrack(false));
    }
  }, [motorista.type]);
  
  // Calcular último pagamento
  const ultimoPagamento = contracheques?.find((c: Contracheque) => c.paymentStatus === 'paid') || null;
  
  // Calcular estatísticas de pagamentos
  const paymentStats = {
    total: contracheques?.length || 0,
    paid: contracheques?.filter(c => c.paymentStatus === 'paid').length || 0,
    pending: contracheques?.filter(c => c.paymentStatus === 'pending').length || 0,
    totalEarnings: contracheques?.reduce((sum, c) => sum + (c.ganhosTotal || 0), 0) || 0,
    totalReceived: contracheques?.filter(c => c.paymentStatus === 'paid').reduce((sum, c) => sum + (c.repasse || 0), 0) || 0,
  };

  const handleDownloadPayslip = async (payslipId: string) => {
    setDownloadingPayslipId(payslipId);
    try {
      const response = await fetch(`/api/painel/contracheques/${payslipId}/pdf`);

      if (!response.ok) {
        throw new Error(tPainel("dashboard.payslips.downloadError"));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const selectedPayslip = contracheques.find(p => p.id === payslipId);
      const fileName = selectedPayslip 
        ? `resumo_${motorista.fullName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_${selectedPayslip.weekStart}_a_${selectedPayslip.weekEnd}.pdf`
        : `resumo_${payslipId}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: tPainel("dashboard.payslips.downloadSuccessTitle"),
        description: tPainel("dashboard.payslips.downloadSuccessDesc"),
        status: "success",
        duration: 3000,
      });

    } catch (error: any) {
      console.error("Erro ao baixar resumo:", error);
      toast({
        title: tPainel("dashboard.payslips.downloadErrorTitle"),
        description: error?.message || tPainel("dashboard.payslips.downloadError"),
        status: "error",
        duration: 5000,
      });
    } finally {
      setDownloadingPayslipId(null);
    }
  };

  const handleDownloadProof = async (recordId: string, weekStart: string, weekEnd: string) => {
    try {
      const response = await fetch(`/api/painel/contracheques/${recordId}/proof`);
      
      if (!response.ok) {
        throw new Error('Erro ao baixar comprovante');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `Comprovante_${motorista.fullName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_${weekStart}_a_${weekEnd}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Comprovante baixado!',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao baixar comprovante:', error);
      toast({
        title: 'Erro ao baixar comprovante',
        description: 'Tente novamente mais tarde',
        status: 'error',
        duration: 5000,
      });
    }
  };
  
  // Funções de tradução com fallbacks
  const t = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations?.common, key, variables) || key;
  };

  const tPainel = (key: string, variables?: Record<string, any>) => {
    return getTranslation(translations?.dashboard, key, variables) || key;
  };

  // Status da conta
  const statusColor = motorista.status === 'active' ? 'green' : 
                      motorista.status === 'pending' ? 'yellow' : 'red';
  
  const statusLabel = motorista.status === 'active' ? 'Ativo' :
                      motorista.status === 'pending' ? 'Pendente' :
                      motorista.status === 'suspended' ? 'Suspenso' : 'Inativo';

  const tipoLabel = motorista.type === 'renter' ? 'Locatário' : 'Afiliado';

  return (
    <PainelLayout 
      title={`Bem-vindo, ${motorista.fullName.split(' ')[0]}!`}
      subtitle="Acompanhe seus ganhos e pagamentos"
      translations={translations}
      driverType={motorista.type}
    >
      {/* Resumo Financeiro */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Dados do Motorista */}
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
          <HStack mb={4} justify="space-between">
            <HStack>
              <Icon as={FiUser} boxSize={5} color="blue.500" />
              <Text fontSize="lg" fontWeight="bold">Meus Dados</Text>
            </HStack>
            <Badge colorScheme={statusColor} fontSize="sm">
              {statusLabel}
            </Badge>
          </HStack>
          
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">Nome</Text>
              <Text fontSize="sm" fontWeight="semibold">
                {motorista.fullName}
              </Text>
            </HStack>
            
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">Email</Text>
              <Text fontSize="sm" fontWeight="semibold">
                {motorista.email}
              </Text>
            </HStack>
            
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">Tipo</Text>
              <Text fontSize="sm" fontWeight="semibold">
                {tipoLabel}
              </Text>
            </HStack>
            
            {motorista.vehicle && (
              <>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Veículo</Text>
                  <Text fontSize="sm" fontWeight="semibold">
                    {motorista.vehicle.model}
                  </Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.600">Matrícula</Text>
                  <Text fontSize="sm" fontWeight="semibold">
                    {motorista.vehicle.plate}
                  </Text>
                </HStack>
              </>
            )}
            
            <Divider />
            
            <VStack spacing={2}>
              <Button
                as={Link}
                href="/dashboard/data"
                size="sm"
                width="full"
                colorScheme="blue"
                variant="outline"
                leftIcon={<Icon as={FiUser} />}
              >
                Ver Todos os Dados
              </Button>
              <Button
                as={Link}
                href="/dashboard/profile"
                size="sm"
                width="full"
                colorScheme="gray"
                variant="outline"
                leftIcon={<Icon as={FiUser} />}
              >
                Editar Perfil
              </Button>
            </VStack>
          </VStack>
        </Box>

        {/* Último Pagamento */}
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
          <HStack mb={4}>
            <Icon as={FiCheckCircle} boxSize={5} color="green.500" />
            <Text fontSize="lg" fontWeight="bold">Último Pagamento</Text>
          </HStack>
          
          {ultimoPagamento ? (
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Semana</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  {formatDateShort(ultimoPagamento.weekStart)} - {formatDateShort(ultimoPagamento.weekEnd)}
                </Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Ganhos Total</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  €{ultimoPagamento.ganhosTotal.toFixed(2)}
                </Text>
              </HStack>
              
              <Divider />
              
              <HStack justify="space-between">
                <Text fontSize="md" fontWeight="bold">Valor Recebido</Text>
                <Text fontSize="xl" fontWeight="bold" color="green.600">
                  €{ultimoPagamento.repasse.toFixed(2)}
                </Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">Pago em</Text>
                <Text fontSize="xs" color="gray.500">
                  {formatDate(ultimoPagamento.paymentDate, '-')}
                </Text>
              </HStack>
              
              <VStack spacing={2} mt={4}>
                <Button
                  onClick={() => handleDownloadPayslip(ultimoPagamento.id)}
                  size="sm"
                  width="full"
                  colorScheme="green"
                  leftIcon={<Icon as={FiDownload} />}
                  isLoading={downloadingPayslipId === ultimoPagamento.id}
                >
                  Baixar Recibo
                </Button>
                
                {ultimoPagamento.paymentInfo?.proofUrl && (
                  <Button
                    onClick={() => handleDownloadProof(
                      ultimoPagamento.id,
                      ultimoPagamento.weekStart,
                      ultimoPagamento.weekEnd
                    )}
                    size="sm"
                    width="full"
                    colorScheme="purple"
                    variant="outline"
                    leftIcon={<Icon as={FiDownload} />}
                  >
                    Baixar Comprovante
                  </Button>
                )}
                
                <Button
                  as={Link}
                  href="/dashboard/payments"
                  size="sm"
                  width="full"
                  colorScheme="blue"
                  variant="outline"
                  leftIcon={<Icon as={FiFileText} />}
                >
                  Ver todos os pagamentos
                </Button>
              </VStack>
            </VStack>
          ) : (
            <VStack align="stretch" spacing={3} h="full" justify="center">
              <Text color="gray.500" fontSize="sm" textAlign="center">
                Nenhum pagamento realizado ainda
              </Text>
              <Button
                as={Link}
                href="/dashboard/payslips"
                size="sm"
                width="full"
                colorScheme="green"
                variant="outline"
                leftIcon={<Icon as={FiFileText} />}
              >
                Ver Resumos
              </Button>
            </VStack>
          )}
        </Box>

        {/* Rastreamento ou Ajuda & Suporte */}
        {motorista.type === 'renter' && cartrackData ? (
          <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
            <HStack mb={4}>
              <Icon as={FiNavigation} boxSize={5} color="purple.500" />
              <Text fontSize="lg" fontWeight="bold">Rastreamento</Text>
            </HStack>
            
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
                  Veículo
                </Text>
                <Text fontSize="md" fontWeight="bold">
                  {cartrackData.vehicle.make} {cartrackData.vehicle.model}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {cartrackData.vehicle.plate}
                </Text>
              </Box>

              <Divider />

              <SimpleGrid columns={2} spacing={3}>
                <Box>
                  <Text fontSize="xs" color="gray.600" mb={1}>Viagens (semana)</Text>
                  <Text fontSize="lg" fontWeight="bold">{cartrackData.weeklyStats.totalTrips}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.600" mb={1}>Km (semana)</Text>
                  <Text fontSize="lg" fontWeight="bold">{cartrackData.weeklyStats.totalKilometers.toFixed(0)} km</Text>
                </Box>
              </SimpleGrid>

              <Button
                as={Link}
                href="/dashboard/tracking"
                size="sm"
                width="full"
                colorScheme="purple"
                leftIcon={<Icon as={FiNavigation} />}
              >
                Ver Detalhes
              </Button>
            </VStack>
          </Box>
        ) : (
          <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
            <HStack mb={4}>
              <Icon as={FiFileText} boxSize={5} color="orange.500" />
              <Text fontSize="lg" fontWeight="bold">Ajuda & Suporte</Text>
            </HStack>
            
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" color="gray.600">
                Precisa de ajuda ou tem alguma dúvida? Acesse nossa página de ajuda ou entre em contato conosco.
              </Text>
              
              <Divider />
              
              <VStack spacing={2}>
                <Button
                  as={Link}
                  href="/dashboard/help"
                  size="sm"
                  width="full"
                  colorScheme="orange"
                  leftIcon={<Icon as={FiFileText} />}
                >
                  Central de Ajuda
                </Button>
                {motorista.type === 'renter' && (
                  <Button
                    as={Link}
                    href="/dashboard/tracking"
                    size="sm"
                    width="full"
                    colorScheme="gray"
                    variant="outline"
                    leftIcon={<Icon as={FiNavigation} />}
                  >
                    Rastreamento
                  </Button>
                )}
              </VStack>
            </VStack>
          </Box>
        )}
      </SimpleGrid>

      {/* Estatísticas de Pagamentos */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" borderWidth="1px" mt={6}>
        <HStack mb={4}>
          <Icon as={FiTrendingUp} boxSize={5} color="blue.500" />
          <Text fontSize="lg" fontWeight="bold">Resumo de Contracheques</Text>
        </HStack>
        
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1}>Total</Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {paymentStats.total}
            </Text>
            <Text fontSize="xs" color="gray.500">contracheques</Text>
          </Box>
          
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1}>Pagos</Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              {paymentStats.paid}
            </Text>
            <Text fontSize="xs" color="gray.500">recebidos</Text>
          </Box>
          
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1}>Pendentes</Text>
            <Text fontSize="2xl" fontWeight="bold" color="orange.600">
              {paymentStats.pending}
            </Text>
            <Text fontSize="xs" color="gray.500">aguardando</Text>
          </Box>
          
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1}>Total Ganho</Text>
            <Text fontSize="2xl" fontWeight="bold" color="purple.600">
              €{paymentStats.totalEarnings.toFixed(0)}
            </Text>
            <Text fontSize="xs" color="gray.500">em ganhos</Text>
          </Box>
          
          <Box>
            <Text fontSize="xs" color="gray.600" mb={1}>Total Recebido</Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              €{paymentStats.totalReceived.toFixed(0)}
            </Text>
            <Text fontSize="xs" color="gray.500">líquido</Text>
          </Box>
        </SimpleGrid>
        
        <Button
          as={Link}
          href="/dashboard/payslips"
          size="sm"
          mt={4}
          colorScheme="blue"
          variant="outline"
          leftIcon={<Icon as={FiFileText} />}
        >
          Ver Todos os Resumos
        </Button>
      </Box>

    
    </PainelLayout>
  );
}

export const getServerSideProps = withDashboardSSR(
  {
    loadDriverData: true,
    loadContracheques: true,
    contrachequeLimit: 10,
    loadContracts: true,
    contractLimit: 5,
    loadDocuments: true,
    documentLimit: 5,
    loadReferrals: true,
    loadGoals: true,
  },
  async (context, user, driverId) => {
    // Todos os dados já vêm automaticamente nas props base pelo withDashboardSSR
    // motorista, contracheques, pendingContracts, pendingDocuments, referralsPreview, goalsPreview
    return {};
  }
);

