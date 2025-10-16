import useSWR, { SWRConfig } from 'swr';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, type AdminPageProps } from '@/lib/ssr';
import { createSafeTranslator } from '@/lib/utils/safeTranslate';
import { ContractTemplateUpload } from '@/components/admin/contracts/ContractTemplateUpload';
import { ContractTemplatesList } from '@/components/admin/contracts/ContractTemplatesList';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { ContractTemplateSchema, type ContractTemplate } from '@/schemas/contract-template';
import type { GetServerSidePropsContext } from 'next';
import type { DocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

interface TemplatesResponse {
  success: boolean;
  templates: Array<ContractTemplate & { downloadUrl?: string | null }>;
}

interface AdminContractsTemplatesPageProps extends AdminPageProps {
  initialTemplates: TemplatesResponse['templates'];
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

function getStoragePathFromGsUrl(url: string | undefined | null): string | null {
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

function normalizeTemplate(doc: DocumentSnapshot<DocumentData>) {
  const data = doc.data();
  const uploadedAtRaw = data?.uploadedAt;
  const uploadedAt = typeof uploadedAtRaw === 'string'
    ? uploadedAtRaw
    : uploadedAtRaw?.toDate?.().toISOString?.() ?? new Date().toISOString();

  const parsed = ContractTemplateSchema.safeParse({
    id: doc.id,
    ...data,
    uploadedAt,
  });

  if (parsed.success) {
    return parsed.data;
  }

  console.warn('[Contracts] Failed to parse template snapshot', parsed.error);
  return {
    id: doc.id,
    type: data?.type ?? 'affiliate',
    version: data?.version ?? '1.0',
    fileName: data?.fileName ?? 'documento.pdf',
    fileUrl: data?.fileUrl ?? '',
    storagePath: data?.storagePath,
    uploadedBy: data?.uploadedBy ?? 'admin',
    uploadedAt,
    isActive: Boolean(data?.isActive),
  } satisfies ContractTemplate;
}

function AdminContractsTemplatesPageContent({ initialTemplates, translations, tCommon, tPage }: AdminContractsTemplatesPageProps) {
  const { data, mutate, isValidating } = useSWR<TemplatesResponse>('/api/admin/contracts/templates', fetcher, {
    fallbackData: { success: true, templates: initialTemplates },
  });

  const templates = data?.templates ?? initialTemplates;
  const tc = createSafeTranslator(tCommon);
  const t = createSafeTranslator(tPage);

  return (
    <AdminLayout
      translations={translations}
      title={t('contracts.templates.title', 'Modelos de documentos')}
      subtitle={t('contracts.templates.subtitle', 'Faça upload e gerencie versões dos contratos base.')}
      breadcrumbs={[
        { label: tc('menu.contracts', 'Contratos'), href: '/admin/contracts' },
        { label: t('contracts.templates.title', 'Modelos de documentos') },
      ]}
    >
      <ContractTemplateUpload onUploaded={() => mutate()} />
      <ContractTemplatesList templates={templates} isLoading={isValidating} onTemplatesChange={() => mutate()} />
    </AdminLayout>
  );
}

export default function AdminContractsTemplatesPage(props: AdminContractsTemplatesPageProps) {
  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/admin/contracts/templates': { success: true, templates: props.initialTemplates },
        },
      }}
    >
      <AdminContractsTemplatesPageContent {...props} />
    </SWRConfig>
  );
}

async function loadTemplatesForSSR(_context: GetServerSidePropsContext) {
  const snapshot = await adminDb.collection('contractTemplates').orderBy('uploadedAt', 'desc').get();

  const templatesWithUrls = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const template = normalizeTemplate(doc);
      let downloadUrl: string | null = null;
      const storagePath = template.storagePath ?? getStoragePathFromGsUrl(template.fileUrl);
      if (storagePath) {
        try {
          const [signedUrl] = await adminStorage.file(storagePath).getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 10,
          });
          downloadUrl = signedUrl;
        } catch (error) {
          console.warn('[Contracts] Failed to generate signed URL for template', error);
        }
      }

      return { ...template, downloadUrl };
    })
  );

  return templatesWithUrls;
}

export const getServerSideProps = withAdminSSR<{ initialTemplates: TemplatesResponse['templates'] }>(async (context) => {
  const initialTemplates = await loadTemplatesForSSR(context);
  return {
    initialTemplates,
  };
});
