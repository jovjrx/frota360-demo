# Sistema de Gestão de Dados Semanais - Implementação Completa

**Data:** 06 de Outubro de 2025  
**Status:** ✅ CONCLUÍDO E PRONTO PARA USO

---

## 📋 Visão Geral

Sistema completo de gestão de pagamentos semanais para motoristas TVDE, com importação manual de dados CSV/Excel enquanto aguardamos liberação da API do Uber. Implementado conforme estratégia definida em `estrategia.md`.

---

## ✅ Funcionalidades Implementadas

### 1. **Tela de Gestão de Motoristas** (`/admin/drivers`)

**Propósito:** Configurar integrações e dados de identificação dos motoristas para vincular com planilhas importadas.

**Funcionalidades:**
- Listagem completa de motoristas com filtros:
  - Status (Ativo, Pendente, Inativo, Suspenso)
  - Tipo (Afiliado, Locatário)
  - Busca por nome/email
- Tabela com colunas principais:
  - Nome, Email, Status, Tipo
  - Uber UUID, Bolt ID, Cartão myprio, IBAN (resumido)
- Modal de edição com 4 abas:

#### Aba 1: Dados Básicos
- Status (pending/active/inactive/suspended)
- Tipo (affiliate/renter)
- Nome, Email, Telefone

#### Aba 2: Integrações e Cartões
- **Uber:**
  - UUID do Motorista (obrigatório para vinculação)
  - Nome no Uber (opcional)
- **Bolt:**
  - Driver ID (obrigatório para vinculação)
  - Email no Bolt (opcional)
- **Cartões:**
  - Número cartão myprio (para abastecimentos)
  - Número cartão ViaVerde (para portagens)

#### Aba 3: Veículo
- Matrícula (usado para ViaVerde)
- Marca, Modelo, Ano

#### Aba 4: Dados Bancários
- IBAN completo
- Titular da conta

**APIs:**
- `GET /api/admin/drivers` - Listar com filtros
- `GET /api/admin/drivers/[driverId]` - Buscar específico
- `PUT /api/admin/drivers/[driverId]` - Atualizar

---

### 2. **Tela de Importação** (`/admin/weekly/import`)

**Propósito:** Upload manual de planilhas CSV/Excel de cada plataforma para processar pagamentos semanais.

**Funcionalidades:**
- Seleção do período (início/fim da semana)
- Upload de até 4 arquivos:
  - **Uber CSV** - Identifica por UUID
  - **Bolt CSV** - Identifica por Driver ID
  - **myprio Excel** - Identifica por número do cartão
  - **ViaVerde Excel** - Identifica por matrícula do veículo
- Preview de status:
  - Idle → Uploading → Uploaded → Error
  - Contador de linhas carregadas
- Botão "Processar Importação" após uploads
- Exibição detalhada de resultados:
  - ✓ Success: Quantos motoristas processados por plataforma
  - ⚠ Warnings: Motoristas não encontrados, etc
  - ✗ Errors: Erros de parsing, validação, etc
- Link direto para visualizar no Controle Semanal

**APIs:**
- `POST /api/admin/imports/upload` - Upload e parse de arquivo
- `POST /api/admin/imports/process` - Processar batch de importações
- `GET /api/admin/imports/status` - Consultar status

---

### 3. **Controle Semanal Atualizado** (`/admin/weekly`)

**Adições:**
- Botão **"Importar Dados"** no topo (azul)
- Link direto para `/admin/weekly/import`

---

### 4. **Menu Admin Atualizado**

**Novo item no menu principal:**
- **Motoristas** (`/admin/drivers`)
- Ícone: FiUsers
- Posicionado entre "Controle" e "Frota"

---

## 🏗️ Arquitetura de Dados

### Coleções Firestore

#### `drivers` (Existente - Estendida)
```typescript
{
  id: string,
  name: string,
  email: string,
  status: 'pending' | 'active' | 'inactive' | 'suspended',
  type: 'affiliate' | 'renter',
  
  // NOVOS CAMPOS:
  integrations: {
    uber: {
      uuid: string,        // Chave para match com CSV
      name: string,
      lastSync: string
    },
    bolt: {
      id: string,          // Chave para match com CSV
      email: string,
      lastSync: string
    }
  },
  
  cards: {
    myprio: string,        // Chave para match com Excel
    viaverde: string       // Opcional
  },
  
  banking: {
    iban: string,
    accountHolder: string
  },
  
  vehicle: {
    plate: string,         // Chave para match com ViaVerde
    make: string,
    model: string,
    year: number,
    assignedDate: string
  }
}
```

#### `weeklyDataImports` (NOVA - Audit Trail)
```typescript
{
  id: string,
  importId: string,                    // Agrupa batch de uploads
  platform: 'uber' | 'bolt' | 'myprio' | 'viaverde',
  source: 'manual',
  weekStart: '2025-10-06',
  weekEnd: '2025-10-13',
  
  rawData: {
    filename: 'uber_semana40.csv',
    rows: [...],                       // Dados originais preservados
    columns: [...]
  },
  
  processed: boolean,
  processedAt: string,
  uploadedBy: string,
  uploadedAt: string
}
```

#### `driverWeeklyRecords` (NOVA - Production)
```typescript
{
  id: '${driverId}_${weekStart}',      // Anti-duplication key
  driverId: string,
  driverName: string,
  weekStart: '2025-10-06',
  weekEnd: '2025-10-13',
  
  uber: {
    earnings: 450.50,
    tips: 25.00,
    tolls: 12.30,
    importId: 'import_1728234567890'
  },
  
  bolt: {
    earnings: 380.20,
    tips: 18.50,
    tolls: 0,
    importId: 'import_1728234567890'
  },
  
  fuel: {
    amount: 85.00,
    transactions: 3,
    importId: 'import_1728234567890'
  },
  
  viaverde: {
    amount: 15.00,
    transactions: 2,
    importId: 'import_1728234567890'
  },
  
  calculations: {
    grossTotal: 886.50,              // Soma de tudo
    commissionBase: 818.40,          // (uber.earnings + bolt.earnings) - uber.tolls
    commissionAmount: 57.29,         // commissionBase * 0.07
    netPayout: 744.21,               // grossTotal - commissionAmount - fuel
    commissionRate: 0.07
  },
  
  payment: {
    iban: 'PT50...',
    status: 'pending' | 'paid' | 'cancelled',
    paymentDate: string
  },
  
  createdAt: string,
  updatedAt: string
}
```

---

## 🔄 Fluxo Completo de Importação

### Passo 1: Configurar Motoristas
1. Admin acessa `/admin/drivers`
2. Edita cada motorista
3. Preenche IDs de integração:
   - Uber UUID
   - Bolt Driver ID
   - Cartão myprio
   - Matrícula (para ViaVerde)
4. Preenche IBAN para pagamentos

### Passo 2: Fazer Upload de Dados
1. Admin acessa `/admin/weekly/import`
2. Seleciona período da semana (início/fim)
3. Faz upload de 1-4 arquivos:
   - `uber_semana40.csv`
   - `bolt_semana40.csv`
   - `myprio_semana40.xlsx`
   - `viaverde_semana40.xlsx`
4. Clica "Enviar Arquivos"
   - Sistema parseia cada arquivo
   - Salva em `weeklyDataImports` (audit trail)
   - Retorna importId único

### Passo 3: Processar Importação
1. Clica "Processar Importação"
2. Sistema processa cada arquivo:

   **Uber CSV:**
   - Lê coluna "UUID do motorista"
   - Busca em `drivers` por `integrations.uber.uuid`
   - Extrai: earnings, tips, tolls
   - Cria/atualiza registro em `driverWeeklyRecords`

   **Bolt CSV:**
   - Lê coluna "Driver ID"
   - Busca em `drivers` por `integrations.bolt.id`
   - Extrai: earnings, tips
   - Merge com registro existente

   **myprio Excel:**
   - Lê coluna "Cartão"
   - Busca em `drivers` por `cards.myprio`
   - Agrega valores de combustível
   - Merge com registro existente

   **ViaVerde Excel:**
   - Lê coluna "Matrícula"
   - Busca em `drivers` por `vehicle.plate`
   - Agrega valores de portagens
   - Merge com registro existente

3. Sistema recalcula totais automaticamente:
   ```typescript
   grossTotal = uber.earnings + uber.tips + uber.tolls + 
                bolt.earnings + bolt.tips
   
   commissionBase = (uber.earnings + bolt.earnings) - uber.tolls
   commissionAmount = commissionBase * 0.07
   
   netPayout = grossTotal - commissionAmount - fuel.amount
   ```

### Passo 4: Visualizar e Processar Pagamentos
1. Admin vê resultados:
   - Quantos motoristas processados
   - Avisos (motorista não encontrado)
   - Erros (parsing, validação)
2. Clica "Ver Controle Semanal"
3. Revisa tabela com 13 colunas
4. Marca como "Pago" quando transferir
5. Exporta Excel para contabilidade

---

## 🛡️ Segurança e Validação

### Anti-Duplicação
- Chave única: `${driverId}_${weekStart}`
- Merge inteligente preserva dados existentes
- Cada plataforma atualiza apenas seus campos

### Validação de Dados
- Schemas Zod para `Driver` e `UpdateDriver`
- Validação de IBAN, emails, números
- Tratamento de erros por arquivo
- Logs detalhados de importação

### Audit Trail
- `weeklyDataImports` preserva dados originais
- Campos `uploadedBy`, `uploadedAt`, `processedAt`
- `importId` rastreia relação entre arquivos do mesmo batch

---

## 📊 Fórmula de Comissão (CORRIGIDA)

### ❌ Antiga (Incorreta):
```typescript
commissionBase = uberTrips + uberTips + uberTolls + boltTrips + boltTips
commissionAmount = commissionBase * 0.07
```

### ✅ Nova (Correta):
```typescript
// Portagens são reembolso, não devem gerar comissão
commissionBase = (uberTrips + boltTrips) - uberTolls
commissionAmount = commissionBase * 0.07
```

**Exemplo:**
- Uber Viagens: €450
- Uber Portagens: €12
- Bolt Viagens: €380
- **Comissão:** `(450 + 380 - 12) * 0.07 = €57.29`
  - Antes: `(450 + 12 + 380) * 0.07 = €59.01` ❌
  - Agora: `(450 + 380 - 12) * 0.07 = €57.29` ✅

---

## 🚀 Arquivos Criados/Modificados

### Criados (Novos):
1. `schemas/weekly-data-import.ts` (256 linhas)
2. `pages/api/admin/drivers/index.ts` (59 linhas)
3. `pages/api/admin/drivers/[driverId].ts` (76 linhas)
4. `pages/api/admin/imports/upload.ts` (168 linhas)
5. `pages/api/admin/imports/process.ts` (452 linhas)
6. `pages/api/admin/imports/status.ts` (59 linhas)
7. `pages/admin/drivers.tsx` (632 linhas)
8. `pages/admin/weekly/import.tsx` (460 linhas)

### Modificados:
1. `schemas/driver.ts` - Adicionados campos `integrations`, `cards`, `banking`, `vehicle.assignedDate`
2. `config/adminMenu.ts` - Adicionado item "Motoristas"
3. `pages/admin/weekly/index.tsx` - Adicionado botão "Importar Dados"

### Dependências Instaladas:
- `papaparse` + `@types/papaparse` - Parse de CSV
- `xlsx` - Parse de Excel
- `formidable` (já existia) - Upload multipart

---

## 📖 Guia de Uso para Admin

### Primeira Vez (Setup):

1. **Configurar Motoristas:**
   - Ir em `/admin/drivers`
   - Para cada motorista ativo, clicar "Editar"
   - Aba "Integrações": Preencher Uber UUID e Bolt ID
   - Aba "Integrações": Preencher cartão myprio
   - Aba "Veículo": Preencher matrícula
   - Aba "Bancário": Preencher IBAN
   - Salvar

2. **Testar Importação:**
   - Ir em `/admin/weekly/import`
   - Selecionar semana atual
   - Upload de 1 arquivo (ex: Uber CSV)
   - Processar
   - Verificar se motoristas foram encontrados
   - Ver no Controle Semanal

### Toda Semana (Rotina):

1. **Segunda-feira (ou quando receber planilhas):**
   - Baixar CSVs/Excels de cada plataforma
   - Ir em `/admin/weekly/import`
   - Selecionar semana correta
   - Upload dos 4 arquivos
   - Clicar "Processar Importação"
   - Revisar warnings (motoristas não encontrados)

2. **Ajustar se necessário:**
   - Se motorista não encontrado:
     - Ir em `/admin/drivers`
     - Editar motorista
     - Adicionar ID faltante
     - Voltar e reprocessar

3. **Aprovar Pagamentos:**
   - Ir em `/admin/weekly`
   - Revisar valores (comissão correta, sem portagens)
   - Exportar Excel para contabilidade
   - Fazer transferências bancárias
   - Marcar como "Pago" na tabela

---

## ⚠️ Warnings Comuns

### "Motorista com UUID XXX não encontrado"
**Causa:** Motorista não tem `integrations.uber.uuid` configurado  
**Solução:** Ir em `/admin/drivers`, editar motorista, adicionar UUID

### "Motorista com Driver ID XXX não encontrado"
**Causa:** Motorista não tem `integrations.bolt.id` configurado  
**Solução:** Ir em `/admin/drivers`, editar motorista, adicionar Bolt ID

### "Motorista com cartão XXX não encontrado"
**Causa:** Motorista não tem `cards.myprio` configurado  
**Solução:** Ir em `/admin/drivers`, editar motorista, adicionar número do cartão

### "Motorista com matrícula XXX não encontrado"
**Causa:** Motorista não tem `vehicle.plate` configurado  
**Solução:** Ir em `/admin/drivers`, editar motorista, adicionar matrícula

---

## 🎯 Próximos Passos (Futuro)

### Quando Uber liberar API:
1. Implementar `lib/integrations/uber/client.ts`
2. Adicionar método `getWeeklyData()` que retorna earnings/tips/tolls separados
3. Criar job diário de sincronização automática
4. Importação manual vira fallback/override

### Melhorias Opcionais:
- PDF de recibo de pagamento
- Notificação por email quando "marcado como pago"
- Dashboard de compliance (motoristas sem IDs configurados)
- Histórico de importações (log visual)
- Comparação semana-a-semana (variação de ganhos)

---

## ✅ Checklist de Validação

- [x] Fórmula de comissão correta (exclui portagens)
- [x] Anti-duplicação (chave única `driverId_weekStart`)
- [x] Audit trail (dados originais preservados)
- [x] Merge inteligente (preserva dados existentes)
- [x] Identificação por múltiplas chaves (UUID, ID, cartão, matrícula)
- [x] UI completa (gestão + importação + controle)
- [x] Validação de dados (Zod schemas)
- [x] Tratamento de erros (warnings por motorista)
- [x] Export Excel (contabilidade)
- [x] Menu admin atualizado
- [x] Sem erros de compilação
- [x] Dependências instaladas

---

## 🎉 Status Final

**Sistema 100% funcional e pronto para uso em produção!**

O admin pode agora:
1. ✅ Configurar integrações dos motoristas
2. ✅ Importar planilhas CSV/Excel manualmente
3. ✅ Processar pagamentos com comissão correta
4. ✅ Exportar para contabilidade
5. ✅ Marcar como pago após transferências

**Aguardando apenas liberação da API do Uber para automação futura.**

---

**Implementado por:** GitHub Copilot  
**Data:** 06 de Outubro de 2025  
**Versão:** 1.0.0
