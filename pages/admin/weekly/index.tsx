import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
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
  Select,
  ButtonGroup,
  Icon,
  Stat,
  StatHelpText,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiUpload,
  FiFileText,
  FiCheckCircle,
  FiRotateCcw,
} from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { getWeekOptions } from '@/lib/admin/adminQueries';
import { useRouter } from 'next/router';
import { getWeekId, getWeekDates } from '@/lib/utils/date-helpers';
import EditableNumberField from '@/components/admin/EditableNumberField';
import StatCard from '@/components/admin/StatCard';
import WeeklyRecordCard from '@/components/admin/WeeklyRecordCard';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import { FiDownload, FiMail } from 'react-icons/fi';

interface WeekOption {
  label: string;
  value: string;
  start: string;
  end: string;
}

import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { WeeklyNormalizedData } from '@/schemas/data-weekly';

interface DriverRecord extends DriverWeeklyRecord {
  driverType: 'affiliate' | 'renter';
  vehicle: string;
  platformData: WeeklyNormalizedData[];
}

interface WeeklyPageProps extends AdminPageProps {
  weekOptions: WeekOption[];
  currentWeek: string;
  initialRecords: DriverRecord[];
}

const PAYMENT_STATUS_COLOR: Record<DriverWeeklyRecord['paymentStatus'], string> = {
  pending: 'orange',
  paid: 'green',
  cancelled: 'red',
};

export default function WeeklyPage({
  user,
  locale,
  weekOptions,
  currentWeek,
  initialRecords,
  tCommon,
  tPage,
}: WeeklyPageProps) {
  const [filterWeek, setFilterWeek] = useState(currentWeek);
  const [records, setRecords] = useState<DriverRecord[]>(initialRecords);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingResumos, setIsGeneratingResumos] = useState(false);
  const [unassigned, setUnassigned] = useState<WeeklyNormalizedData[]>([]);
  const [generatingRecordId, setGeneratingRecordId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);
  const isMobile = useBreakpointValue({ base: true, md: false });
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

  const loadWeekData = async (weekValue: string) => {
    const selectedWeek = weekOptions.find(w => w.value === weekValue);
    if (!selectedWeek) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/weekly/data?weekId=${selectedWeek.value}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(t('weekly.control.errors.loadData', 'Erro ao carregar dados'));
      }

      const data = await response.json();

      const recordsResponse: DriverRecord[] = (data.records || []).map((record: DriverRecord) => ({
        ...record,
        driverType: record.driverType,
        vehicle: record.vehicle,
        platformData: record.platformData || [],
      }));

      setRecords(recordsResponse);
      setUnassigned(data.unassigned || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: t('weekly.control.toasts.loadData.title', 'Erro ao carregar dados'),
        description: error instanceof Error ? error.message : t('weekly.control.toasts.loadData.description', 'Não foi possível carregar os dados da semana.'),
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (filterWeek) {
      loadWeekData(filterWeek);
    }
  }, [filterWeek]);

  const handleGenerateResumos = async () => {
    setIsGeneratingResumos(true);
    try {
      const selectedWeek = weekOptions.find(w => w.value === filterWeek);
      if (!selectedWeek) {
        toast({
          title: tc('errors.title', 'Erro'),
          description: t('weekly.control.errors.selectWeek', 'Selecione uma semana válida para continuar.'),
          status: 'error',
          duration: 3000,
        });
        return;
      }

      const response = await fetch('/api/admin/weekly/generate-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekStart: selectedWeek.start,
          weekEnd: selectedWeek.end,
          records, // Passar registros já processados
        }),
      });

      if (!response.ok) {
        throw new Error(t('weekly.control.errors.generateSummaries', 'Não foi possível gerar os resumos.'));
      }

      // Download do arquivo ZIP
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
  a.download = `${t('weekly.control.files.summariesPrefix', 'resumos')}_${selectedWeek.start}_a_${selectedWeek.end}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t('weekly.control.toasts.generateSummaries.successTitle', 'Resumos gerados!'),
        description: t('weekly.control.toasts.generateSummaries.successDescription', 'Os resumos foram gerados com sucesso e o download começou.'),
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Erro ao gerar resumos:", error);
      toast({
        title: t('weekly.control.toasts.generateSummaries.errorTitle', 'Erro ao gerar resumos'),
        description: error instanceof Error ? error.message : t('weekly.control.toasts.generateSummaries.errorDescription', 'Não foi possível gerar os resumos desta semana.'),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingResumos(false);
    }
  };

  const { isOpen: isPayslipModalOpen, onOpen: onOpenPayslipModal, onClose: onClosePayslipModal } = useDisclosure();
  const [selectedPayslipRecord, setSelectedPayslipRecord] = useState<DriverRecord | null>(null);
  const [payslipPdfUrl, setPayslipPdfUrl] = useState<string | null>(null);

  const handleViewPayslip = async (record: DriverRecord) => {
    if (!record?.id) {
      return;
    }

    setGeneratingRecordId(record.id);
    try {
      const response = await fetch("/api/admin/weekly/generate-single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ record }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.message || t('weekly.control.records.messages.generateError', 'Não foi possível gerar o contracheque.'));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPayslipPdfUrl(url);
      setSelectedPayslipRecord(record);
      onOpenPayslipModal();

    } catch (error: any) {
      toast({
        title: t('weekly.control.records.actions.generatePayslip', 'Gerar contracheque'),
        description: error?.message || t('weekly.control.records.messages.generateError', 'Não foi possível gerar o contracheque.'),
        status: "error",
        duration: 4000,
      });
    } finally {
      setGeneratingRecordId(null);
    }
  };

  const handleDownloadPayslip = () => {
    if (payslipPdfUrl && selectedPayslipRecord) {
      const a = document.createElement("a");
      a.href = payslipPdfUrl;
      const fileName = `contracheque_${selectedPayslipRecord.driverName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_${selectedPayslipRecord.weekStart}_a_${selectedPayslipRecord.weekEnd}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSendPayslipEmail = async () => {
    if (!selectedPayslipRecord || !payslipPdfUrl) {
      toast({
        title: t('weekly.control.records.messages.sendEmailErrorTitle', 'Erro ao enviar e-mail'),
        description: t('weekly.control.records.messages.sendEmailErrorDesc', 'Nenhum contracheque selecionado ou PDF não gerado.'),
        status: "error",
        duration: 4000,
      });
      return;
    }

    try {
      // Convert blob URL to base64 for sending via API
      const response = await fetch(payslipPdfUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(",")[1];

        const emailRes = await fetch("/api/admin/weekly/send-payslip-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recordId: selectedPayslipRecord.id,
            driverEmail: selectedPayslipRecord.driverEmail,
            driverName: selectedPayslipRecord.driverName,
            weekStart: selectedPayslipRecord.weekStart,
            weekEnd: selectedPayslipRecord.weekEnd,
            pdfBase64: base64data,
          }),
        });

        if (!emailRes.ok) {
          const errorPayload = await emailRes.json().catch(() => ({}));
          throw new Error(errorPayload?.message || t('weekly.control.records.messages.sendEmailError', 'Não foi possível enviar o contracheque por e-mail.'));
        }

        toast({
          title: t('weekly.control.records.messages.sendEmailSuccessTitle', 'E-mail enviado!'),
          description: t('weekly.control.records.messages.sendEmailSuccessDesc', 'Contracheque enviado com sucesso para o motorista.'),
          status: "success",
          duration: 4000,
        });
      };
    } catch (error: any) {
      console.error("Erro ao enviar e-mail:", error);
      toast({
        title: t('weekly.control.records.messages.sendEmailErrorTitle', 'Erro ao enviar e-mail'),
        description: error?.message || t('weekly.control.records.messages.sendEmailError', 'Não foi possível enviar o contracheque por e-mail.'),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      // Any cleanup if needed
    }
  };

  const handleExportPayments = async () => {
    try {
      const selectedWeek = weekOptions.find(w => w.value === filterWeek);
      if (!selectedWeek) {
        toast({
          title: tc('errors.title', 'Erro'),
          description: t('weekly.control.errors.selectWeek', 'Selecione uma semana válida para continuar.'),
          status: "error",
          duration: 3000,
        });
        return;
      }

      const response = await fetch("/api/admin/weekly/export-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: records,
          weekId: selectedWeek.value,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.message || t('weekly.control.records.messages.exportError', 'Não foi possível exportar a planilha de pagamentos.'));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pagamentos_semana_${selectedWeek.value}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t('weekly.control.records.messages.exportSuccessTitle', 'Exportação concluída!'),
        description: t('weekly.control.records.messages.exportSuccessDesc', 'A planilha de pagamentos foi exportada com sucesso.'),
        status: "success",
        duration: 4000,
      });
    } catch (error: any) {
      console.error("Erro ao exportar pagamentos:", error);
      toast({
        title: t('weekly.control.records.messages.exportErrorTitle', 'Erro na exportação'),
        description: error?.message || t('weekly.control.records.messages.exportError', 'Não foi possível exportar a planilha de pagamentos.'),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      // Any cleanup if needed
    }
  };


  const handleUpdateRecord = async (recordId: string, updates: Partial<DriverWeeklyRecord>) => {
    try {
      const response = await fetch("/api/admin/weekly/update-record", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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
            }
            : item
        )
      );

      toast({
        title: t('weekly.control.records.messages.updateSuccess', 'Registro atualizado com sucesso!'),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: t('weekly.control.records.messages.updateErrorTitle', 'Erro ao atualizar registro'),
        description: error?.message || t('weekly.control.records.messages.updateError', 'Não foi possível atualizar o registro.'),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleTogglePaymentStatus = async (record: DriverRecord) => {
    if (!record?.id) {
      return;
    }

    const nextStatus = record.paymentStatus === "paid" ? "pending" : "paid";
    setUpdatingPaymentId(record.id);

    try {
      const response = await fetch("/api/admin/weekly/update-record", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordId: record.id,
          updates: {
            paymentStatus: nextStatus,
            paymentDate: nextStatus === "paid" ? new Date().toISOString() : null,
          },
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.message || t('weekly.control.records.messages.updatePaymentStatusError', 'Não foi possível atualizar o status do pagamento.'));
      }

      const payload = await response.json();
      const updated: DriverWeeklyRecord = payload?.record;

      setRecords((prev) =>
        prev.map((item) =>
          item.id === record.id
            ? {
              ...item,
              paymentStatus: updated?.paymentStatus ?? nextStatus,
              paymentDate: updated?.paymentDate ?? item.paymentDate,
              updatedAt: updated?.updatedAt ?? item.updatedAt,
            }
            : item
        )
      );

      toast({
        title: t('weekly.control.records.messages.updatePaymentStatusSuccess', 'Status de pagamento atualizado com sucesso!'),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: t('weekly.control.records.messages.updatePaymentStatusErrorTitle', 'Erro ao atualizar status de pagamento'),
        description: error?.message || t('weekly.control.records.messages.updatePaymentStatusError', 'Não foi possível atualizar o status do pagamento.'),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Calcular totais
  const totals = records.reduce((acc, record) => ({
    ganhosTotal: acc.ganhosTotal + record.ganhosTotal,
    ivaValor: acc.ivaValor + record.ivaValor,
    despesasAdm: acc.despesasAdm + record.despesasAdm,
    combustivel: acc.combustivel + record.combustivel,
    viaverde: acc.viaverde + record.viaverde,
    aluguel: acc.aluguel + record.aluguel,
    repasse: acc.repasse + record.repasse,
  }), {
    ganhosTotal: 0,
    ivaValor: 0,
    despesasAdm: 0,
    combustivel: 0,
    viaverde: 0,
    aluguel: 0,
    repasse: 0,
  });

  return (
    <AdminLayout
      title={t('weekly.control.title', 'Controle Semanal')}
      subtitle={t('weekly.control.subtitle', 'Gestão semanal de dados TVDE')}
      breadcrumbs={[{ label: t('weekly.control.title', 'Controle Semanal') }]}
      side={<Button
        leftIcon={<Icon as={FiUpload} />}
        onClick={() => router.push('/admin/data')}
        colorScheme="blue"
        size="sm"
      >
        {t('weekly.control.actions.importData', 'Importar dados')}
      </Button>}
    >
      {/* Filtros e Ações */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
              <Select
                value={filterWeek}
                onChange={(e) => setFilterWeek(e.target.value)}
                w={{ base: "100%", md: "300px" }}
              >
                {weekOptions.map(week => (
                  <option key={week.value} value={week.value}>
                    {week.label}
                  </option>
                ))}
              </Select>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={2}>
              <Button
                leftIcon={<Icon as={FiRefreshCw} />}
                onClick={() => loadWeekData(filterWeek)}
                isLoading={isLoading}
                size="sm"
              >
                {t('weekly.control.actions.refresh', 'Atualizar')}
              </Button>
              <Button
                leftIcon={<Icon as={FiFileText} />}
                onClick={handleGenerateResumos}
                colorScheme="purple"
                size="sm"
                isLoading={isGeneratingResumos}
                loadingText={t('weekly.control.actions.generateSummariesLoading', 'A gerar...')}
                isDisabled={records.length === 0}
              >
                {t('weekly.control.actions.generateSummaries', 'Gerar resumos')}
              </Button>
              <Button
                leftIcon={<Icon as={FiDownload} />}
                onClick={handleExportPayments}
                colorScheme="teal"
                size="sm"
                isDisabled={records.length === 0}
              >
                {t('weekly.control.actions.exportPayments', 'Exportar planilha')}
              </Button>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <Heading size="md">{t('weekly.control.summary.title', 'Resumo Semanal')}</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <StatCard
              label={t('weekly.control.summary.cards.totalEarnings', 'Ganhos Totais')}
              value={totals.ganhosTotal}
              color="green.600"
              helpText={`${records.length} ${t('weekly.control.summary.cards.driversCountLabel', 'motoristas')}`}
            />
            <StatCard
              label={t('weekly.control.summary.cards.totalDiscounts', 'Descontos Totais')}
              value={totals.ivaValor + totals.despesasAdm + totals.combustivel + totals.viaverde + totals.aluguel}
              color="red.600"
              helpText={t('weekly.control.summary.cards.discountsHelp', 'IVA, Adm, Combustível, Portagens, Aluguel')}
            />
            <StatCard
              label={t('weekly.control.summary.cards.fuel', 'Combustível')}
              value={totals.combustivel}
              color="orange.600"
              helpText={t('weekly.control.summary.cards.prioLabel', 'PRIO')}
            />
            <StatCard
              label={t('weekly.control.summary.cards.netValue', 'Valor Líquido')}
              value={totals.repasse}
              color="blue.600"
              helpText={t('weekly.control.summary.cards.totalToPay', 'Total a pagar')}
            />
          </SimpleGrid>
          <Table variant="simple" size="sm" mt={6}>
            <Thead>
              <Tr>
                <Th>{t('weekly.control.summary.table.item', 'Item')}</Th>
                <Th isNumeric>{t('weekly.control.summary.table.value', 'Valor')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>{t('weekly.control.summary.rows.totalEarnings', 'Ganhos Totais')}</Td>
                <Td isNumeric>{formatCurrency(totals.ganhosTotal)}</Td>
              </Tr>
              <Tr>
                <Td>{t('weekly.control.summary.rows.iva', 'IVA')}</Td>
                <Td isNumeric color="red.600">-{formatCurrency(totals.ivaValor)}</Td>
              </Tr>
              <Tr>
                <Td>{t('weekly.control.summary.rows.adminExpenses', 'Despesas Administrativas')}</Td>
                <Td isNumeric color="red.600">-{formatCurrency(totals.despesasAdm)}</Td>
              </Tr>
              <Tr>
                <Td>{t('weekly.control.summary.rows.fuel', 'Combustível')}</Td>
                <Td isNumeric color="orange.600">-{formatCurrency(totals.combustivel)}</Td>
              </Tr>
              <Tr>
                <Td>{t('weekly.control.summary.rows.tolls', 'Portagens')}</Td>
                <Td isNumeric color="orange.600">-{formatCurrency(totals.viaverde)}</Td>
              </Tr>
              <Tr>
                <Td>{t('weekly.control.summary.rows.rent', 'Aluguel')}</Td>
                <Td isNumeric color="purple.600">-{formatCurrency(totals.aluguel)}</Td>
              </Tr>
              <Tr>
                <Td fontWeight="bold">{t('weekly.control.summary.rows.netValue', 'Valor Líquido')}</Td>
                <Td isNumeric fontWeight="bold" color="blue.600">{formatCurrency(totals.repasse)}</Td>
              </Tr>
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Tabela de Registros */}
      <Card>
        <CardHeader>
          <Heading size="md">{t('weekly.control.records.title', 'Registos Semanais')}</Heading>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" color="blue.500" />
              <Text mt={4} color="gray.600">{t('weekly.control.records.loading', 'A carregar dados...')}</Text>
            </Box>
          ) : records.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text color="gray.600">{t('weekly.control.records.empty', 'Nenhum registo encontrado para esta semana.')}</Text>
              <Button
                mt={4}
                leftIcon={<Icon as={FiUpload} />}
                onClick={() => router.push("/admin/data")}
                colorScheme="blue"
              >
                {t('weekly.control.actions.importData', 'Importar dados')}
              </Button>
            </Box>
          ) : isMobile ? (
            // Mobile: Exibir como cartões
            <VStack spacing={4} align="stretch">
              {records.map((record, index) => (
                <WeeklyRecordCard
                  key={index}
                  record={record}
                  formatCurrency={formatCurrency}
                  formatDateLabel={formatDateLabel}
                  typeLabels={typeLabels}
                  statusLabels={statusLabels}
                  statusColor={PAYMENT_STATUS_COLOR[record.paymentStatus] || 'gray'}
                  locale={locale || 'pt-PT'}
                  onViewPayslip={handleViewPayslip}
                  onTogglePaymentStatus={handleTogglePaymentStatus}
                  onUpdateField={handleUpdateRecord}
                  generatingRecordId={generatingRecordId}
                  updatingPaymentId={updatingPaymentId}
                  t={t}
                />
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
                    <Th isNumeric>{t('weekly.control.records.columns.platformPrio', 'PRIO')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.platformViaVerde', 'ViaVerde')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.grossTotal', 'Ganhos brutos')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.iva', 'IVA')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.adminExpenses', 'Taxa adm.')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.fuel', 'Combustível')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.tolls', 'Portagens')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.rent', 'Aluguel')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.net', 'Valor líquido')}</Th>
                    <Th>{t('weekly.control.records.columns.status', 'Status')}</Th>
                    <Th textAlign="right">{t('weekly.control.records.columns.actions', 'Ações')}</Th>
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
                        {formatCurrency(
                          record.platformData
                            .filter((p) => p.platform === 'uber')
                            .reduce((acc, curr) => acc + (curr.totalValue || 0), 0)
                        )}
                      </Td>
                      <Td isNumeric>
                        {formatCurrency(
                          record.platformData
                            .filter((p) => p.platform === 'bolt')
                            .reduce((acc, curr) => acc + (curr.totalValue || 0), 0)
                        )}
                      </Td>
                      <Td isNumeric>
                        {formatCurrency(
                          record.platformData
                            .filter((p) => p.platform === 'myprio')
                            .reduce((acc, curr) => acc + (curr.totalValue || 0), 0)
                        )}
                      </Td>
                      <Td isNumeric>
                        {formatCurrency(
                          record.platformData
                            .filter((p) => p.platform === 'viaverde')
                            .reduce((acc, curr) => acc + (curr.totalValue || 0), 0)
                        )}
                      </Td>
                      <EditableNumberField
                        value={record.ganhosTotal}
                        onChange={(newValue) => handleUpdateRecord(record.id, { ganhosTotal: newValue })}
                        isPaid={record.paymentStatus === 'paid'}
                      />
                      <EditableNumberField
                        value={record.ivaValor}
                        onChange={(newValue) => handleUpdateRecord(record.id, { ivaValor: newValue })}
                        isPaid={record.paymentStatus === 'paid'}
                        color="red.600"
                        prefix="-"
                      />
                      <EditableNumberField
                        value={record.despesasAdm}
                        onChange={(newValue) => handleUpdateRecord(record.id, { despesasAdm: newValue })}
                        isPaid={record.paymentStatus === 'paid'}
                        color="red.600"
                        prefix="-"
                      />
                      <EditableNumberField
                        value={record.combustivel}
                        onChange={(newValue) => handleUpdateRecord(record.id, { combustivel: newValue })}
                        isPaid={record.paymentStatus === 'paid'}
                        color="orange.600"
                        prefix="-"
                      />
                      <EditableNumberField
                        value={record.viaverde}
                        onChange={(newValue) => handleUpdateRecord(record.id, { viaverde: newValue })}
                        isPaid={record.paymentStatus === 'paid'}
                        color="orange.600"
                        prefix="-"
                      />
                      <EditableNumberField
                        value={record.aluguel}
                        onChange={(newValue) => handleUpdateRecord(record.id, { aluguel: newValue })}
                        isPaid={record.paymentStatus === 'paid'}
                        color="purple.600"
                        prefix="-"
                      />
                      <EditableNumberField
                        value={record.repasse}
                        onChange={(newValue) => handleUpdateRecord(record.id, { repasse: newValue })}
                        isPaid={record.paymentStatus === 'paid'}
                        color="blue.600"
                        fontWeight="bold"
                      />
                      <Td>
                        <VStack align="flex-start" spacing={1}>
                          <Badge colorScheme={PAYMENT_STATUS_COLOR[record.paymentStatus] || 'gray'}>
                            {statusLabels[record.paymentStatus] || record.paymentStatus}
                          </Badge>
                          {record.paymentDate && (
                            <Text fontSize="xs" color="gray.500">
                              {formatDateLabel(record.paymentDate, locale || 'pt-PT')}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <ButtonGroup size="xs" variant="outline" spacing={2} justifyContent="flex-end">
                          <Button
                            leftIcon={<Icon as={FiFileText} />}
                            onClick={() => handleViewPayslip(record)}
                            isLoading={generatingRecordId === record.id}
                            loadingText={t('weekly.control.records.messages.generateInProgress', 'A gerar...')}
                            size="xs"
                          >
                            {t('weekly.control.records.actions.generatePayslip', 'Contracheque')}
                          </Button>
                          <Button
                            leftIcon={<Icon as={record.paymentStatus === 'paid' ? FiRotateCcw : FiCheckCircle} />}
                            colorScheme={record.paymentStatus === 'paid' ? 'yellow' : 'green'}
                            onClick={() => handleTogglePaymentStatus(record)}
                            isLoading={updatingPaymentId === record.id}
                            size="xs"
                          >
                            {record.paymentStatus === 'paid'
                              ? t('weekly.control.records.actions.markAsPending', 'Pendente')
                              : t('weekly.control.records.actions.markAsPaid', 'Pago')}
                          </Button>
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

      {/* Modal de Visualização do Contracheque */}
      <Modal isOpen={isPayslipModalOpen} onClose={onClosePayslipModal} size="5xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Text>{t('weekly.control.payslipModal.title', 'Contracheque Semanal')}</Text>
              {selectedPayslipRecord && (
                <Text fontSize="sm" fontWeight="normal" color="gray.600">
                  {formatDateLabel(selectedPayslipRecord.weekStart, locale || 'pt-PT')} - {formatDateLabel(selectedPayslipRecord.weekEnd, locale || 'pt-PT')}
                </Text>
              )}
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch" height="100%">
              <HStack spacing={4} justify="flex-end">
                <Button
                  leftIcon={<Icon as={FiDownload} />}
                  onClick={handleDownloadPayslip}
                  colorScheme="blue"
                >
                  {t('weekly.control.payslipModal.downloadPdf', 'Baixar PDF')}
                </Button>
                <Button
                  leftIcon={<Icon as={FiMail} />}
                  onClick={handleSendPayslipEmail}
                  colorScheme="green"
                >
                  {t('weekly.control.payslipModal.sendEmail', 'Enviar por e-mail')}
                </Button>
              </HStack>
              {payslipPdfUrl ? (
                <Box flex="1" minH="full" height="60vh">
                  <iframe src={payslipPdfUrl} width="100%" height="100%" style={{ border: 'none' }} />
                </Box>
              ) : (
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <AlertTitle>{t('weekly.control.payslipModal.noPdfTitle', 'Nenhum PDF gerado')}</AlertTitle>
                  <AlertDescription>{t('weekly.control.payslipModal.noPdfDesc', 'Gere o contracheque para visualizá-lo aqui.')}</AlertDescription>
                </Alert>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {unassigned.length > 0 && (
        <Card variant="outline">
          <CardHeader>
            <Heading size="sm" color="orange.500">
              {t('weekly.control.unassigned.title', 'Registos sem motorista associado')}
            </Heading>
          </CardHeader>
          <CardBody>
            <Text fontSize="sm" color="gray.600" mb={3}>
              {t('weekly.control.unassigned.description', 'Revise estes lançamentos e atualize os cadastros para mapear corretamente.')} ({unassigned.length})
            </Text>
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>{t('weekly.control.unassigned.columns.platform', 'Plataforma')}</Th>
                  <Th>{t('weekly.control.unassigned.columns.reference', 'Referência')}</Th>
                  <Th>{t('weekly.control.unassigned.columns.value', 'Valor')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {unassigned.map((entry) => (
                  <Tr key={entry.id}>
                    <Td textTransform="capitalize">{entry.platform}</Td>
                    <Td>{entry.referenceLabel || entry.referenceId}</Td>
                    <Td isNumeric>{formatCurrency(entry.totalValue)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}

    </AdminLayout>
  );
}

// SSR com autenticação, traduções e dados iniciais
export const getServerSideProps = withAdminSSR(async (context, user) => {
  // Gerar opções de semanas baseado nos dados reais
  const weekOptions = await getWeekOptions(12);
  const currentWeek = weekOptions.length > 0 ? weekOptions[0].value : '';

  return {
    weekOptions,
    currentWeek,
    initialRecords: [], // Será carregado via SWR no cliente
  };
});

