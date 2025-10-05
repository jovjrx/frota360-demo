# 🎨 Redesign da Página de Integrações - Estilo Dashboard

## ✅ Mudanças Implementadas

### 1. **Header Redesenhado (Estilo Dashboard)**

**Antes:**
```tsx
<Heading size="lg">integrations.title</Heading>
<Text color="gray.600">integrations.subtitle</Text>
```

**Depois:**
```tsx
<Heading size="xl" mb={2}>
  Integrações TVDE
</Heading>
<Text color="gray.600" fontSize="lg">
  Gerencie conexões com plataformas, visualize dados sincronizados e configure credenciais
</Text>
```

- ✅ Título maior (size="xl")
- ✅ Subtítulo descritivo e informativo
- ✅ Espaçamento consistente com dashboard

---

### 2. **KPIs em Cards (Estilo Dashboard)**

Transformei os cards simples em **Stat cards** com ícones e informações detalhadas:

#### **Card 1: Total de Integrações**
```tsx
<Stat>
  <HStack justify="space-between" mb={2}>
    <StatLabel>Total de Integrações</StatLabel>
    <Icon as={FiServer} color="blue.500" boxSize={5} />
  </HStack>
  <StatNumber fontSize="3xl" color="blue.600">
    {integrations.length}
  </StatNumber>
  <StatHelpText>
    6 plataformas disponíveis
  </StatHelpText>
</Stat>
```

#### **Card 2: Conectadas**
```tsx
<Stat>
  <HStack justify="space-between" mb={2}>
    <StatLabel>Conectadas</StatLabel>
    <Icon as={FiWifi} color="green.500" boxSize={5} />
  </HStack>
  <StatNumber fontSize="3xl" color="green.600">
    {connectedCount}
  </StatNumber>
  <StatHelpText>
    Funcionando normalmente
  </StatHelpText>
</Stat>
```

#### **Card 3: Com Erro**
```tsx
<Stat>
  <HStack justify="space-between" mb={2}>
    <StatLabel>Com Erro</StatLabel>
    <Icon as={FiAlertTriangle} color="red.500" boxSize={5} />
  </HStack>
  <StatNumber fontSize="3xl" color="red.600">
    {errorCount}
  </StatNumber>
  <StatHelpText>
    Requer atenção
  </StatHelpText>
</Stat>
```

#### **Card 4: Taxa de Sucesso**
```tsx
<Stat>
  <HStack justify="space-between" mb={2}>
    <StatLabel>Taxa de Sucesso</StatLabel>
    <Icon as={FiTrendingUp} color="purple.500" boxSize={5} />
  </HStack>
  <StatNumber fontSize="3xl" color="purple.600">
    {Math.round((connectedCount / integrations.length) * 100)}%
  </StatNumber>
  <StatHelpText>
    Performance geral
  </StatHelpText>
</Stat>
```

**Características:**
- ✅ Números grandes e destacados (fontSize="3xl")
- ✅ Ícones coloridos no canto (FiServer, FiWifi, FiAlertTriangle, FiTrendingUp)
- ✅ StatHelpText com informações extras
- ✅ Cores consistentes (blue.600, green.600, red.600, purple.600)

---

### 3. **Botão "Ver Dados" nos Cards**

Adicionei um novo botão em cada card de integração:

```tsx
<HStack justify="space-between" spacing={2}>
  <Button
    size="sm"
    leftIcon={<Icon as={FiDatabase} />}
    variant="outline"
    colorScheme="purple"
    onClick={() => handleViewData(integration)}
    isDisabled={integration.status !== 'connected'}
  >
    Ver Dados
  </Button>
  <Button
    size="sm"
    leftIcon={<Icon as={FiSettings} />}
    variant="outline"
    onClick={() => handleOpenConfig(integration)}
  >
    Configurar
  </Button>
  <Button
    size="sm"
    leftIcon={<Icon as={getStatusIcon(integration.status)} />}
    colorScheme={integration.status === 'connected' ? 'green' : 'blue'}
    onClick={() => handleTestConnection(integration)}
    isLoading={integration.status === 'syncing'}
  >
    {integration.status === 'connected' ? 'Testar' : 'Conectar'}
  </Button>
</HStack>
```

**Características:**
- 🆕 Botão "Ver Dados" (roxo, ícone FiDatabase)
- ✅ Desabilitado se integração não está conectada
- ✅ Abre modal com dados reais sincronizados

---

### 4. **Modal de Visualização de Dados**

Novo modal que mostra os dados recebidos de cada integração:

```tsx
<Modal isOpen={isDataOpen} onClose={onDataClose} size="6xl">
  <ModalOverlay />
  <ModalContent maxH="90vh">
    <ModalHeader>
      <HStack>
        <Icon as={FiDatabase} color="purple.500" />
        <Text>Dados Recebidos - {selectedDataView?.name}</Text>
      </HStack>
    </ModalHeader>
    <ModalCloseButton />
    <ModalBody overflowY="auto">
      {/* Card de Resumo */}
      <Card bg="purple.50">
        <CardBody>
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Text fontWeight="bold" fontSize="lg">Resumo dos Dados</Text>
              <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                {integrationData.count || 0} registros
              </Badge>
            </HStack>
            <HStack>
              <Icon as={FiClock} color="gray.500" />
              <Text fontSize="sm" color="gray.600">
                Última atualização: {new Date(integrationData.lastUpdate).toLocaleString('pt-PT')}
              </Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Dados em JSON */}
      <Box>
        <Text fontWeight="bold" mb={3}>Dados Completos (JSON):</Text>
        <Code display="block" whiteSpace="pre" p={4} borderRadius="md" maxH="500px" overflowY="auto" fontSize="xs">
          {JSON.stringify(integrationData, null, 2)}
        </Code>
      </Box>

      {/* Alerta informativo */}
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontSize="sm">
            Estes são os dados mais recentes sincronizados da integração <strong>{selectedDataView?.name}</strong>.
            Para atualizar, use o botão "Sincronizar" no card da integração.
          </Text>
        </Box>
      </Alert>
    </ModalBody>
  </ModalContent>
</Modal>
```

**Características:**
- 🆕 Modal 6xl (muito espaço)
- 🆕 Card de resumo roxo (bg="purple.50")
- 🆕 Badge com contagem de registros
- 🆕 Timestamp da última atualização
- 🆕 JSON formatado com scroll
- 🆕 Alerta informativo sobre sincronização

---

### 5. **API Endpoint para Buscar Dados Reais**

Criei `/api/admin/integrations/[platform]/data` que retorna dados sincronizados:

```typescript
GET /api/admin/integrations/cartrack/data

Response:
{
  "success": true,
  "data": {
    "platform": "cartrack",
    "lastUpdate": "2025-10-05T23:30:00.000Z",
    "count": 147,
    "summary": {
      "totalTrips": 147,
      "totalVehicles": 3,
      "totalDistance": 2496.3,
      "period": {
        "start": "2025-09-28T00:00:00.000Z",
        "end": "2025-10-05T00:00:00.000Z"
      }
    },
    "trips": [ /* primeiras 10 viagens */ ],
    "vehicles": [ /* lista de veículos */ ]
  }
}
```

**Suporta:**
- ✅ **Cartrack**: Viagens + veículos (últimos 7 dias)
- 🔄 **Bolt**: Placeholder (API em desenvolvimento)
- 🔄 **Uber**: Placeholder (API em desenvolvimento)
- ⏳ **ViaVerde/FONOA/myPrio**: Scraping (implementação pendente)

---

### 6. **Função handleViewData**

```typescript
const handleViewData = async (integration: Integration) => {
  setSelectedDataView(integration);
  setLoadingData(true);
  onDataOpen();

  try {
    const response = await fetch(`/api/admin/integrations/${integration.id}/data`);
    const data = await response.json();

    if (data.success) {
      setIntegrationData(data.data);
    } else {
      toast({
        title: 'Erro ao carregar dados',
        description: data.error || 'Não foi possível carregar os dados',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIntegrationData(null);
    }
  } catch (error) {
    toast({
      title: 'Erro',
      description: 'Erro ao buscar dados da integração',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
    setIntegrationData(null);
  } finally {
    setLoadingData(false);
  }
};
```

**Flow:**
1. Abre modal com spinner
2. Busca dados da API
3. Mostra dados formatados ou erro
4. Toast de feedback

---

### 7. **Novos Ícones Adicionados**

```typescript
import {
  FiWifi,
  FiWifiOff,
  FiRefreshCw,
  FiSettings,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiActivity,
  FiEye,
  FiEyeOff,
  FiDatabase,      // 🆕 Botão "Ver Dados"
  FiServer,        // 🆕 Card "Total Integrações"
  FiClock,         // 🆕 Timestamp
  FiTrendingUp,    // 🆕 Card "Taxa de Sucesso"
} from 'react-icons/fi';
```

---

### 8. **Layout Atualizado**

**Container:**
```tsx
<Container maxW="container.xl" py={8}>  // padding vertical 8
```

**Espaçamento:**
```tsx
<VStack spacing={8} align="stretch">  // espaçamento 8 entre seções
```

**Consistência com Dashboard:**
- ✅ Mesmo container (maxW="container.xl")
- ✅ Mesmo padding (py={8})
- ✅ Mesmo spacing (spacing={8})
- ✅ Mesmo estilo de cards (Stat)
- ✅ Mesmos ícones coloridos

---

## 📊 Exemplo de Dados Exibidos

### **Cartrack - Dados Reais:**

**Card de Resumo:**
```
Resumo dos Dados                     147 registros
🕒 Última atualização: 05/10/2025 às 23:30
```

**JSON Formatado:**
```json
{
  "platform": "cartrack",
  "lastUpdate": "2025-10-05T23:30:00.000Z",
  "count": 147,
  "summary": {
    "totalTrips": 147,
    "totalVehicles": 3,
    "totalDistance": 2496.3,
    "period": {
      "start": "2025-09-28T00:00:00.000Z",
      "end": "2025-10-05T00:00:00.000Z"
    }
  },
  "trips": [
    {
      "id": "trip_001",
      "vehicleId": "vehicle_123",
      "startTime": "2025-10-05T08:00:00.000Z",
      "endTime": "2025-10-05T08:45:00.000Z",
      "distance": 25.5,
      "origin": "Lisboa",
      "destination": "Cascais"
    },
    // ... mais 9 viagens
  ],
  "vehicles": [
    {
      "id": "vehicle_123",
      "registration": "AA-00-BB",
      "make": "Volkswagen",
      "model": "Passat",
      "year": 2020
    }
    // ... mais veículos
  ]
}
```

---

## 🎯 Fluxo de Uso

1. **Acessar Página de Integrações:**
   ```
   /admin/integrations → Página carrega com novo layout
   ```

2. **Ver Métricas no Topo:**
   ```
   Total: 6 | Conectadas: 3 | Erro: 3 | Taxa: 50%
   ```

3. **Clicar "Ver Dados" (integração conectada):**
   ```
   Card Cartrack → Botão "Ver Dados" → Modal abre
   ```

4. **Modal Mostra:**
   ```
   - Card roxo com resumo (147 registros)
   - Timestamp da última atualização
   - JSON formatado com scroll
   - Alerta informativo
   ```

5. **Fechar e Sincronizar:**
   ```
   Fechar modal → Clicar "Sincronizar" → Dados atualizam
   ```

---

## ✅ Checklist

- [x] Header redesenhado (size="xl", subtítulo descritivo)
- [x] 4 Cards de métricas (Stat com ícones)
- [x] Botão "Ver Dados" nos cards (roxo, FiDatabase)
- [x] Modal de visualização de dados (6xl, scroll)
- [x] Card de resumo roxo (bg="purple.50")
- [x] JSON formatado com Code block
- [x] API endpoint `/api/admin/integrations/[platform]/data`
- [x] Integração Cartrack retorna dados reais
- [x] Loading spinner enquanto busca
- [x] Toast de erro se falhar
- [x] Alerta informativo no modal
- [x] Consistência com estilo dashboard
- [ ] Testar no navegador
- [ ] Implementar dados para Bolt/Uber
- [ ] Implementar scrapers (ViaVerde, FONOA, myPrio)

---

## 🚀 Próximos Passos

1. **Testar no navegador:**
   - Ver novo layout
   - Clicar "Ver Dados" no Cartrack
   - Verificar JSON formatado

2. **Implementar dados para Bolt:**
   - Criar método `getTrips()` no BoltClient
   - Retornar viagens reais da API Bolt

3. **Implementar dados para Uber:**
   - Criar método `getTrips()` no UberClient
   - Retornar viagens reais da API Uber

4. **Implementar scrapers:**
   - ViaVerde: Scraping de portagens
   - FONOA: Scraping de faturas
   - myPrio: Scraping de combustível

---

**Agora a página de integrações tem o mesmo estilo do dashboard! 🎨**

- ✅ Header grande e informativo
- ✅ 4 Cards de métricas com ícones
- ✅ Botão "Ver Dados" para mostrar informações sincronizadas
- ✅ Modal roxo com JSON formatado
- ✅ Layout consistente e profissional

**Quer testar no navegador agora?** 🚀
