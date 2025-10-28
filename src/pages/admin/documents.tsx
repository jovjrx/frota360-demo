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
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import useSWR, { SWRConfig } from 'swr';
import { FiFolder, FiAlertCircle, FiPlus } from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import DocumentCategoriesList from '@/components/admin/DocumentCategoriesList';
import DocumentsStats from '@/components/admin/DocumentsStats';
import DocumentsFilters from '@/components/admin/DocumentsFilters';
import DocumentsList from '@/components/admin/DocumentsList';
import AddCategoryModal from '@/components/admin/AddCategoryModal';
import AddDocumentModal from '@/components/admin/AddDocumentModal';
import { serializeDatasets } from '@/lib/utils/serializeFirestore';
import type { DocumentCategory } from '@/schemas/document-category';
import type { DocumentRequest } from '@/schemas/document-request';

interface DocumentsPageProps extends AdminPageProps {
  initialCategories: DocumentCategory[];
  initialDocuments: DocumentRequest[];
}

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) =>
    res.ok ? res.json() : { data: [] }
  );

function AdminDocumentsPageContent({
  user,
  locale,
  translations,
  initialCategories = [],
  initialDocuments = [],
  tCommon,
  tPage,
}: DocumentsPageProps) {
  const toast = useToast();
  const tc = useMemo(() => createSafeTranslator(tCommon), [tCommon]);
  const t = useMemo(() => createSafeTranslator(tPage), [tPage]);

  // Categories state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const { isOpen: isAddCategoryOpen, onOpen: onAddCategoryOpen, onClose: onAddCategoryClose } = useDisclosure();
  const { isOpen: isAddDocumentOpen, onOpen: onAddDocumentOpen, onClose: onAddDocumentClose } = useDisclosure();

  // Documents state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // SWR for categories
  const { data: categoriesData, mutate: mutateCategories } = useSWR(
    '/api/admin/document-categories',
    fetcher,
    {
      fallbackData: { data: initialCategories || [] },
      revalidateOnFocus: false,
    }
  );

  const categoriesArray = Array.isArray(categoriesData?.data) ? categoriesData.data : (Array.isArray(initialCategories) ? initialCategories : []);
  const categories = categoriesArray as DocumentCategory[];

  // SWR for documents
  const { data: docsData, isLoading: docsLoading, mutate: mutateDocs } = useSWR(
    `/api/admin/documents/requests?search=${searchQuery}&status=${statusFilter}`,
    fetcher,
    {
      fallbackData: { data: initialDocuments || [] },
      revalidateOnFocus: false,
    }
  );

  const docsArray = Array.isArray(docsData?.data) ? docsData.data : (Array.isArray(initialDocuments) ? initialDocuments : []);
  const documents = docsArray as DocumentRequest[];

  // Category handlers
  const handleEditCategory = async (category: DocumentCategory) => {
    setEditingCategoryId(category.id);
    try {
      toast({
        title: t('categories.edit.title', 'Editar categoria'),
        status: 'info',
        duration: 3000,
      });
    } finally {
      setEditingCategoryId(null);
    }
  };

  const handleDeleteCategory = async (category: DocumentCategory) => {
    if (!confirm(t('categories.delete.confirm', 'Tem certeza que deseja deletar esta categoria?'))) {
      return;
    }

    setDeletingCategoryId(category.id);
    try {
      const response = await fetch(`/api/admin/document-categories/${category.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: t('categories.delete.success', 'Categoria deletada'),
          status: 'success',
          duration: 3000,
        });
        await mutateCategories();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error: any) {
      toast({
        title: t('categories.delete.error', 'Erro ao deletar categoria'),
        description: error?.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleAddCategory = async (data: {
    name: string;
    description: string;
    type: 'company' | 'affiliate' | 'renter';
  }) => {
    try {
      const response = await fetch('/api/admin/document-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await mutateCategories();
    } catch (error: any) {
      throw error;
    }
  };

  // Document handlers
  const handleAddDocument = async (data: any) => {
    try {
      const response = await fetch('/api/admin/documents/requests', {
        method: 'POST',
        body: data, // FormData
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: t('documents.add.success', 'Documento adicionado com sucesso'),
        status: 'success',
        duration: 3000,
      });
      await mutateDocs();
    } catch (error: any) {
      toast({
        title: t('documents.add.error', 'Erro ao adicionar documento'),
        description: error?.message,
        status: 'error',
        duration: 5000,
      });
      throw error;
    }
  };

  const handleReview = async (document: DocumentRequest) => {
    setReviewingId(document.id);
    try {
      toast({
        title: t('documents.review.title', 'Revisar documento'),
        description: document.documentName,
        status: 'info',
        duration: 3000,
      });
    } finally {
      setReviewingId(null);
    }
  };

  const handleDelete = async (document: DocumentRequest) => {
    if (!confirm(t('documents.delete.confirm', 'Tem certeza que deseja deletar esta solicitação?'))) {
      return;
    }

    setDeletingDocId(document.id);
    try {
      const response = await fetch(`/api/admin/documents/${document.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: t('documents.delete.success', 'Solicitação deletada'),
          status: 'success',
          duration: 3000,
        });
        await mutateDocs();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error: any) {
      toast({
        title: t('documents.delete.error', 'Erro ao deletar solicitação'),
        description: error?.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setDeletingDocId(null);
    }
  };

  return (
    <AdminLayout
      translations={translations}
      title={t('documents.title', 'Gestão de Documentos')}
      subtitle={t('documents.subtitle', 'Categorias e solicitações')}
      breadcrumbs={[{ label: tc('menu.documents', 'Documentos') }]}
    >
      <VStack spacing={4} align="stretch">
        <DocumentsStats t={t} />

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
          {/* Left: Categories */}
          <GridItem>
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="sm" display="flex" alignItems="center">
                      <Icon as={FiFolder} mr={2} />
                      {t('categories.list.title', 'Categorias')}
                    </Heading>
                    <Button
                      leftIcon={<Icon as={FiPlus} />}
                      colorScheme="blue"
                      size="sm"
                      onClick={onAddCategoryOpen}
                    >
                      {t('categories.add', 'Adicionar')}
                    </Button>
                  </HStack>

                  <DocumentCategoriesList
                    categories={categories}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                    editingId={editingCategoryId}
                    deletingId={deletingCategoryId}
                    t={t}
                  />
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Right: Document Requests */}
          <GridItem>
            <Card borderLeft="4px" borderLeftColor="orange.400">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="sm" display="flex" alignItems="center">
                      <Icon as={FiAlertCircle} mr={2} color="orange.500" />
                      {t('documents.list.title', 'Documentos')}
                      <Badge ml={2} colorScheme="orange">{documents.length}</Badge>
                    </Heading>
                    <Button
                      leftIcon={<Icon as={FiPlus} />}
                      colorScheme="orange"
                      size="sm"
                      onClick={onAddDocumentOpen}
                    >
                      {t('documents.add', 'Adicionar')}
                    </Button>
                  </HStack>

                  <Box maxH="600px" overflowY="auto">
                    <VStack spacing={4} align="stretch">
                      <DocumentsFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                        onRefresh={() => mutateDocs()}
                        isLoading={docsLoading}
                        t={t}
                      />
                      <DocumentsList
                        documents={documents}
                        onReview={handleReview}
                        onDelete={handleDelete}
                        reviewingId={reviewingId}
                        deletingId={deletingDocId}
                        t={t}
                      />
                    </VStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        <AddCategoryModal
          isOpen={isAddCategoryOpen}
          onClose={onAddCategoryClose}
          onAdd={handleAddCategory}
          t={t}
        />

        <AddDocumentModal
          isOpen={isAddDocumentOpen}
          onClose={onAddDocumentClose}
          onAdd={handleAddDocument}
          categories={categories}
          t={t}
        />
      </VStack>
    </AdminLayout>
  );
}

export default function AdminDocumentsPage(props: DocumentsPageProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/admin/document-categories': { data: props.initialCategories },
          '/api/admin/documents/requests': { data: props.initialDocuments },
        },
      }}
    >
      <AdminDocumentsPageContent {...props} />
    </SWRConfig>
  );
}

export const getServerSideProps = withAdminSSR(async (context, user) => {
  try {
    const { getFirestore } = await import('firebase-admin/firestore');
    const { firebaseAdmin } = await import('@/lib/firebase/firebaseAdmin');

    const db = getFirestore(firebaseAdmin);

    // Fetch categories
    const categoriesSnapshot = await db
      .collection('documentCategories')
      .orderBy('createdAt', 'desc')
      .get();

    const categories = categoriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<DocumentCategory, 'id'>),
    }));

    // Fetch documents
    const docsSnapshot = await db
      .collection('documentRequests')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const documents = docsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<DocumentRequest, 'id'>),
    }));

    const serialized = serializeDatasets({ categories, documents });

    return {
      initialCategories: serialized.categories,
      initialDocuments: serialized.documents,
    };
  } catch (error) {
    console.error('[documents SSR]', error);
    return {
      initialCategories: [],
      initialDocuments: [],
    };
  }
});

