'use client';

import { useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import {
  VStack,
  HStack,
  Box,
  Button,
  Icon,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Input,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  SimpleGrid,
  Progress,
  Tooltip,
  Divider,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  FiUpload,
  FiRefreshCw,
  FiPlay,
  FiActivity,
  FiClock,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { WeeklyNormalizedData } from '@/schemas/data-weekly';

interface WeeklyDataTabContentProps {
  weekId: string;
  initialWeeklyData: WeeklyNormalizedData[];
  tCommon: Record<string, any> | ((key: string, variables?: Record<string, any>) => string);
  tPage: Record<string, any> | ((key: string, variables?: Record<string, any>) => string);
}

interface IntegrationStatus {
  platform: 'uber' | 'bolt' | 'myprio' | 'viaverde' | 'cartrack';
  name: string;
  label: string;
  status: 'synced' | 'pending' | 'error';
  lastSync?: string;
  recordCount?: number;
  source: 'api' | 'upload' | 'pending';
}

interface DriverSyncInfo {
  driverId: string;
  driverName: string;
  type: 'affiliate' | 'renter';
  integrations: IntegrationStatus[];
  hasPaymentGenerated: boolean;
}

export default function WeeklyDataTabContent({
  weekId,
  initialWeeklyData,
  tCommon,
  tPage,
}: WeeklyDataTabContentProps) {
  const tc = createSafeTranslator(
    (typeof tCommon === 'function' 
      ? tCommon 
      : (() => '') as any) as (key: string, variables?: Record<string, any>) => string
  );
  const t = createSafeTranslator(
    (typeof tPage === 'function' 
      ? tPage 
      : (() => '') as any) as (key: string, variables?: Record<string, any>) => string
  );
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Local state
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reprocessingPlatform, setReprocessingPlatform] = useState<string | null>(null);

  // SWR to fetch weekly data
  const { data: swrData, isLoading, mutate } = useSWR(
    weekId ? `/api/admin/weekly/data?weekId=${weekId}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch data');
      return res.json();
    },
    {
      fallbackData: { records: initialWeeklyData || [] },
      revalidateOnFocus: false,
      dedupingInterval: 0,
    }
  );

  const weeklyData = swrData?.records || initialWeeklyData || [];

  // Fetch drivers with sync info
  const { data: driversData, isLoading: driversLoading } = useSWR(
    weekId ? `/api/admin/weekly/drivers-sync?weekId=${weekId}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch drivers');
      return res.json();
    },
    {
      fallbackData: { drivers: [] },
      revalidateOnFocus: false,
    }
  );

  const drivers: DriverSyncInfo[] = driversData?.drivers || [];

  // Computed
  const totalDrivers = drivers.length;
  const driversWithPayment = drivers.filter(d => d.hasPaymentGenerated).length;
  const canReprocess = driversWithPayment === 0; // Só reprocessa se nenhum teve pagamento gerado

  // Handlers
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('weekId', weekId);

    try {
      const response = await fetch('/api/admin/imports/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || 'Erro ao fazer upload');
      }

      toast({
        title: 'Arquivo importado com sucesso!',
        status: 'success',
        duration: 3000,
      });
      
      mutate();
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error?.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleReprocessIntegration = async (platform: string) => {
    if (!canReprocess) {
      toast({
        title: 'Não é possível reprocessar',
        description: 'Já foram gerados pagamentos. Para reprocessar, crie uma nova semana ou revert os pagamentos.',
        status: 'warning',
        duration: 4000,
      });
      return;
    }

    setReprocessingPlatform(platform);
    try {
      const response = await fetch('/api/admin/imports/reprocess-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, platform }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || 'Erro ao reprocessar');
      }

      toast({
        title: `${platform.toUpperCase()} reprocessado!`,
        status: 'success',
        duration: 3000,
      });
      
      mutate();
    } catch (error: any) {
      toast({
        title: 'Erro ao reprocessar',
        description: error?.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setReprocessingPlatform(null);
    }
  };

  const handleProcessPayments = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/imports/process-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || 'Erro ao processar pagamentos');
      }

      const result = await response.json();
      
      toast({
        title: 'Pagamentos processados!',
        description: `${result.processed} motoristas processados`,
        status: 'success',
        duration: 3000,
      });
      
      mutate();
    } catch (error: any) {
      toast({
        title: 'Erro no processamento',
        description: error?.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Status cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card>
          <CardBody>
            <HStack justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.600">Motoristas ativos</Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">{totalDrivers}</Text>
              </Box>
              <Icon as={FiActivity} w={8} h={8} color="blue.200" />
            </HStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <HStack justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.600">Pagamentos gerados</Text>
                <Text fontSize="2xl" fontWeight="bold" color={driversWithPayment > 0 ? 'green.600' : 'gray.400'}>
                  {driversWithPayment}/{totalDrivers}
                </Text>
              </Box>
              <Icon as={driversWithPayment > 0 ? FiCheck : FiClock} w={8} h={8} color={driversWithPayment > 0 ? 'green.200' : 'yellow.200'} />
            </HStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <HStack justify="space-between">
              <Box>
                <Text fontSize="sm" color="gray.600">Reprocessamento</Text>
                <Text fontSize="2xl" fontWeight="bold" color={canReprocess ? 'green.600' : 'red.600'}>
                  {canReprocess ? 'Permitido' : 'Bloqueado'}
                </Text>
              </Box>
              <Icon as={canReprocess ? FiCheck : FiAlertCircle} w={8} h={8} color={canReprocess ? 'green.200' : 'red.200'} />
            </HStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Divider />

      {/* Motoristas e integrações */}
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <Text fontWeight="bold" fontSize="lg">Dados de Integração por Motorista</Text>
            {driversLoading && <Spinner size="sm" />}
          </HStack>
        </CardHeader>
        <CardBody>
          {driversLoading ? (
            <HStack justify="center" py={8}>
              <Spinner />
              <Text>Carregando dados...</Text>
            </HStack>
          ) : drivers.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Nenhum motorista ativo</AlertTitle>
                <AlertDescription>Esta semana não tem motoristas registrados</AlertDescription>
              </Box>
            </Alert>
          ) : isMobile ? (
            // Mobile: Cards
            <VStack spacing={3}>
              {drivers.map((driver) => (
                <Card key={driver.driverId} w="full" borderWidth={1}>
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <HStack justify="space-between" w="full">
                        <Box>
                          <Text fontWeight="bold">{driver.driverName}</Text>
                          <HStack spacing={2}>
                            <Badge colorScheme={driver.type === 'renter' ? 'purple' : 'green'}>
                              {driver.type === 'renter' ? 'Locatário' : 'Afiliado'}
                            </Badge>
                            {driver.hasPaymentGenerated && (
                              <Badge colorScheme="green">Pago</Badge>
                            )}
                          </HStack>
                        </Box>
                      </HStack>
                      
                      <Box w="full">
                        <Text fontSize="xs" fontWeight="bold" mb={2}>Integrações:</Text>
                        <VStack spacing={1} align="start">
                          {driver.integrations.map((int) => (
                            <HStack key={int.platform} spacing={2} fontSize="xs" w="full">
                              <Badge 
                                colorScheme={
                                  int.status === 'synced' ? 'green' : 
                                  int.status === 'error' ? 'red' : 'yellow'
                                }
                                minW="60px"
                              >
                                {int.status === 'synced' ? '✓ Sync' : int.status === 'error' ? 'Erro' : 'Pendente'}
                              </Badge>
                              <Text flex="1">{int.label}</Text>
                              <Text color="gray.500">({int.source})</Text>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>

                      {canReprocess && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          w="full"
                          onClick={() => handleReprocessIntegration(driver.driverId)}
                          isLoading={reprocessingPlatform === driver.driverId}
                        >
                          Reprocessar integração
                        </Button>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          ) : (
            // Desktop: Table
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Motorista</Th>
                    <Th>Tipo</Th>
                    <Th>Uber</Th>
                    <Th>Bolt</Th>
                    <Th>MyPrio</Th>
                    <Th>ViaVerde</Th>
                    <Th>Status</Th>
                    <Th textAlign="right">Ações</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {drivers.map((driver) => {
                    const uberInt = driver.integrations.find(i => i.platform === 'uber');
                    const boltInt = driver.integrations.find(i => i.platform === 'bolt');
                    const myprioInt = driver.integrations.find(i => i.platform === 'myprio');
                    const viaverdeInt = driver.integrations.find(i => i.platform === 'viaverde');

                    return (
                      <Tr key={driver.driverId}>
                        <Td fontWeight="medium">{driver.driverName}</Td>
                        <Td>
                          <Badge colorScheme={driver.type === 'renter' ? 'purple' : 'green'}>
                            {driver.type === 'renter' ? 'Locatário' : 'Afiliado'}
                          </Badge>
                        </Td>
                        <Td>
                          <Tooltip label={uberInt?.source} placement="top">
                            <Badge colorScheme={uberInt?.status === 'synced' ? 'green' : uberInt?.status === 'error' ? 'red' : 'yellow'}>
                              {uberInt?.status === 'synced' ? '✓' : '○'}
                            </Badge>
                          </Tooltip>
                        </Td>
                        <Td>
                          <Tooltip label={boltInt?.source} placement="top">
                            <Badge colorScheme={boltInt?.status === 'synced' ? 'green' : boltInt?.status === 'error' ? 'red' : 'yellow'}>
                              {boltInt?.status === 'synced' ? '✓' : '○'}
                            </Badge>
                          </Tooltip>
                        </Td>
                        <Td>
                          <Tooltip label={myprioInt?.source} placement="top">
                            <Badge colorScheme={myprioInt?.status === 'synced' ? 'green' : myprioInt?.status === 'error' ? 'red' : 'yellow'}>
                              {myprioInt?.status === 'synced' ? '✓' : '○'}
                            </Badge>
                          </Tooltip>
                        </Td>
                        <Td>
                          <Tooltip label={viaverdeInt?.source} placement="top">
                            <Badge colorScheme={viaverdeInt?.status === 'synced' ? 'green' : viaverdeInt?.status === 'error' ? 'red' : 'yellow'}>
                              {viaverdeInt?.status === 'synced' ? '✓' : '○'}
                            </Badge>
                          </Tooltip>
                        </Td>
                        <Td>
                          {driver.hasPaymentGenerated ? (
                            <Badge colorScheme="green">Pago</Badge>
                          ) : (
                            <Badge colorScheme="yellow">Pendente</Badge>
                          )}
                        </Td>
                        <Td textAlign="right">
                          {canReprocess && (
                            <Button
                              size="xs"
                              colorScheme="blue"
                              onClick={() => handleReprocessIntegration(driver.driverId)}
                              isLoading={reprocessingPlatform === driver.driverId}
                            >
                              Reprocessar
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      <Divider />

      {/* Action Buttons */}
      <HStack spacing={4} flexWrap="wrap">
        <Button
          leftIcon={<Icon as={FiUpload} />}
          onClick={() => fileInputRef.current?.click()}
          isLoading={isUploadingFile}
          loadingText="Enviando..."
          colorScheme="blue"
        >
          Importar Arquivo
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleImportFile}
          accept=".xlsx,.xls,.csv"
        />

        <Button
          leftIcon={<Icon as={FiPlay} />}
          onClick={handleProcessPayments}
          isLoading={isProcessing}
          loadingText="Processando..."
          colorScheme="green"
          isDisabled={!canReprocess && driversWithPayment === 0}
        >
          Processar Pagamentos
        </Button>
      </HStack>

      {!canReprocess && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Reprocessamento bloqueado</AlertTitle>
            <AlertDescription>
              {driversWithPayment} de {totalDrivers} motoristas já têm pagamentos gerados. Para reprocessar, você precisa reverter os pagamentos primeiro.
            </AlertDescription>
          </Box>
        </Alert>
      )}
    </VStack>
  );
}