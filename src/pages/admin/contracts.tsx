import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  useToast,
  VStack,
  HStack,
  Grid,
  GridItem,
  Card,
  CardBody,
  Heading,
  Icon,
  Badge,
  Select,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import useSWR, { SWRConfig } from 'swr';
import { FiFileText, FiAlertCircle, FiPlus } from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import ContractTemplatesList from '@/components/admin/ContractTemplatesList';
import AddTemplateModal from '@/components/admin/AddTemplateModal';
import SendContractModal from '@/components/admin/SendContractModal';
import ContractsSentStats from '@/components/admin/ContractsSentStats';
import ContractsSentFilters from '@/components/admin/ContractsSentFilters';
import ContractsSentList from '@/components/admin/ContractsSentList';
import { serializeDatasets } from '@/lib/utils/serializeFirestore';
import type { DriverContract } from '@/schemas/driver-contract';
import type { ContractTemplate } from '@/schemas/contract-template';

interface ContractsPageProps extends AdminPageProps {
  initialTemplates: ContractTemplate[];
  initialContracts: DriverContract[];
}

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) =>
    res.ok ? res.json() : { data: [] }
  );

function AdminContractsPageContent({
  user,
  locale,
  translations,
  initialTemplates = [],
  initialContracts = [],
  tCommon,
  tPage,
}: ContractsPageProps) {
  const toast = useToast();
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  // Templates state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const { isOpen: isAddTemplateOpen, onOpen: onAddTemplateOpen, onClose: onAddTemplateClose } = useDisclosure();
  const { isOpen: isSendContractOpen, onOpen: onSendContractOpen, onClose: onSendContractClose } = useDisclosure();

  // Contracts state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null);

  // SWR for contracts
  const { data: contractsData, isLoading: contractsLoading, mutate: mutateContracts } = useSWR(
    `/api/admin/contracts?search=${searchQuery}&status=${statusFilter}&type=${typeFilter}`,
    fetcher,
    {
      fallbackData: { data: initialContracts || [] },
      revalidateOnFocus: false,
    }
  );

  const contractsArray = Array.isArray(contractsData?.data) ? contractsData.data : (Array.isArray(initialContracts) ? initialContracts : []);
  const contracts = contractsArray as DriverContract[];

  // Template handlers
  const handleEditTemplate = async (template: ContractTemplate) => {
    setEditingId(template.id);
    try {
      toast({
        title: t('templates.edit.title', 'Editar modelo'),
        description: template.fileName,
        status: 'info',
        duration: 3000,
      });
    } finally {
      setEditingId(null);
    }
  };

  const handleDeleteTemplate = async (template: ContractTemplate) => {
    if (!confirm(t('templates.delete.confirm', 'Tem certeza que deseja deletar este modelo?'))) {
      return;
    }

    setDeletingTemplateId(template.id);
    try {
      toast({
        title: t('templates.delete.success', 'Modelo deletado'),
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: t('templates.delete.error', 'Erro ao deletar modelo'),
        description: error?.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const handleDownloadTemplate = async (template: ContractTemplate) => {
    try {
      window.open(template.fileUrl, '_blank');
    } catch (error: any) {
      toast({
        title: t('templates.download.error', 'Erro ao baixar modelo'),
        description: error?.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleAddTemplate = async (data: {
    file: File;
    name: string;
    category: string;
    type: 'affiliate' | 'renter';
  }) => {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('name', data.name);
      formData.append('category', data.category);
      formData.append('type', data.type);

      const response = await fetch('/api/admin/contract-templates', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: t('templates.add.success', 'Modelo adicionado com sucesso'),
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      throw error;
    }
  };

  const handleSendContract = async (data: {
    driverId: string;
    driverEmail: string;
    templateId: string;
  }) => {
    try {
      const response = await fetch('/api/admin/contracts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await mutateContracts();
      toast({
        title: t('contracts.send.success', 'Contrato enviado com sucesso'),
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      throw error;
    }
  };

  // Contracts handlers
  const handleViewContract = async (contract: DriverContract) => {
    setViewingId(contract.id);
    try {
      toast({
        title: t('contracts.view.title', 'Visualizar contrato'),
        description: contract.signedDocumentUrl
          ? t('contracts.view.hasFile', 'Documento disponível para download')
          : t('contracts.view.noFile', 'Nenhum documento assinado ainda'),
        status: 'info',
        duration: 3000,
      });
    } finally {
      setViewingId(null);
    }
  };

  const handleDeleteContract = async (contract: DriverContract) => {
    if (!confirm(t('contracts.delete.confirm', 'Tem certeza que deseja deletar este contrato?'))) {
      return;
    }

    setDeletingContractId(contract.id);
    try {
      const response = await fetch(`/api/admin/contracts/${contract.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast({
          title: t('contracts.delete.success', 'Contrato deletado'),
          status: 'success',
          duration: 3000,
        });
        await mutateContracts();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error: any) {
      toast({
        title: t('contracts.delete.error', 'Erro ao deletar contrato'),
        description: error?.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setDeletingContractId(null);
    }
  };

  return (
    <AdminLayout
      translations={translations}
      title={t('contracts.title', 'Gestão de Contratos')}
      subtitle={t('contracts.subtitle', 'Modelos e solicitações')}
      breadcrumbs={[{ label: tc('menu.contracts', 'Contratos') }]}
    >
      <ContractsSentStats contracts={contracts} t={t} />

      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
        <GridItem>
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="center">
                  <Heading size="sm" display="flex" alignItems="center">
                    <Icon as={FiFileText} mr={2} />
                    {t('templates.list.title', 'Modelos de Contrato')}
                  </Heading>
                  <Button
                    leftIcon={<Icon as={FiPlus} />}
                    colorScheme="blue"
                    size="sm"
                    onClick={onAddTemplateOpen}
                  >
                    {t('templates.add', 'Adicionar')}
                  </Button>
                </HStack>

                <ContractTemplatesList
                  templates={initialTemplates}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  onDownload={handleDownloadTemplate}
                  editingId={editingId}
                  deletingId={deletingTemplateId}
                  t={t}
                />
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem>
          <Card borderLeft="4px" borderLeftColor="orange.400">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="center">
                  <Heading size="sm" display="flex" alignItems="center">
                    <Icon as={FiAlertCircle} mr={2} color="orange.500" />
                    {t('contracts.sent.title', 'Contratos Enviados')}
                    <Badge ml={2} colorScheme="orange">{contracts.length}</Badge>
                  </Heading>
                  <Button
                    leftIcon={<Icon as={FiPlus} />}
                    colorScheme="orange"
                    size="sm"
                    onClick={onSendContractOpen}
                  >
                    {t('contracts.send', 'Nova Solicitação')}
                  </Button>
                </HStack>

                <Box maxH="600px" overflowY="auto">
                  <VStack spacing={4} align="stretch">
                    <ContractsSentFilters
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      statusFilter={statusFilter}
                      onStatusChange={setStatusFilter}
                      typeFilter={typeFilter}
                      onTypeChange={setTypeFilter}
                      onRefresh={() => mutateContracts()}
                      isLoading={contractsLoading}
                      t={t}
                    />
                    <ContractsSentList
                      contracts={contracts}
                      onView={handleViewContract}
                      onDelete={handleDeleteContract}
                      viewingId={viewingId}
                      deletingId={deletingContractId}
                      t={t}
                    />
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      <AddTemplateModal
        isOpen={isAddTemplateOpen}
        onClose={onAddTemplateClose}
        onAdd={handleAddTemplate}
        t={t}
      />

      <SendContractModal
        isOpen={isSendContractOpen}
        onClose={onSendContractClose}
        templates={initialTemplates}
        onSend={handleSendContract}
        t={t}
      />
    </AdminLayout>
  );
}

export default function AdminContractsPage(props: ContractsPageProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/admin/contracts': { data: props.initialContracts },
        },
      }}
    >
      <AdminContractsPageContent {...props} />
    </SWRConfig>
  );
}

export const getServerSideProps = withAdminSSR(async (context, user) => {
  try {
    const { getFirestore } = await import('firebase-admin/firestore');
    const { firebaseAdmin } = await import('@/lib/firebase/firebaseAdmin');

    const db = getFirestore(firebaseAdmin);

    // Fetch templates
    const templatesSnapshot = await db
      .collection('contractTemplates')
      .orderBy('uploadedAt', 'desc')
      .limit(50)
      .get();

    const templates = templatesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ContractTemplate, 'id'>),
    }));

    // Fetch contracts
    const contractsSnapshot = await db
      .collection('driverContracts')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const contracts = contractsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<DriverContract, 'id'>),
    }));

    const serialized = serializeDatasets({ templates, contracts });

    return {
      initialTemplates: serialized.templates,
      initialContracts: serialized.contracts,
    };
  } catch (error) {
    console.error('[contracts SSR]', error);
    return {
      initialTemplates: [],
      initialContracts: [],
    };
  }
});

