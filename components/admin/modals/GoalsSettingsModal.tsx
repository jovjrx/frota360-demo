import React, { useEffect, useState } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Stack, SimpleGrid, FormControl, FormLabel, Input, useToast, Text } from '@chakra-ui/react';

interface GoalsConfigDto {
  activeYear: number;
  targets: { Q1: number; Q2: number; Q3: number; Q4: number };
}

const DEFAULT_CFG: GoalsConfigDto = { activeYear: 2026, targets: { Q1: 15, Q2: 25, Q3: 40, Q4: 60 } };

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoalsSettingsModal({ isOpen, onClose }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [cfg, setCfg] = useState<GoalsConfigDto>(DEFAULT_CFG);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/goals');
      const data = await res.json();
      if (data?.success && data.config) setCfg(data.config as GoalsConfigDto);
    } catch (e) {
      // Silently ignore; use defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen]);

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (data?.success) {
        toast({ status: 'success', title: 'Metas atualizadas' });
        onClose();
      } else {
        toast({ status: 'error', title: data?.error || 'Erro ao salvar' });
      }
    } catch (e) {
      toast({ status: 'error', title: 'Erro de rede ao salvar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Configurações de Metas</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Ano Ativo</FormLabel>
              <Input type="number" value={cfg.activeYear} onChange={(e) => setCfg({ ...cfg, activeYear: Number(e.target.value) })} />
            </FormControl>
            <Text fontWeight="semibold">Targets por Trimestre (Motoristas Ativos)</Text>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
              {(['Q1','Q2','Q3','Q4'] as const).map(q => (
                <FormControl key={q}>
                  <FormLabel>{q}</FormLabel>
                  <Input type="number" min={0} value={cfg.targets[q]} onChange={(e) => setCfg({ ...cfg, targets: { ...cfg.targets, [q]: Number(e.target.value) } })} />
                </FormControl>
              ))}
            </SimpleGrid>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="blue" onClick={save} isLoading={loading}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
