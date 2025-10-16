import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Input,
  Select,
  Button,
  useToast,
  Badge,
} from '@chakra-ui/react';
import { FiSend } from 'react-icons/fi';

interface DriverOption {
  id: string;
  fullName?: string;
  email?: string;
  type?: 'affiliate' | 'renter';
}

interface SendContractEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: DriverOption[];
  onSent?: () => void;
}

export function SendContractEmailModal({ isOpen, onClose, drivers, onSent }: SendContractEmailModalProps) {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [contractType, setContractType] = useState<'affiliate' | 'renter'>('affiliate');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredDrivers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return drivers;
    }

    return drivers.filter((driver) => {
      const name = driver.fullName?.toLowerCase() ?? '';
      const email = driver.email?.toLowerCase() ?? '';
      return name.includes(term) || email.includes(term);
    });
  }, [drivers, searchTerm]);

  const selectedDriver = useMemo(() => drivers.find((driver) => driver.id === selectedDriverId), [drivers, selectedDriverId]);

  useEffect(() => {
    if (selectedDriver?.type) {
      setContractType(selectedDriver.type);
    }
  }, [selectedDriver?.type]);

  const resetState = () => {
    setSearchTerm('');
    setSelectedDriverId('');
    setContractType('affiliate');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSendEmail = async () => {
    if (!selectedDriverId) {
      toast({
        title: 'Selecione um motorista',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/contracts/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId: selectedDriverId,
          contractType,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error ?? 'Erro ao enviar email');
      }

      toast({
        title: 'Email enviado',
        description: 'O motorista recebeu o link de assinatura.',
        status: 'success',
        duration: 4000,
      });
      onSent?.();
      handleClose();
    } catch (error: any) {
      console.error('[Contracts] Failed to send contract email:', error);
      toast({
        title: 'Erro ao enviar email',
        description: error?.message ?? 'Tente novamente mais tarde.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Enviar instruções por email</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Text fontSize="sm" color="gray.600">
              Selecione um motorista ativo e envie as instruções para concluir o contrato diretamente pelo dashboard.
            </Text>

            <Input
              placeholder="Pesquisar por nome ou email"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <Select
              placeholder="Escolha um motorista"
              value={selectedDriverId}
              onChange={(event) => setSelectedDriverId(event.target.value)}
            >
              {filteredDrivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName ?? 'Motorista sem nome'} {driver.email ? `(${driver.email})` : ''}
                </option>
              ))}
            </Select>

            {selectedDriver && (
              <HStack spacing={3} align="center">
                <Badge colorScheme={selectedDriver.type === 'renter' ? 'purple' : 'blue'}>
                  {selectedDriver.type === 'renter' ? 'Locatário' : 'Afiliado'}
                </Badge>
                <Text fontSize="sm" color="gray.600">{selectedDriver.email ?? 'Sem email cadastrado'}</Text>
              </HStack>
            )}

            <Select value={contractType} onChange={(event) => setContractType(event.target.value as 'affiliate' | 'renter')}>
              <option value="affiliate">Contrato Afiliado</option>
              <option value="renter">Contrato Locatário</option>
            </Select>
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={handleClose} isDisabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            leftIcon={<FiSend />}
            onClick={handleSendEmail}
            isLoading={isSubmitting}
            isDisabled={!drivers.length}
          >
            Enviar email
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
