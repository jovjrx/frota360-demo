'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import useSWR from 'swr';
import {
  Box,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  ButtonGroup,
  Icon,
  useToast,
  useBreakpointValue,
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiDownload,
  FiFileText,
  FiCheckCircle,
  FiExternalLink,
  FiUpload,
} from 'react-icons/fi';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import StatCard from '@/components/admin/StatCard';
import EditableNumberField from '@/components/admin/EditableNumberField';
import StructuredModal from '@/components/admin/StructuredModal';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { DriverPayment } from '@/schemas/driver-payment';
import { WeeklyNormalizedData } from '@/schemas/data-weekly';
import { useDisclosure } from '@chakra-ui/react';

interface DriverRecord extends DriverWeeklyRecord {
  driverType: 'affiliate' | 'renter';
  vehicle: string;
  platformData: WeeklyNormalizedData[];
  paymentInfo?: DriverPayment | null;
  portagens?: number;
}

interface PaymentsTabContentProps {
  weekId: string;
  initialRecords: DriverRecord[];
  tCommon: Record<string, any> | ((key: string, variables?: Record<string, any>) => string);
  tPage: Record<string, any> | ((key: string, variables?: Record<string, any>) => string);
  locale?: string;
  user?: any;
}

const PAYMENT_STATUS_COLOR: Record<DriverWeeklyRecord['paymentStatus'], string> = {
  pending: 'orange',
  paid: 'green',
  cancelled: 'red',
};

export default function PaymentsTabContent({
  weekId,
  initialRecords,
  tCommon,
  tPage,
  locale = 'pt-PT',
  user,
}: PaymentsTabContentProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_PROOF_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
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
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Local state
  const [records, setRecords] = useState<DriverRecord[]>(initialRecords || []);
  const [selectedPaymentRecord, setSelectedPaymentRecord] = useState<DriverRecord | null>(null);
  const [paymentDateValue, setPaymentDateValue] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [bonusValue, setBonusValue] = useState('0');
  const [discountValue, setDiscountValue] = useState('0');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [generatingRecordId, setGeneratingRecordId] = useState<string | null>(null);
  const [isGeneratingResumos, setIsGeneratingResumos] = useState(false);
  // Modal de visualização para Resumos/Comprovantes
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState<string>('');
  const objectUrlRef = useRef<string | null>(null);

  const { isOpen: isPaymentModalOpen, onOpen: onOpenPaymentModal, onClose: onClosePaymentModal } = useDisclosure();

  // SWR to fetch weekly records - payments tab must use only driverPayments
  const { data: swrData, isLoading, mutate } = useSWR(
    weekId ? `/api/admin/weekly/payments?weekId=${weekId}` : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch records');
      return res.json();
    },
    {
      fallbackData: { records: initialRecords || [] },
      revalidateOnFocus: false,
      dedupingInterval: 0,
    }
  );

  // Update records when SWR data changes
  useEffect(() => {
    if (swrData?.records) {
      setRecords(swrData.records);
    }
  }, [swrData?.records]);

  // Translations
  const typeLabels = useMemo(
    () => ({
      affiliate: t('weekly.control.records.types.affiliate', 'Afiliado'),
      renter: t('weekly.control.records.types.renter', 'Locatário'),
    }),
    [t]
  );

  const statusLabels = useMemo(
    () => ({
      pending: t('weekly.control.records.paymentStatus.pending', 'Pendente'),
      paid: t('weekly.control.records.paymentStatus.paid', 'Pago'),
      cancelled: t('weekly.control.records.paymentStatus.cancelled', 'Cancelado'),
    }),
    [t]
  );

  // Formatting functions
  const formatDateLabel = (value: string | undefined, localeValue: string) => {
    if (!value) return '—';
    try {
      return new Intl.DateTimeFormat(localeValue, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(value));
    } catch (error) {
      return value;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);
  };

  const bankChargeBreakdownTemplate = useMemo(
    () => t('weekly.control.records.labels.bankChargeBreakdown', 'Parcela: {{installment}} | Ônus bancário: {{interest}}'),
    [t]
  );

  const formatBankChargeBreakdown = (installment: number, interest: number) =>
    bankChargeBreakdownTemplate
      .replace('{{installment}}', formatCurrency(installment))
      .replace('{{interest}}', formatCurrency(interest));

  const parseMoneyInput = (value: string) => {
    if (!value) return 0;
    const normalized = value.replace(',', '.');
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return Number(Math.round(numeric * 100) / 100);
  };

  const formatDateTimeLocalValue = (value?: string) => {
    const fallback = new Date();
    const date = value ? new Date(value) : fallback;

    if (Number.isNaN(date.getTime())) {
      return `${fallback.getFullYear()}-${(fallback.getMonth() + 1).toString().padStart(2, '0')}-${fallback.getDate().toString().padStart(2, '0')}T${fallback.getHours().toString().padStart(2, '0')}:${fallback.getMinutes().toString().padStart(2, '0')}`;
    }

    const pad = (num: number) => num.toString().padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Computed properties
  const paymentBonusAmount = parseMoneyInput(bonusValue);
  const paymentDiscountAmount = parseMoneyInput(discountValue);
  const paymentTotalInvalid = !paymentDateValue || paymentBonusAmount < 0 || paymentDiscountAmount < 0;

  // Calculate totals (exact same logic from weekly.tsx)
  const totals = records.reduce((acc, record) => {
    const ganhosMenosIVA = record.ganhosTotal - record.ivaValor;

    // Verificar se combustível ou portagens foram editados manualmente (não vêm da plataforma)
    const combustivelIsFixed = (record.combustivel || 0) > 0;
    const viaverdeIsFixed = (record.portagens || 0) > 0;
    const hasFixedExpenses = combustivelIsFixed || viaverdeIsFixed;

    // Não calcular 7% se houver despesas fixas
    const despesasBase = hasFixedExpenses ? 0 : ganhosMenosIVA * 0.07; // 7% fixo apenas se sem despesas fixas

    const financing = (record.financingDetails as any);
    const financingInstallment = financing?.weeklyAmount || financing?.installment || 0;
    const financingInterest = financing?.weeklyInterest || financing?.interestAmount || 0;
    const financingOnus = financing?.onusParcelado || 0;
    const financingTotal = financing?.totalCost || financingInstallment;

    return {
      ganhosTotal: acc.ganhosTotal + record.ganhosTotal,
      ivaValor: acc.ivaValor + record.ivaValor,
      despesasAdm: acc.despesasAdm + record.despesasAdm,
      despesasBase: acc.despesasBase + despesasBase,
      despesasJuros: acc.despesasJuros + 0,
      combustivel: acc.combustivel + (record.combustivel || 0),
      viaverde: acc.viaverde + (record.portagens || 0),
      aluguel: acc.aluguel + record.aluguel,
      financiamento: acc.financiamento + financingInstallment,
      financiamentoJuros: acc.financiamentoJuros + financingInterest + financingOnus,
      financiamentoTotal: acc.financiamentoTotal + financingTotal,
      repasse: acc.repasse + record.repasse,
    };
  }, {
    ganhosTotal: 0,
    ivaValor: 0,
    despesasAdm: 0,
    despesasBase: 0,
    despesasJuros: 0,
    combustivel: 0,
    viaverde: 0,
    aluguel: 0,
    financiamento: 0,
    financiamentoJuros: 0,
    financiamentoTotal: 0,
    repasse: 0,
  });

  // Handlers
  const handleViewPayslip = async (record: DriverRecord) => {
    setGeneratingRecordId(record.id);
    try {
      const response = await fetch('/api/admin/weekly/generate-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record }),
      });
      if (!response.ok) throw new Error('Failed to generate payslip');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      // Guardar a URL para revogar depois
      objectUrlRef.current = url;
      setDocUrl(url);
      setDocTitle(`Resumo - ${record.driverName} - ${weekId}`);
      setIsDocModalOpen(true);
    } catch (error: any) {
      toast({
        title: t('weekly.control.records.messages.payslipErrorTitle', 'Erro ao gerar resumo'),
        description: error?.message || t('weekly.control.records.messages.payslipError', 'Não foi possível gerar o resumo.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGeneratingRecordId(null);
    }
  };

  const handleExportPayments = async () => {
    try {
      const response = await fetch('/api/admin/weekly/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, records }),
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pagamentos_semana_${weekId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: t('weekly.control.records.messages.exportSuccessTitle', 'Exportação concluída!'),
        description: t('weekly.control.records.messages.exportSuccessDesc', 'A planilha de pagamentos foi exportada com sucesso.'),
        status: 'success',
        duration: 4000,
      });
    } catch (error: any) {
      console.error('Erro ao exportar pagamentos:', error);
      toast({
        title: t('weekly.control.records.messages.exportErrorTitle', 'Erro na exportação'),
        description: error?.message || t('weekly.control.records.messages.exportError', 'Não foi possível exportar a planilha de pagamentos.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateRecord = async (recordId: string, updates: Partial<DriverWeeklyRecord>) => {
    try {
      const response = await fetch('/api/admin/weekly/update-record', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, updates }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.message || t('weekly.control.records.messages.updateError', 'Não foi possível atualizar o registro.'));
      }

      const payload = await response.json();
      const updatedRecord: DriverWeeklyRecord = payload?.record;

      setRecords((prev) =>
        prev.map((item) =>
          item.id === recordId
            ? {
              ...item,
              ...updatedRecord,
              paymentInfo: item.paymentInfo,
            }
            : item
        )
      );

      toast({
        title: t('weekly.control.records.messages.updateSuccess', 'Registro atualizado com sucesso!'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: t('weekly.control.records.messages.updateErrorTitle', 'Erro ao atualizar registro'),
        description: error?.message || t('weekly.control.records.messages.updateError', 'Não foi possível atualizar o registro.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleOpenPaymentModal = (record: DriverRecord) => {
    if (!record?.id) return;
    setSelectedPaymentRecord(record);
    setPaymentDateValue(formatDateTimeLocalValue());
    setPaymentNotes('');
    setBonusValue('0');
    setDiscountValue('0');
    setPaymentProofFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenPaymentModal();
  };

  const handleClosePaymentModal = () => {
    if (isSavingPayment) return;
    setSelectedPaymentRecord(null);
    setPaymentDateValue('');
    setPaymentNotes('');
    setBonusValue('0');
    setDiscountValue('0');
    setPaymentProofFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClosePaymentModal();
  };

  const handleConfirmPayment = async () => {
    if (!selectedPaymentRecord) return;

    if (!paymentDateValue) {
      toast({
        title: t('weekly.control.records.messages.paymentErrorTitle', 'Erro ao registrar pagamento'),
        description: t('weekly.control.records.messages.paymentDateMissing', 'Informe a data em que o pagamento foi efetuado.'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const parsedDate = new Date(paymentDateValue);
    if (Number.isNaN(parsedDate.getTime())) {
      toast({
        title: t('weekly.control.records.messages.paymentErrorTitle', 'Erro ao registrar pagamento'),
        description: t('weekly.control.records.messages.paymentDateInvalid', 'A data informada é inválida.'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (paymentTotalInvalid) {
      toast({
        title: t('weekly.control.records.messages.paymentErrorTitle', 'Erro ao registrar pagamento'),
        description: t('weekly.control.records.messages.paymentTotalInvalid', 'O valor total do pagamento deve ser maior que zero.'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const paymentDateIso = parsedDate.toISOString();
    setUpdatingPaymentId(selectedPaymentRecord.id);
    setIsSavingPayment(true);

    let proofPayload:
      | {
        url: string;
        storagePath: string;
        fileName: string;
        size: number;
        contentType?: string;
        uploadedAt: string;
      }
      | undefined;
    let uploadedProofPath: string | null = null;

    try {
      if (paymentProofFile) {
        const storagePath = `driverPayments/${selectedPaymentRecord.weekId}/${selectedPaymentRecord.driverId}/${Date.now()}-${paymentProofFile.name}`;
        const fileRef = storageRef(storage, storagePath);
        await uploadBytes(fileRef, paymentProofFile, {
          contentType: paymentProofFile.type || undefined,
        });
        const url = await getDownloadURL(fileRef);
        proofPayload = {
          url,
          storagePath,
          fileName: paymentProofFile.name,
          size: paymentProofFile.size,
          contentType: paymentProofFile.type || undefined,
          uploadedAt: new Date().toISOString(),
        };
        uploadedProofPath = storagePath;
      }

      const response = await fetch('/api/admin/weekly/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          record: selectedPaymentRecord,
          payment: {
            bonusAmount: paymentBonusAmount,
            discountAmount: paymentDiscountAmount,
            paymentDate: paymentDateIso,
            notes: paymentNotes,
            iban: selectedPaymentRecord.iban ?? null,
            ...(proofPayload ? { proof: proofPayload } : {}),
          },
          actor: {
            uid: user?.uid,
            email: user?.email,
            name: user?.displayName ?? null,
          },
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.message || t('weekly.control.records.messages.paymentError', 'Não foi possível registrar o pagamento.'));
      }

      const payload = await response.json();
      const updated: DriverWeeklyRecord | undefined = payload?.record;
      const paymentInfo: DriverPayment | undefined = payload?.payment;
      const financingProcessed: Array<any> | undefined = (paymentInfo as any)?.financingProcessed;

      setRecords((prev) =>
        prev.map((item) =>
          item.id === selectedPaymentRecord.id
            ? {
              ...item,
              paymentStatus: updated?.paymentStatus ?? 'paid',
              paymentDate: updated?.paymentDate ?? paymentDateIso,
              updatedAt: updated?.updatedAt ?? item.updatedAt,
              paymentInfo: paymentInfo ?? item.paymentInfo ?? null,
            }
            : item
        )
      );

      let description = t('weekly.control.records.messages.paymentSuccessDescription', 'O pagamento foi marcado como concluído.');

      if (financingProcessed && financingProcessed.length > 0) {
        const installmentDetails = financingProcessed.map(f => {
          if (f.completed) {
            return `✅ Ônus bancário de €${f.amount.toFixed(2)} quitado!`;
          } else {
            return `📉 Parcela descontada. Restam ${f.remainingInstallments} de ${f.remainingInstallments + f.installmentPaid} parcelas`;
          }
        }).join('\n');

        description = `${description}\n\n${installmentDetails}`;
      }

      toast({
        title: t('weekly.control.records.messages.paymentSuccessTitle', 'Pagamento registrado!'),
        description: description,
        status: 'success',
        duration: 6000,
        isClosable: true,
      });

      setSelectedPaymentRecord(null);
      setPaymentNotes('');
      setPaymentDateValue('');
      setBonusValue('0');
      setDiscountValue('0');
      setPaymentProofFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClosePaymentModal();
      uploadedProofPath = null;
    } catch (error: any) {
      if (uploadedProofPath) {
        try {
          await deleteObject(storageRef(storage, uploadedProofPath));
        } catch (cleanupError) {
          console.error('Failed to rollback proof upload:', cleanupError);
        }
      }
      toast({
        title: t('weekly.control.records.messages.paymentErrorTitle', 'Erro ao registrar pagamento'),
        description: error?.message || t('weekly.control.records.messages.paymentError', 'Não foi possível registrar o pagamento.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSavingPayment(false);
      setUpdatingPaymentId(null);
    }
  };

  const handleGenerateResumos = async () => {
    setIsGeneratingResumos(true);
    try {
      const promises = records.map((record) =>
        fetch('/api/admin/weekly/generate-single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ record }),
        })
          .then((res) => {
            if (!res.ok) throw new Error('Failed');
            return res.blob().then((blob) => ({ blob, name: `resumo_${record.driverId}_${weekId}.pdf` }));
          })
          .catch(() => null)
      );

      const results = await Promise.all(promises);
      const validResults = results.filter(Boolean);

      if (validResults.length === 0) throw new Error('No resumos generated');

      toast({
        title: t('weekly.control.records.messages.resumosGeneratedTitle', 'Resumos gerados!'),
        description: t('weekly.control.records.messages.resumosGeneratedDesc', `${validResults.length} resumos foram gerados com sucesso.`),
        status: 'success',
        duration: 4000,
      });
    } catch (error: any) {
      toast({
        title: t('weekly.control.records.messages.resumosErrorTitle', 'Erro ao gerar resumos'),
        description: error?.message || t('weekly.control.records.messages.resumosError', 'Não foi possível gerar os resumos.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingResumos(false);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Resumo - Linha 1 */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <StatCard
          label="Entradas"
          value={totals.ganhosTotal}
          color="green.600"
          helpText={`${records.length} ${t('weekly.control.summary.cards.driversCountLabel', 'motoristas')}`}
        />
        <StatCard
          label="IVA (6%)"
          value={totals.ivaValor}
          color="red.600"
          helpText="Imposto sobre o valor"
        />
        <StatCard
          label="Combustível"
          value={totals.combustivel}
          color="orange.600"
          helpText="Valor de MyPrio"
        />
        <StatCard
          label="Portagens"
          value={totals.viaverde}
          color="orange.600"
          helpText={t('weekly.control.summary.cards.tollsHelp', 'Pagamento direto da empresa')}
        />
      </SimpleGrid>

      {/* Resumo - Linha 2 */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <StatCard
          label="Despesas Adm"
          value={totals.despesasAdm}
          color="red.600"
          helpText="Valores definidos pelo tipo de motorista"
        />
        <StatCard
          label="Aluguéis"
          value={totals.aluguel}
          color="purple.600"
          helpText="Aluguel de viaturas"
        />
        <StatCard
          label="Financiamento"
          value={totals.financiamentoTotal}
          color="pink.600"
          helpText={`Parcela: ${formatCurrency(totals.financiamento)} | Ônus bancário: ${formatCurrency(totals.financiamentoJuros)}`}
        />
        <StatCard
          label="Líquido"
          value={totals.despesasAdm + totals.aluguel + totals.financiamentoTotal}
          color="blue.600"
          helpText={`Adm+Aluguel: ${formatCurrency(totals.despesasAdm + totals.aluguel)} | Ônus: ${formatCurrency(totals.financiamentoTotal)}`}
        />
      </SimpleGrid>



      {/* Tabela de Registos */}
      <Card>
        <CardHeader>
          <HStack justify="space-between" flexWrap="wrap">
            <Text fontWeight="bold" fontSize="lg">
              {t('weekly.control.records.title', 'Registos de pagamento')}
            </Text>
            <HStack spacing={{ base: 1, md: 2 }}>
              <Button
                leftIcon={isMobile ? undefined : <Icon as={FiRefreshCw} />}
                onClick={() => { mutate(); }}
                size="sm"
                title={t('weekly.control.actions.refresh', 'Atualizar')}
              >
                {isMobile ? <Icon as={FiRefreshCw} /> : t('weekly.control.actions.refresh', 'Atualizar')}
              </Button>

              <Button
                leftIcon={isMobile ? undefined : <Icon as={FiDownload} />}
                onClick={handleExportPayments}
                colorScheme="teal"
                size="sm"
                isDisabled={records.length === 0}
                title={t('weekly.control.actions.exportPayments', 'Exportar planilha')}
              >
                {isMobile ? <Icon as={FiDownload} /> : t('weekly.control.actions.exportPayments', 'Exportar planilha')}
              </Button>

              <Button
                leftIcon={isMobile ? undefined : <Icon as={FiFileText} />}
                onClick={handleGenerateResumos}
                colorScheme="green"
                size="sm"
                isLoading={isGeneratingResumos}
                loadingText={isMobile ? undefined : t('weekly.control.actions.generateSummariesLoading', 'A gerar...')}
                isDisabled={records.length === 0}
                title={t('weekly.control.actions.generateSummaries', 'Gerar resumos')}
              >
                {isMobile ? <Icon as={FiFileText} /> : t('weekly.control.actions.generateSummaries', 'Gerar resumos')}
              </Button>
            </HStack>
          </HStack>
        </CardHeader>

        <CardBody>
          {records.length === 0 ? (
            <Text textAlign="center" color="gray.500" py={8}>
              {t('weekly.control.records.empty', 'Nenhum registo para esta semana')}
            </Text>
          ) : isMobile ? (
            // Mobile: Exibir como cards
            <VStack spacing={3} align="stretch">
              {records.map((record, index) => (
                <Box key={index} p={3} borderWidth={1} borderRadius="md" borderColor="gray.200">
                  <VStack align="flex-start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="medium">{record.driverName}</Text>
                        <Text fontSize="xs" color="gray.600">{record.vehicle}</Text>
                      </VStack>
                      <Badge colorScheme={record.driverType === 'renter' ? 'purple' : 'green'}>
                        {typeLabels[record.driverType]}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between" w="full" fontSize="sm">
                      <Text color="gray.600">Ganhos:</Text>
                      <Text fontWeight="bold">{formatCurrency(record.ganhosTotal || 0)}</Text>
                    </HStack>
                    <HStack justify="space-between" w="full" fontSize="sm">
                      <Text color="gray.600">Repasse:</Text>
                      <Text fontWeight="bold" color="blue.600">{formatCurrency(record.repasse || 0)}</Text>
                    </HStack>
                    <HStack justify="space-between" w="full" fontSize="sm">
                      <Text color="gray.600">Status:</Text>
                      <Badge colorScheme={PAYMENT_STATUS_COLOR[record.paymentStatus] || 'gray'}>
                        {statusLabels[record.paymentStatus] || record.paymentStatus}
                      </Badge>
                    </HStack>
                    <ButtonGroup size="xs" w="full" spacing={1}>
                      {record.paymentStatus === 'paid' ? (
                        <Button colorScheme="green" w="full" isDisabled>
                          {t('weekly.control.records.actions.alreadyPaid', 'Pago')}
                        </Button>
                      ) : (
                        <Button
                          colorScheme="green"
                          w="full"
                          onClick={() => handleOpenPaymentModal(record)}
                          isLoading={updatingPaymentId === record.id}
                        >
                          {t('weekly.control.records.actions.markAsPaid', 'Pagar')}
                        </Button>
                      )}
                    </ButtonGroup>
                  </VStack>
                </Box>
              ))}
            </VStack>
          ) : (
            // Desktop: Exibir como tabela
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>{t('weekly.control.records.columns.driver', 'Motorista')}</Th>
                    <Th>{t('weekly.control.records.columns.type', 'Tipo')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.platformUber', 'Uber')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.platformBolt', 'Bolt')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.grossTotal', 'Ganhos brutos (✕)')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.iva', 'IVA (✕)')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.adminExpenses', 'Taxa adm. (✕)')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.fuel', 'Combustível (✕)')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.tolls', 'Portagens (✕)')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.rent', 'Aluguel')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.bankCharge', 'Financiamento')}</Th>
                    <Th isNumeric>Bônus Meta</Th>
                    <Th isNumeric>Comissão</Th>
                    <Th isNumeric>Bônus Indicação</Th>
                    <Th isNumeric>Líquido</Th>
                    <Th>{t('weekly.control.records.columns.status', 'Status')}</Th>
                    <Th textAlign="right" position="sticky" right={0} bg="white" zIndex={10}>{t('weekly.control.records.columns.actions', 'Ações')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {records.map((record, index) => (
                    <Tr key={index}>
                      <Td>
                        <Text fontWeight="medium">{record.driverName}</Text>
                        <Text fontSize="xs" color="gray.600">{record.vehicle}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={record.driverType === 'renter' ? 'purple' : 'green'}>
                          {typeLabels[record.driverType]}
                        </Badge>
                      </Td>
                      <Td isNumeric>
                        {formatCurrency(record.uberTotal || 0)}
                      </Td>
                      <Td isNumeric>
                        {formatCurrency(record.boltTotal || 0)}
                      </Td>
                      <Td isNumeric fontWeight="medium">
                        {formatCurrency(record.ganhosTotal || 0)}
                      </Td>
                      <Td isNumeric color="red.600" fontWeight="medium">
                        -{formatCurrency(record.ivaValor || 0)}
                      </Td>
                      <Td isNumeric color="red.600" fontWeight="medium">
                        -{formatCurrency(record.despesasAdm || 0)}
                      </Td>
                      {record.combustivel > 0 ? (
                        <EditableNumberField
                          value={record.combustivel}
                          onChange={(newValue) => handleUpdateRecord(record.id, { combustivel: newValue })}
                          isPaid={record.paymentStatus === 'paid'}
                          color="orange.600"
                          prefix="-"
                        />
                      ) : (
                        <Td isNumeric color="gray.400">-</Td>
                      )}
                      {record.portagens > 0 ? (
                        <EditableNumberField
                          value={record.portagens}
                          onChange={(newValue) => handleUpdateRecord(record.id, { viaverde: newValue })}
                          isPaid={record.paymentStatus === 'paid'}
                          color="orange.600"
                          prefix="-"
                        />
                      ) : (
                        <Td isNumeric color="gray.400">-</Td>
                      )}
                      {record.aluguel > 0 ? (
                        <EditableNumberField
                          value={record.aluguel}
                          onChange={(newValue) => handleUpdateRecord(record.id, { aluguel: newValue })}
                          isPaid={record.paymentStatus === 'paid'}
                          color="purple.600"
                          prefix="-"
                        />
                      ) : (
                        <Td isNumeric color="gray.400">-</Td>
                      )}
                      <Td isNumeric>
                        {record.financingDetails?.hasFinancing ? (
                          <VStack spacing={0} align="flex-end">
                            <Text color="pink.600" fontWeight="medium">
                              -{formatCurrency((record.financingDetails as any).totalCost || (record.financingDetails as any).weeklyAmount || 0)}
                            </Text>
                            {((record.financingDetails as any).weeklyInterest || 0) > 0 && (
                              <Text fontSize="xs" color="pink.500">
                                {formatBankChargeBreakdown(
                                  (record.financingDetails as any).weeklyAmount || 0,
                                  (record.financingDetails as any).weeklyInterest || 0
                                )}
                              </Text>
                            )}
                            {((record.financingDetails as any).onusParcelado || 0) > 0 && (
                              <Text fontSize="xs" color="pink.400">
                                Ônus: {formatCurrency((record.financingDetails as any).onusParcelado || 0)}
                              </Text>
                            )}
                          </VStack>
                        ) : (
                          <Text color="gray.400">-</Text>
                        )}
                      </Td>
                      <Td isNumeric>
                        {(record.paymentInfo as any)?.bonusMetaAmount || 0 > 0 ? (
                          <Text color="green.600" fontWeight="bold">
                            +{formatCurrency((record.paymentInfo as any)?.recordSnapshot?.bonusMetaAmount || (record.paymentInfo as any)?.bonusMetaAmount || 0)}
                          </Text>
                        ) : (
                          <Text color="gray.400">-</Text>
                        )}
                      </Td>
                      <Td isNumeric>
                        {(record.paymentInfo as any)?.commissionAmount || 0 > 0 ? (
                          <Text color="blue.600" fontWeight="bold">
                            +{formatCurrency((record.paymentInfo as any)?.recordSnapshot?.commissionAmount || (record.paymentInfo as any)?.commissionAmount || 0)}
                          </Text>
                        ) : (
                          <Text color="gray.400">-</Text>
                        )}
                      </Td>
                      <Td isNumeric>
                        {(record.paymentInfo as any)?.bonusReferralAmount || 0 > 0 ? (
                          <Text color="purple.600" fontWeight="bold">
                            +{formatCurrency((record.paymentInfo as any)?.recordSnapshot?.bonusReferralAmount || (record.paymentInfo as any)?.bonusReferralAmount || 0)}
                          </Text>
                        ) : (
                          <Text color="gray.400">-</Text>
                        )}
                      </Td>
                      <EditableNumberField
                        value={record.repasse}
                        onChange={(newValue) => handleUpdateRecord(record.id, { repasse: newValue })}
                        isPaid={record.paymentStatus === 'paid'}
                        color="blue.600"
                        fontWeight="bold"
                      />
                      <Td>
                        <VStack spacing={1} align="flex-start">
                          {record.paymentStatus === 'paid' ? (
                            <>
                              <Badge colorScheme="green">PAGO</Badge>
                              <Text fontSize="xs" color="gray.600">
                                {record.paymentInfo?.paymentDate ? (
                                  formatDateLabel(record.paymentInfo.paymentDate, locale || 'pt-PT')
                                ) : record.paymentDate ? (
                                  formatDateLabel(record.paymentDate, locale || 'pt-PT')
                                ) : (
                                  '-'
                                )}
                              </Text>
                            </>
                          ) : (
                            <Badge colorScheme={PAYMENT_STATUS_COLOR[record.paymentStatus] || 'gray'}>
                              {statusLabels[record.paymentStatus] || record.paymentStatus}
                            </Badge>
                          )}
                        </VStack>
                      </Td>
                      <Td position="sticky" right={0} bg="white" zIndex={9}>
                        <ButtonGroup size="xs" variant="outline" spacing={2} justifyContent="flex-end">
                          <Button
                            leftIcon={<Icon as={FiFileText} />}
                            onClick={() => handleViewPayslip(record)}
                            isLoading={generatingRecordId === record.id}
                            loadingText={t('weekly.control.records.messages.generateInProgress', 'A gerar...')}
                            size="xs"
                          >
                            {t('weekly.control.records.actions.generatePayslip', 'Resumo')}
                          </Button>
                          {record.paymentStatus === 'paid' ? (
                            <>
                              {record.paymentInfo?.proofUrl ? (
                                <Button
                                  leftIcon={<Icon as={FiExternalLink} />}
                                  size="xs"
                                  colorScheme="blue"
                                  onClick={() => {
                                    setDocUrl(record.paymentInfo!.proofUrl as string);
                                    setDocTitle(`Comprovante - ${record.driverName} - ${weekId}`);
                                    setIsDocModalOpen(true);
                                  }}
                                >
                                  {t('weekly.control.records.actions.viewProof', 'Comprovante')}
                                </Button>
                              ) : (
                                <Button
                                  leftIcon={<Icon as={FiUpload} />}
                                  colorScheme="orange"
                                  size="xs"
                                  onClick={() => handleOpenPaymentModal(record)}
                                  isLoading={updatingPaymentId === record.id}
                                >
                                  {t('weekly.control.records.actions.uploadProof', 'Enviar Comprovante')}
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button
                              leftIcon={<Icon as={FiCheckCircle} />}
                              colorScheme="green"
                              onClick={() => handleOpenPaymentModal(record)}
                              isLoading={updatingPaymentId === record.id}
                              size="xs"
                            >
                              {t('weekly.control.records.actions.markAsPaid', 'Pagar')}
                            </Button>
                          )}
                        </ButtonGroup>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>
      {/* Legenda de Campos */}
      <Box p={2} bg="blue.50" borderRadius="md" borderLeft="4px" borderColor="blue.500">
        <Text fontSize="xs" fontWeight="bold" mb={2} color="blue.900">
          📋 Legenda de Campos:
        </Text>
        <VStack align="start" spacing={1} fontSize="xs" color="blue.800">
          <Text><strong>MyPrio:</strong> Combustível = Valor da plataforma MyPrio</Text>
          <Text><strong>Portagens:</strong> ViaVerde = Taxa de portagens (autoestrada)</Text>
          <Text><strong>Financiamento (Parcelado):</strong> Valor da parcela semanal + Ônus bancário + Juros</Text>
          <Text><strong>Financiamento (Vitalício/Desconto):</strong> Taxa fixa semanal + Ônus</Text>
        </VStack>
      </Box>
      {/* Payment Modal */}
      <StructuredModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        isCentered
        size="lg"
        title={t('weekly.control.paymentModal.title', 'Confirmar pagamento')}
        showCloseButton
        isCloseButtonDisabled={isSavingPayment}
        closeOnOverlayClick={!isSavingPayment}
        closeOnEsc={!isSavingPayment}
        footer={(
          <HStack spacing={3} justify="flex-end" w="full">
            <Button variant="ghost" onClick={handleClosePaymentModal} isDisabled={isSavingPayment}>
              {t('weekly.control.paymentModal.cancel', 'Cancelar')}
            </Button>
            <Button
              colorScheme="green"
              leftIcon={<Icon as={FiCheckCircle} />}
              onClick={handleConfirmPayment}
              isLoading={isSavingPayment}
              isDisabled={paymentTotalInvalid || isSavingPayment}
            >
              {t('weekly.control.paymentModal.confirm', 'Confirmar pagamento')}
            </Button>
          </HStack>
        )}
      >
        <VStack spacing={4} align="stretch">
          {selectedPaymentRecord && (
            <Box>
              <Text fontWeight="semibold" fontSize="lg">
                {selectedPaymentRecord.driverName}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {t('weekly.control.paymentModal.weekLabel', 'Semana')}: {selectedPaymentRecord.weekStart} → {selectedPaymentRecord.weekEnd}
              </Text>
            </Box>
          )}

          {selectedPaymentRecord?.iban ? (
            <FormControl>
              <FormLabel>{t('weekly.control.paymentModal.ibanLabel', 'IBAN')}</FormLabel>
              <Input value={selectedPaymentRecord.iban} isReadOnly variant="filled" />
            </FormControl>
          ) : null}

          <FormControl>
            <FormLabel>{t('weekly.control.paymentModal.paymentDateLabel', 'Data do pagamento')}</FormLabel>
            <Input
              type="datetime-local"
              value={paymentDateValue}
              onChange={(e) => setPaymentDateValue(e.target.value)}
              isDisabled={isSavingPayment}
            />
          </FormControl>

          <HStack>
            <FormControl>
              <FormLabel>{t('weekly.control.paymentModal.bonusLabel', 'Bônus')}</FormLabel>
              <Input
                type="number"
                step="0.01"
                value={bonusValue}
                onChange={(e) => setBonusValue(e.target.value)}
                isDisabled={isSavingPayment}
                placeholder="0.00"
              />
            </FormControl>

            <FormControl>
              <FormLabel>{t('weekly.control.paymentModal.discountLabel', 'Desconto')}</FormLabel>
              <Input
                type="number"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                isDisabled={isSavingPayment}
                placeholder="0.00"
              />
            </FormControl>
          </HStack>


          {selectedPaymentRecord && (
            <Box bg="green.50" p={4} borderRadius="md" borderLeft="4px" borderColor="green.500">
              <Text fontSize="sm" color="gray.600" mb={2}>Resumo do pagamento:</Text>
              <VStack align="flex-start" spacing={2}>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm">Repasse base:</Text>
                  <Text fontSize="sm" fontWeight="bold">{formatCurrency(selectedPaymentRecord.repasse || 0)}</Text>
                </HStack>
                {bonusValue && parseFloat(bonusValue) > 0 && (
                  <HStack justify="space-between" w="full">
                    <Text fontSize="sm" color="green.600">+ Bônus:</Text>
                    <Text fontSize="sm" fontWeight="bold" color="green.600">+{formatCurrency(parseFloat(bonusValue) || 0)}</Text>
                  </HStack>
                )}
                {discountValue && parseFloat(discountValue) > 0 && (
                  <HStack justify="space-between" w="full">
                    <Text fontSize="sm" color="red.600">- Desconto:</Text>
                    <Text fontSize="sm" fontWeight="bold" color="red.600">-{formatCurrency(parseFloat(discountValue) || 0)}</Text>
                  </HStack>
                )}
                <Box w="full" borderTopWidth={1} borderColor="green.200" pt={2}>
                  <HStack justify="space-between" w="full">
                    <Text fontSize="md" fontWeight="bold">Valor a pagar:</Text>
                    <Text fontSize="lg" fontWeight="bold" color="green.600">
                      {formatCurrency(
                        (selectedPaymentRecord.repasse || 0) +
                        (parseFloat(bonusValue) || 0) -
                        (parseFloat(discountValue) || 0)
                      )}
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            </Box>
          )}

          <FormControl>
            <FormLabel>{t('weekly.control.paymentModal.notesLabel', 'Observações')}</FormLabel>
            <Textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              isDisabled={isSavingPayment}
              placeholder={t('weekly.control.paymentModal.notesPlaceholder', 'Adicione notas sobre este pagamento...')}
            />
          </FormControl>

          <FormControl>
            <FormLabel>{t('weekly.control.paymentModal.proofLabel', 'Comprovante de pagamento')}</FormLabel>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.size <= MAX_PROOF_FILE_SIZE) {
                  setPaymentProofFile(file);
                } else if (file) {
                  toast({
                    title: t('weekly.control.paymentModal.fileTooLargeTitle', 'Arquivo muito grande'),
                    description: t('weekly.control.paymentModal.fileTooLargeDesc', `Máximo de ${MAX_PROOF_FILE_SIZE / 1024 / 1024}MB permitido.`),
                    status: 'error',
                    duration: 4000,
                  });
                }
              }}
              isDisabled={isSavingPayment}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </FormControl>
        </VStack>
      </StructuredModal>
      {/* Modal para visualizar Resumo/Comprovante */}
      <StructuredModal
        isOpen={isDocModalOpen}
        onClose={() => {
          setIsDocModalOpen(false);
          setDocTitle('');
          setDocUrl(null);
          if (objectUrlRef.current) {
            try { window.URL.revokeObjectURL(objectUrlRef.current); } catch { }
            objectUrlRef.current = null;
          }
        }}
        isCentered
        size="6xl"
        title={docTitle || 'Documento'}
        showCloseButton
      >
        <Box w="100%" h="80vh">
          {docUrl ? (
            <iframe src={docUrl} width="100%" height="100%" style={{ border: 0 }} />
          ) : (
            <VStack w="full" h="full" align="center" justify="center">
              <Text color="gray.500">Sem conteúdo</Text>
            </VStack>
          )}
        </Box>
      </StructuredModal>
    </VStack>
  );
}
