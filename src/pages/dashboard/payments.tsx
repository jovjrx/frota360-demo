import { useState } from 'react';
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiDownload,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import PainelLayout from '@/components/layouts/DashboardLayout';
import { withDashboardSSR, DashboardPageProps } from '@/lib/ssr';
import { getTranslation } from '@/lib/translations';
import { formatDate, formatDateShort } from '@/lib/utils/format';

interface Contracheque {
  id: string;
  weekId: string;
  weekStart: string;
  weekEnd: string;
  uberTotal: number;
  boltTotal: number;
  ganhosTotal: number;
  ivaValor: number;
  ganhosMenosIVA: number;
  despesasAdm: number;
  combustivel: number;
  viaverde: number;
  aluguel: number;
  totalDespesas: number;
  repasse: number;
  iban: string | null;
  paymentStatus: string;
  paymentDate: string | null;
  paymentInfo?: {
    proofUrl?: string;
    proofFileName?: string;
  };
  financingDetails?: {
    interestPercent: number;
    installment: number;
    interestAmount: number;
    totalCost: number;
    hasFinancing: boolean;
  };
}

interface PainelPaymentsProps extends DashboardPageProps {
  contracheques: Contracheque[];
  motorista?: any;
}

export default function PainelPayments({ 
  contracheques: initialContracheques,
  motorista,
  translations,
  locale 
}: PainelPaymentsProps) {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [contracheques] = useState<Contracheque[]>(initialContracheques || []);
  const [contraqueSelecionado, setContraqueSelecionado] = useState<Contracheque | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('all');

  // Funções de tradução
  const t = (key: string, fallback?: string) => {
    if (!translations?.common) return fallback || key;
    return getTranslation(translations.common, key) || fallback || key;
  };

  const tDashboard = (key: string, fallback?: string) => {
    if (!translations?.dashboard) return fallback || key;
    return getTranslation(translations.dashboard, key) || fallback || key;
  };

  // Filtrar contracheques no lado do cliente
  const contrachequesFiltrados = filtroStatus === 'all' 
    ? contracheques 
    : contracheques.filter(c => c.paymentStatus === filtroStatus);

  function abrirDetalhes(contracheque: Contracheque) {
    setContraqueSelecionado(contracheque);
    onOpen();
  }

  async function baixarPDF(contracheque: Contracheque) {
    try {
      const response = await fetch(`/api/painel/contracheques/${contracheque.id}/pdf`);
      
      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `Pagamentos_${formatDateShort(contracheque.weekStart)}_a_${formatDateShort(contracheque.weekEnd)}.pdf`;
      a.download = fileName.replace(/\//g, '-');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: tDashboard('payments.toast.pdf_success', 'PDF gerado com sucesso!'),
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast({
        title: tDashboard('payments.toast.pdf_error', 'Erro ao gerar PDF'),
        description: tDashboard('payments.toast.try_again', 'Tente novamente mais tarde'),
        status: 'error',
        duration: 5000,
      });
    }
  }

  async function baixarComprovante(recordId: string, weekStart: string, weekEnd: string) {
    try {
      const response = await fetch(`/api/painel/contracheques/${recordId}/proof`);
      
      if (!response.ok) {
        throw new Error('Erro ao baixar comprovante');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `Comprovante_${formatDateShort(weekStart)}_a_${formatDateShort(weekEnd)}.pdf`;
      a.download = fileName.replace(/\//g, '-');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: tDashboard('payments.toast.proof_success', 'Comprovante baixado!'),
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao baixar comprovante:', error);
      toast({
        title: tDashboard('payments.toast.proof_error', 'Erro ao baixar comprovante'),
        description: tDashboard('payments.toast.try_again', 'Tente novamente mais tarde'),
        status: 'error',
        duration: 5000,
      });
    }
  }

  // Funções de formatação movidas para lib/utils/format.ts
  // Usando formatDate e formatDateShort para evitar problemas de timezone

  return (
    <PainelLayout 
      title={tDashboard('payments.title', 'Pagamentos')}
      subtitle={tDashboard('payments.subtitle', 'Histórico de pagamentos e repasses')}
      breadcrumbs={[{ label: tDashboard('payments.breadcrumb', 'Pagamentos') }]}
      translations={translations}
      driverType={motorista?.type}
      side={
        <Select 
          value={filtroStatus} 
          onChange={(e) => setFiltroStatus(e.target.value)}
          maxW="200px"
        >
          <option value="all">{tDashboard('payments.filter.all', 'Todos')}</option>
          <option value="paid">{tDashboard('payments.filter.paid', 'Pagos')}</option>
          <option value="pending">{tDashboard('payments.filter.pending', 'Pendentes')}</option>
        </Select>
      }
    >
      {contrachequesFiltrados.length === 0 ? (
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>
            {filtroStatus === 'all' 
              ? tDashboard('payments.empty.all', 'Nenhum pagamento encontrado')
              : `${tDashboard('payments.empty.filtered', 'Nenhum pagamento')} ${filtroStatus === 'paid' ? tDashboard('payments.filter.paid', 'pago') : tDashboard('payments.filter.pending', 'pendente')}`
            }
          </AlertTitle>
          <AlertDescription>
            {filtroStatus === 'all'
              ? tDashboard('payments.empty.description', 'Você ainda não possui pagamentos registrados.')
              : tDashboard('payments.empty.filtered_description', 'Não há pagamentos com este status.')
            }
          </AlertDescription>
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {contrachequesFiltrados.map((contracheque) => {
            const isPago = contracheque.paymentStatus === 'paid';
            const statusColor = isPago ? 'green' : 'orange';
            const statusLabel = isPago 
              ? tDashboard('payments.status.paid', 'PAGO')
              : tDashboard('payments.status.pending', 'PENDENTE');
            const statusIcon = isPago ? FiCheckCircle : FiClock;

            return (
              <Box 
                key={contracheque.id}
                bg="white" 
                p={6} 
                borderRadius="lg" 
                shadow="sm" 
                borderWidth="1px"
                borderColor={isPago ? 'green.200' : 'orange.200'}
                transition="all 0.2s"
                _hover={{ shadow: 'md', borderColor: statusColor + '.300' }}
              >
                <VStack align="stretch" spacing={4}>
                  {/* Header */}
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={statusIcon} boxSize={5} color={statusColor + '.500'} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold" color="gray.700">
                          {tDashboard('payments.week', 'Semana')} {formatDateShort(contracheque.weekStart)} - {formatDateShort(contracheque.weekEnd)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {contracheque.weekId}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge colorScheme={statusColor} fontSize="xs">
                      {statusLabel}
                    </Badge>
                  </HStack>

                  <Divider />

                  {/* Valores */}
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">{tDashboard('payments.earnings.total', 'Ganhos Total')}</Text>
                      <Text fontSize="sm" fontWeight="semibold">
                        €{contracheque.ganhosTotal.toFixed(2)}
                      </Text>
                    </HStack>

                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">{tDashboard('payments.expenses.total', 'Total Despesas')}</Text>
                      <Text fontSize="sm" fontWeight="semibold" color="red.600">
                        -€{contracheque.totalDespesas.toFixed(2)}
                      </Text>
                    </HStack>

                    <Divider />

                    <HStack justify="space-between">
                      <Text fontSize="md" fontWeight="bold">{tDashboard('payments.net.transfer', 'Repasse Líquido')}</Text>
                      <Text fontSize="xl" fontWeight="bold" color={statusColor + '.600'}>
                        €{contracheque.repasse.toFixed(2)}
                      </Text>
                    </HStack>
                  </VStack>

                  {/* Data de pagamento */}
                  {isPago && contracheque.paymentDate && (
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      {tDashboard('payments.paid_on', 'Pago em')} {formatDate(contracheque.paymentDate)}
                    </Text>
                  )}

                  {/* Ações */}
                  <VStack spacing={2} width="full">
                    <HStack spacing={2} width="full">
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        leftIcon={<Icon as={FiEye} />}
                        onClick={() => abrirDetalhes(contracheque)}
                        flex={1}
                      >
                        {tDashboard('payments.view_details', 'Ver Detalhes')}
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<Icon as={FiDownload} />}
                        onClick={() => baixarPDF(contracheque)}
                        flex={1}
                      >
                        {tDashboard('payments.download', 'Baixar')}
                      </Button>
                    </HStack>
                    
                    {/* Botão de comprovante (se houver) */}
                    {isPago && contracheque.paymentInfo?.proofUrl && (
                      <Button
                        size="sm"
                        width="full"
                        colorScheme="purple"
                        variant="outline"
                        leftIcon={<Icon as={FiDownload} />}
                        onClick={() => baixarComprovante(
                          contracheque.id,
                          contracheque.weekStart,
                          contracheque.weekEnd
                        )}
                      >
                        {tDashboard('payments.download_proof', 'Baixar Comprovante')}
                      </Button>
                    )}
                  </VStack>
                </VStack>
              </Box>
            );
          })}
        </SimpleGrid>
      )}

      {/* Modal de Detalhes */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Text>{tDashboard('payments.modal_title', 'Detalhes de Pagamento')}</Text>
              {contraqueSelecionado && (
                <Text fontSize="sm" fontWeight="normal" color="gray.600">
                  {formatDate(contraqueSelecionado.weekStart)} - {formatDate(contraqueSelecionado.weekEnd)}
                </Text>
              )}
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {contraqueSelecionado && (
              <VStack align="stretch" spacing={4}>
                {/* Receitas */}
                <Box>
                  <Text fontSize="md" fontWeight="bold" mb={3} color="green.700">
                    {tDashboard('payments.earnings_title', 'RECEITAS')}
                  </Text>
                  <VStack align="stretch" spacing={2} pl={4}>
                    <HStack justify="space-between">
                      <Text fontSize="sm">{tDashboard('payments.earnings.uber', 'Uber Total')}</Text>
                      <Text fontSize="sm" fontWeight="semibold">
                        €{contraqueSelecionado.uberTotal.toFixed(2)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">{tDashboard('payments.earnings.bolt', 'Bolt Total')}</Text>
                      <Text fontSize="sm" fontWeight="semibold">
                        €{contraqueSelecionado.boltTotal.toFixed(2)}
                      </Text>
                    </HStack>
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontSize="md" fontWeight="bold">{tDashboard('payments.earnings.total', 'GANHOS TOTAL')}</Text>
                      <Text fontSize="md" fontWeight="bold">
                        €{contraqueSelecionado.ganhosTotal.toFixed(2)}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>

                <Divider />

                {/* Cálculos */}
                <Box>
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">{tDashboard('payments.iva', 'IVA (6%)')}</Text>
                      <Text fontSize="sm" color="red.600">
                        -€{contraqueSelecionado.ivaValor.toFixed(2)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="semibold">{tDashboard('payments.earnings_minus_iva', 'Ganhos - IVA')}</Text>
                      <Text fontSize="sm" fontWeight="semibold">
                        €{contraqueSelecionado.ganhosMenosIVA.toFixed(2)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        {tDashboard('payments.expenses.admin', 'Despesas Adm (7%)')}
                      </Text>
                      <Text fontSize="sm" color="red.600">
                        -€{contraqueSelecionado.despesasAdm.toFixed(2)}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>

                <Divider />

                {/* Descontos */}
                <Box>
                  <Text fontSize="md" fontWeight="bold" mb={3} color="red.700">
                    {tDashboard('payments.discounts_title', 'DESCONTOS')}
                  </Text>
                  <VStack align="stretch" spacing={2} pl={4}>
                    <HStack justify="space-between">
                      <Text fontSize="sm">{tDashboard('payments.expenses.fuel', 'Combustível')}</Text>
                      <Text fontSize="sm" color="red.600">
                        -€{contraqueSelecionado.combustivel.toFixed(2)}
                      </Text>
                    </HStack>
                    {contraqueSelecionado.aluguel > 0 && (
                      <HStack justify="space-between">
                        <Text fontSize="sm">{tDashboard('payments.expenses.rent', 'Aluguel Semanal')}</Text>
                        <Text fontSize="sm" color="red.600">
                          -€{contraqueSelecionado.aluguel.toFixed(2)}
                        </Text>
                      </HStack>
                    )}
                    {contraqueSelecionado.viaverde > 0 && (
                      <HStack justify="space-between">
                        <Text fontSize="sm">{tDashboard('payments.expenses.tolls', 'Portagens (ViaVerde)')}</Text>
                        <Text fontSize="sm" color="red.600">
                          -€{contraqueSelecionado.viaverde.toFixed(2)}
                        </Text>
                      </HStack>
                    )}
                    {contraqueSelecionado.financingDetails?.totalCost && contraqueSelecionado.financingDetails.totalCost > 0 && (
                      <>
                        <HStack justify="space-between">
                          <Text fontSize="sm">{tDashboard('payments.expenses.financing', 'Financiamento (parcela)')}</Text>
                          <Text fontSize="sm" color="pink.600">
                            -€{contraqueSelecionado.financingDetails.installment.toFixed(2)}
                          </Text>
                        </HStack>
                        {contraqueSelecionado.financingDetails.interestAmount > 0 && (
                          <HStack justify="space-between">
                            <Text fontSize="sm" pl={4}>{tDashboard('payments.expenses.interest', 'Juros')} ({contraqueSelecionado.financingDetails.interestPercent}%)</Text>
                            <Text fontSize="sm" color="pink.600">
                              -€{contraqueSelecionado.financingDetails.interestAmount.toFixed(2)}
                            </Text>
                          </HStack>
                        )}
                      </>
                    )}
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontSize="md" fontWeight="bold">{tDashboard('payments.total_expenses', 'TOTAL DESPESAS')}</Text>
                      <Text fontSize="md" fontWeight="bold" color="red.600">
                        -€{(contraqueSelecionado.totalDespesas + (contraqueSelecionado.financingDetails?.totalCost || 0)).toFixed(2)}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>

                <Divider borderWidth="2px" borderColor="gray.300" />

                {/* Repasse */}
                <Box bg="green.50" p={4} borderRadius="md">
                  <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="bold">{tDashboard('payments.net_value', 'VALOR LÍQUIDO')}</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      €{contraqueSelecionado.repasse.toFixed(2)}
                    </Text>
                  </HStack>
                </Box>

                {/* Informações de Pagamento */}
                <Box>
                  <VStack align="stretch" spacing={2}>
                    {contraqueSelecionado.iban && (
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.500">{tDashboard('payments.iban', 'IBAN')}</Text>
                        <Text fontSize="xs" color="gray.500" fontFamily="mono">
                          {contraqueSelecionado.iban}
                        </Text>
                      </HStack>
                    )}
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.500">{tDashboard('payments.status_label', 'Status')}</Text>
                      <Badge 
                        colorScheme={contraqueSelecionado.paymentStatus === 'paid' ? 'green' : 'orange'}
                        fontSize="xs"
                      >
                        {contraqueSelecionado.paymentStatus === 'paid' ? tDashboard('payments.status.paid', 'PAGO') : tDashboard('payments.status.pending', 'PENDENTE')}
                      </Badge>
                    </HStack>
                    {contraqueSelecionado.paymentDate && (
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.500">{tDashboard('payments.payment_date_label', 'Data de Pagamento')}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {formatDate(contraqueSelecionado.paymentDate)}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>

                {/* Botões */}
                <VStack spacing={3} width="full">
                  <Button
                    width="full"
                    colorScheme="green"
                    leftIcon={<Icon as={FiDownload} />}
                    onClick={() => baixarPDF(contraqueSelecionado)}
                    size="lg"
                  >
                    {tDashboard('payments.download_payslip', 'Baixar Comprovante (PDF)')}
                  </Button>
                  
                  {contraqueSelecionado.paymentStatus === 'paid' && contraqueSelecionado.paymentInfo?.proofUrl && (
                    <Button
                      width="full"
                      colorScheme="purple"
                      variant="outline"
                      leftIcon={<Icon as={FiDownload} />}
                      onClick={() => baixarComprovante(
                        contraqueSelecionado.id,
                        contraqueSelecionado.weekStart,
                        contraqueSelecionado.weekEnd
                      )}
                      size="lg"
                    >
                      {tDashboard('payments.download_proof', 'Baixar Comprovante de Pagamento')}
                    </Button>
                  )}
                </VStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </PainelLayout>
  );
}

export const getServerSideProps = withDashboardSSR(
  { loadDriverData: false, loadContracheques: true, contrachequeLimit: 50 },
  async (context, user, driverId) => {
    // contracheques já vêm automaticamente nas props base
    return {};
  }
);
