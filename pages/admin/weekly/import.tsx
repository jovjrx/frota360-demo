import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  FormControl,
  FormLabel,
  Icon,
  useToast,
  Progress,
  Badge,
  List,
  ListItem,
  ListIcon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FiUpload,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiDatabase,
} from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { withAdminSSR, AdminPageProps } from '@/lib/admin/withAdminSSR';
import { getTranslation } from '@/lib/translations';
import { useRouter } from 'next/router';

interface ImportPageProps extends AdminPageProps {}

interface FileUpload {
  platform: 'uber' | 'bolt' | 'prio' | 'viaverde';
  label: string;
  file: File | null;
  status: 'idle' | 'ready' | 'error';
  error?: string;
}

const getWeekDates = (): { start: string; end: string } => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  let daysToMonday;
  if (dayOfWeek === 0) {
    daysToMonday = 6;
  } else if (dayOfWeek === 1) {
    daysToMonday = 0;
  } else {
    daysToMonday = dayOfWeek - 1;
  }
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0],
  };
};

export default function ImportNewPage({ user, translations, locale }: ImportPageProps) {
  const router = useRouter();
  const { start, end } = getWeekDates();
  
  const [weekStart, setWeekStart] = useState(start);
  const [weekEnd, setWeekEnd] = useState(end);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  const [files, setFiles] = useState<FileUpload[]>([
    { platform: 'uber', label: 'Uber (CSV)', file: null, status: 'idle' },
    { platform: 'bolt', label: 'Bolt (CSV)', file: null, status: 'idle' },
    { platform: 'prio', label: 'Prio (XLSX)', file: null, status: 'idle' },
    { platform: 'viaverde', label: 'ViaVerde (XLSX)', file: null, status: 'idle' },
  ]);

  const toast = useToast();

  const t = (key: string, variables?: Record<string, any>) => getTranslation(translations.common, key, variables) || key;
  const tAdmin = (key: string, variables?: Record<string, any>) => getTranslation(translations.page, key, variables) || key;

  const handleFileChange = (platform: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    setFiles(prev =>
      prev.map(f =>
        f.platform === platform 
          ? { ...f, file, status: file ? 'ready' : 'idle', error: undefined }
          : f
      )
    );
  };

  const handleImport = async () => {
    const filesToUpload = files.filter(f => f.file !== null);

    if (filesToUpload.length === 0) {
      toast({
        title: tAdmin('no_file_selected_title'),
        description: tAdmin('no_file_selected_description'),
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('weekStart', weekStart);
      formData.append('weekEnd', weekEnd);
      formData.append('adminId', user.id); // Usar ID do admin logado

      filesToUpload.forEach(fileData => {
        if (fileData.file) {
          formData.append(fileData.platform, fileData.file);
        }
      });

      const response = await fetch('/api/admin/weekly/import-raw', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tAdmin('import_error_generic'));
      }

      const data = await response.json();
      setImportResult(data);

      toast({
        title: tAdmin('import_success_title'),
        description: tAdmin('import_success_description', { importId: data.importId }),
        status: 'success',
        duration: 5000,
      });

      // Redirecionar para página weekly
      setTimeout(() => {
        router.push('/admin/weekly');
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('unknown_error');
      
      toast({
        title: tAdmin('import_error_title'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const filesReady = files.filter(f => f.file !== null).length;
  const totalFiles = files.length;

  return (
    <AdminLayout
      title={tAdmin('import_data_title')}
      subtitle={tAdmin('import_data_subtitle')}
      breadcrumbs={[
        { label: tAdmin('weekly_control_title'), href: '/admin/weekly' },
        { label: tAdmin('import_data_title') }
      ]}
    >
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg">{tAdmin('import_data_heading')}</Heading>
          <Text color="gray.600" mt={2}>
            {tAdmin('import_data_description')}
          </Text>
        </Box>

        {/* Alerta informativo */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>{tAdmin('new_import_structure_alert_title')}</AlertTitle>
            <AlertDescription>
              {tAdmin('new_import_structure_alert_description')}
            </AlertDescription>
          </Box>
        </Alert>

        {/* Seleção de período */}
        <Card>
          <CardHeader>
            <Heading size="md">{tAdmin('week_period_title')}</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={4}>
              <FormControl>
                <FormLabel>{t('start_date')}</FormLabel>
                <Input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t('end_date')}</FormLabel>
                <Input
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                />
              </FormControl>
            </HStack>
          </CardBody>
        </Card>

        {/* Upload de arquivos */}
        <Card>
          <CardHeader>
            <Heading size="md">{tAdmin('files_for_import_title')}</Heading>
            <Text fontSize="sm" color="gray.600" mt={1}>
              {tAdmin('files_selected_count', { ready: filesReady, total: totalFiles })}
            </Text>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {files.map((fileData) => (
                <Box key={fileData.platform} p={4} borderWidth="1px" borderRadius="md">
                  <HStack justify="space-between" mb={2}>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold">{fileData.label}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {fileData.platform.toUpperCase()}
                      </Text>
                    </VStack>
                    <Badge
                      colorScheme={
                        fileData.status === 'ready'
                          ? 'green'
                          : fileData.status === 'error'
                          ? 'red'
                          : 'gray'
                      }
                    >
                      {fileData.status === 'ready'
                        ? tAdmin('status_ready')
                        : fileData.status === 'error'
                        ? tAdmin('status_error')
                        : tAdmin('status_waiting')}
                    </Badge>
                  </HStack>

                  <FormControl>
                    <Input
                      type="file"
                      accept={fileData.platform === 'uber' || fileData.platform === 'bolt' ? '.csv' : '.xlsx,.xls'}
                      onChange={(e) => handleFileChange(fileData.platform, e)}
                      size="sm"
                    />
                  </FormControl>

                  {fileData.file && (
                    <HStack mt={2} spacing={2}>
                      <Icon as={FiCheck} color="green.500" />
                      <Text fontSize="sm" color="gray.600">
                        {fileData.file.name} ({(fileData.file.size / 1024).toFixed(2)} KB)
                      </Text>
                    </HStack>
                  )}

                  {fileData.error && (
                    <HStack mt={2} spacing={2}>
                      <Icon as={FiX} color="red.500" />
                      <Text fontSize="sm" color="red.500">
                        {fileData.error}
                      </Text>
                    </HStack>
                  )}
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>

        {/* Resultado da importação */}
        {importResult && (
          <Card>
            <CardHeader>
              <Heading size="md">{tAdmin('import_result_title')}</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <HStack>
                  <Icon as={FiDatabase} color="blue.500" />
                  <Text fontWeight="bold">{tAdmin('import_id_label')}:</Text>
                  <Text fontFamily="mono" fontSize="sm">{importResult.importId}</Text>
                </HStack>

                {importResult.results.success.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" color="green.600" mb={2}>
                      {tAdmin('import_success_section_title')}:
                    </Text>
                    <List spacing={1}>
                      {importResult.results.success.map((msg: string, i: number) => (
                        <ListItem key={i}>
                          <ListIcon as={FiCheck} color="green.500" />
                          {msg}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {importResult.results.errors.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" color="red.600" mb={2}>
                      {tAdmin('import_errors_section_title')}:
                    </Text>
                    <List spacing={1}>
                      {importResult.results.errors.map((err: any, i: number) => (
                        <ListItem key={i}>
                          <ListIcon as={FiX} color="red.500" />
                          {err.platform}: {err.error}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Botões de ação */}
        <HStack spacing={4}>
          <Button
            leftIcon={<Icon as={FiUpload} />}
            colorScheme="blue"
            size="lg"
            onClick={handleImport}
            isLoading={isImporting}
            loadingText={tAdmin('importing_loading_text')}
            isDisabled={filesReady === 0}
          >
            {tAdmin('import_data_button')}
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push('/admin/weekly')}
          >
            {t('cancel')}
          </Button>
        </HStack>

        {isImporting && (
          <Progress size="sm" isIndeterminate colorScheme="blue" />
        )}
      </VStack>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR();

