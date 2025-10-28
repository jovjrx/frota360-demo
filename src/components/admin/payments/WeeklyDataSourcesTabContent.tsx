import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
    VStack,
    HStack,
    Card,
    CardHeader,
    CardBody,
    Heading,
    Text,
    SimpleGrid,
    Badge,
    Button,
    Icon,
    Spinner,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import { FiRefreshCw, FiUpload, FiActivity, FiInfo, FiEye } from 'react-icons/fi';
import type { IntegrationPlatform } from '@/schemas/integration';
import UploadPlatformModal from './UploadPlatformModal';
import PreviewPaymentsModal from './PreviewPaymentsModal';

interface WeeklyDataSourcesTabContentProps {
    weekId: string;
}

type WeeklyPlatform = 'uber' | 'bolt' | 'myprio' | 'viaverde';
const WEEKLY_PLATFORMS: WeeklyPlatform[] = ['uber', 'bolt', 'myprio', 'viaverde'];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function WeeklyDataSourcesTabContent({ weekId }: WeeklyDataSourcesTabContentProps) {
    const toast = useToast();
    const [uploadPlatform, setUploadPlatform] = useState<WeeklyPlatform | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const { data: dataSourcesResp, isLoading: loadingSources, mutate: mutateSources } = useSWR(
        '/api/admin/weekly/sources',
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 0 }
    );

    const { data: integrationsResp } = useSWR('/api/admin/integrations/summary', fetcher, { revalidateOnFocus: false });
    const { data: recordsResp, mutate: mutateRecords } = useSWR(
        weekId ? `/api/admin/weekly/records?weekId=${encodeURIComponent(weekId)}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const selectedWeek = useMemo(() => {
        const weeks = dataSourcesResp?.weeks || [];
        return weeks.find((w: any) => w.weekId === weekId) || null;
    }, [dataSourcesResp, weekId]);

    const weekStart: string = selectedWeek?.weekStart || '';
    const weekEnd: string = selectedWeek?.weekEnd || '';

    const handleProcessAll = async (): Promise<boolean> => {
        try {
            setIsProcessing(true);
            // Coletar todos os rawFileArchive ids das plataformas desta semana
            const rawEntries: string[] = WEEKLY_PLATFORMS.flatMap((p) => (
                selectedWeek?.rawFiles?.[p]?.entries?.map((e: any) => e.id) || []
            ));
            if (!rawEntries.length) {
                toast({ title: 'Nenhum arquivo para processar', status: 'info' });
                return false;
            }
            const res = await fetch('/api/admin/imports/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekId, rawDataDocIds: rawEntries }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || 'Falha ao processar');
            }
            mutateSources();
            mutateRecords();
            return true;
        } catch (e: any) {
            toast({ title: 'Erro ao processar', description: e?.message, status: 'error' });
            return false;
        } finally {
            setIsProcessing(false);
        }
    };

    // Preview modal
    const previewDisclosure = useDisclosure();

    if (loadingSources && !selectedWeek) {
        return (
            <HStack justify="center" py={4}>
                <Spinner />
                <Text>Carregando fontes da semana…</Text>
            </HStack>
        );
    }

    if (!selectedWeek) {
        return (
            <Card>
                <CardBody>
                    <Text>Nenhuma fonte encontrada para {weekId}. Crie a semana e importe dados.</Text>
                </CardBody>
            </Card>
        );
    }

    return (
        <VStack spacing={4} align="stretch">
            <Card>
                <CardBody>
                <HStack justify="space-between">
                    <Heading size="sm">{weekId}</Heading>
                    <HStack>
                        <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={<Icon as={FiEye} />}
                            isLoading={isProcessing}
                            onClick={async () => {
                                const ok = await handleProcessAll();
                                if (ok) previewDisclosure.onOpen();
                            }}
                        >
                            Processar e pré-visualizar
                        </Button>
                    </HStack>
                </HStack>
                </CardBody>
            </Card>


            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {WEEKLY_PLATFORMS.map((p) => {
                    const source = selectedWeek?.sources?.[p] || { status: 'pending' };
                    const raw = selectedWeek?.rawFiles?.[p] || { total: 0, processed: 0 };
                    const integration = integrationsResp?.integrations?.find((i: any) => i.platform === p);
                    const color = source.status === 'complete' ? 'green' : source.status === 'partial' ? 'orange' : source.status === 'error' ? 'red' : 'gray';

                    return (
                        <Card key={p} variant="outline">
                            <CardHeader pb={0}>
                                <HStack justify="space-between">
                                    <Heading size="sm" textTransform="capitalize">{p}</Heading>
                                    <Badge colorScheme={color}>{source.status || 'pending'}</Badge>
                                </HStack>
                            </CardHeader>
                            <CardBody pt={0}>
                                <VStack align="stretch" spacing={3}>
                                    <Text fontSize="sm">Arquivos: {raw.total} • Processados: {raw.processed}</Text>
                                    <HStack>
                                        <Badge colorScheme={integration?.enabled ? 'green' : 'gray'}>
                                            {integration?.enabled ? 'Integração ativa' : 'Integração inativa'}
                                        </Badge>
                                    </HStack>
                                    <HStack>
                                        <Button size="sm" leftIcon={<Icon as={FiUpload} />} onClick={() => { setUploadPlatform(p); onOpen(); }}>
                                            Importar arquivo
                                        </Button>
                                        <Button size="sm" leftIcon={<Icon as={FiRefreshCw} />} isDisabled>
                                            Buscar da API (indisponível)
                                        </Button>
                                        <Button size="sm" variant="ghost" leftIcon={<Icon as={FiInfo} />} onClick={() => toast({ title: 'Logs', description: 'Em breve', status: 'info' })}>
                                            Logs
                                        </Button>
                                    </HStack>
                                </VStack>
                            </CardBody>
                        </Card>
                    );
                })}
            </SimpleGrid>

            {/* Composição / Pré-processamento */}
            {(recordsResp?.weeklyData && recordsResp.weeklyData.length > 0) && (
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    {WEEKLY_PLATFORMS.map((p) => {
                        const entries = recordsResp.weeklyData.filter((d: any) => d.platform === p);
                        // Para MyPrio e ViaVerde, exibir total agregado por motorista para evitar duplicidades
                        let total = 0;
                        let driversCount = 0;
                        let unmapped = 0;
                        if (p === 'myprio' || p === 'viaverde') {
                            const byDriver = new Map<string, number>();
                            entries.forEach((e: any) => {
                                if (e.driverId) {
                                    const prev = byDriver.get(e.driverId) || 0;
                                    byDriver.set(e.driverId, prev + (e.totalValue || 0));
                                } else {
                                    // não mapeados
                                    unmapped += 1;
                                }
                            });
                            driversCount = byDriver.size;
                            total = Array.from(byDriver.values()).reduce((a, b) => a + b, 0);
                        } else {
                            total = entries.reduce((s: number, e: any) => s + (e.totalValue || 0), 0);
                            // para Uber/Bolt os registros já são por motorista
                            driversCount = new Set(entries.map((e: any) => e.driverId).filter(Boolean)).size;
                            unmapped = entries.filter((e: any) => !e.driverId).length;
                        }
                        return (
                            <Card key={`summary-${p}`} variant="outline">
                                <CardBody>
                                    <VStack spacing={1} align="start">
                                        <HStack justify="space-between" w="full">
                                            <Text textTransform="capitalize" fontWeight="semibold">{p}</Text>
                                            <Badge>{entries.length} reg.</Badge>
                                        </HStack>
                                        <Text fontSize="sm">Total: €{total.toFixed(2)}</Text>
                                        {(p === 'myprio' || p === 'viaverde') && (
                                            <Text fontSize="xs" color="gray.600">Agrupado por motorista • {driversCount} motoristas{unmapped > 0 ? ` • ${unmapped} não mapeado(s)` : ''}</Text>
                                        )}
                                    </VStack>
                                </CardBody>
                            </Card>
                        );
                    })}
                </SimpleGrid>
            )}

            {uploadPlatform && (
                <UploadPlatformModal
                    isOpen={isOpen}
                    onClose={() => { onClose(); setUploadPlatform(null); }}
                    platform={uploadPlatform}
                    weekId={weekId}
                    weekStart={weekStart}
                    weekEnd={weekEnd}
                    onUploaded={() => mutateSources()}
                />
            )}

            <PreviewPaymentsModal isOpen={previewDisclosure.isOpen} onClose={previewDisclosure.onClose} weekId={weekId} />
        </VStack>
    );
}
