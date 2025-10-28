import React, { useMemo, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Button,
    VStack,
    HStack,
    Text,
    Spinner,
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useToast,
} from '@chakra-ui/react';
import { Badge } from '@chakra-ui/react';
import useSWR from 'swr';
import { useLanguage } from '@/lib/useLanguage';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PreviewPaymentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    weekId: string;
}

export default function PreviewPaymentsModal({ isOpen, onClose, weekId }: PreviewPaymentsModalProps) {
    const toast = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const { currentLocale } = useLanguage();
    const { data, isLoading, mutate } = useSWR(
        isOpen ? `/api/admin/weekly/data?weekId=${encodeURIComponent(weekId)}&forceRefresh=true` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const records = data?.records || [];

    const totals = useMemo(() => {
        const totalRepasse = records.reduce((s: number, r: any) => s + (r.repasse || 0), 0);
        const totalBonus = records.reduce((s: number, r: any) => s + (r.totalBonusAmount || 0), 0);
        return { totalRepasse, totalBonus, drivers: records.length };
    }, [records]);

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            const resp = await fetch('/api/admin/imports/process-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekId }),
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err?.error || 'Falha ao gerar pagamentos');
            }
            const res = await resp.json();
            toast({ title: 'Pagamentos gerados', description: `${res.processed} motoristas processados`, status: 'success' });
            onClose();
        } catch (e: any) {
            toast({ title: 'Erro ao gerar pagamentos', description: e?.message, status: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="6xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Pré-visualização de Pagamentos — {weekId}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {isLoading ? (
                        <HStack justify="center" py={8}>
                            <Spinner />
                            <Text>Calculando prévia…</Text>
                        </HStack>
                    ) : (
                        <VStack align="stretch" spacing={4}>
                            <HStack justify="space-between">
                                <Text fontWeight="bold">Motoristas: {totals.drivers}</Text>
                                <HStack>
                                    <Text>Bônus: €{totals.totalBonus.toFixed(2)}</Text>
                                    <Text>Repasse total: €{totals.totalRepasse.toFixed(2)}</Text>
                                </HStack>
                            </HStack>
                            <Box overflowX="auto" maxW="100%">
                                <Table size="sm" sx={{ tableLayout: 'auto', minWidth: '1200px' }}>
                                    <Thead>
                                        <Tr>
                                            <Th minW="160px" fontSize={'xs'}>Nome</Th>
                                            <Th fontSize={'xs'}>Tipo</Th>
                                            <Th isNumeric fontSize={'xs'}>Uber</Th>
                                            <Th isNumeric fontSize={'xs'}>Bolt</Th>
                                            <Th isNumeric fontSize={'xs'}>Ganhos</Th>
                                            <Th isNumeric fontSize={'xs'}>IVA</Th>
                                            <Th isNumeric fontSize={'xs'}>Taxa</Th>
                                            <Th isNumeric fontSize={'xs'}>Comb.</Th>
                                            <Th isNumeric fontSize={'xs'}>Port.</Th>
                                            <Th isNumeric fontSize={'xs'}>Aluguel</Th>
                                            <Th isNumeric fontSize={'xs'}>Financ.</Th>
                                            <Th isNumeric fontSize={'xs'}>Com.</Th>
                                            <Th isNumeric fontSize={'xs'}>Meta</Th>
                                            <Th isNumeric fontSize={'xs'}>Ind.</Th>
                                            <Th isNumeric fontSize={'xs'}>Líquido</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {records.map((r: any) => {
                                            const uber = Number(r.uberTotal || 0);
                                            const bolt = Number(r.boltTotal || 0);
                                            const ganhosBrutos = Number((r as any).ganhos ?? (r as any).ganhosTotal ?? (uber + bolt));
                                            const iva = Number(r.ivaValor || 0);
                                            const taxaAdm = Number(r.despesasAdm || 0);
                                            const combustivel = Number(r.combustivel || 0);
                                            const portagens = Number(r.viaverde || 0);
                                            const aluguel = Number(r.aluguel || 0);
                                            const fin = (r.financingDetails || {}) as any;
                                            const finWeeklyAmount = Number(
                                                fin.weeklyAmount ?? fin.installment ?? 0
                                            );
                                            const finInterestPercent = Number(
                                                fin.weeklyInterest ?? fin.interestPercent ?? 0
                                            );
                                            let financiamento = Number(
                                                fin.displayAmount ?? fin.weeklyWithFees ?? fin.totalCost
                                            );
                                            if (!isFinite(financiamento) || financiamento <= 0) {
                                                financiamento = Math.max(0, finWeeklyAmount + (finWeeklyAmount * finInterestPercent / 100));
                                            }
                                            // Fallback: se não vier financingDetails, derivar pela identidade do repasse
                                            if (!financiamento || financiamento <= 0) {
                                                const ganhosMenosIVA = Number(r.ganhosMenosIVA ?? (ganhosBrutos - iva));
                                                const despesasAdmNum = Number(r.despesasAdm || 0);
                                                const totalDespesasBasicas = combustivel + portagens + aluguel;
                                                const derived = ganhosMenosIVA - despesasAdmNum - totalDespesasBasicas - Number(r.repasse || 0);
                                                if (isFinite(derived) && derived > 0) {
                                                    financiamento = derived;
                                                }
                                            }
                                            // Valores informativos (sempre mostrar) – após financiamento
                                            const commissionPending = Number(r.commissionPending?.amount || 0);
                                            const bonusMeta = Array.isArray(r.bonusMetaPending)
                                                ? r.bonusMetaPending.reduce((s: number, b: any) => s + Number(b?.amount || 0), 0)
                                                : 0;
                                            const bonusReferral = Array.isArray(r.referralBonusPending)
                                                ? r.referralBonusPending.reduce((s: number, b: any) => s + Number(b?.amount || 0), 0)
                                                : 0;
                                            const repasse = Number(r.repasse || 0);
                                            const type: string = r.type || (r.isLocatario ? 'renter' : 'affiliate');
                                            const typeLabel = type === 'renter'
                                                ? (currentLocale === 'en' ? 'Renter' : 'Locatário')
                                                : (currentLocale === 'en' ? 'Affiliate' : 'Afiliado');
                                            const typeColor: any = type === 'renter' ? 'green' : 'blue';
                                            return (
                                                <Tr key={r.id}>
                                                    <Td
                                                        maxW="160px"
                                                        whiteSpace="nowrap"
                                                        overflow="hidden"
                                                        textOverflow="ellipsis"
                                                        title={r.driverName || ''}
                                                    >
                                                        {r.driverName || '—'}
                                                    </Td>
                                                    <Td>
                                                        <Badge colorScheme={typeColor} variant="subtle">
                                                            {typeLabel}
                                                        </Badge>
                                                    </Td>
                                                    <Td whiteSpace="nowrap" isNumeric color="green.600" fontSize={"xs"}>€{uber.toFixed(2)}</Td>
                                                    <Td whiteSpace="nowrap" isNumeric color="green.600" fontSize={"xs"}>€{bolt.toFixed(2)}</Td>
                                                    <Td whiteSpace="nowrap" isNumeric fontWeight="semibold" color="green.600" fontSize={"xs"}>€{ganhosBrutos.toFixed(2)}</Td>
                                                    <Td whiteSpace="nowrap" isNumeric color="red.600" fontSize={"xs"}>{iva > 0 ? `-€${iva.toFixed(2)}` : '—'}</Td>
                                                    <Td whiteSpace="nowrap" isNumeric color="red.600" fontSize={"xs"}>{taxaAdm > 0 ? `-€${taxaAdm.toFixed(2)}` : '—'}</Td>
                                                    <Td whiteSpace="nowrap" isNumeric color="orange.600" fontSize={"xs"}>{combustivel > 0 ? `-€${combustivel.toFixed(2)}` : '—'}</Td>
                                                    <Td whiteSpace="nowrap" isNumeric color="orange.600" fontSize={"xs"}>{portagens > 0 ? `-€${portagens.toFixed(2)}` : '—'}</Td>
                                                    <Td whiteSpace="nowrap" isNumeric color="purple.600" fontSize={"xs"}>{aluguel > 0 ? `-€${aluguel.toFixed(2)}` : '—'}</Td>
                                                    <Td whiteSpace="nowrap" isNumeric color="pink.600" fontSize={"xs"}>
                                                        {financiamento > 0 ? `-€${financiamento.toFixed(2)}` : '€0.00'}
                                                        {(finWeeklyAmount > 0 || finInterestPercent > 0) && (
                                                            <Box as="div" color="gray.500" fontSize="10px" mt={1} whiteSpace="normal">
                                                                {(fin.type === 'loan' ? (currentLocale === 'en' ? 'Installment' : 'Parcela') : (currentLocale === 'en' ? 'Discount' : 'Desconto'))}: €{finWeeklyAmount.toFixed(2)}{finInterestPercent > 0 ? ` + Juros ${finInterestPercent}%` : ''}
                                                            </Box>
                                                        )}
                                                    </Td>
                                                    <Td whiteSpace="nowrap" isNumeric color="teal.600" fontSize={"xs"}>{commissionPending > 0 ? `€${commissionPending.toFixed(2)}` : '€0.00'}</Td>
                                                    <Td whiteSpace="nowrap" isNumeric color="teal.600" fontSize={"xs"}>{bonusMeta > 0 ? `€${bonusMeta.toFixed(2)}` : '€0.00'}</Td>
                                                    <Td whiteSpace="nowrap" isNumeric color="teal.600" fontSize={"xs"}>{bonusReferral > 0 ? `€${bonusReferral.toFixed(2)}` : '€0.00'}</Td>
                                                    <Td whiteSpace="nowrap" isNumeric fontWeight="semibold" fontSize={"xs"}>€{repasse.toFixed(2)}</Td>
                                                </Tr>
                                            );
                                        })}
                                    </Tbody>
                                </Table>
                            </Box>
                        </VStack>
                    )}
                </ModalBody>
                <ModalFooter>
                    <HStack>
                        <Button variant="ghost" onClick={onClose} size={'sm'} isDisabled={isProcessing}>Cancelar</Button>
                        <Button colorScheme="green" onClick={handleConfirm} size={'sm'} isLoading={isProcessing} loadingText="Processando..." isDisabled={isProcessing}>Confirmar e gerar pagamentos</Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
