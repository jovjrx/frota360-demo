import { useMemo, useState } from 'react';
import useSWR, { SWRConfig } from 'swr';
import {
  Button,
  HStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  VStack,
  Text,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { FiFileText, FiSend, FiLayers } from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, type AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { ContractSubmissionsTable } from '@/components/admin/contracts/ContractSubmissionsTable';
import { SendContractEmailModal } from '@/components/admin/contracts/SendContractEmailModal';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { DriverContractSchema, type DriverContract } from '@/schemas/driver-contract';
import { getDrivers, type Driver } from '@/lib/admin/adminQueries';
import Link from 'next/link';
import type { DocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

interface ContractsResponse {
  success: boolean;
  contracts: Array<DriverContract & { signedDocumentDownloadUrl?: string | null }>;
}

interface AdminContractsPageProps extends AdminPageProps {
  initialContracts: ContractsResponse['contracts'];
  drivers: Array<Pick<Driver, 'id' | 'fullName' | 'email' | 'type'>>;
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

const toIsoString = (value: any): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  return null;
};

function getStoragePathFromGsUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('gs://')) {
    return null;
  }
  const withoutScheme = url.replace('gs://', '');
  const firstSlash = withoutScheme.indexOf('/');
  if (firstSlash === -1) {
    return null;
  }
  return withoutScheme.slice(firstSlash + 1);
}

async function buildContract(doc: DocumentSnapshot<DocumentData>) {
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

  const base: DriverContract = parsed.success
    ? parsed.data
    : {
        id: doc.id,
        driverId: data?.driverId ?? '',
        driverName: data?.driverName ?? 'Motorista',
        driverEmail: data?.driverEmail,
        contractType: data?.contractType ?? 'affiliate',
        templateVersion: data?.templateVersion ?? '1.0',
        signedDocumentUrl: data?.signedDocumentUrl ?? null,
        signedDocumentFileName: data?.signedDocumentFileName ?? null,
        submittedAt: toIsoString(data?.submittedAt),
        status: data?.status ?? 'pending_signature',
        reviewedBy: data?.reviewedBy ?? null,
    reviewedAt: toIsoString(data?.reviewedAt),
    rejectionReason: data?.rejectionReason ?? null,
    emailSentAt: toIsoString(data?.emailSentAt),
        createdAt: toIsoString(data?.createdAt) ?? new Date().toISOString(),
        updatedAt: toIsoString(data?.updatedAt) ?? new Date().toISOString(),
      };

  let signedDocumentDownloadUrl: string | null = null;
  const storagePath = getStoragePathFromGsUrl(base.signedDocumentUrl);
  if (storagePath) {
    try {
      const [signedUrl] = await adminStorage.file(storagePath).getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 10,
      });
      signedDocumentDownloadUrl = signedUrl;
    } catch (error) {
      console.warn('[Contracts] Failed to prepare signed contract URL', error);
    }
  }

  return { ...base, signedDocumentDownloadUrl };
}

function AdminContractsPageContent({ initialContracts, drivers, translations, tCommon, tPage }: AdminContractsPageProps) {
  const { data, mutate, isValidating } = useSWR<ContractsResponse>('/api/admin/contracts/submissions', fetcher, {
    fallbackData: { success: true, contracts: initialContracts },
  });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const contracts = data?.contracts ?? initialContracts;
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  const stats = useMemo(
    () => ({
      total: contracts.length,
      pending: contracts.filter((c) => c.status === 'pending_signature').length,
      submitted: contracts.filter((c) => c.status === 'submitted').length,
      approved: contracts.filter((c) => c.status === 'approved').length,
      rejected: contracts.filter((c) => c.status === 'rejected').length,
    }),
    [contracts]
  );

  const statItems = useMemo(
    () => [
      { key: 'total', label: t('contracts.dashboard.stats.total', 'Total'), value: stats.total },
      { key: 'pending', label: t('contracts.dashboard.stats.pending', 'Pendentes'), value: stats.pending },
      { key: 'submitted', label: t('contracts.dashboard.stats.submitted', 'Submetidos'), value: stats.submitted },
      { key: 'approved', label: t('contracts.dashboard.stats.approved', 'Aprovados'), value: stats.approved },
      { key: 'rejected', label: t('contracts.dashboard.stats.rejected', 'Rejeitados'), value: stats.rejected },
    ],
    [stats, t]
  );

  return (
    <AdminLayout
      translations={translations}
      title={t('contracts.dashboard.title', 'Gestão de contratos')}
      subtitle={t('contracts.dashboard.subtitle', 'Acompanhe status de envio, aprove, rejeite e envie notificações.')}
      breadcrumbs={[
        { label: tc('menu.contracts', 'Contratos') },
      ]}
      side={
        <HStack spacing={3}>
          <Button as={Link} href="/admin/contracts/templates" leftIcon={<FiLayers />} size="sm" variant="outline">
            {t('contracts.dashboard.manageTemplates', 'Modelos de documentos')}
          </Button>
          <Button leftIcon={<FiSend />} size="sm" colorScheme="blue" onClick={() => setIsEmailModalOpen(true)}>
            {t('contracts.dashboard.sendEmail', 'Enviar contrato por email')}
          </Button>
        </HStack>
      }
    >
      <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4}>
        {statItems.map((item) => (
          <Stat key={item.key} borderWidth="1px" borderRadius="lg" p={4}>
            <StatLabel>{item.label}</StatLabel>
            <StatNumber>{item.value}</StatNumber>
          </Stat>
        ))}
      </SimpleGrid>

      <ContractSubmissionsTable contracts={contracts} isLoading={isValidating} onRefresh={() => mutate()} />

      <Card variant="outline">
        <CardBody>
          <VStack align="stretch" spacing={3}>
            <HStack spacing={3}>
              <Icon as={FiFileText} boxSize={6} color="blue.500" />
              <VStack align="start" spacing={0}>
                <Text fontWeight="semibold">Envio manual</Text>
                <Text fontSize="sm" color="gray.600">
                  Utilize esta opção para reenviar instruções aos motoristas através do email.
                </Text>
              </VStack>
            </HStack>
            <Button leftIcon={<FiSend />} colorScheme="blue" alignSelf="flex-start" onClick={() => setIsEmailModalOpen(true)}>
              Enviar instruções por email
            </Button>
          </VStack>
        </CardBody>
      </Card>

      <SendContractEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        drivers={drivers.map((driver) => ({
          id: driver.id,
          fullName: driver.fullName,
          email: driver.email,
          type: driver.type === 'renter' ? 'renter' : 'affiliate',
        }))}
        onSent={() => mutate()}
      />
    </AdminLayout>
  );
}

export default function AdminContractsPage(props: AdminContractsPageProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/admin/contracts/submissions': { success: true, contracts: props.initialContracts },
        },
      }}
    >
      <AdminContractsPageContent {...props} />
    </SWRConfig>
  );
}

async function loadContractsForSSR() {
  const snapshot = await adminDb.collection('driverContracts').orderBy('updatedAt', 'desc').limit(100).get();
  const contracts = await Promise.all(snapshot.docs.map((doc) => buildContract(doc)));
  return contracts;
}

export const getServerSideProps = withAdminSSR<{ initialContracts: ContractsResponse['contracts']; drivers: AdminContractsPageProps['drivers'] }>(
  async () => {
    const [initialContracts, drivers] = await Promise.all([
      loadContractsForSSR(),
      getDrivers({ status: 'active' }).then((items) =>
        items.map((driver) => ({
          id: driver.id,
          fullName: driver.fullName ?? 'Motorista',
          email: driver.email ?? '',
          type: driver.type ?? 'affiliate',
        }))
      ),
    ]);

    return {
      initialContracts,
      drivers,
    };
  }
);
