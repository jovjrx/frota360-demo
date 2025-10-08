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
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
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
import { getTranslation } from '@/lib/translations';
import { getWeekOptions } from '@/lib/admin/adminQueries';
import { useRouter } from 'next/router';
import { getWeekId, getWeekDates } from '@/lib/utils/date-helpers';
import EditableNumberField from '@/components/admin/EditableNumberField';
import StatCard from '@/components/admin/StatCard';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import { FiDownload, FiMail } from 'react-icons/fi';
import EditableNumberField from '@/components/admin/EditableNumberField';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import { FiDownload, FiMail } from 'react-icons/fi';
import EditableNumberField from '@/components/admin/EditableNumberField';

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

const makeSafeT = (dictionary?: Record<string, any>) => (
  key: string,
  fallback?: string,
  variables?: Record<string, any>
) => {
  if (!dictionary) return fallback ?? key;
  const value = getTranslation(dictionary, key, variables);
  return value === key ? (fallback ?? key) : value;
};

export default function WeeklyPage({ user, translations, locale, weekOptions, currentWeek, initialRecords }: WeeklyPageProps) {
  const [filterWeek, setFilterWeek] = useState(currentWeek);
  const [records, setRecords] = useState<DriverRecord[]>(initialRecords);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingResumos, setIsGeneratingResumos] = useState(false);
  const [unassigned, setUnassigned] = useState<WeeklyNormalizedData[]>([]);
  const [generatingRecordId, setGeneratingRecordId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();
  const t = useMemo(() => makeSafeT(translations.common), [translations.common]);
  const tAdmin = useMemo(() => makeSafeT(translations.admin), [translations.admin]);
  const typeLabels = useMemo(
    () => ({
      affiliate: tAdmin('weekly_records.types.affiliate', 'Afiliado'),
      renter: tAdmin('weekly_records.types.renter', 'Locatário'),
    }),
    [tAdmin]
  );

  const statusLabels = useMemo(
    () => ({
      pending: tAdmin('weekly_records.paymentStatus.pending', 'Pendente'),
      paid: tAdmin('weekly_records.paymentStatus.paid', 'Pago'),
      cancelled: tAdmin('weekly_records.paymentStatus.cancelled', 'Cancelado'),
    }),
    [tAdmin]
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
        throw new Error(tAdmin('error_loading_data'));
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
        title: tAdmin('error_loading_data_title'),
        description: error instanceof Error ? error.message : tAdmin('error_loading_data_description'),
        status: 'error',
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
          title: tAdmin('errors.title', 'Erro'),
          description: tAdmin('select_week_error'),
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
        throw new Error(tAdmin('error_generating_summaries'));
      }

      // Download do arquivo ZIP
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tAdmin('summaries_filename_prefix')}_${selectedWeek.start}_a_${selectedWeek.end}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: tAdmin('summaries_generated_success_title'),
        description: tAdmin('summaries_generated_success_description'),
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      console.error('Erro ao gerar resumos:', error);
      toast({
        title: tAdmin('error_generating_summaries_title'),
        description: error instanceof Error ? error.message : tAdmin('error_generating_summaries_description'),
        status: 'error',
        duration: 5000,
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
        throw new Error(errorPayload?.message || tAdmin("weekly_records.messages.generateError", "Não foi possível gerar o contracheque."));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPayslipPdfUrl(url);
      setSelectedPayslipRecord(record);
      onOpenPayslipModal();

    } catch (error: any) {
      toast({
        title: tAdmin("weekly_records.actions.generatePayslip", "Gerar contracheque"),
        description: error?.message || tAdmin("weekly_records.messages.generateError", "Não foi possível gerar o contracheque."),
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
        title: tAdmin("weekly_records.messages.sendEmailErrorTitle", "Erro ao enviar e-mail"),
        description: tAdmin("weekly_records.messages.sendEmailErrorDesc", "Nenhum contracheque selecionado ou PDF não gerado."),
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
          throw new Error(errorPayload?.message || tAdmin("weekly_records.messages.sendEmailError", "Não foi possível enviar o contracheque por e-mail."));
        }

        toast({
          title: tAdmin("weekly_records.messages.sendEmailSuccessTitle", "E-mail enviado!"),
          description: tAdmin("weekly_records.messages.sendEmailSuccessDesc", "Contracheque enviado com sucesso para o motorista."),
          status: "success",
          duration: 4000,
        });
      };
    } catch (error: any) {
      console.error("Erro ao enviar e-mail:", error);
      toast({
        title: tAdmin("weekly_records.messages.sendEmailErrorTitle", "Erro ao enviar e-mail"),
        description: error?.message || tAdmin("weekly_records.messages.sendEmailError", "Não foi possível enviar o contracheque por e-mail."),
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleExportPayments = async () => {
    try {
      const selectedWeek = weekOptions.find(w => w.value === filterWeek);
      if (!selectedWeek) {
        toast({
          title: tAdmin("errors.title", "Erro"),
          description: tAdmin("select_week_error"),
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
        throw new Error(errorPayload?.message || tAdmin("weekly_records.messages.exportError", "Não foi possível exportar a planilha de pagamentos."));
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
        title: tAdmin("weekly_records.messages.exportSuccessTitle", "Exportação concluída!"),
        description: tAdmin("weekly_records.messages.exportSuccessDesc", "A planilha de pagamentos foi exportada com sucesso."),
        status: "success",
        duration: 4000,
      });
    } catch (error: any) {
      console.error("Erro ao exportar pagamentos:", error);
      toast({
        title: tAdmin("weekly_records.messages.exportErrorTitle", "Erro na exportação"),
        description: error?.message || tAdmin("weekly_records.messages.exportError", "Não foi possível exportar a planilha de pagamentos."),
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleUpdateRecord = async (recordId: string, updates: Partial<DriverWeeklyRecord>) => {
    if (!selectedPayslipRecord || !payslipPdfUrl) {
      toast({
        title: tAdmin("weekly_records.messages.sendEmailErrorTitle", "Erro ao enviar e-mail"),
        description: tAdmin("weekly_records.messages.sendEmailErrorDesc", "Nenhum contracheque selecionado ou PDF não gerado."),
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
          throw new Error(errorPayload?.message || tAdmin("weekly_records.messages.sendEmailError", "Não foi possível enviar o contracheque por e-mail."));
        }

        toast({
          title: tAdmin("weekly_records.messages.sendEmailSuccessTitle", "E-mail enviado!"),
          description: tAdmin("weekly_records.messages.sendEmailSuccessDesc", "Contracheque enviado com sucesso para o motorista."),
          status: "success",
          duration: 4000,
        });
      };
    } catch (error: any) {
      console.error("Erro ao enviar e-mail:", error);
      toast({
        title: tAdmin("weekly_records.messages.sendEmailErrorTitle", "Erro ao enviar e-mail"),
        description: error?.message || tAdmin("weekly_records.messages.sendEmailError", "Não foi possível enviar o contracheque por e-mail."),
        status: "error",
        duration: 5000,
      });
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
        throw new Error(errorPayload?.message || tAdmin("weekly_records.messages.updateError", "Não foi possível atualizar o registro."));
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
        title: tAdmin("weekly_records.messages.updateSuccess", "Registro atualizado com sucesso!"),
        status: "success",
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: tAdmin("weekly_records.messages.updateErrorTitle", "Erro ao atualizar registro"),
        description: error?.message || tAdmin("weekly_records.messages.updateError", "Não foi possível atualizar o registro."),
        status: "error",
        duration: 5000,
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
        throw new Error(errorPayload?.message || tAdmin("weekly_records.messages.updateError", "Não foi possível atualizar o status do pagamento."));
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
        title:
          nextStatus === "paid"
            ? tAdmin("weekly_records.actions.markAsPaid", "Marcar como pago")
            : tAdmin("weekly_records.actions.markAsPending", "Marcar como pendente"),
        description:
          nextStatus === "paid"
            ? tAdmin("weekly_records.messages.markPaidSuccess", "Pagamento marcado como concluído.")
            : tAdmin("weekly_records.messages.markPendingSuccess", "Pagamento marcado como pendente."),
        status: "success",
        duration: 4000,
      });
    } catch (error: any) {
      toast({
        title: tAdmin("weekly_records.actions.markAsPaid", "Marcar como pago"),
        description: error?.message || tAdmin("weekly_records.messages.updateError", "Não foi possível atualizar o status do pagamento."),
        status: "error",
        duration: 4000,
      });
    } finally {
      setUpdatingPaymentId(null);
    }
  };
    if (!record?.id) {
      return;
    }

    const nextStatus = record.paymentStatus === 'paid' ? 'pending' : 'paid';
    setUpdatingPaymentId(record.id);

    try {
      const response = await fetch('/api/admin/weekly/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          record,
          updates: { paymentStatus: nextStatus },
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.message || tAdmin('weekly_records.messages.updateError', 'Não foi possível atualizar o status do pagamento.'));
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
        title:
          nextStatus === 'paid'
            ? tAdmin('weekly_records.actions.markAsPaid', 'Marcar como pago')
            : tAdmin('weekly_records.actions.markAsPending', 'Marcar como pendente'),
        description:
          nextStatus === 'paid'
            ? tAdmin('weekly_records.messages.markPaidSuccess', 'Pagamento marcado como concluído.')
            : tAdmin('weekly_records.messages.markPendingSuccess', 'Pagamento marcado como pendente.'),
        status: 'success',
        duration: 4000,
      });
    } catch (error: any) {
      toast({
        title: tAdmin('weekly_records.actions.markAsPaid', 'Marcar como pago'),
        description: error?.message || tAdmin('weekly_records.messages.updateError', 'Não foi possível atualizar o status do pagamento.'),
        status: 'error',
        duration: 4000,
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
      title={tAdmin('weekly_control_title')}
      subtitle={tAdmin('weekly_control_subtitle')}
      breadcrumbs={[{ label: tAdmin('weekly_control_title') }]}
    >
      <VStack spacing={6} align="stretch">
        {/* Alerta */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          {tAdmin('new_structure_alert')}
        </Alert>

        {/* Filtros e Ações */}
        <Card>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap" justify="space-between">
              <HStack spacing={4}>
                <Box>
                  <Text fontSize="sm" mb={2} fontWeight="medium">{tAdmin('week_label')}:</Text>
                  <Select 
                    value={filterWeek} 
                    onChange={(e) => setFilterWeek(e.target.value)} 
                    w="300px"
                  >
                    {weekOptions.map(week => (
                      <option key={week.value} value={week.value}>
                        {week.label}
                      </option>
                    ))}
                  </Select>
                </Box>
              </HStack>

              <HStack spacing={2}>
                <Button
                  leftIcon={<Icon as={FiUpload} />}
                  onClick={() => router.push('/admin/data')}
                  colorScheme="blue"
                  size="sm"
                >
                  {tAdmin('import_data_button')}
                </Button>
                <Button
                  leftIcon={<Icon as={FiRefreshCw} />}
                  onClick={() => loadWeekData(filterWeek)}
                  isLoading={isLoading}
                  size="sm"
                >
                  {tAdmin('dashboard.actions.refresh', 'Atualizar')}
                </Button>
                <Button
                  leftIcon={<Icon as={FiFileText} />}
                  onClick={handleGenerateResumos}
                  colorScheme="purple"
                  size="sm"
                  isLoading={isGeneratingResumos}
                  loadingText={tAdmin("generating_summaries_loading")}
                  isDisabled={records.length === 0}
                >
                  {tAdmin("generate_summaries_button")}
                </Button>
                <Button
                  leftIcon={<Icon as={FiDownload} />}
                  onClick={handleExportPayments}
                  colorScheme="teal"
                  size="sm"
                  isDisabled={records.length === 0}
                >
                  {tAdmin("export_payments_button", "Exportar Planilha")}
                </Button>
              </HStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Resumo */}
        <Card>
          <CardHeader>
            <Heading size="md">{tAdmin("weekly_summary_title", "Resumo Semanal")}</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <StatCard label={tAdmin("total_earnings", "Ganhos Totais")} value={totals.ganhosTotal} color="green.600" helpText={`${records.length} ${tAdmin("drivers_label", "motoristas")}`} />
              <StatCard label={tAdmin("total_discounts", "Descontos Totais")} value={totals.ivaValor + totals.despesasAdm + totals.combustivel + totals.viaverde + totals.aluguel} color="red.600" helpText={tAdmin("iva_adm_fuel_tolls_rent", "IVA, Adm, Combustível, Portagens, Aluguel")} />
              <StatCard label={tAdmin("fuel_label", "Combustível")} value={totals.combustivel} color="orange.600" helpText={tAdmin("prio_label", "PRIO")} />
              <StatCard label={tAdmin("net_value", "Valor Líquido")} value={totals.repasse} color="blue.600" helpText={tAdmin("total_to_pay", "Total a Pagar")} />
            </SimpleGrid>
            <Table variant="simple" size="sm" mt={6}>
              <Thead>
                <Tr>
                  <Th>{tAdmin("summary_item", "Item")}</Th>
                  <Th isNumeric>{tAdmin("summary_value", "Valor")}</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>{tAdmin("total_earnings", "Ganhos Totais")}</Td>
                  <Td isNumeric>{formatCurrency(totals.ganhosTotal)}</Td>
                </Tr>
                <Tr>
                  <Td>{tAdmin("iva_label", "IVA")}</Td>
                  <Td isNumeric color="red.600">-{formatCurrency(totals.ivaValor)}</Td>
                </Tr>
                <Tr>
                  <Td>{tAdmin("admin_expenses_label", "Despesas Administrativas")}</Td>
                  <Td isNumeric color="red.600">-{formatCurrency(totals.despesasAdm)}</Td>
                </Tr>
                <Tr>
                  <Td>{tAdmin("fuel_label", "Combustível")}</Td>
                  <Td isNumeric color="orange.600">-{formatCurrency(totals.combustivel)}</Td>
                </Tr>
                <Tr>
                  <Td>{tAdmin("tolls_label", "Portagens")}</Td>
                  <Td isNumeric color="orange.600">-{formatCurrency(totals.viaverde)}</Td>
                </Tr>
                <Tr>
                  <Td>{tAdmin("rent_label", "Aluguel")}</Td>
                  <Td isNumeric color="purple.600">-{formatCurrency(totals.aluguel)}</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="bold">{tAdmin("net_value", "Valor Líquido")}</Td>
                  <Td isNumeric fontWeight="bold" color="blue.600">{formatCurrency(totals.repasse)}</Td>
                </Tr>
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* Tabela de Registros */}
        <Card>
          <CardHeader>
            <Heading size="md">{tAdmin("weekly_records_title")}</Heading>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <Box textAlign="center" py={10}>
                <Spinner size="xl" color="blue.500" />
                <Text mt={4} color="gray.600">{tAdmin("loading_data")}</Text>
              </Box>
            ) : records.length === 0 ? (
              <Box textAlign="center" py={10}>
                <Text color="gray.600">{tAdmin("no_records_found")}</Text>
                <Button
                  mt={4}
                  leftIcon={<Icon as={FiUpload} />}
                  onClick={() => router.push("/admin/data")}
                  colorScheme="blue"
                >
                  {tAdmin("import_data_button")}
                </Button>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>{tAdmin('weekly_records.columns.driver', 'Motorista')}</Th>
                      <Th>{tAdmin('weekly_records.columns.type', 'Tipo')}</Th>
                      <Th isNumeric>{tAdmin("weekly_records.columns.platformUber", "Uber")}</Th>
                      <Th isNumeric>{tAdmin("weekly_records.columns.platformBolt", "Bolt")}</Th>
                      <Th isNumeric>{tAdmin("weekly_records.columns.platformPrio", "PRIO")}</Th>
                      <Th isNumeric>{tAdmin("weekly_records.columns.platformViaVerde", "ViaVerde")}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.grossTotal', 'Ganhos brutos')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.iva', 'IVA')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.adminExpenses', 'Taxa adm.')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.fuel', 'Combustível')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.tolls', 'Portagens')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.rent', 'Aluguel')}</Th>
                      <Th isNumeric>{tAdmin('weekly_records.columns.net', 'Valor líquido')}</Th>
                      <Th>{tAdmin('weekly_records.columns.status', 'Status')}</Th>
                      <Th textAlign="right">{tAdmin('weekly_records.columns.actions', 'Ações')}</Th>
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
                              .filter((p) => p.platform === 'prio')
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
                        isPaid={isPaid}
                      />
                      <EditableNumberField 
                        value={record.ivaValor}
                        onChange={(newValue) => handleUpdateRecord(record.id, { ivaValor: newValue })}
                        isPaid={isPaid}
                        color="red.600"
                        prefix="-"
                      />
                      <EditableNumberField 
                        value={record.despesasAdm}
                        onChange={(newValue) => handleUpdateRecord(record.id, { despesasAdm: newValue })}
                        isPaid={isPaid}
                        color="red.600"
                        prefix="-"
                      />
                      <EditableNumberField 
                        value={record.combustivel}
                        onChange={(newValue) => handleUpdateRecord(record.id, { combustivel: newValue })}
                        isPaid={isPaid}
                        color="orange.600"
                        prefix="-"
                      />
                      <EditableNumberField 
                        value={record.viaverde}
                        onChange={(newValue) => handleUpdateRecord(record.id, { viaverde: newValue })}
                        isPaid={isPaid}
                        color="orange.600"
                        prefix="-"
                      />
                      <EditableNumberField 
                        value={record.aluguel}
                        onChange={(newValue) => handleUpdateRecord(record.id, { aluguel: newValue })}
                        isPaid={isPaid}
                        color="purple.600"
                        prefix="-"
                      />
                      <EditableNumberField 
                        value={record.repasse}
                        onChange={(newValue) => handleUpdateRecord(record.id, { repasse: newValue })}
                        isPaid={isPaid}
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
                              onClick={() => handleGeneratePayslip(record)}
                              isLoading={generatingRecordId === record.id}
                              loadingText={tAdmin('weekly_records.messages.generateInProgress', 'A gerar contracheque...')}
                            >
                              {tAdmin('weekly_records.actions.generatePayslip', 'Gerar contracheque')}
                            </Button>
                            <Button
                              leftIcon={<Icon as={record.paymentStatus === 'paid' ? FiRotateCcw : FiCheckCircle} />}
                              colorScheme={record.paymentStatus === 'paid' ? 'yellow' : 'green'}
                              onClick={() => handleTogglePaymentStatus(record)}
                              isLoading={updatingPaymentId === record.id}
                            >
                              {record.paymentStatus === 'paid'
                                ? tAdmin('weekly_records.actions.markAsPending', 'Marcar como pendente')
                                : tAdmin('weekly_records.actions.markAsPaid', 'Marcar como pago')}
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
<Modal isOpen={isPayslipModalOpen} onClose={onClosePayslipModal} size="full">
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>
      <VStack align="start" spacing={1}>
        <Text>{tAdmin("weekly_records.payslipModal.title", "Contracheque Semanal")}</Text>
        {selectedPayslipRecord && (
          <Text fontSize="sm" fontWeight="normal" color="gray.600">
            {formatDateLabel(selectedPayslipRecord.weekStart, locale || 'pt-PT')} - {formatDateLabel(selectedPayslipRecord.weekEnd, locale || 'pt-PT')}
          </Text>
        )}
      </VStack>
    </ModalHeader>
    <ModalCloseButton />
    <ModalBody pb={6}>
      <VStack spacing={4} align="stretch" height="100%">
        <HStack spacing={4} justify="flex-end">
          <Button
            leftIcon={<Icon as={FiDownload} />}
            onClick={handleDownloadPayslip}
            colorScheme="blue"
          >
            {tAdmin("weekly_records.payslipModal.downloadPdf", "Baixar PDF")}
          </Button>
          <Button
            leftIcon={<Icon as={FiMail} />}
            onClick={handleSendPayslipEmail}
            colorScheme="green"
          >
            {tAdmin("weekly_records.payslipModal.sendEmail", "Enviar por E-mail")}
          </Button>
        </HStack>
        {payslipPdfUrl ? (
          <Box flex="1" height="calc(100vh - 200px)">
            <iframe src={payslipPdfUrl} width="100%" height="100%" style={{ border: 'none' }} />
          </Box>
        ) : (
          <Alert status="info" borderRadius="lg">
            <AlertIcon />
            <AlertTitle>{tAdmin("weekly_records.payslipModal.noPdfTitle", "Nenhum PDF gerado")}</AlertTitle>
            <AlertDescription>{tAdmin("weekly_records.payslipModal.noPdfDesc", "Gere o contracheque para visualizá-lo aqui.")}</AlertDescription>
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
                {tAdmin('weekly_unassigned_title', 'Registos sem motorista associado')}
              </Heading>
            </CardHeader>
            <CardBody>
              <Text fontSize="sm" color="gray.600" mb={3}>
                {tAdmin('weekly_unassigned_description', 'Revise estes lançamentos e atualize os cadastros para mapear corretamente.')} ({unassigned.length})
              </Text>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>{tAdmin('platform_label', 'Plataforma')}</Th>
                    <Th>{tAdmin('reference_label', 'Referência')}</Th>
                    <Th>{tAdmin('value_label', 'Valor')}</Th>
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
      </VStack>
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

