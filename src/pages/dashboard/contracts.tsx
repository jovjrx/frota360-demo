import { useRef, useState } from 'react';
import useSWR, { SWRConfig } from 'swr';
import { useToast, VStack, Text, Alert, AlertIcon } from '@chakra-ui/react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { withDashboardSSR, type DashboardPageProps } from '@/lib/ssr';
import { ContractStatusCard } from '@/components/dashboard/contracts/ContractStatusCard';
import { ContractUploadArea, type ContractUploadAreaHandle } from '@/components/dashboard/contracts/ContractUploadArea';
import { ContractInstructions } from '@/components/dashboard/contracts/ContractInstructions';
import { adminDb } from '@/lib/firebaseAdmin';
import { DriverContractSchema, type DriverContract } from '@/schemas/driver-contract';
import { getDriverData } from '@/lib/auth/driverData';
import { serializeDatasets } from '@/lib/utils/serializeFirestore';
import { getTranslation } from '@/lib/translations';

interface ContractsApiResponse {
  success: boolean;
  contract: DriverContract | null;
}

interface DashboardContractsPageProps extends DashboardPageProps {
  initialContract: DriverContract | null;
  motorista?: any;
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Não foi possível ler o arquivo.'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
};

function DashboardContractsPageContent({ initialContract, translations, motorista }: DashboardContractsPageProps) {
  const toast = useToast();
  const uploadAreaRef = useRef<ContractUploadAreaHandle | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data, mutate, isValidating } = useSWR<ContractsApiResponse>('/api/dashboard/contracts/my-contract', fetcher, {
    fallbackData: { success: true, contract: initialContract },
  });

  const contract = data?.contract ?? initialContract;

  // Funções de tradução
  const tDashboard = (key: string, fallback?: string) => {
    if (!translations?.dashboard) return fallback || key;
    return getTranslation(translations.dashboard, key) || fallback || key;
  };

  const triggerUpload = () => {
    uploadAreaRef.current?.openSelector();
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const query = contract?.contractType ? `?type=${contract.contractType}` : '';
      const response = await fetch(`/api/dashboard/contracts/download-template${query}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result?.error ?? 'Falha ao gerar link de download.');
      }

      const link = document.createElement('a');
      link.href = result.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (error: any) {
      console.error('[Contracts] Failed to download template:', error);
      toast({
        title: 'Erro ao baixar modelo',
        description: error?.message ?? 'Tente novamente mais tarde.',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelected = async (file: File) => {
    setIsUploading(true);
    try {
      const base64 = await readFileAsBase64(file);
      const response = await fetch('/api/dashboard/contracts/upload-signed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileContent: base64,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result?.error ?? 'Falha ao enviar contrato.');
      }

      toast({
        title: 'Contrato enviado',
        description: 'Aguarde a confirmação da equipa administrativa.',
        status: 'success',
        duration: 4000,
      });
      mutate();
    } catch (error: any) {
      console.error('[Contracts] Failed to upload signed contract:', error);
      toast({
        title: 'Erro ao enviar contrato',
        description: error?.message ?? 'Tente novamente mais tarde.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout
      translations={translations}
      title={tDashboard('contracts.title', 'Meus contratos')}
      subtitle={tDashboard('contracts.subtitle', 'Baixe, assine e envie o contrato obrigatório para continuar ativo.')}
      breadcrumbs={[{ label: tDashboard('menu.contracts', 'Contratos') }]}
      driverType={motorista?.type}
    >
      {!contract && !isValidating && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">{tDashboard('contracts.empty', 'Ainda não há um contrato associado à sua conta. Aguarde contacto da equipa.')}</Text>
        </Alert>
      )}

      <ContractStatusCard
        contract={contract}
        onDownloadTemplate={handleDownloadTemplate}
        onUploadClick={triggerUpload}
        isDownloading={isDownloading}
        isUploading={isUploading}
      />

      <ContractUploadArea
        ref={uploadAreaRef}
        onFileSelected={handleFileSelected}
        isUploading={isUploading}
        lastFileName={contract?.signedDocumentFileName ?? null}
        submittedAt={contract?.submittedAt ?? null}
      />

      <ContractInstructions />

      {contract?.status === 'submitted' && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">{tDashboard('contracts.waitingReview', 'Documento recebido. Notificaremos por email quando for aprovado.')}</Text>
        </Alert>
      )}

      {contract?.status === 'rejected' && contract.rejectionReason && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="semibold">Envio rejeitado</Text>
            <Text fontSize="sm">{contract.rejectionReason}</Text>
          </VStack>
        </Alert>
      )}
    </DashboardLayout>
  );
}

export default function DashboardContractsPage(props: DashboardContractsPageProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/dashboard/contracts/my-contract': { success: true, contract: props.initialContract },
        },
      }}
    >
      <DashboardContractsPageContent {...props} />
    </SWRConfig>
  );
}

const toIsoString = (value: any): string | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return null;
};

async function loadDriverContract(driverEmail: string) {
  const driver = await getDriverData(driverEmail);
  if (!driver?.id) {
    return null;
  }

  const snapshot = await adminDb
    .collection('driverContracts')
    .where('driverId', '==', driver.id)
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  const parsed = DriverContractSchema.safeParse({
    id: doc.id,
    ...data,
    submittedAt: toIsoString(data?.submittedAt),
    reviewedAt: toIsoString(data?.reviewedAt),
    emailSentAt: toIsoString(data?.emailSentAt),
    createdAt: toIsoString(data?.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoString(data?.updatedAt) ?? new Date().toISOString(),
  });

  if (parsed.success) {
    return parsed.data;
  }

  console.warn('[Contracts] Failed to parse driver contract', parsed.error);
  return null;
}

export const getServerSideProps = withDashboardSSR<{ initialContract: DriverContract | null }>(
  { loadDriverData: true },
  async (_context, _user, driverEmail) => {
    const initialContract = await loadDriverContract(driverEmail);
    
    // Serializar todos os Timestamps de forma centralizada
    const initialData = serializeDatasets({
      initialContract,
    });
    
    return initialData;
  }
);

