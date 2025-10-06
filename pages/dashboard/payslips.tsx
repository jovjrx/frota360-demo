import { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  useToast,
  Spinner,
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
} from 'react-icons/fi';
import { useRouter } from 'next/router';
import PainelLayout from '@/components/layouts/DashboardLayout';

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
}

export default function PainelContracheques() {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [loading, setLoading] = useState(true);
  const [contracheques, setContracheques] = useState<Contracheque[]>([]);
  const [contraqueSelecionado, setContraqueSelecionado] = useState<Contracheque | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('all');

  useEffect(() => {
    carregarContracheques();
  }, [filtroStatus]);

  async function carregarContracheques() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filtroStatus !== 'all') {
        params.append('status', filtroStatus);
      }

      const res = await fetch(`/api/painel/contracheques?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const error = await res.json();
        throw new Error(error.error || 'Erro ao carregar contracheques');
      }

      const { contracheques: dados } = await res.json();
      setContracheques(dados);

    } catch (error: any) {
      console.error('Erro ao carregar contracheques:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar contracheques',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

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
      const fileName = `Contracheque_${formatarDataCurta(contracheque.weekStart)}_a_${formatarDataCurta(contracheque.weekEnd)}.pdf`;
      a.download = fileName.replace(/\//g, '-');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF gerado com sucesso!',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Tente novamente mais tarde',
        status: 'error',
        duration: 5000,
      });
    }
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function formatarDataCurta(data: string) {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  if (loading) {
    return (
      <PainelLayout 
        title="Contracheques"
        breadcrumbs={[{ label: 'Contracheques' }]}
      >
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="green.500" />
          <Text mt={4} color="gray.600">Carregando...</Text>
        </Box>
      </PainelLayout>
    );
  }

  return (
    <PainelLayout 
      title="Contracheques"
      subtitle="Histórico de pagamentos e repasses"
      breadcrumbs={[{ label: 'Contracheques' }]}
      side={
        <Select 
          value={filtroStatus} 
          onChange={(e) => setFiltroStatus(e.target.value)}
          maxW="200px"
        >
          <option value="all">Todos</option>
          <option value="paid">Pagos</option>
          <option value="pending">Pendentes</option>
        </Select>
      }
    >
      {contracheques.length === 0 ? (
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <AlertTitle>Nenhum contracheque encontrado</AlertTitle>
          <AlertDescription>
            Você ainda não possui contracheques registrados.
          </AlertDescription>
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {contracheques.map((contracheque) => {
            const isPago = contracheque.paymentStatus === 'paid';
            const statusColor = isPago ? 'green' : 'orange';
            const statusLabel = isPago ? 'PAGO' : 'PENDENTE';
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
                          Semana {formatarDataCurta(contracheque.weekStart)} - {formatarDataCurta(contracheque.weekEnd)}
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
                      <Text fontSize="sm" color="gray.600">Ganhos Total</Text>
                      <Text fontSize="sm" fontWeight="semibold">
                        €{contracheque.ganhosTotal.toFixed(2)}
                      </Text>
                    </HStack>

                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">Total Despesas</Text>
                      <Text fontSize="sm" fontWeight="semibold" color="red.600">
                        -€{contracheque.totalDespesas.toFixed(2)}
                      </Text>
                    </HStack>

                    <Divider />

                    <HStack justify="space-between">
                      <Text fontSize="md" fontWeight="bold">Repasse Líquido</Text>
                      <Text fontSize="xl" fontWeight="bold" color={statusColor + '.600'}>
                        €{contracheque.repasse.toFixed(2)}
                      </Text>
                    </HStack>
                  </VStack>

                  {/* Data de pagamento */}
                  {isPago && contracheque.paymentDate && (
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      Pago em {formatarData(contracheque.paymentDate)}
                    </Text>
                  )}

                  {/* Ações */}
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme={statusColor}
                      variant="outline"
                      leftIcon={<Icon as={FiEye} />}
                      onClick={() => abrirDetalhes(contracheque)}
                      flex={1}
                    >
                      Ver Detalhes
                    </Button>
                    <Button
                      size="sm"
                      colorScheme={statusColor}
                      leftIcon={<Icon as={FiDownload} />}
                      onClick={() => baixarPDF(contracheque)}
                      flex={1}
                    >
                      Baixar PDF
                    </Button>
                  </HStack>
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
              <Text>Contracheque Semanal</Text>
              {contraqueSelecionado && (
                <Text fontSize="sm" fontWeight="normal" color="gray.600">
                  {formatarData(contraqueSelecionado.weekStart)} - {formatarData(contraqueSelecionado.weekEnd)}
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
                    RECEITAS
                  </Text>
                  <VStack align="stretch" spacing={2} pl={4}>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Uber Total</Text>
                      <Text fontSize="sm" fontWeight="semibold">
                        €{contraqueSelecionado.uberTotal.toFixed(2)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Bolt Total</Text>
                      <Text fontSize="sm" fontWeight="semibold">
                        €{contraqueSelecionado.boltTotal.toFixed(2)}
                      </Text>
                    </HStack>
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontSize="md" fontWeight="bold">GANHOS TOTAL</Text>
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
                      <Text fontSize="sm" color="gray.600">IVA (6%)</Text>
                      <Text fontSize="sm" color="red.600">
                        -€{contraqueSelecionado.ivaValor.toFixed(2)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="semibold">Ganhos - IVA</Text>
                      <Text fontSize="sm" fontWeight="semibold">
                        €{contraqueSelecionado.ganhosMenosIVA.toFixed(2)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">Despesas Adm (7%)</Text>
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
                    DESCONTOS
                  </Text>
                  <VStack align="stretch" spacing={2} pl={4}>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Combustível</Text>
                      <Text fontSize="sm" color="red.600">
                        -€{contraqueSelecionado.combustivel.toFixed(2)}
                      </Text>
                    </HStack>
                    {contraqueSelecionado.aluguel > 0 && (
                      <HStack justify="space-between">
                        <Text fontSize="sm">Aluguel Semanal</Text>
                        <Text fontSize="sm" color="red.600">
                          -€{contraqueSelecionado.aluguel.toFixed(2)}
                        </Text>
                      </HStack>
                    )}
                    {contraqueSelecionado.viaverde > 0 && (
                      <HStack justify="space-between">
                        <Text fontSize="sm">Portagens (ViaVerde)</Text>
                        <Text fontSize="sm" color="red.600">
                          -€{contraqueSelecionado.viaverde.toFixed(2)}
                        </Text>
                      </HStack>
                    )}
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontSize="md" fontWeight="bold">TOTAL DESPESAS</Text>
                      <Text fontSize="md" fontWeight="bold" color="red.600">
                        -€{contraqueSelecionado.totalDespesas.toFixed(2)}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>

                <Divider borderWidth="2px" borderColor="gray.300" />

                {/* Repasse */}
                <Box bg="green.50" p={4} borderRadius="md">
                  <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="bold">VALOR LÍQUIDO</Text>
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
                        <Text fontSize="xs" color="gray.500">IBAN</Text>
                        <Text fontSize="xs" color="gray.500" fontFamily="mono">
                          {contraqueSelecionado.iban}
                        </Text>
                      </HStack>
                    )}
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.500">Status</Text>
                      <Badge 
                        colorScheme={contraqueSelecionado.paymentStatus === 'paid' ? 'green' : 'orange'}
                        fontSize="xs"
                      >
                        {contraqueSelecionado.paymentStatus === 'paid' ? 'PAGO' : 'PENDENTE'}
                      </Badge>
                    </HStack>
                    {contraqueSelecionado.paymentDate && (
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.500">Data de Pagamento</Text>
                        <Text fontSize="xs" color="gray.500">
                          {formatarData(contraqueSelecionado.paymentDate)}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>

                {/* Botões */}
                {contraqueSelecionado.paymentStatus === 'paid' && (
                  <Button
                    colorScheme="green"
                    leftIcon={<Icon as={FiDownload} />}
                    size="lg"
                  >
                    Baixar PDF
                  </Button>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </PainelLayout>
  );
}
