import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
  HStack,
} from '@chakra-ui/react';

interface AdminFeeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminFeeConfigModal({ isOpen, onClose }: AdminFeeConfigModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    adminFeePercent: 7,
    adminFeeFixedDefault: 25,
  });

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/admin/financial-config');
      if (res.ok) {
        const data = await res.json();
        setConfig({
          adminFeePercent: data.adminFeePercent || 7,
          adminFeeFixedDefault: data.adminFeeFixedDefault || 25,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/financial-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error('Erro ao salvar configuração');

      toast({
        title: 'Configuração salva!',
        description: 'Os valores padrões foram atualizados com sucesso.',
        status: 'success',
        duration: 3000,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a configuração.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Configurar Taxa Administrativa Padrão</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Taxa Percentual Padrão (%)</FormLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={config.adminFeePercent}
                onChange={(e) => setConfig({ ...config, adminFeePercent: parseFloat(e.target.value) || 0 })}
              />
              <Text fontSize="xs" color="gray.600" mt={1}>
                Percentual padrão aplicado sobre (Ganhos - IVA) quando o motorista não tem taxa customizada.
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Valor Fixo Padrão (€)</FormLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={config.adminFeeFixedDefault}
                onChange={(e) => setConfig({ ...config, adminFeeFixedDefault: parseFloat(e.target.value) || 0 })}
              />
              <Text fontSize="xs" color="gray.600" mt={1}>
                Valor fixo padrão em euros aplicado semanalmente quando o motorista escolhe taxa fixa mas não define um valor customizado.
              </Text>
            </FormControl>

            <Text fontSize="sm" color="orange.600" fontWeight="medium">
              ⚠️ Estas configurações só afetam pagamentos futuros. Pagamentos já realizados não serão alterados.
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={handleSave} isLoading={loading}>
              Salvar Configuração
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
