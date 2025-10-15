import { useState, useEffect, useMemo, useRef } from 'react';
import type { ChangeEvent } from 'react';
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
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useBreakpointValue,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Textarea,
  Stack,
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiUpload,
  FiFileText,
  FiCheckCircle,
  FiExternalLink,
  FiPaperclip,
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
import { useDisclosure } from '@chakra-ui/react';
import { FiDownload, FiMail } from 'react-icons/fi';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import StructuredModal from '@/components/admin/StructuredModal';

interface WeekOption {
  label: string;
  value: string;
  start: string;
  end: string;
}

import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { DriverPayment } from '@/schemas/driver-payment';
import { WeeklyNormalizedData } from '@/schemas/data-weekly';

interface DriverRecord extends DriverWeeklyRecord {
  driverType: 'affiliate' | 'renter';
  vehicle: string;
  platformData: WeeklyNormalizedData[];
  paymentInfo?: DriverPayment | null;
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
  translations,
}: WeeklyPageProps) {
  const [filterWeek, setFilterWeek] = useState(currentWeek);
  const [records, setRecords] = useState<DriverRecord[]>(initialRecords);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingResumos, setIsGeneratingResumos] = useState(false);
  const [unassigned, setUnassigned] = useState<WeeklyNormalizedData[]>([]);
  const [generatingRecordId, setGeneratingRecordId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const { isOpen: isPaymentModalOpen, onOpen: onOpenPaymentModal, onClose: onClosePaymentModal } = useDisclosure();
  const [selectedPaymentRecord, setSelectedPaymentRecord] = useState<DriverRecord | null>(null);
  const [paymentDateValue, setPaymentDateValue] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSavingPayment, setIsSavingPayment] = useState<boolean>(false);
  const [bonusValue, setBonusValue] = useState<string>('0');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_PROOF_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
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

  const paymentBaseAmount = selectedPaymentRecord?.repasse ?? 0;
  const paymentBonusAmount = parseMoneyInput(bonusValue);
  const paymentDiscountAmount = parseMoneyInput(discountValue);
  const paymentTotalAmount = Number(
    Math.round((paymentBaseAmount + paymentBonusAmount - paymentDiscountAmount) * 100) / 100
  );
  const paymentTotalInvalid = paymentTotalAmount <= 0;

  const handleProofFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setPaymentProofFile(null);
      return;
    }

    if (file.size > MAX_PROOF_FILE_SIZE) {
      toast({
        title: t('weekly.control.paymentModal.proofTooLargeTitle', 'Arquivo muito grande'),
        description: t('weekly.control.paymentModal.proofTooLargeDescription', 'Selecione um arquivo de até 10MB.'),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setPaymentProofFile(file);
  };

  const handleRemoveProof = () => {
    setPaymentProofFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

      const recordsResponse: DriverRecord[] = (data.records || []).map((record: any) => ({
        ...record,
        driverType: record.driverType,
        vehicle: record.vehicle,
        platformData: record.platformData || [],
        paymentInfo: record.paymentInfo ?? null,
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
        throw new Error(errorPayload?.message || t('weekly.control.records.messages.generateError', 'Não foi possível gerar o resumo.'));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPayslipPdfUrl(url);
      setSelectedPayslipRecord(record);
      onOpenPayslipModal();

    } catch (error: any) {
      toast({
        title: t('weekly.control.records.actions.generatePayslip', 'Gerar resumo'),
        description: error?.message || t('weekly.control.records.messages.generateError', 'Não foi possível gerar o resumo.'),
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
      const fileName = `resumo_${selectedPayslipRecord.driverName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_${selectedPayslipRecord.weekStart}_a_${selectedPayslipRecord.weekEnd}.pdf`;
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
        description: t('weekly.control.records.messages.sendEmailErrorDesc', 'Nenhum resumo selecionado ou PDF não gerado.'),
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
          throw new Error(errorPayload?.message || t('weekly.control.records.messages.sendEmailError', 'Não foi possível enviar o resumo por e-mail.'));
        }

        toast({
          title: t('weekly.control.records.messages.sendEmailSuccessTitle', 'E-mail enviado!'),
          description: t('weekly.control.records.messages.sendEmailSuccessDesc', 'Resumo enviado com sucesso para o motorista.'),
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
              paymentInfo: item.paymentInfo,
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

  const handleOpenPaymentModal = (record: DriverRecord) => {
    if (!record?.id) {
      return;
    }

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
    if (isSavingPayment) {
      return;
    }

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
    if (!selectedPaymentRecord) {
      return;
    }

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

  // Mensagem de sucesso com informações sobre ônus bancário processado
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

  // Calcular totais
  const totals = records.reduce((acc, record) => {
    // NOVA LÓGICA: despesasAdm sempre 7% fixo, juros vão para financiamento
    const ganhosMenosIVA = record.ganhosTotal - record.ivaValor;
    const despesasBase = ganhosMenosIVA * 0.07; // 7% fixo
    
    // Juros agora são calculados sobre a parcela de financiamento
    const financingInstallment = record.financingDetails?.installment || 0;
    const financingInterest = record.financingDetails?.interestAmount || 0;
    const financingTotal = record.financingDetails?.totalCost || financingInstallment;
    
    return {
      ganhosTotal: acc.ganhosTotal + record.ganhosTotal,
      ivaValor: acc.ivaValor + record.ivaValor,
      despesasAdm: acc.despesasAdm + record.despesasAdm,
      despesasBase: acc.despesasBase + despesasBase,
      despesasJuros: acc.despesasJuros + 0, // Não há mais juros nas despesas adm
      combustivel: acc.combustivel + record.combustivel,
      viaverde: acc.viaverde + record.viaverde,
      aluguel: acc.aluguel + record.aluguel,
      financiamento: acc.financiamento + financingInstallment,
      financiamentoJuros: acc.financiamentoJuros + financingInterest,
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

  return (
    <AdminLayout
      title={t('weekly.control.title', 'Controle Semanal')}
      subtitle={t('weekly.control.subtitle', 'Gestão semanal de dados TVDE')}
      breadcrumbs={[{ label: t('weekly.control.title', 'Controle Semanal') }]}
      translations={translations}
    >
      {/* Filtros e Ações */}
      <Card>
        <CardBody p={4}>
          <HStack spacing={{ base: 2, md: 4 }} align="center" justify="space-between" flexWrap="wrap">
            <Select
              size="sm"
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              flex={{ base: "1", md: "0 0 300px" }}
              minW={{ base: "150px", md: "300px" }}
            >
              {weekOptions.map(week => (
                <option key={week.value} value={week.value}>
                  {week.label}
                </option>
              ))}
            </Select>
            <HStack spacing={{ base: 1, md: 2 }}>
              <Button
                leftIcon={isMobile ? undefined : <Icon as={FiRefreshCw} />}
                onClick={() => loadWeekData(filterWeek)}
                isLoading={isLoading}
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
        </CardBody>
      </Card>

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
          helpText="PRIO"
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
          helpText="7% fixo"
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
                  onInitiatePayment={handleOpenPaymentModal}
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
                    <Th isNumeric>{t('weekly.control.records.columns.grossTotal', 'Ganhos brutos (✕)')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.iva', 'IVA (✕)')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.adminExpenses', 'Taxa adm. (✕)')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.fuel', 'Combustível (✕)')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.tolls', 'Portagens (✕)')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.rent', 'Aluguel')}</Th>
                    <Th isNumeric>{t('weekly.control.records.columns.bankCharge', 'Financiamento')}</Th>
                    <Th isNumeric>Líquido</Th>
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
                      <Td isNumeric color="orange.600" fontWeight="medium">
                        -{formatCurrency(record.combustivel || 0)}
                      </Td>
                      <Td isNumeric>
                        {record.viaverde > 0 ? (
                          <VStack spacing={0} align="flex-end">
                            <Text color="orange.600" fontWeight="medium">
                              {formatCurrency(record.viaverde || 0)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {t('weekly.control.records.columns.tollsCompany', 'Pago pela empresa')}
                            </Text>
                          </VStack>
                        ) : (
                          <Text color="gray.400">-</Text>
                        )}
                      </Td>
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
                              -{formatCurrency(record.financingDetails.totalCost || record.financingDetails.installment)}
                            </Text>
                            {record.financingDetails.interestAmount > 0 && (
                              <Text fontSize="xs" color="pink.500">
                                {formatBankChargeBreakdown(
                                  record.financingDetails.installment,
                                  record.financingDetails.interestAmount
                                )}
                              </Text>
                            )}
                          </VStack>
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
                        <VStack align="flex-start" spacing={1}>
                          <Badge colorScheme={PAYMENT_STATUS_COLOR[record.paymentStatus] || 'gray'}>
                            {statusLabels[record.paymentStatus] || record.paymentStatus}
                          </Badge>
                          {record.paymentInfo?.paymentDate ? (
                            <Text fontSize="xs" color="gray.500">
                              {formatDateLabel(record.paymentInfo.paymentDate, locale || 'pt-PT')}
                            </Text>
                          ) : record.paymentDate ? (
                            <Text fontSize="xs" color="gray.500">
                              {formatDateLabel(record.paymentDate, locale || 'pt-PT')}
                            </Text>
                          ) : null}
                          {record.paymentInfo && (
                            <VStack align="flex-start" spacing={0} fontSize="xs" pt={1} w="full">
                              <Text fontWeight="bold" color="green.600">
                                {t('weekly.control.records.paymentSummary.total', 'Valor pago')}: {formatCurrency(record.paymentInfo.totalAmount)}
                              </Text>
                              {record.paymentInfo.bonusCents > 0 && (
                                <Text color="green.600">
                                  {t('weekly.control.records.paymentSummary.bonus', 'Bônus')}: +{formatCurrency(record.paymentInfo.bonusAmount)}
                                </Text>
                              )}
                              {record.paymentInfo.discountCents > 0 && (
                                <Text color="red.600">
                                  {t('weekly.control.records.paymentSummary.discount', 'Desconto')}: -{formatCurrency(record.paymentInfo.discountAmount)}
                                </Text>
                              )}
                              <Text color="gray.600">
                                {t('weekly.control.records.paymentSummary.base', 'Valor base')}: {formatCurrency(record.paymentInfo.baseAmount)}
                              </Text>
                              {record.paymentInfo.notes && (
                                <Text color="gray.500">
                                  {t('weekly.control.records.paymentSummary.notes', 'Observações')}: {record.paymentInfo.notes}
                                </Text>
                              )}
                              {record.paymentInfo.proofUrl && (
                                <Button
                                  as="a"
                                  href={record.paymentInfo.proofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="xs"
                                  variant="link"
                                  colorScheme="blue"
                                  leftIcon={<Icon as={FiExternalLink} />}
                                  justifyContent="flex-start"
                                  px={0}
                                >
                                  {t('weekly.control.records.paymentSummary.proof', 'Ver comprovante')}
                                </Button>
                              )}
                            </VStack>
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
                            {t('weekly.control.records.actions.generatePayslip', 'Resumo')}
                          </Button>
                          {record.paymentInfo?.proofUrl && (
                            <Button
                              as="a"
                              href={record.paymentInfo.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              leftIcon={<Icon as={FiExternalLink} />}
                              size="xs"
                            >
                              {t('weekly.control.records.actions.viewProof', 'Comprovante')}
                            </Button>
                          )}
                          {record.paymentStatus === 'paid' ? (
                            <Button
                              leftIcon={<Icon as={FiCheckCircle} />}
                              colorScheme="green"
                              size="xs"
                              isDisabled
                            >
                              {t('weekly.control.records.actions.alreadyPaid', 'Pago')}
                            </Button>
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
          ) : (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="medium">
                  {t('weekly.control.paymentModal.missingIbanTitle', 'IBAN não encontrado')}
                </Text>
                <Text fontSize="sm">
                  {t('weekly.control.paymentModal.missingIbanDescription', 'Cadastre o IBAN do motorista antes de efetuar o pagamento.')}
                </Text>
              </Box>
            </Alert>
          )}

          <FormControl>
            <FormLabel>{t('weekly.control.paymentModal.baseAmountLabel', 'Valor base')}</FormLabel>
            <Input value={formatCurrency(paymentBaseAmount)} isReadOnly variant="filled" />
          </FormControl>

          <FormControl>
            <FormLabel>{t('weekly.control.paymentModal.bonusLabel', 'Bônus (opcional)')}</FormLabel>
            <Input
              type="number"
              step="0.01"
              value={bonusValue}
              onChange={(event) => setBonusValue(event.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>{t('weekly.control.paymentModal.discountLabel', 'Desconto (opcional)')}</FormLabel>
            <Input
              type="number"
              step="0.01"
              value={discountValue}
              onChange={(event) => setDiscountValue(event.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>{t('weekly.control.paymentModal.totalAmountLabel', 'Valor a pagar')}</FormLabel>
            <Input
              value={formatCurrency(paymentTotalAmount)}
              isReadOnly
              variant="filled"
              color={paymentTotalInvalid ? 'red.600' : undefined}
            />
          </FormControl>

          {paymentTotalInvalid && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                {t('weekly.control.paymentModal.totalAmountInvalid', 'O valor final deve ser maior que zero.')}
              </Text>
            </Alert>
          )}

          <FormControl>
            <FormLabel>{t('weekly.control.paymentModal.proofLabel', 'Comprovante do pagamento')}</FormLabel>
            <VStack align="stretch" spacing={2}>
              <Button
                as="label"
                leftIcon={<Icon as={FiPaperclip} />}
                variant="outline"
                colorScheme="blue"
                cursor="pointer"
                isDisabled={isSavingPayment}
              >
                {paymentProofFile
                  ? t('weekly.control.paymentModal.changeProof', 'Trocar arquivo')
                  : t('weekly.control.paymentModal.selectProof', 'Selecionar arquivo')}
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  display="none"
                  ref={fileInputRef}
                  onChange={handleProofFileChange}
                />
              </Button>
              {paymentProofFile ? (
                <HStack spacing={2} justify="space-between" w="full">
                  <Text fontSize="sm" noOfLines={1}>
                    {paymentProofFile.name}
                  </Text>
                  <Button
                    variant="link"
                    size="xs"
                    colorScheme="red"
                    onClick={handleRemoveProof}
                    isDisabled={isSavingPayment}
                  >
                    {t('weekly.control.paymentModal.removeProof', 'Remover')}
                  </Button>
                </HStack>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  {t('weekly.control.paymentModal.noProofSelected', 'Nenhum arquivo selecionado.')}
                </Text>
              )}
              <FormHelperText>
                {t('weekly.control.paymentModal.proofHelp', 'Aceita PDF ou imagem até 10MB.')}
              </FormHelperText>
            </VStack>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>{t('weekly.control.paymentModal.dateLabel', 'Data do pagamento')}</FormLabel>
            <Input
              type="datetime-local"
              value={paymentDateValue}
              onChange={(event) => setPaymentDateValue(event.target.value)}
              max={formatDateTimeLocalValue()}
            />
          </FormControl>

          <FormControl>
            <FormLabel>{t('weekly.control.paymentModal.notesLabel', 'Observações')}</FormLabel>
            <Textarea
              value={paymentNotes}
              onChange={(event) => setPaymentNotes(event.target.value)}
              placeholder={t('weekly.control.paymentModal.notesPlaceholder', 'Anote informações relevantes sobre o pagamento (opcional).')}
              rows={3}
            />
          </FormControl>
        </VStack>
      </StructuredModal>

      {/* Modal de Visualização do Resumo */}
      <StructuredModal
        isOpen={isPayslipModalOpen}
        onClose={onClosePayslipModal}
        size="5xl"
        header={(
          <VStack align="start" spacing={1}>
            <Text>{t('weekly.control.payslipModal.title', 'Resumo Semanal')}</Text>
            {selectedPayslipRecord && (
              <Text fontSize="sm" fontWeight="normal" color="gray.600">
                {formatDateLabel(selectedPayslipRecord.weekStart, locale || 'pt-PT')} - {formatDateLabel(selectedPayslipRecord.weekEnd, locale || 'pt-PT')}
              </Text>
            )}
          </VStack>
        )}
        footer={(
          <HStack spacing={4} justify="flex-end" w="full">
            <Button leftIcon={<Icon as={FiDownload} />} onClick={handleDownloadPayslip} colorScheme="blue">
              {t('weekly.control.payslipModal.downloadPdf', 'Baixar PDF')}
            </Button>
            <Button leftIcon={<Icon as={FiMail} />} onClick={handleSendPayslipEmail} colorScheme="green">
              {t('weekly.control.payslipModal.sendEmail', 'Enviar por e-mail')}
            </Button>
          </HStack>
        )}
      >
        {payslipPdfUrl ? (
          <Box flex="1" minH="full" height="60vh">
            <iframe src={payslipPdfUrl} width="100%" height="100%" style={{ border: 'none' }} />
          </Box>
        ) : (
          <Alert status="info" borderRadius="lg">
            <AlertIcon />
            <AlertTitle>{t('weekly.control.payslipModal.noPdfTitle', 'Nenhum PDF gerado')}</AlertTitle>
            <AlertDescription>{t('weekly.control.payslipModal.noPdfDesc', 'Gere o resumo para visualizá-lo aqui.')}</AlertDescription>
          </Alert>
        )}
      </StructuredModal>

      {unassigned.length > 0 && (
        <Card variant="outline">
          <CardHeader>
            <Heading size="sm" color="orange.500" mb={0}>
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
                  <Th isNumeric>{t('weekly.control.unassigned.columns.value', 'Valor')}</Th>
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

