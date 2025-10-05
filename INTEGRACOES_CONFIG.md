# 🚀 Configuração das Integrações - Conduz PT

Este documento contém instruções detalhadas para configurar cada uma das integrações de plataformas TVDE.

## 📋 Status das Integrações

| Plataforma | Status | Tipo Auth | Prioridade |
|------------|--------|-----------|------------|
| ✅ **Cartrack** | ⚠️ Credenciais inválidas | Basic Auth | ALTA |
| 🔄 **Uber** | ⚠️ Scopes não configurados | OAuth 2.0 | ALTA |
| ⏳ **Bolt** | Não implementado | Web Scraping | MÉDIA |
| ⏳ **ViaVerde** | Não implementado | Web Scraping | MÉDIA |
| ⏳ **FONOA** | Não implementado | Portal | BAIXA |
| ⏳ **myprio** | Não implementado | Portal | MÉDIA |

---

## 1. 🚗 Cartrack API

### Status Atual
✅ **Implementação completa**  
⚠️ **Erro 401**: Credenciais retornam "Unauthorized. In order to access this web service you must be a Cartrack Subscriber"

### O que foi implementado
- ✅ Cliente com Basic Auth
- ✅ Endpoints: `/vehicles/status`, `/trips`, `/fuel`, `/maintenance`
- ✅ Métodos: `getVehicles()`, `getTrips()`, `getFuelData()`, `getMaintenanceData()`, `getMetrics()`
- ✅ Factory function `createCartrackClient()`
- ✅ Script de teste `scripts/test-cartrack.ts`

### ⚠️ **AÇÃO NECESSÁRIA**

1. **Acessar o portal Cartrack**
   - URL: https://fleetapi-pt.cartrack.com/rest/redoc.php
   - Fazer login com `ALVO00008`

2. **Verificar Status da Conta**
   - Confirmar se a conta está ativa
   - Verificar se tem acesso à **Fleet API**
   - A mensagem de erro indica que pode não ser um "Subscriber" da API

3. **Renovar/Criar Credenciais de API**
   - No painel Cartrack, procure por "API" ou "Integrações"
   - Pode ser necessário:
     - Ativar acesso à API
     - Gerar novas credenciais
     - Assinar plano que inclua acesso à API

4. **Atualizar `.env`**
   ```env
   CARTRACK_BASE_URL=https://fleetapi-pt.cartrack.com/rest
   CARTRACK_USERNAME=<novo_username>
   CARTRACK_PASSWORD=<nova_password>
   ```

5. **Testar**
   ```bash
   npx tsx scripts/test-cartrack.ts
   ```

### Contato Cartrack
Se precisar de suporte: fleet-api@cartrack.com

---

## 2. 🚕 Uber API

### Status Atual
🔄 **Implementação completa**  
⚠️ **Erro "invalid_scope"**: Os scopes `business.trips business.earnings` não estão configurados no app OAuth

### O que foi implementado
- ✅ Cliente com OAuth 2.0
- ✅ Auto-renovação de token
- ✅ Endpoints: `/organizations/{org}/trips`, `/organizations/{org}/drivers`
- ✅ Métodos: `getTrips()`, `getEarnings()`, `getDrivers()`, `getMetrics()`
- ✅ Factory function `createUberClient()`
- ✅ Script de teste `scripts/test-uber.ts`

### ⚠️ **AÇÃO NECESSÁRIA**

1. **Acessar Uber Developer Dashboard**
   - URL: https://developer.uber.com
   - Login com: `info@alvoradamagistral.eu / Alvorada@25`

2. **Localizar seu App OAuth**
   - Client ID: `0W89Kw8QMgGdesno5dBdvNdabnMw8KkL`
   - Ou criar um novo app se necessário

3. **Configurar Scopes**
   - No painel do app, seção "Scopes" ou "Permissions"
   - **Ativar os seguintes scopes:**
     - ✅ `business.trips` - Para acessar dados de viagens
     - ✅ `business.earnings` - Para acessar dados de ganhos

4. **Configurar Redirect URI** (se necessário)
   ```
   http://localhost:3000/api/auth/uber/callback
   https://conduz.pt/api/auth/uber/callback
   ```

5. **Obter Organization UUID**
   - No dashboard Uber, vá em "Organization Settings"
   - Copie o **Organization UUID**
   - Atualizar `.env`:
     ```env
     UBER_ORG_UUID=<seu_org_uuid>
     ```

6. **Atualizar `.env` (se gerou novas credenciais)**
   ```env
   UBER_CLIENT_ID=<client_id>
   UBER_CLIENT_SECRET=<client_secret>
   UBER_ORG_UUID=<org_uuid>
   ```

7. **Testar**
   ```bash
   npx tsx scripts/test-uber.ts
   ```

### Documentação Uber
- API Docs: https://developer.uber.com/docs/
- OAuth Guide: https://developer.uber.com/docs/riders/guides/authentication/introduction

---

## 3. ⚡ Bolt API

### Status Atual
⏳ **Não implementado** - Bolt não possui API pública oficial

### Opções

#### Opção A: API Oficial (se disponível)
1. **Verificar se existe API**
   - Acessar: https://fleet.bolt.eu
   - Login: `caroline@alvoradamagistral.eu / Muffin@2017`
   - Procurar seção "API", "Integrações" ou "Developer"

2. **Se encontrar API:**
   - Obter credenciais (API Key ou OAuth)
   - Informar para implementarmos o cliente

#### Opção B: Web Scraping (Puppeteer)
Se não houver API oficial, podemos implementar scraping:

**Prós:**
- ✅ Funciona sem API oficial
- ✅ Acessa todos os dados do painel

**Contras:**
- ❌ Mais lento que API
- ❌ Pode quebrar se mudarem o layout
- ❌ Requer credenciais do portal

**Implementação:**
```typescript
// lib/integrations/bolt/scraper.ts
// Usa Puppeteer para:
// 1. Login no fleet.bolt.eu
// 2. Navegar para seção de viagens
// 3. Extrair dados da tabela
// 4. Retornar métricas
```

### ⚠️ **AÇÃO NECESSÁRIA**
1. Acessar https://fleet.bolt.eu
2. Verificar se existe opção de API/Integrações
3. Informar o resultado para decidirmos a abordagem

---

## 4. 🛣️ ViaVerde

### Status Atual
⏳ **Não implementado** - Requer web scraping

### Dados Disponíveis
- Transações de portagens
- Estacionamento
- Combustível (se ativo)

### Implementação Planejada
```typescript
// Web scraping de www.viaverde.pt
- Login: info@alvoradamagistral.eu / Alvorada2025@
- Extrair transações por período
- Categorizar por tipo (portagem, parking, fuel)
```

### ⚠️ **AÇÃO NECESSÁRIA**
1. Confirmar que as credenciais estão corretas
2. Autorizar uso de web scraping (termos de serviço)
3. Confirmar prioridade (MÉDIA/BAIXA)

---

## 5. 📄 FONOA

### Status Atual
⏳ **Não implementado** - Gestão fiscal

### Dados Disponíveis
- Faturas emitidas
- Impostos pagos
- Relatórios fiscais

### ⚠️ **AÇÃO NECESSÁRIA**
1. Confirmar se FONOA tem API ou apenas portal
2. Validar credenciais: `info@alvoradamagistral.eu / Muffin@2017`
3. Definir prioridade (atual: BAIXA)

---

## 6. 💳 myprio

### Status Atual
⏳ **Não implementado** - Gestão de despesas

### Dados Disponíveis
- Despesas por categoria
- Combustível
- Manutenção
- Portagens
- Seguros

### Implementação Planejada
```typescript
// Account: 606845
// Password: Alvorada25@
// Extrair despesas categorizadas
```

### ⚠️ **AÇÃO NECESSÁRIA**
1. Verificar se myprio tem API
2. Confirmar credenciais funcionam
3. Autorizar scraping se necessário

---

## 🔧 Próximos Passos

### Imediato (Próximas 24h)
1. **Cartrack**: Resolver erro 401 - renovar credenciais ou ativar acesso à API
2. **Uber**: Configurar scopes `business.trips` e `business.earnings` no app OAuth
3. **Bolt**: Verificar se existe API oficial no portal fleet.bolt.eu

### Curto Prazo (Próxima semana)
4. **ViaVerde**: Implementar web scraping para transações
5. **myprio**: Implementar scraping de despesas
6. **Unified API**: Atualizar `/api/admin/metrics/unified` para usar clientes reais

### Médio Prazo
7. **FONOA**: Avaliar necessidade e implementar se prioritário
8. **Dashboard**: Integrar dados reais no painel admin
9. **Cache**: Implementar cache Redis para reduzir chamadas às APIs
10. **Monitoring**: Adicionar alertas para falhas nas integrações

---

## 📝 Checklist de Configuração

### Cartrack
- [ ] Acessar portal Cartrack
- [ ] Verificar status da conta / subscription
- [ ] Renovar ou gerar novas credenciais de API
- [ ] Atualizar `.env`
- [ ] Testar com `npx tsx scripts/test-cartrack.ts`

### Uber
- [ ] Acessar https://developer.uber.com
- [ ] Localizar app OAuth com client_id fornecido
- [ ] Ativar scopes: `business.trips`, `business.earnings`
- [ ] Confirmar Organization UUID
- [ ] Testar com `npx tsx scripts/test-uber.ts`

### Bolt
- [ ] Acessar https://fleet.bolt.eu
- [ ] Verificar se existe seção de API/Integrações
- [ ] Informar resultado (API ou scraping)
- [ ] Implementar cliente baseado no resultado

### Outras Plataformas
- [ ] ViaVerde: Validar credenciais e autorizar scraping
- [ ] myprio: Verificar se tem API ou usar scraping
- [ ] FONOA: Definir prioridade e abordagem

---

## 🆘 Suporte

Se precisar de ajuda:

1. **Erros de autenticação**: Verifique as credenciais no `.env`
2. **Erros de scope**: Confirme permissões no painel do desenvolvedor
3. **Erros 401/403**: Pode ser problema de subscription ou acesso não configurado
4. **Timeouts**: Verifique sua conexão e firewalls

Para cada plataforma, teste primeiro com os scripts em `scripts/test-*.ts` antes de usar no dashboard.
