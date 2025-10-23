
import React, { useEffect, useState } from 'react';
import { Box, IconButton, Select, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Stack, SimpleGrid, FormControl, FormLabel, Input } from '@chakra-ui/react';
import { FiTrash2, FiPlus } from 'react-icons/fi';

export interface RewardConfig {
  criterio: 'ganho' | 'viagens';
  tipo: 'valor' | 'percentual';
  valor: number;
  nivel: number;
  descricao: string;
  dataInicio?: number;
}



interface Props {
  isOpen: boolean;
  onClose: () => void;
}


export default function GoalsSettingsModal({ isOpen, onClose }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState<RewardConfig[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings/goals');
      const data = await res.json();
      if (data?.success && Array.isArray(data.config?.rewards)) setRewards(data.config.rewards);
    } catch (e) {
      toast({ status: 'error', title: 'Falha ao carregar config' });
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
        body: JSON.stringify({ rewards }),
      });
      const data = await res.json();
      if (data?.success) {
        toast({ status: 'success', title: 'Configuração salva' });
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

  const updateReward = (idx: number, patch: Partial<RewardConfig>) => {
    setRewards(rewards => rewards.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };

  const removeReward = (idx: number) => {
    setRewards(rewards => rewards.filter((_, i) => i !== idx));
  };

  const addReward = () => {
    setRewards(rewards => [
      ...rewards,
      { criterio: 'ganho', tipo: 'valor', valor: 0, nivel: 1, descricao: '' }
    ]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" closeOnOverlayClick={!loading}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Configuração de Metas/Recompensas</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            {rewards.length === 0 && (
              <Box color="gray.500" fontSize="sm">Nenhuma meta configurada. Adicione uma recompensa abaixo.</Box>
            )}
            {rewards.map((reward, idx) => (
              <SimpleGrid columns={{ base: 1, md: 6 }} spacing={3} key={idx} alignItems="end">
                <FormControl>
                  <FormLabel>Critério</FormLabel>
                  <Select value={reward.criterio} onChange={e => updateReward(idx, { criterio: e.target.value as any })}>
                    <option value="ganho">Ganho Bruto (€)</option>
                    <option value="viagens">Viagens</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={reward.tipo} onChange={e => updateReward(idx, { tipo: e.target.value as any })}>
                    <option value="valor">Valor Fixo (€)</option>
                    <option value="percentual">Percentual (%)</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Valor</FormLabel>
                  <Input type="number" min={0} step="any" value={reward.valor}
                    onChange={e => updateReward(idx, { valor: Number(e.target.value) })} />
                </FormControl>
                <FormControl>
                  <FormLabel>Nível</FormLabel>
                  <Input type="number" min={1} max={10} value={reward.nivel}
                    onChange={e => updateReward(idx, { nivel: Math.max(1, Math.min(10, Number(e.target.value))) })} />
                </FormControl>
                <FormControl>
                  <FormLabel>Descrição</FormLabel>
                  <Input value={reward.descricao} onChange={e => updateReward(idx, { descricao: e.target.value })} />
                </FormControl>
                <Box>
                  <IconButton aria-label="Remover" icon={<FiTrash2 />} colorScheme="red" variant="ghost" onClick={() => removeReward(idx)} />
                </Box>
              </SimpleGrid>
            ))}
            <Button leftIcon={<FiPlus />} onClick={addReward} colorScheme="blue" variant="outline" size="sm" mt={2} alignSelf="start">Adicionar Recompensa</Button>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={loading}>Cancelar</Button>
          <Button colorScheme="blue" onClick={save} isLoading={loading}>Salvar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
