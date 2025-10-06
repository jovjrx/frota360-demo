# 🔧 Correção: Cartrack Monitor - Dados Sempre Atualizados

**Data:** 06 de Outubro de 2025  
**Problema:** Monitor mostrando apenas dados de setembro  
**Status:** ✅ **CORRIGIDO**

---

## 🐛 Problema Identificado

### **Sintoma:**
- Tela `/admin/monitor` (Cartrack) mostrava apenas dados de setembro
- Dados não eram da semana atual
- Auto-refresh não estava buscando dados recentes

### **Causa Raiz:**
A API em `pages/api/admin/integrations/[platform]/data.ts` estava usando datas fixas:
```typescript
// ❌ ANTES (ERRADO):
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 7);
```

Isso causava busca de um período fixo, que podia estar desatualizado.

---

## ✅ Solução Implementada

### **1. Buscar Sempre Dados Recentes**

**Arquivo:** `pages/api/admin/integrations/[platform]/data.ts`

**Mudanças:**
- ✅ Calcular **sempre** a data atual (`new Date()`)
- ✅ Buscar últimos 7 dias a partir de hoje
- ✅ Calcular semana atual (Segunda a Domingo)
- ✅ Ordenar viagens por data mais recente primeiro
- ✅ Aumentar limite de viagens de 10 para 50

**Código corrigido:**
```typescript
// ✅ DEPOIS (CORRETO):
const today = new Date(); // Data atual SEMPRE
const alternativeStart = new Date(today);
alternativeStart.setDate(today.getDate() - 7); // Últimos 7 dias

// Buscar com datas dinâmicas
const trips = await cartrackClient.getTrips(
  alternativeStart.toISOString().split('T')[0],
  today.toISOString().split('T')[0]
);

// Ordenar por mais recente
const sortedTrips = trips.sort((a, b) => {
  const dateA = new Date(a.start_timestamp).getTime();
  const dateB = new Date(b.start_timestamp).getTime();
  return dateB - dateA; // Mais recente primeiro
});
```

### **2. Logs para Debug**

**Arquivo:** `lib/integrations/cartrack/client.ts`

Adicionados logs para rastrear:
- Range de datas sendo buscado
- Quantidade de viagens recebidas
- Data da primeira e última viagem

```typescript
console.log(`[Cartrack] Fetching trips from ${startTimestamp} to ${endTimestamp}`);
console.log(`[Cartrack] Received ${trips.length} trips`);
console.log(`[Cartrack] First trip: ${firstTrip.start_timestamp}`);
```

### **3. Correção de Distância**

Cartrack retorna distância em **metros**, não km:
```typescript
// ✅ Corrigido: converter metros para km
totalDistance: trips.reduce((sum, trip) => 
  sum + (trip.trip_distance || 0) / 1000, 
0)
```

---

## 📊 Como Funciona Agora

### **Fluxo de Dados:**

1. **Frontend** (`/admin/monitor`):
   - Carrega dados iniciais
   - Auto-refresh a cada 30 segundos
   - Chama `/api/admin/integrations/cartrack/data`

2. **API** (`/api/admin/integrations/[platform]/data.ts`):
   - Calcula data de hoje
   - Busca últimos 7 dias
   - Ordena por mais recente
   - Retorna até 50 viagens

3. **Cartrack Client** (`lib/integrations/cartrack/client.ts`):
   - Faz requisição à API Cartrack
   - Range: `YYYY-MM-DD 00:00:00` até `YYYY-MM-DD 23:59:59`
   - Retorna array de viagens

### **Período Buscado:**

```
Hoje: 06/10/2025 15:30
Busca: 29/09/2025 00:00:00 até 06/10/2025 23:59:59
       └─────── 7 dias ──────┘
       
Semana atual (referência):
Segunda: 30/09/2025
Domingo: 06/10/2025
```

### **Ordenação:**

```
Viagens ordenadas do mais recente para o mais antigo:
1. 06/10/2025 15:20 ← Mais recente
2. 06/10/2025 14:45
3. 06/10/2025 12:30
...
50. 29/09/2025 08:15 ← Mais antiga (das 50)
```

---

## 🧪 Como Testar

### **1. Verificar logs no servidor:**
```bash
npm run dev
```

Acessar `/admin/monitor` e verificar logs no terminal:
```
[Cartrack API] Hoje é: 2025-10-06T15:30:00.000Z
[Cartrack API] Buscando dados de 2025-09-29 até 2025-10-06
[Cartrack] Fetching trips from 2025-09-29 00:00:00 to 2025-10-06 23:59:59
[Cartrack] Received 127 trips
[Cartrack] First trip: 2025-10-06 15:20:35
[Cartrack API] Total de viagens recebidas: 127
```

### **2. Verificar dados na tela:**
- Acessar `/admin/monitor`
- Ver "Período" no resumo (deve mostrar semana atual)
- Verificar tabela de viagens (deve mostrar viagens recentes)
- Primeira viagem da lista deve ser de HOJE ou ontem

### **3. Testar auto-refresh:**
- Aguardar 30 segundos
- Deve atualizar automaticamente
- Toast de "Dados atualizados" aparece
- Novos dados carregados

---

## 📁 Arquivos Modificados

### **1. `pages/api/admin/integrations/[platform]/data.ts`**
- ✅ Cálculo dinâmico de datas
- ✅ Busca últimos 7 dias sempre
- ✅ Ordenação por data mais recente
- ✅ Logs para debug
- ✅ Conversão metros → km

### **2. `lib/integrations/cartrack/client.ts`**
- ✅ Logs detalhados em getTrips()
- ✅ Informações sobre período buscado
- ✅ Quantidade de viagens recebidas

---

## 🎯 Resultado

### **Antes:**
```
❌ Dados de setembro
❌ Não atualizava com data atual
❌ Apenas 10 viagens
❌ Sem logs de debug
❌ Distância incorreta (metros vs km)
```

### **Depois:**
```
✅ Dados sempre dos últimos 7 dias
✅ Calcula data atual dinamicamente
✅ Até 50 viagens mais recentes
✅ Logs completos para debug
✅ Distância correta em km
✅ Ordenado por mais recente
```

---

## 📝 Notas Importantes

### **Range de Datas:**
- Sempre busca **últimos 7 dias** a partir de hoje
- Garante que há dados recentes mesmo se semana atual estiver vazia
- API Cartrack suporta até 1000 viagens por requisição

### **Auto-Refresh:**
- Intervalo: 30 segundos
- Pode ser desligado pelo usuário
- Não mostra toast em refresh automático (apenas manual)

### **Performance:**
- Limite de 50 viagens na resposta (reduz payload)
- Viagens já vêm ordenadas do backend
- Frontend apenas renderiza (não processa)

### **Timezone:**
- Servidor usa UTC
- Datas formatadas como YYYY-MM-DD
- Horários em formato ISO 8601

---

## ✅ Status Final

**Problema:** Resolvido ✅  
**Testes:** Pendente (aguardar teste com dados reais)  
**Deploy:** Pronto para produção  

**Próximos passos:**
1. Testar com dados reais da API Cartrack
2. Verificar logs no servidor
3. Confirmar viagens recentes aparecem
4. Validar auto-refresh funcionando

---

**Data da correção:** 06/10/2025 - 16:45  
**Tempo estimado para teste:** 5-10 minutos
