import { useState, ChangeEvent } from 'react';
import { Button, Input, FormControl, FormLabel, Text, Box, useToast } from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';

interface BrandingFileUploadProps {
  fileType: 'logo' | 'favicon' | 'appleTouchIcon';
  currentUrl: string;
  onUploadComplete: (url: string) => void;
}

export function BrandingFileUpload({ fileType, currentUrl, onUploadComplete }: BrandingFileUploadProps) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const base64 = result.split(',')[1];
        if (!base64) {
          reject(new Error('Invalid file result'));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        status: 'error',
        title: 'Formato inválido',
        description: 'Apenas imagens são permitidas (PNG, JPG, WEBP, SVG)',
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        status: 'error',
        title: 'Arquivo muito grande',
        description: 'Tamanho máximo: 5MB',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const base64 = await readFileAsBase64(selectedFile);
      const timestamp = Date.now();
      const fileName = `${fileType}-${timestamp}.${selectedFile.name.split('.').pop()}`;

      const response = await fetch('/api/admin/upload-branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileType,
          fileName,
          base64,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onUploadComplete(data.url);
        setSelectedFile(null);
        toast({
          status: 'success',
          title: 'Upload concluído!',
          description: 'Imagem enviada com sucesso para Firebase Storage',
        });
      } else {
        throw new Error(data.error || 'Erro ao fazer upload');
      }
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        status: 'error',
        title: 'Erro ao fazer upload',
        description: error.message || 'Tente novamente',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <FormControl>
      <FormLabel>Upload de nova imagem</FormLabel>
      <Input
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        mb={2}
      />
      {selectedFile && (
        <Box>
          <Text fontSize="sm" mb={2}>
            Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
          </Text>
          <Button
            leftIcon={<FiUpload />}
            onClick={handleUpload}
            isLoading={uploading}
            colorScheme="blue"
            size="sm"
          >
            Enviar para Firebase Storage
          </Button>
        </Box>
      )}
      <Text fontSize="xs" color="gray.500" mt={2}>
        Formatos aceitos: PNG, JPG, WEBP, SVG | Máx: 5MB
      </Text>
    </FormControl>
  );
}

