import { useState, ChangeEvent } from 'react';
import { Button, Input, FormControl, FormLabel, Text, Box, useToast, HStack, Image } from '@chakra-ui/react';
import { FiUpload, FiX } from 'react-icons/fi';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  maxSize?: number; // em MB
}

export function ImageUpload({ label, value, onChange, accept = 'image/*', maxSize = 5 }: ImageUploadProps) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

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
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        status: 'error',
        title: 'Formato inválido',
        description: 'Apenas imagens são permitidas (PNG, JPG, WEBP, GIF, SVG)',
      });
      return;
    }

    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        status: 'error',
        title: 'Arquivo muito grande',
        description: `Tamanho máximo: ${maxSize}MB`,
      });
      return;
    }

    setUploading(true);

    try {
      const base64 = await readFileAsBase64(file);
      const timestamp = Date.now();
      const fileName = `block-images/${timestamp}-${file.name}`;

      const response = await fetch('/api/admin/upload-branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileType: 'block-image',
          fileName,
          base64,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        onChange(data.url);
        toast({
          status: 'success',
          title: 'Upload realizado com sucesso!',
          duration: 3000,
        });
      } else {
        throw new Error(data.error || 'Erro no upload');
      }
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        status: 'error',
        title: 'Erro no upload',
        description: error.message || 'Não foi possível fazer upload da imagem',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      
      <HStack spacing={3}>
        <Box flex={1}>
          <Input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            display="none"
            id={`file-input-${label.replace(/\s/g, '-')}`}
          />
          <Button
            as="label"
            htmlFor={`file-input-${label.replace(/\s/g, '-')}`}
            leftIcon={<FiUpload />}
            isLoading={uploading}
            loadingText="Fazendo upload..."
            size="sm"
            cursor="pointer"
          >
            {value ? 'Trocar Imagem' : 'Upload Imagem'}
          </Button>
        </Box>

        {value && (
          <>
            <Button
              leftIcon={<FiX />}
              onClick={handleRemove}
              size="sm"
              variant="ghost"
              colorScheme="red"
            >
              Remover
            </Button>
          </>
        )}
      </HStack>

      <Box mt={3}>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL da imagem ou caminho local (/img/example.jpg)"
        />
        <Text fontSize="xs" color="gray.500" mt={1}>
          Você pode colar uma URL ou usar o botão de upload acima
        </Text>
      </Box>

      {value && (
        <Box mt={3} borderWidth="1px" borderRadius="md" p={2} maxW="200px">
          <Text fontSize="xs" color="gray.600" mb={1}>
            Preview:
          </Text>
          <Image src={value} alt="Preview" maxH="150px" objectFit="contain" />
        </Box>
      )}
    </FormControl>
  );
}

