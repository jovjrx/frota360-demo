export { default, getServerSideProps } from './data-page';

/*

  const reloadWeeks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/weekly/data-sources');
      if (!response.ok) {
        throw new Error('Failed to fetch weekly data sources');
      }
      const data = await response.json();
      setWeeks(data.weeks ?? []);
    } catch (error: any) {
      toast({
        title: tc('errors.title', 'Erro'),
        description: error?.message || t('weeklyDataSources.errors.fetch', 'Falha ao carregar semanas.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [t, tc, toast]);

  useEffect(() => {
    if (!initialWeeks || initialWeeks.length === 0) {
      reloadWeeks();
    }
  }, [initialWeeks, reloadWeeks]);

  const filteredWeeks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return weeks.filter((week) => {
      const status = getWeekStatus(week);
      const matchesStatus = !statusFilter || statusFilter === status;
      const matchesSearch =
        !normalizedSearch ||
        [week.weekId, week.weekStart, week.weekEnd]
          .map((value) => value?.toLowerCase() ?? '')
          .some((value) => value.includes(normalizedSearch));
      return matchesSearch && matchesStatus;
    });
  }, [weeks, searchTerm, statusFilter]);

  const handleAddWeek = () => {
    router.push('/admin/weekly/import');
  };

  const handleSync = async (weekId: string) => {
    setSyncingWeekId(weekId);
    try {
      const rawDataResponse = await fetch(`/api/admin/imports/get-raw-data-ids?weekId=${weekId}`);
      if (!rawDataResponse.ok) {
        throw new Error('Failed to fetch raw data references');
      }
      const { rawDataDocIds } = await rawDataResponse.json();

      if (!rawDataDocIds || rawDataDocIds.length === 0) {
        toast({
          title: tc('messages.info', 'Informação'),
          description: t('weeklyDataSources.messages.noRawData', 'Nenhum dado bruto disponível para processar.'),
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        setSyncingWeekId(null);
        return;
      }

      const processResponse = await fetch('/api/admin/imports/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, rawDataDocIds }),
      });
      const data = await processResponse.json();

      if (!processResponse.ok) {
        throw new Error(data?.message || 'Failed to process raw data');
      }

      toast({
        title: tc('messages.success', 'Sucesso'),
        description: data?.message || t('weeklyDataSources.messages.processSuccess', 'Dados processados com sucesso.'),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      await reloadWeeks();
    } catch (error: any) {
      toast({
        title: tc('errors.title', 'Erro'),
        description: error?.message || t('weeklyDataSources.errors.process', 'Falha ao processar dados brutos.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncingWeekId(null);
    }
  };

  return (
    <AdminLayout
      title={t('weeklyDataSources.title', 'Fontes de dados')}
      subtitle={t('weeklyDataSources.subtitle', 'Gerencie importações, status e processamento semanal')}
      breadcrumbs={[{ label: t('weeklyDataSources.breadcrumb', 'Fontes de dados') }]}
      side={
        <HStack spacing={3}>
          <Button
            variant="outline"
            leftIcon={<FiRefreshCw />}
            onClick={reloadWeeks}
            isLoading={loading}
            size="sm"
          >
            {tc('actions.refresh', 'Atualizar')}
          </Button>
          <Button leftIcon={<MdAdd />} colorScheme="green" onClick={handleAddWeek} size="sm">
            {t("weeklyDataSources.actions.addWeek", "Adicionar semana")}
          </Button>
        </HStack>
      }
    >
      <Stack spacing={6}>
        <Stack direction={{ base: 'column', xl: 'row' }} spacing={6} align="start">
          <Box flex="1" minW={0}>
            <Stack spacing={6}>
              <Card>
                <CardBody>
                  <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align={{ base: 'stretch', md: 'center' }}>
                    <InputGroup maxW={{ base: '100%', md: '320px' }}>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaSearch} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={t('weeklyDataSources.filters.search', 'Pesquisar semanas')}
                      />
                    </InputGroup>

                    <Select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as WeekStatus | '')}
                      maxW={{ base: '100%', md: '220px' }}
                    >
                      <option value="">{t('weeklyDataSources.filters.status.all', 'Todos os status')}</option>
                      <option value="complete">{t('weeklyDataSources.filters.status.complete', 'Completo')}</option>
                      <option value="partial">{t('weeklyDataSources.filters.status.partial', 'Parcial')}</option>
                      <option value="pending">{t('weeklyDataSources.filters.status.pending', 'Pendente')}</option>
                    </Select>
                  </Stack>
                </CardBody>
              </Card>

              {loading ? (
                <Flex justify="center" py={20}>
                  <Spinner size="xl" />
                </Flex>
              ) : filteredWeeks.length === 0 ? (
                <Box textAlign="center" py={16}>
                  <Text color="gray.600">
                    {t('weeklyDataSources.messages.empty', 'Nenhuma semana encontrada para os filtros selecionados.')}
                  </Text>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} spacing={6}>
                  {filteredWeeks.map((week) => {
                    const status = getWeekStatus(week);

                    return (
                      <Card key={week.weekId} p={0} borderWidth="1px" borderColor="gray.200">
                        <CardHeader pb={4}>
                          <VStack align="start" spacing={1}>
                            <HStack w="full">
                              <Heading size="md">{week.weekId}</Heading>
                              <Spacer />
                              <Badge colorScheme={STATUS_BADGE_COLOR[status]}>{statusLabels[status]}</Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              {formatDate(week.weekStart, router.locale || 'pt')} —{' '}
                              {formatDate(week.weekEnd, router.locale || 'pt')}
                            </Text>
                          </VStack>
                        </CardHeader>

                        <Divider />

                        <CardBody>
                          <VStack align="stretch" spacing={3}>
                            {WEEKLY_PLATFORMS.map((platform) => {
                              const source = week.sources?.[platform];
                              const raw = week.rawFiles[platform];
                              const platformStatus = (source?.status as WeekStatus | undefined) ?? 'pending';

                              return (
                                <Box key={platform} borderWidth="1px" borderColor="gray.100" borderRadius="md" p={3}>
                                  <HStack align="start" justify="space-between" spacing={3}>
                                    <VStack align="start" spacing={1}>
                                      <Text fontWeight="semibold">{platformLabels[platform]}</Text>
                                      <Text fontSize="xs" color="gray.500">
                                        {t('weeklyDataSources.labels.rawFiles', 'Arquivos brutos')}: {raw.total}
                                      </Text>
                                    </VStack>
                                    <VStack align="end" spacing={1}>
                                      <Tooltip label={statusLabels[platformStatus]}>
                                        <Badge colorScheme={STATUS_BADGE_COLOR[platformStatus]}>
                                          {statusLabels[platformStatus]}
                                        </Badge>
                                      </Tooltip>
                                      {raw.total > 0 ? (
                                        <Tag variant="subtle" colorScheme={raw.pending > 0 ? 'orange' : 'green'} size="sm">
                                          <TagLabel>
                                            {raw.pending > 0
                                              ? `${raw.pending} ${t('weeklyDataSources.labels.pendingRaw', 'pendente(s)')}`
                                              : t('weeklyDataSources.labels.allProcessed', 'Todos processados')}
                                          </TagLabel>
                                        </Tag>
                                      ) : (
                                        <Tag variant="subtle" size="sm">
                                          <TagLabel>{t('weeklyDataSources.labels.noRaw', 'Nenhum envio')}</TagLabel>
                                        </Tag>
                                      )}
                                    </VStack>
                                  </HStack>
                                </Box>
                              );
                            })}
                          </VStack>
                        </CardBody>

                        <Divider />

                        <CardFooter pt={4} justifyContent="space-between" flexWrap="wrap" gap={4}>
                          <VStack align="start" spacing={1}>
                            {week.lastImportAt && (
                              <Text fontSize="xs" color="gray.500">
                                {t('weeklyDataSources.labels.updatedAt', 'Última importação')}: {formatDateTime(week.lastImportAt, router.locale || 'pt')}
                              </Text>
                            )}
                            <Text fontSize="xs" color="gray.500">
                              {t('weeklyDataSources.labels.pendingRaw', 'Pendentes')}: {week.pendingRawFiles} ·{' '}
                              {t('weeklyDataSources.labels.processedRaw', 'Processados')}: {week.totalRawFiles - week.pendingRawFiles}
                            </Text>
                          </VStack>

                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/weekly?week=${week.weekId}`)}
                            >
                              {t('weeklyDataSources.actions.viewWeek', 'Ver semana')}
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleSync(week.weekId)}
                              isLoading={syncingWeekId === week.weekId}
                              isDisabled={week.pendingRawFiles === 0 || (syncingWeekId !== null && syncingWeekId !== week.weekId)}
                            >
                              {t('weeklyDataSources.actions.sync', 'Sincronizar')}
                            </Button>
                          </HStack>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              )}
            </Stack>
          </Box>

          <Box flex={{ base: '1', xl: '0 0 420px' }} w={{ base: 'full', xl: '420px' }}>
            <Card variant="outline" borderColor="gray.200">
              <CardHeader pb={4}>
                <VStack align="start" spacing={1}>
                  <Heading size="md">
                    {t('weeklyDataSources.integrations.title', 'Automação via APIs')}
                  </Heading>
                  <Text fontSize="sm" color="gray.600">
                    {t('weeklyDataSources.integrations.subtitle', 'Atualize credenciais, ative integrações e teste a conexão sem sair desta página.')}
                  </Text>
                </VStack>
              </CardHeader>
              <CardBody pt={0}>
                <Stack spacing={6} divider={<StackDivider borderColor="gray.100" />}>
                  {orderedIntegrations.map((integration) => {
                    const fields = integrationFieldConfigs[integration.platform] ?? [];
                    const formValues = integrationForms[integration.platform] ?? {};
                    const isSaving = Boolean(savingIntegration[integration.platform]);
                    const isTesting = Boolean(testingIntegration[integration.platform]);
                    const statusColor = INTEGRATION_STATUS_COLORS[integration.status] ?? 'gray';

                    return (
                      <Box key={integration.platform}>
                        <Stack spacing={4}>
                          <Flex align="flex-start" justify="space-between" gap={3}>
                            <Box>
                              <Heading size="sm">{integrationNameLabels[integration.platform]}</Heading>
                              <HStack spacing={2} mt={2}>
                                <Badge colorScheme={statusColor}>{integrationStatusLabels[integration.status]}</Badge>
                                <Text fontSize="xs" color="gray.500">
                                  {integration.updatedAt
                                    ? t('weeklyDataSources.integrations.labels.updatedAt', 'Atualizado em {{date}}', {
                                        date: formatDateTime(integration.updatedAt, router.locale || 'pt'),
                                      })
                                    : t('weeklyDataSources.integrations.labels.neverUpdated', 'Nunca atualizado')}
                                </Text>
                              </HStack>
                            </Box>
                            <VStack spacing={1} align="end">
                              <Text fontSize="xs" color="gray.500">
                                {integration.enabled
                                  ? t('weeklyDataSources.integrations.labels.enabled', 'Ativa')
                                  : t('weeklyDataSources.integrations.labels.disabled', 'Inativa')}
                              </Text>
                              <Switch
                                colorScheme="green"
                                isChecked={integration.enabled}
                                onChange={(event) =>
                                  handleToggleIntegration(integration.platform, event.target.checked)
                                }
                                isDisabled={isSaving || isTesting}
                              />
                            </VStack>
                          </Flex>

                          <Stack spacing={3}>
                            {fields.map((field) => (
                              <FormControl key={field.key} isRequired={REQUIRED_CREDENTIALS[integration.platform]?.includes(field.key)}>
                                <FormLabel fontSize="sm">{field.label}</FormLabel>
                                <Input
                                  type={field.type === 'password' ? 'password' : 'text'}
                                  value={formValues[field.key] ?? ''}
                                  onChange={(event) =>
                                    handleIntegrationFieldChange(integration.platform, field.key, event.target.value)
                                  }
                                  placeholder={field.placeholder}
                                  isDisabled={isSaving || isTesting}
                                />
                                {field.helper && (
                                  <FormHelperText fontSize="xs" color="gray.500">
                                    {field.helper}
                                  </FormHelperText>
                                )}
                              </FormControl>
                            ))}
                          </Stack>

                          <Flex direction={{ base: 'column', sm: 'row' }} gap={3} justify="space-between" align={{ base: 'stretch', sm: 'center' }}>
                            <HStack spacing={3}>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={() => handleSaveIntegration(integration.platform)}
                                isLoading={isSaving}
                                isDisabled={isTesting}
                              >
                                {t('weeklyDataSources.integrations.actions.save', 'Guardar credenciais')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTestIntegration(integration.platform)}
                                isLoading={isTesting}
                                isDisabled={isSaving}
                              >
                                {isTesting
                                  ? t('weeklyDataSources.integrations.actions.testing', 'Testando...')
                                  : t('weeklyDataSources.integrations.actions.test', 'Testar conexão')}
                              </Button>
                            </HStack>
                            <VStack align="end" spacing={1}>
                              <Text fontSize="xs" color="gray.500">
                                {t('weeklyDataSources.integrations.labels.lastSuccess', 'Último sucesso')}: {' '}
                                {integration.lastSuccess
                                  ? formatDateTime(integration.lastSuccess, router.locale || 'pt')
                                  : t('weeklyDataSources.integrations.labels.never', 'Nunca')}
                              </Text>
                              {integration.errorMessage && (
                                <Text fontSize="xs" color="red.500">
                                  {t('weeklyDataSources.integrations.labels.lastError', 'Erro recente')}: {integration.errorMessage}
                                </Text>
                              )}
                            </VStack>
                          </Flex>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </CardBody>
            </Card>
          </Box>
        </Stack>
      </Stack>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminSSR(async () => {
  const { fetchWeeklyDataOverview } = await import('@/lib/admin/weeklyDataOverview');
  const integrationService = (await import('@/lib/integrations/integration-service')).default;

  const initialWeeks = await fetchWeeklyDataOverview();
  const allIntegrations = await integrationService.getAllIntegrations();
  const initialIntegrations: IntegrationSummary[] = allIntegrations
    .filter((integration) => INTEGRATION_PLATFORMS.includes(integration.platform))
    .map((integration) => ({
      platform: integration.platform,
      name: integration.name,
      enabled: integration.enabled,
      status: integration.status,
      credentials: integration.credentials ?? {},
      lastSync: integration.stats.lastSync?.toDate().toISOString() ?? null,
      lastSuccess: integration.stats.lastSuccess?.toDate().toISOString() ?? null,
      lastError: integration.stats.lastError?.toDate().toISOString() ?? null,
      errorMessage: integration.stats.errorMessage ?? null,
      updatedAt: integration.metadata.updatedAt?.toDate().toISOString() ?? null,
    }));
  return {
    initialWeeks,
    initialIntegrations,
  };
});


*/


