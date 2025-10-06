import { useState } from 'react';
import { GetServerSideProps } from 'next';
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
} from '@chakra-ui/react';
import {
  FiUpload,
  FiCheck,
  FiX,
  FiAlertCircle,
} from 'react-icons/fi';
import AdminLayout from '@/components/layouts/AdminLayout';
import { PageProps } from '@/interface/Global';

interface ImportPageProps extends PageProps {
}

interface UploadedFile {
  platform: string;
  file: File | null;
  recordsCount?: number;
  status: 'idle' | 'uploading' | 'uploaded' | 'error';
  error?: string;
}

interface ProcessResult {
  success: string[];
  errors: Array<{ platform: string; error: string }>;
  warnings: string[];
}

const getWeekDates = (): { start: string; end: string } => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Segunda-feira
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // Domingo
  weekEnd.setHours(23, 59, 59, 999);
  
  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0],
  };
};

export default function ImportPage(_props: ImportPageProps) {
  const { start, end } = getWeekDates();
  
  const [weekStart, setWeekStart] = useState(start);
  const [weekEnd, setWeekEnd] = useState(end);
  const [importId, setImportId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  
  const [files, setFiles] = useState<UploadedFile[]>([
    { platform: 'uber', file: null, status: 'idle' },
    { platform: 'bolt', file: null, status: 'idle' },
    { platform: 'myprio', file: null, status: 'idle' },
    { platform: 'viaverde', file: null, status: 'idle' },
  ]);

  const toast = useToast();

  const handleFileChange = (platform: string, file: File | null) => {
    setFiles(prev =>
      prev.map(f =>
        f.platform === platform ? { ...f, file, status: 'idle', error: undefined } : f
      )
    );
  };

  const uploadFile = async (platform: string, file: File): Promise<boolean> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('platform', platform);
    formData.append('weekStart', weekStart);
    formData.append('weekEnd', weekEnd);

    try {
      const response = await fetch('/api/admin/imports/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro no upload');
      }

      const data = await response.json();
      
      setFiles(prev =>
        prev.map(f =>
          f.platform === platform
            ? { ...f, status: 'uploaded', recordsCount: data.recordsCount }
            : f
        )
      );

      // Guardar importId do primeiro arquivo
      if (!importId) {
        setImportId(data.importId);
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setFiles(prev =>
        prev.map(f =>
          f.platform === platform ? { ...f, status: 'error', error: errorMessage } : f
        )
      );

      return false;
    }
  };

  const handleUploadAll = async () => {
    const filesToUpload = files.filter(f => f.file !== null);

    if (filesToUpload.length === 0) {
      toast({
        title: 'Nenhum arquivo selecionado',
        description: 'Selecione pelo menos um arquivo para importar',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // Reset estado
    setImportId(null);
    setProcessResult(null);

    // Upload de todos os arquivos
    for (const fileData of filesToUpload) {
      if (!fileData.file) continue;

      setFiles(prev =>
        prev.map(f =>
          f.platform === fileData.platform ? { ...f, status: 'uploading' } : f
        )
      );

      await uploadFile(fileData.platform, fileData.file);
    }

    toast({
      title: 'Upload concluído',
      description: 'Arquivos enviados. Clique em "Processar Importação" para continuar.',
      status: 'success',
      duration: 5000,
    });
  };

  const handleProcess = async () => {
    if (!importId) {
      toast({
        title: 'Erro',
        description: 'Faça o upload dos arquivos primeiro',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsProcessing(true);
    setProcessResult(null);

    try {
      const response = await fetch('/api/admin/imports/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro no processamento');
      }

      const data = await response.json();
      setProcessResult(data.results);

      toast({
        title: 'Processamento concluído',
        status: 'success',
        duration: 5000,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: 'Erro no processamento',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([
      { platform: 'uber', file: null, status: 'idle' },
      { platform: 'bolt', file: null, status: 'idle' },
      { platform: 'myprio', file: null, status: 'idle' },
      { platform: 'viaverde', file: null, status: 'idle' },
    ]);
    setImportId(null);
    setProcessResult(null);
    setWeekStart(start);
    setWeekEnd(end);
  };

  const getPlatformLabel = (platform: string): string => {
    switch (platform) {
      case 'uber': return 'Uber';
      case 'bolt': return 'Bolt';
      case 'myprio': return 'myprio (Combustível)';
      case 'viaverde': return 'ViaVerde (Portagens)';
      default: return platform;
    }
  };

  const getFileAccept = (platform: string): string => {
    return platform === 'myprio' || platform === 'viaverde' 
      ? '.xlsx,.xls' 
      : '.csv';
  };

  const uploadedCount = files.filter(f => f.status === 'uploaded').length;
  const canProcess = uploadedCount > 0 && !isProcessing;
  const allUploaded = files.filter(f => f.file !== null).every(f => f.status === 'uploaded');

  return (
    <AdminLayout
      title="Importação de Dados Semanais"
      subtitle="Faça upload dos arquivos CSV/Excel de cada plataforma para processar os pagamentos da semana"
      breadcrumbs={[{ label: 'Controle Semanal', href: '/admin/weekly' }, { label: 'Importação' }]}
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Importação de Dados Semanais</Heading>
          <Text color="gray.600">
            Faça upload dos arquivos CSV/Excel de cada plataforma para processar os pagamentos da semana
          </Text>
        </Box>

        {/* Week Selection */}
        <Card>
          <CardHeader>
            <Heading size="md">Período da Semana</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Início da Semana</FormLabel>
                <Input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Fim da Semana</FormLabel>
                <Input
                  type="date"
                  value={weekEnd}
                  onChange={(e) => setWeekEnd(e.target.value)}
                />
              </FormControl>
            </HStack>
          </CardBody>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <Heading size="md">Arquivos para Importação</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {files.map((fileData) => (
                <HStack key={fileData.platform} spacing={4} p={4} borderWidth={1} borderRadius="md">
                  <Box flex={1}>
                    <Text fontWeight="bold" mb={1}>
                      {getPlatformLabel(fileData.platform)}
                    </Text>
                    <Input
                      type="file"
                      accept={getFileAccept(fileData.platform)}
                      onChange={(e) => handleFileChange(fileData.platform, e.target.files?.[0] || null)}
                      disabled={fileData.status === 'uploading' || fileData.status === 'uploaded'}
                    />
                    {fileData.status === 'uploaded' && fileData.recordsCount !== undefined && (
                      <Text fontSize="sm" color="green.600" mt={1}>
                        ✓ {fileData.recordsCount} linhas carregadas
                      </Text>
                    )}
                    {fileData.error && (
                      <Text fontSize="sm" color="red.600" mt={1}>
                        ✗ {fileData.error}
                      </Text>
                    )}
                  </Box>
                  <Badge
                    colorScheme={
                      fileData.status === 'uploaded' ? 'green' :
                      fileData.status === 'uploading' ? 'blue' :
                      fileData.status === 'error' ? 'red' :
                      'gray'
                    }
                  >
                    {fileData.status === 'uploaded' ? 'Enviado' :
                     fileData.status === 'uploading' ? 'Enviando...' :
                     fileData.status === 'error' ? 'Erro' :
                     'Aguardando'}
                  </Badge>
                </HStack>
              ))}
            </VStack>

            <HStack mt={6} spacing={4}>
              <Button
                leftIcon={<Icon as={FiUpload} />}
                colorScheme="blue"
                onClick={handleUploadAll}
                isDisabled={files.every(f => f.file === null) || allUploaded}
              >
                Enviar Arquivos ({uploadedCount}/{files.filter(f => f.file !== null).length})
              </Button>
              <Button onClick={handleReset} variant="ghost">
                Resetar
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Process Button */}
        {uploadedCount > 0 && (
          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Text>
                  {uploadedCount} arquivo(s) pronto(s) para processar. 
                  Clique no botão abaixo para criar/atualizar os registros semanais.
                </Text>
                <Button
                  leftIcon={<Icon as={FiCheck} />}
                  colorScheme="green"
                  size="lg"
                  onClick={handleProcess}
                  isLoading={isProcessing}
                  isDisabled={!canProcess}
                >
                  Processar Importação
                </Button>
                {isProcessing && <Progress size="xs" isIndeterminate w="100%" />}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Results */}
        {processResult && (
          <Card>
            <CardHeader>
              <Heading size="md">Resultados do Processamento</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Success */}
                {processResult.success.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" color="green.600" mb={2}>
                      ✓ Processado com sucesso:
                    </Text>
                    <List spacing={1}>
                      {processResult.success.map((msg, i) => (
                        <ListItem key={i}>
                          <ListIcon as={FiCheck} color="green.500" />
                          {msg}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Warnings */}
                {processResult.warnings.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" color="orange.600" mb={2}>
                      ⚠ Avisos:
                    </Text>
                    <List spacing={1}>
                      {processResult.warnings.map((msg, i) => (
                        <ListItem key={i} fontSize="sm">
                          <ListIcon as={FiAlertCircle} color="orange.500" />
                          {msg}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Errors */}
                {processResult.errors.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" color="red.600" mb={2}>
                      ✗ Erros:
                    </Text>
                    <List spacing={1}>
                      {processResult.errors.map((err, i) => (
                        <ListItem key={i}>
                          <ListIcon as={FiX} color="red.500" />
                          <strong>{err.platform}:</strong> {err.error}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                <Button
                  mt={4}
                  colorScheme="blue"
                  onClick={() => window.location.href = '/admin/weekly'}
                >
                  Ver Controle Semanal
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  const authResult = await checkAdminAuth(context);

  if ('redirect' in authResult) {
    return authResult;
  }

  return {
    props: {
      ...authResult.props,
    },
  };
};
