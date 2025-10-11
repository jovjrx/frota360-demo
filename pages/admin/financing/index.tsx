import { useState, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  Box,
  Heading,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  useToast,
  Card,
  CardBody,
  Badge,
  Icon,
  IconButton,
  Tooltip,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import { FiDollarSign, FiPlus, FiUpload, FiDownload, FiFileText } from 'react-icons/fi';
import FinancingProofUpload from '@/components/admin/FinancingProofUpload';
import useSWR, { SWRConfig } from 'swr';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { getDrivers } from '@/lib/admin/adminQueries';
import { adminDb } from '@/lib/firebaseAdmin';
import { useRouter } from 'next/router';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Driver {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  status?: string;
}

interface AdminFinancingPageProps extends AdminPageProps {
  initialDrivers: Driver[];
  initialFinancing: any[];
}

function AdminFinancingPageContent({
  user,
  locale,
  initialDrivers,
  initialFinancing,
  tCommon,
  tPage,
  translations,
}: AdminFinancingPageProps) {
  const router = useRouter();
  const toast = useToast();
  const { data, mutate } = useSWR('/api/admin/financing', fetcher);
  const financing: any[] = data?.financing || initialFinancing || [];

  const [driverId, setDriverId] = useState('');
  const [type, setType] = useState('loan');
  const [amount, setAmount] = useState('');
  const [weeks, setWeeks] = useState('');
  const [weeklyInterest, setWeeklyInterest] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFinancingId, setSelectedFinancingId] = useState<string | null>(null);
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();

  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverId) {
      toast({ title: tc('error', 'Erro'), description: 'Selecione o motorista', status: 'error' });
      return;
    }
    const parsedAmount = parseFloat(amount) || 0;
    const parsedWeeks = weeks ? parseInt(weeks, 10) : null;
    const parsedInterest = weeklyInterest ? parseFloat(weeklyInterest) : 0;
    if (type === 'loan' && (!parsedWeeks || parsedWeeks <= 0)) {
      toast({ title: tc('error', 'Erro'), description: 'Informe o número de semanas', status: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/financing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          driverId, 
          type, 
          amount: parsedAmount, 
          weeks: parsedWeeks, 
          weeklyInterest: parsedInterest,
          notes: notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro');
      
      toast({ 
        title: tc('success', 'Sucesso'), 
        description: 'Financiamento criado com sucesso!', 
        status: 'success',
        duration: 3000,
      });
      
      setDriverId('');
      setAmount('');
      setWeeks('');
      setWeeklyInterest('');
      setNotes('');
      
      mutate();
      
      // Perguntar se quer anexar comprovante (opcional)
      if (json.id) {
        setTimeout(() => {
          if (window.confirm('Deseja anexar o comprovante de pagamento agora?')) {
            setSelectedFinancingId(json.id);
            onUploadOpen();
          }
        }, 500);
      }
    } catch (err: any) {
      toast({ title: tc('error', 'Erro'), description: err.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'loan' ? (
      <Badge colorScheme="blue">Empréstimo</Badge>
    ) : (
      <Badge colorScheme="purple">Desconto</Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge colorScheme="green">Ativo</Badge>
    ) : (
      <Badge colorScheme="gray">Completo</Badge>
    );
  };

  return (
    <AdminLayout
      title={t('financing.title', 'Financiamentos')}
      subtitle={t('financing.subtitle', 'Gerencie financiamentos e descontos dos motoristas')}
      breadcrumbs={[
        { label: t('financing.title', 'Financiamentos') }
      ]}
      translations={translations}
      side={
        <Button
          leftIcon={<Icon as={FiPlus} />}
          colorScheme="blue"
          size="sm"
          onClick={() => router.push('/admin/financing/requests')}
        >
          {t('financing.viewRequests', 'Ver Solicitações')}
        </Button>
      }
    >
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <Box as="form" onSubmit={handleSubmit}>
              <Heading size="sm" mb={4}>
                <Icon as={FiDollarSign} mr={2} />
                {t('financing.create.title', 'Criar Financiamento/Desconto')}
              </Heading>
              <HStack spacing={4} align="flex-end" wrap="wrap">
                <FormControl isRequired flex="1" minW="200px">
                  <FormLabel>{t('financing.form.driver', 'Motorista')}</FormLabel>
                  <Select placeholder={tc('select', 'Selecione')} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                    {initialDrivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.fullName || d.name}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired minW="150px">
                  <FormLabel>{t('financing.form.type', 'Tipo')}</FormLabel>
                  <Select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="loan">{t('financing.type.loan', 'Empréstimo')}</option>
                    <option value="discount">{t('financing.type.discount', 'Desconto')}</option>
                  </Select>
                </FormControl>
                <FormControl isRequired minW="150px">
                  <FormLabel>{t('financing.form.amount', 'Valor (€)')}</FormLabel>
                  <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </FormControl>
                {type === 'loan' && (
                  <FormControl isRequired minW="120px">
                    <FormLabel>{t('financing.form.weeks', 'Semanas')}</FormLabel>
                    <Input type="number" value={weeks} onChange={(e) => setWeeks(e.target.value)} />
                  </FormControl>
                )}
                <FormControl minW="150px">
                  <FormLabel>{t('financing.form.interest', 'Juros/semana (€)')}</FormLabel>
                  <Input type="number" step="0.01" value={weeklyInterest} onChange={(e) => setWeeklyInterest(e.target.value)} />
                </FormControl>
              </HStack>
              <FormControl mt={4}>
                <FormLabel>{t('financing.form.notes', 'Observações (opcional)')}</FormLabel>
                <Textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais sobre o financiamento..."
                  rows={2}
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={loading} mt={4}>
                {tc('create', 'Criar')}
              </Button>
            </Box>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Heading size="sm" mb={4}>{t('financing.list.title', 'Financiamentos Existentes')}</Heading>
            {financing.length === 0 ? (
              <Text color="gray.500">{t('financing.list.empty', 'Nenhum financiamento encontrado.')}</Text>
            ) : (
              <Box overflowX="auto">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>{t('financing.table.driver', 'Motorista')}</Th>
                      <Th>{t('financing.table.type', 'Tipo')}</Th>
                      <Th>{t('financing.table.amount', 'Valor (€)')}</Th>
                      <Th>{t('financing.table.weeks', 'Semanas')}</Th>
                      <Th>{t('financing.table.interest', 'Juros/sem (€)')}</Th>
                      <Th>{t('financing.table.remaining', 'Restante')}</Th>
                      <Th>{t('financing.table.start', 'Início')}</Th>
                      <Th>{t('financing.table.end', 'Fim')}</Th>
                      <Th>{t('financing.table.status', 'Status')}</Th>
                      <Th>{t('financing.table.proof', 'Comprovante')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {financing.map((fin) => {
                      const driver = initialDrivers.find((d) => d.id === fin.driverId);
                      return (
                        <Tr key={fin.id}>
                          <Td>{driver ? (driver.fullName || driver.name) : fin.driverId}</Td>
                          <Td>{getTypeBadge(fin.type)}</Td>
                          <Td>{(fin.amount ?? 0).toFixed(2)}</Td>
                          <Td>{fin.weeks ?? '-'}</Td>
                          <Td>{(fin.weeklyInterest ?? 0).toFixed(2)}</Td>
                          <Td>{typeof fin.remainingWeeks === 'number' ? fin.remainingWeeks : '-'}</Td>
                          <Td>{fin.startDate ? new Date(fin.startDate).toLocaleDateString(locale || 'pt-PT') : '-'}</Td>
                          <Td>{fin.endDate ? new Date(fin.endDate).toLocaleDateString(locale || 'pt-PT') : '-'}</Td>
                          <Td>{getStatusBadge(fin.status)}</Td>
                          <Td>
                            <HStack spacing={2}>
                              {fin.proofUrl ? (
                                <>
                                  <Tooltip label="Baixar comprovante">
                                    <IconButton
                                      aria-label="Baixar comprovante"
                                      icon={<Icon as={FiDownload} />}
                                      size="sm"
                                      colorScheme="green"
                                      variant="ghost"
                                      as="a"
                                      href={fin.proofUrl}
                                      target="_blank"
                                    />
                                  </Tooltip>
                                  <Badge colorScheme="green" fontSize="xs">
                                    <Icon as={FiFileText} mr={1} />
                                    Anexado
                                  </Badge>
                                </>
                              ) : (
                                <Tooltip label="Anexar comprovante">
                                  <Button
                                    size="sm"
                                    leftIcon={<Icon as={FiUpload} />}
                                    colorScheme="blue"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedFinancingId(fin.id);
                                      onUploadOpen();
                                    }}
                                  >
                                    Anexar
                                  </Button>
                                </Tooltip>
                              )}
                            </HStack>
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
      </VStack>
      
      {/* Modal de Upload de Comprovante */}
      {selectedFinancingId && (
        <FinancingProofUpload
          isOpen={isUploadOpen}
          onClose={onUploadClose}
          financingId={selectedFinancingId}
          onUploadSuccess={() => {
            mutate();
            toast({
              title: 'Comprovante anexado!',
              status: 'success',
            });
          }}
        />
      )}
    </AdminLayout>
  );
}

export default function AdminFinancingPage(props: AdminFinancingPageProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/admin/financing': { financing: props.initialFinancing },
        },
      }}
    >
      <AdminFinancingPageContent {...props} />
    </SWRConfig>
  );
}

// SSR com autenticação admin - Carrega TODOS os dados necessários
export const getServerSideProps = withAdminSSR(async (context, user) => {
  const drivers = await getDrivers({ status: 'active' });
  
  // Buscar financiamentos direto do Firestore
  const snapshot = await adminDb
    .collection('financing')
    .orderBy('createdAt', 'desc')
    .get();
  const financing = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    initialDrivers: drivers,
    initialFinancing: financing,
  };
});
