# Refatoração: Sistema de Importação e Processamento de Dados

## 🎯 Objetivo

Refatorar o sistema para:
1. Salvar dados brutos nas 4 collections (raw_uber, raw_bolt, raw_prio, raw_viaverde)
2. Fazer cruzamento de dados usando integrations dos motoristas
3. Calcular valores em tempo real no painel
4. Manter consistência dos dados originais

## 📁 Arquivos Criados

### 1. schemas/raw-data.ts
- Schemas TypeScript para as 4 collections
- RawUber, RawBolt, RawPrio, RawViaVerde

### 2. pages/api/admin/weekly/import-raw.ts
- Nova API de importação
- Salva dados brutos sem cálculos
- Gera importId único para rastreabilidade

### 3. pages/api/admin/weekly/process-week.ts
- API para processar dados das 4 collections
- Faz cruzamento usando integrations
- Calcula valores em tempo real
- Retorna registros por motorista

## 🔗 Regras de Vinculação

### Uber
```
integrations.uber.key = UUID do motorista
integrations.uber.enabled = true
```

### Bolt
```
integrations.bolt.key = Email do motorista
integrations.bolt.enabled = true
```

### MyPrio
```
integrations.myprio.key = Número completo do cartão
integrations.myprio.enabled = true
```

### ViaVerde
```
integrations.viaverde.key = Matrícula do veículo
integrations.viaverde.enabled = true/false
```

## 📊 Cálculos

```
Ganhos Total = Uber Total + Bolt Total
IVA 6% = Ganhos Total × 0,06
Ganhos - IVA = Ganhos Total - IVA
Despesas Adm 7% = (Ganhos - IVA) × 0,07
Aluguel = 290 EUR (Locatário) ou 0 EUR (Afiliado)
Valor Líquido = (Ganhos - IVA) - Despesas Adm - Combustível - Portagens - Aluguel
```

## ✅ Próximos Passos

1. [ ] Atualizar página de importação (import.tsx) para usar import-raw.ts
2. [ ] Atualizar página weekly (index.tsx) para usar process-week.ts
3. [ ] Testar com dados reais (29/09-05/10)
4. [ ] Validar valores contra planilha fornecida
5. [ ] Commit e push

## 🗄️ Estrutura Firebase

### Collections Raw
- `raw_uber` - Dados brutos do Uber
- `raw_bolt` - Dados brutos do Bolt
- `raw_prio` - Transações de abastecimento
- `raw_viaverde` - Transações de portagens

### Collection Drivers
- `drivers.integrations.uber.key` - UUID
- `drivers.integrations.bolt.key` - Email
- `drivers.integrations.myprio.key` - Número do cartão
- `drivers.integrations.viaverde.key` - Matrícula

## 🔄 Fluxo de Dados

```
1. Admin faz upload dos 4 arquivos
   ↓
2. import-raw.ts salva dados brutos nas 4 collections
   ↓
3. Weekly page chama process-week.ts
   ↓
4. process-week.ts busca dados das 4 collections
   ↓
5. Faz cruzamento usando integrations
   ↓
6. Calcula valores em tempo real
   ↓
7. Retorna registros para exibição
   ↓
8. Admin pode gerar resumos (Excel + PDFs)
```

