# Prompt Completo: Telas de Controle de Frota e Motoristas

## Contexto

O projeto Conduz PT possui duas planilhas Excel que são usadas manualmente para controlar:
1. **Frota TVDE** - Controle de veículos, períodos, ganhos, despesas e repasses
2. **Motoristas Semanal** - Controle semanal de motoristas, ganhos, despesas, comissões e pagamentos

**Objetivo:** Criar duas telas no sistema que substituam essas planilhas, integrando com dados reais das APIs (Uber, Bolt, Cartrack, ViaVerde, myprio, FONOA).

---

## Análise das Planilhas Atuais

### 1. Planilha: Controle de Frota TVDE

**Aba: BASE DADOS**

**Colunas:**
- Nome (Motorista)
- Carro/Matrícula
- Período (ex: "01/09 - 08/09")
- Aluguel (€)
- Ganhos Uber (€)
- Ganhos Bolt (€)
- Ganhos Total (€)
- % (Comissão - fixo 7%)
- Desconto (Comissão calculada)
- Combustível (€)
- Portagens Uber (€)
- Portagens Ajustada (€)
- Gorjeta Uber (€)
- Gorjeta Bolt (€)
- Gorjeta Total (€)
- Repasse (€) - Valor líquido a pagar
- IBAN
- STATUS PGTO (PAGO / N PAGO)

**Exemplo de Registro:**
```
Nome: Yuri Rocha
Carro: AX-42-DO
Período: 01/09 - 08/09
Aluguel: 0.00
Ganhos Uber: 389.04
Ganhos Bolt: 328.71
Ganhos Total: 717.75
%: 7%
Desconto (Comissão): 50.24
Combustível: 170.90
Portagens Uber: 17.70
Gorjeta Uber: 13.55
Repasse: 527.86
IBAN: PT50000700000066615972323
STATUS PGTO: PAGO
```

**Cálculos:**
```
Ganhos Total = Ganhos Uber + Ganhos Bolt
Base de Comissão = Ganhos Total - Portagens
Desconto (Comissão) = Base de Comissão × 7%
Repasse = Ganhos Total + Gorjetas - Comissão - Combustível - Aluguel
```

**Aba: RESUMO**

Mostra totais por motorista:
- Ganho Bruto
- Portagens Total
- Aluguel Carro
- Combustível Prio
- Lucro Líquido Repasse
- Soma de Ganhos Uber
- Soma de Ganhos Bolt
- Soma de Desconto (Comissão)
- Soma de Portagens Uber

---

### 2. Planilha: Controle de Motoristas Semanal

**Aba: Controlo Semanal**

**Colunas:**
- Semana (ex: "01/09 - 07/09")
- Nome do Motorista
- IBAN
- Uber - Viagens (€)
- Uber - Gorjetas (€)
- Uber - Portagens Reembolsadas (€)
- Bolt - Viagens (€)
- Bolt - Gorjetas (€)
- Total Bruto (€)
- Combustível (€)
- Outros Custos (€)
- Base de Comissão (€)
- Comissão Gestão (7%) (€)
- Valor Líquido a Transferir (€)

**Exemplo de Registro:**
```
Semana: 01/09 - 07/09
Nome: Yuri Rocha
IBAN: PT50000700000066615972323
Uber - Viagens: 389.04
Uber - Gorjetas: 13.55
Uber - Portagens: 17.70
Bolt - Viagens: 328.71
Total Bruto: 749.00
Combustível: 170.90
Base de Comissão: 717.75
Comissão 7%: 50.24
Valor Líquido: 527.86
```

**Cálculos:**
```
Total Bruto = Uber Viagens + Uber Gorjetas + Uber Portagens + Bolt Viagens + Bolt Gorjetas
Base de Comissão = Uber Viagens + Bolt Viagens (sem gorjetas e portagens)
Comissão 7% = Base de Comissão × 0.07
Valor Líquido = Total Bruto - Comissão - Combustível - Outros Custos
```

---

## Estrutura de Dados

### Schema: FleetRecord (Registro de Frota)

```typescript
// schemas/fleet-record.ts

import { z } from 'zod';

export const FleetRecordSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  vehicleId: z.string(),
  vehiclePlate: z.string(),
  periodStart: z.string(), // YYYY-MM-DD
  periodEnd: z.string(),   // YYYY-MM-DD
  
  // Ganhos
  earningsUber: z.number().default(0),
  earningsBolt: z.number().default(0),
  earningsTotal: z.number().default(0),
  
  // Gorjetas
  tipsUber: z.number().default(0),
  tipsBolt: z.number().default(0),
  tipsTotal: z.number().default(0),
  
  // Portagens
  tollsUber: z.number().default(0),
  tollsAdjusted: z.number().default(0),
  
  // Despesas
  rental: z.number().default(0),
  fuel: z.number().default(0),
  otherExpenses: z.number().default(0),
  
  // Comissão
  commissionRate: z.number().default(0.07), // 7%
  commissionBase: z.number().default(0),    // Ganhos - Portagens
  commissionAmount: z.number().default(0),  // Base × Rate
  
  // Repasse
  netPayout: z.number().default(0),
  
  // Pagamento
  iban: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  paymentDate: z.string().optional(),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  notes: z.string().optional(),
});

export type FleetRecord = z.infer<typeof FleetRecordSchema>;

// Função para calcular valores
export function calculateFleetRecord(data: Partial<FleetRecord>): FleetRecord {
  const earningsTotal = (data.earningsUber || 0) + (data.earningsBolt || 0);
  const tipsTotal = (data.tipsUber || 0) + (data.tipsBolt || 0);
  const commissionBase = earningsTotal - (data.tollsAdjusted || 0);
  const commissionAmount = commissionBase * (data.commissionRate || 0.07);
  const netPayout = 
    earningsTotal + 
    tipsTotal - 
    commissionAmount - 
    (data.fuel || 0) - 
    (data.rental || 0) - 
    (data.otherExpenses || 0);
  
  return {
    ...data,
    earningsTotal,
    tipsTotal,
    commissionBase,
    commissionAmount,
    netPayout,
  } as FleetRecord;
}
```

### Schema: DriverWeeklyRecord (Registro Semanal de Motorista)

```typescript
// schemas/driver-weekly-record.ts

import { z } from 'zod';

export const DriverWeeklyRecordSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  weekStart: z.string(), // YYYY-MM-DD
  weekEnd: z.string(),   // YYYY-MM-DD
  
  // Uber
  uberTrips: z.number().default(0),
  uberTips: z.number().default(0),
  uberTolls: z.number().default(0),
  
  // Bolt
  boltTrips: z.number().default(0),
  boltTips: z.number().default(0),
  
  // Totais
  grossTotal: z.number().default(0),
  
  // Despesas
  fuel: z.number().default(0),
  otherCosts: z.number().default(0),
  
  // Comissão
  commissionBase: z.number().default(0),
  commissionRate: z.number().default(0.07),
  commissionAmount: z.number().default(0),
  
  // Líquido
  netPayout: z.number().default(0),
  
  // Pagamento
  iban: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  paymentDate: z.string().optional(),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
  notes: z.string().optional(),
});

export type DriverWeeklyRecord = z.infer<typeof DriverWeeklyRecordSchema>;

export function calculateDriverWeeklyRecord(data: Partial<DriverWeeklyRecord>): DriverWeeklyRecord {
  const grossTotal = 
    (data.uberTrips || 0) + 
    (data.uberTips || 0) + 
    (data.uberTolls || 0) + 
    (data.boltTrips || 0) + 
    (data.boltTips || 0);
  
  const commissionBase = (data.uberTrips || 0) + (data.boltTrips || 0);
  const commissionAmount = commissionBase * (data.commissionRate || 0.07);
  
  const netPayout = 
    grossTotal - 
    commissionAmount - 
    (data.fuel || 0) - 
    (data.otherCosts || 0);
  
  return {
    ...data,
    grossTotal,
    commissionBase,
    commissionAmount,
    netPayout,
  } as DriverWeeklyRecord;
}
```

---

## Tela 1: Controle de Frota

### Rota: `/admin/fleet`

### Funcionalidades

1. **Listagem de Registros**
   - Tabela com todos os registros de frota
   - Filtros: Motorista, Veículo, Período, Status de Pagamento
   - Ordenação por colunas
   - Paginação

2. **Resumo/KPIs**
   - Total de Ganhos (Uber + Bolt)
   - Total de Despesas (Combustível + Aluguel)
   - Total de Comissões
   - Total de Repasses
   - Pendentes de Pagamento

3. **Ações**
   - Adicionar novo registro manualmente
   - Editar registro existente
   - Marcar como pago
   - Exportar para Excel
   - Importar dados das APIs (botão "Sincronizar")

4. **Sincronização com APIs**
   - Botão "Sincronizar Dados"
   - Busca dados de Uber, Bolt, Cartrack, ViaVerde, myprio
   - Cria/atualiza registros automaticamente
   - Mostra log de sincronização

### Layout

```tsx
// pages/admin/fleet.tsx

<LoggedInLayout>
  <Container maxW="container.xl">
    {/* Header */}
    <HStack justify="space-between">
      <Heading>Controle de Frota TVDE</Heading>
      <HStack>
        <Button onClick={syncData}>Sincronizar Dados</Button>
        <Button onClick={exportExcel}>Exportar Excel</Button>
        <Button onClick={openAddModal}>Adicionar Registro</Button>
      </HStack>
    </HStack>

    {/* KPIs */}
    <SimpleGrid columns={5} spacing={4}>
      <Card>
        <StatLabel>Ganhos Totais</StatLabel>
        <StatNumber>€ {totalEarnings}</StatNumber>
      </Card>
      <Card>
        <StatLabel>Despesas Totais</StatLabel>
        <StatNumber>€ {totalExpenses}</StatNumber>
      </Card>
      <Card>
        <StatLabel>Comissões</StatLabel>
        <StatNumber>€ {totalCommissions}</StatNumber>
      </Card>
      <Card>
        <StatLabel>Repasses</StatLabel>
        <StatNumber>€ {totalPayouts}</StatNumber>
      </Card>
      <Card>
        <StatLabel>Pendentes</StatLabel>
        <StatNumber>€ {pendingPayments}</StatNumber>
        <Badge>Pendente</Badge>
      </Card>
    </SimpleGrid>

    {/* Filtros */}
    <HStack>
      <Select placeholder="Todos os Motoristas">
        {drivers.map(d => <option value={d.id}>{d.name}</option>)}
      </Select>
      <Select placeholder="Todos os Veículos">
        {vehicles.map(v => <option value={v.id}>{v.plate}</option>)}
      </Select>
      <Input type="date" placeholder="Data Início" />
      <Input type="date" placeholder="Data Fim" />
      <Select placeholder="Status">
        <option value="pending">Pendente</option>
        <option value="paid">Pago</option>
      </Select>
      <Button onClick={applyFilters}>Filtrar</Button>
      <Button onClick={clearFilters}>Limpar</Button>
    </HStack>

    {/* Tabela */}
    <Card>
      <Table>
        <Thead>
          <Tr>
            <Th>Motorista</Th>
            <Th>Veículo</Th>
            <Th>Período</Th>
            <Th isNumeric>Uber</Th>
            <Th isNumeric>Bolt</Th>
            <Th isNumeric>Total</Th>
            <Th isNumeric>Combustível</Th>
            <Th isNumeric>Comissão</Th>
            <Th isNumeric>Repasse</Th>
            <Th>Status</Th>
            <Th>Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {records.map(record => (
            <Tr key={record.id}>
              <Td>{record.driverName}</Td>
              <Td>{record.vehiclePlate}</Td>
              <Td>{formatPeriod(record.periodStart, record.periodEnd)}</Td>
              <Td isNumeric>€ {record.earningsUber.toFixed(2)}</Td>
              <Td isNumeric>€ {record.earningsBolt.toFixed(2)}</Td>
              <Td isNumeric>€ {record.earningsTotal.toFixed(2)}</Td>
              <Td isNumeric>€ {record.fuel.toFixed(2)}</Td>
              <Td isNumeric>€ {record.commissionAmount.toFixed(2)}</Td>
              <Td isNumeric fontWeight="bold">€ {record.netPayout.toFixed(2)}</Td>
              <Td>
                <Badge colorScheme={record.paymentStatus === 'paid' ? 'green' : 'yellow'}>
                  {record.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                </Badge>
              </Td>
              <Td>
                <HStack>
                  <IconButton icon={<FiEdit />} onClick={() => editRecord(record)} />
                  {record.paymentStatus === 'pending' && (
                    <Button size="sm" onClick={() => markAsPaid(record)}>
                      Marcar como Pago
                    </Button>
                  )}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>

    {/* Paginação */}
    <HStack justify="center">
      <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
        Anterior
      </Button>
      <Text>Página {page} de {totalPages}</Text>
      <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
        Próxima
      </Button>
    </HStack>
  </Container>
</LoggedInLayout>
```

### Modal: Adicionar/Editar Registro

```tsx
<Modal isOpen={isOpen} onClose={onClose} size="xl">
  <ModalHeader>
    {editMode ? 'Editar Registro' : 'Adicionar Registro'}
  </ModalHeader>
  <ModalBody>
    <VStack spacing={4}>
      <FormControl>
        <FormLabel>Motorista</FormLabel>
        <Select value={formData.driverId} onChange={...}>
          {drivers.map(d => <option value={d.id}>{d.name}</option>)}
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Veículo</FormLabel>
        <Select value={formData.vehicleId} onChange={...}>
          {vehicles.map(v => <option value={v.id}>{v.plate}</option>)}
        </Select>
      </FormControl>

      <HStack>
        <FormControl>
          <FormLabel>Data Início</FormLabel>
          <Input type="date" value={formData.periodStart} onChange={...} />
        </FormControl>
        <FormControl>
          <FormLabel>Data Fim</FormLabel>
          <Input type="date" value={formData.periodEnd} onChange={...} />
        </FormControl>
      </HStack>

      <SimpleGrid columns={2} spacing={4} width="100%">
        <FormControl>
          <FormLabel>Ganhos Uber (€)</FormLabel>
          <Input type="number" value={formData.earningsUber} onChange={...} />
        </FormControl>
        <FormControl>
          <FormLabel>Ganhos Bolt (€)</FormLabel>
          <Input type="number" value={formData.earningsBolt} onChange={...} />
        </FormControl>
        <FormControl>
          <FormLabel>Gorjetas Uber (€)</FormLabel>
          <Input type="number" value={formData.tipsUber} onChange={...} />
        </FormControl>
        <FormControl>
          <FormLabel>Gorjetas Bolt (€)</FormLabel>
          <Input type="number" value={formData.tipsBolt} onChange={...} />
        </FormControl>
        <FormControl>
          <FormLabel>Portagens (€)</FormLabel>
          <Input type="number" value={formData.tollsAdjusted} onChange={...} />
        </FormControl>
        <FormControl>
          <FormLabel>Combustível (€)</FormLabel>
          <Input type="number" value={formData.fuel} onChange={...} />
        </FormControl>
        <FormControl>
          <FormLabel>Aluguel (€)</FormLabel>
          <Input type="number" value={formData.rental} onChange={...} />
        </FormControl>
        <FormControl>
          <FormLabel>Outras Despesas (€)</FormLabel>
          <Input type="number" value={formData.otherExpenses} onChange={...} />
        </FormControl>
      </SimpleGrid>

      <FormControl>
        <FormLabel>IBAN</FormLabel>
        <Input value={formData.iban} onChange={...} />
      </FormControl>

      <FormControl>
        <FormLabel>Notas</FormLabel>
        <Textarea value={formData.notes} onChange={...} />
      </FormControl>

      {/* Resumo Calculado */}
      <Card width="100%" bg="gray.50">
        <CardBody>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Text>Ganhos Totais:</Text>
              <Text fontWeight="bold">€ {calculatedValues.earningsTotal}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Base de Comissão:</Text>
              <Text>€ {calculatedValues.commissionBase}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Comissão (7%):</Text>
              <Text>€ {calculatedValues.commissionAmount}</Text>
            </HStack>
            <Divider />
            <HStack justify="space-between">
              <Text fontWeight="bold" fontSize="lg">Repasse Líquido:</Text>
              <Text fontWeight="bold" fontSize="lg" color="green.500">
                € {calculatedValues.netPayout}
              </Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  </ModalBody>
  <ModalFooter>
    <Button onClick={onClose}>Cancelar</Button>
    <Button colorScheme="blue" onClick={handleSave}>
      {editMode ? 'Atualizar' : 'Adicionar'}
    </Button>
  </ModalFooter>
</Modal>
```

---

## Tela 2: Controle de Motoristas (Semanal)

### Rota: `/admin/drivers-weekly`

### Funcionalidades

1. **Listagem de Registros Semanais**
   - Tabela com registros semanais por motorista
   - Filtros: Motorista, Semana, Status
   - Ordenação
   - Paginação

2. **Resumo por Motorista**
   - Card com totais acumulados de cada motorista
   - Gráfico de evolução semanal

3. **Ações**
   - Adicionar registro semanal
   - Editar registro
   - Marcar como pago
   - Exportar para Excel
   - Sincronizar dados

### Layout

```tsx
// pages/admin/drivers-weekly.tsx

<LoggedInLayout>
  <Container maxW="container.xl">
    {/* Header */}
    <HStack justify="space-between">
      <Heading>Controle de Motoristas (Semanal)</Heading>
      <HStack>
        <Button onClick={syncData}>Sincronizar Dados</Button>
        <Button onClick={exportExcel}>Exportar Excel</Button>
        <Button onClick={openAddModal}>Adicionar Registro</Button>
      </HStack>
    </HStack>

    {/* Resumo por Motorista */}
    <SimpleGrid columns={3} spacing={4}>
      {driverSummaries.map(driver => (
        <Card key={driver.id}>
          <CardHeader>
            <HStack>
              <Avatar name={driver.name} />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">{driver.name}</Text>
                <Text fontSize="sm" color="gray.500">
                  {driver.totalWeeks} semanas
                </Text>
              </VStack>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text fontSize="sm">Total Ganhos:</Text>
                <Text fontWeight="bold">€ {driver.totalEarnings}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm">Total Despesas:</Text>
                <Text>€ {driver.totalExpenses}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm">Total Comissões:</Text>
                <Text>€ {driver.totalCommissions}</Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontSize="sm" fontWeight="bold">Total Líquido:</Text>
                <Text fontWeight="bold" color="green.500">
                  € {driver.totalNet}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm">Pendente:</Text>
                <Badge colorScheme="yellow">€ {driver.pending}</Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>

    {/* Filtros */}
    <HStack>
      <Select placeholder="Todos os Motoristas">
        {drivers.map(d => <option value={d.id}>{d.name}</option>)}
      </Select>
      <Input type="week" placeholder="Semana" />
      <Select placeholder="Status">
        <option value="pending">Pendente</option>
        <option value="paid">Pago</option>
      </Select>
      <Button onClick={applyFilters}>Filtrar</Button>
    </HStack>

    {/* Tabela */}
    <Card>
      <Table>
        <Thead>
          <Tr>
            <Th>Semana</Th>
            <Th>Motorista</Th>
            <Th isNumeric>Uber</Th>
            <Th isNumeric>Bolt</Th>
            <Th isNumeric>Gorjetas</Th>
            <Th isNumeric>Total Bruto</Th>
            <Th isNumeric>Combustível</Th>
            <Th isNumeric>Comissão</Th>
            <Th isNumeric>Líquido</Th>
            <Th>Status</Th>
            <Th>Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {records.map(record => (
            <Tr key={record.id}>
              <Td>{formatWeek(record.weekStart, record.weekEnd)}</Td>
              <Td>{record.driverName}</Td>
              <Td isNumeric>€ {record.uberTrips.toFixed(2)}</Td>
              <Td isNumeric>€ {record.boltTrips.toFixed(2)}</Td>
              <Td isNumeric>€ {(record.uberTips + record.boltTips).toFixed(2)}</Td>
              <Td isNumeric>€ {record.grossTotal.toFixed(2)}</Td>
              <Td isNumeric>€ {record.fuel.toFixed(2)}</Td>
              <Td isNumeric>€ {record.commissionAmount.toFixed(2)}</Td>
              <Td isNumeric fontWeight="bold">€ {record.netPayout.toFixed(2)}</Td>
              <Td>
                <Badge colorScheme={record.paymentStatus === 'paid' ? 'green' : 'yellow'}>
                  {record.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                </Badge>
              </Td>
              <Td>
                <HStack>
                  <IconButton icon={<FiEdit />} onClick={() => editRecord(record)} />
                  {record.paymentStatus === 'pending' && (
                    <Button size="sm" onClick={() => markAsPaid(record)}>
                      Pagar
                    </Button>
                  )}
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  </Container>
</LoggedInLayout>
```

---

## APIs Necessárias

### 1. Fleet Records

```typescript
// pages/api/admin/fleet/index.ts
GET /api/admin/fleet
  Query: driverId?, vehicleId?, startDate?, endDate?, status?, page?, limit?
  Response: { records: FleetRecord[], total: number, page: number }

POST /api/admin/fleet
  Body: FleetRecord
  Response: { success: boolean, record: FleetRecord }

PUT /api/admin/fleet/[id]
  Body: Partial<FleetRecord>
  Response: { success: boolean, record: FleetRecord }

DELETE /api/admin/fleet/[id]
  Response: { success: boolean }

POST /api/admin/fleet/[id]/mark-paid
  Body: { paymentDate: string }
  Response: { success: boolean, record: FleetRecord }
```

### 2. Driver Weekly Records

```typescript
// pages/api/admin/drivers-weekly/index.ts
GET /api/admin/drivers-weekly
  Query: driverId?, weekStart?, weekEnd?, status?, page?, limit?
  Response: { records: DriverWeeklyRecord[], total: number }

POST /api/admin/drivers-weekly
  Body: DriverWeeklyRecord
  Response: { success: boolean, record: DriverWeeklyRecord }

PUT /api/admin/drivers-weekly/[id]
  Body: Partial<DriverWeeklyRecord>
  Response: { success: boolean, record: DriverWeeklyRecord }

POST /api/admin/drivers-weekly/[id]/mark-paid
  Body: { paymentDate: string }
  Response: { success: boolean, record: DriverWeeklyRecord }
```

### 3. Sincronização

```typescript
// pages/api/admin/fleet/sync.ts
POST /api/admin/fleet/sync
  Body: { startDate: string, endDate: string, driverId?: string }
  Response: { 
    success: boolean, 
    created: number, 
    updated: number,
    errors: string[]
  }

// Lógica:
// 1. Buscar dados de Uber, Bolt (viagens e ganhos)
// 2. Buscar dados de Cartrack (veículos, km)
// 3. Buscar dados de ViaVerde (portagens)
// 4. Buscar dados de myprio (combustível, despesas)
// 5. Criar/atualizar registros de frota
// 6. Calcular comissões e repasses
```

---

## Integrações com APIs

### Mapeamento de Dados

**Uber API → Fleet Record:**
```typescript
{
  earningsUber: uberData.trips.reduce((sum, t) => sum + t.fare.value, 0),
  tipsUber: uberData.trips.reduce((sum, t) => sum + (t.tip || 0), 0),
  tollsUber: uberData.trips.reduce((sum, t) => sum + (t.tolls || 0), 0),
}
```

**Bolt API → Fleet Record:**
```typescript
{
  earningsBolt: boltData.trips.reduce((sum, t) => sum + t.fare, 0),
  tipsBolt: boltData.trips.reduce((sum, t) => sum + (t.tip || 0), 0),
}
```

**myprio API → Fleet Record:**
```typescript
{
  fuel: myprioData.expenses
    .filter(e => e.category === 'fuel')
    .reduce((sum, e) => sum + e.amount, 0),
  otherExpenses: myprioData.expenses
    .filter(e => e.category !== 'fuel')
    .reduce((sum, e) => sum + e.amount, 0),
}
```

**ViaVerde API → Fleet Record:**
```typescript
{
  tollsAdjusted: viaverdeData.transactions
    .filter(t => t.type === 'toll')
    .reduce((sum, t) => sum + t.amount, 0),
}
```

---

## Exportação para Excel

```typescript
// lib/export-excel.ts

import * as XLSX from 'xlsx';

export function exportFleetToExcel(records: FleetRecord[]) {
  const data = records.map(r => ({
    'Nome': r.driverName,
    'Carro/Matrícula': r.vehiclePlate,
    'Período': `${formatDate(r.periodStart)} - ${formatDate(r.periodEnd)}`,
    'Aluguel': r.rental,
    'Ganhos Uber': r.earningsUber,
    'Ganhos Bolt': r.earningsBolt,
    'Ganhos Total': r.earningsTotal,
    '%': (r.commissionRate * 100).toFixed(0) + '%',
    'Desconto': r.commissionAmount,
    'Combustível': r.fuel,
    'Portagens Uber': r.tollsUber,
    'Portagens Ajustada': r.tollsAdjusted,
    'Gorjeta Uber': r.tipsUber,
    'Gorjeta Bolt': r.tipsBolt,
    'Gorjeta': r.tipsTotal,
    'Repasse': r.netPayout,
    'IBAN': r.iban,
    'STATUS PGTO': r.paymentStatus === 'paid' ? 'PAGO' : 'N PAGO',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BASE DADOS');
  
  XLSX.writeFile(wb, `Controle_Frota_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportDriversWeeklyToExcel(records: DriverWeeklyRecord[]) {
  const data = records.map(r => ({
    'Semana': `${formatDate(r.weekStart)} - ${formatDate(r.weekEnd)}`,
    'Nome do Motorista': r.driverName,
    'IBAN': r.iban,
    'Uber - Viagens (€)': r.uberTrips,
    'Uber - Gorjetas (€)': r.uberTips,
    'Uber - Portagens Reembolsadas (€)': r.uberTolls,
    'Bolt - Viagens (€)': r.boltTrips,
    'Bolt - Gorjetas (€)': r.boltTips,
    'Total Bruto (€)': r.grossTotal,
    'Combustível (€)': r.fuel,
    'Outros Custos (€)': r.otherCosts,
    'Base de Comissão (€)': r.commissionBase,
    'Comissão Gestão (7%) (€)': r.commissionAmount,
    'Valor Líquido a Transferir (€)': r.netPayout,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Controlo Semanal');
  
  XLSX.writeFile(wb, `Controle_Motoristas_${new Date().toISOString().split('T')[0]}.xlsx`);
}
```

---

## Traduções

```json
// locales/pt/admin.json
{
  "fleet": {
    "title": "Controle de Frota TVDE",
    "addRecord": "Adicionar Registro",
    "editRecord": "Editar Registro",
    "syncData": "Sincronizar Dados",
    "exportExcel": "Exportar Excel",
    "filters": {
      "driver": "Motorista",
      "vehicle": "Veículo",
      "period": "Período",
      "status": "Status"
    },
    "table": {
      "driver": "Motorista",
      "vehicle": "Veículo",
      "period": "Período",
      "uber": "Uber",
      "bolt": "Bolt",
      "total": "Total",
      "fuel": "Combustível",
      "commission": "Comissão",
      "payout": "Repasse",
      "status": "Status",
      "actions": "Ações"
    },
    "kpis": {
      "totalEarnings": "Ganhos Totais",
      "totalExpenses": "Despesas Totais",
      "totalCommissions": "Comissões",
      "totalPayouts": "Repasses",
      "pending": "Pendentes"
    }
  },
  "driversWeekly": {
    "title": "Controle de Motoristas (Semanal)",
    "week": "Semana",
    "grossTotal": "Total Bruto",
    "netPayout": "Líquido",
    "markAsPaid": "Marcar como Pago"
  }
}
```

---

## Checklist de Implementação

### Fase 1: Schemas e Cálculos
- [ ] Criar `schemas/fleet-record.ts`
- [ ] Criar `schemas/driver-weekly-record.ts`
- [ ] Implementar funções de cálculo
- [ ] Testar cálculos com dados das planilhas

### Fase 2: APIs Backend
- [ ] Criar API `/api/admin/fleet/index.ts` (CRUD)
- [ ] Criar API `/api/admin/fleet/sync.ts`
- [ ] Criar API `/api/admin/drivers-weekly/index.ts` (CRUD)
- [ ] Criar API `/api/admin/drivers-weekly/sync.ts`
- [ ] Testar APIs com Postman

### Fase 3: Tela de Controle de Frota
- [ ] Criar página `/pages/admin/fleet.tsx`
- [ ] Implementar listagem com filtros
- [ ] Implementar KPIs
- [ ] Implementar modal de adicionar/editar
- [ ] Implementar marcar como pago
- [ ] Implementar sincronização
- [ ] Implementar exportação Excel

### Fase 4: Tela de Controle de Motoristas
- [ ] Criar página `/pages/admin/drivers-weekly.tsx`
- [ ] Implementar listagem com filtros
- [ ] Implementar cards de resumo por motorista
- [ ] Implementar modal de adicionar/editar
- [ ] Implementar marcar como pago
- [ ] Implementar sincronização
- [ ] Implementar exportação Excel

### Fase 5: Integrações
- [ ] Implementar lógica de sincronização com Uber
- [ ] Implementar lógica de sincronização com Bolt
- [ ] Implementar lógica de sincronização com myprio
- [ ] Implementar lógica de sincronização com ViaVerde
- [ ] Implementar lógica de sincronização com Cartrack
- [ ] Testar sincronização end-to-end

### Fase 6: Traduções e Testes
- [ ] Adicionar traduções PT
- [ ] Adicionar traduções EN
- [ ] Testar responsividade
- [ ] Testar cálculos
- [ ] Testar exportação Excel
- [ ] Testar sincronização

### Fase 7: Navegação
- [ ] Adicionar links no menu admin
- [ ] Atualizar dashboard admin com links
- [ ] Testar navegação

---

## Notas Importantes

1. **Comissão Fixa de 7%**: Sempre aplicar 7% sobre a base (ganhos - portagens)
2. **Cálculo de Repasse**: Ganhos + Gorjetas - Comissão - Combustível - Aluguel - Outras Despesas
3. **Portagens**: Não entram na base de comissão (são reembolsadas)
4. **Gorjetas**: Não entram na base de comissão (são do motorista)
5. **Sincronização**: Deve ser manual (botão) para controle do admin
6. **Edição Manual**: Sempre permitir edição manual dos valores
7. **Status de Pagamento**: Controlar manualmente (não automático)
8. **IBAN**: Armazenar para facilitar transferências
9. **Exportação**: Manter formato idêntico às planilhas atuais
10. **Períodos**: Frota usa períodos flexíveis, Motoristas usa semanas

---

## Conclusão

Este prompt fornece toda a estrutura necessária para criar as duas telas de controle que substituirão as planilhas Excel, integrando com dados reais das APIs e mantendo a flexibilidade de edição manual quando necessário.
