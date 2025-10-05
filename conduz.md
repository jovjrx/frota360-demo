# Prompt Completo: Reestruturação do Conduz PT

## Contexto do Projeto

O **Conduz PT** é uma plataforma para gestão de motoristas TVDE (Uber, Bolt) em Portugal. O projeto usa Next.js 15 (Pages Router), TypeScript, Chakra UI, Firebase e está hospedado no Vercel.

**Repositório:** https://github.com/jovjrx/conduz-pt
**Site em produção:** https://conduz.pt

---

## Problemas Atuais

1. ❌ **Menu mostrando chaves de tradução** (navigation.home, navigation.drivers) ao invés dos textos traduzidos
2. ❌ **Painel admin ainda está com layout antigo** (AdminLayout) ao invés do novo dashboard simplificado
3. ❌ **Traduções incompletas** - faltam várias chaves nos arquivos de locale
4. ❌ **Modelo de negócio desatualizado** - ainda tem referências a "Para Empresas" que deve ser removido

---

## Objetivo Final

Criar uma plataforma simplificada focada em:

### 1. Site Público (PT/EN)
- Menu funcionando com traduções corretas
- Foco em 2 tipos de motorista: **Afiliados** (veículo próprio) e **Locatários** (alugam veículos da Conduz)
- Remover completamente seção "Para Empresas"
- Formulário de solicitação simples em `/request`

### 2. Painel do Motorista (`/drivers`)
- Apenas visualizar status da candidatura (Pendente/Aprovado/Rejeitado)
- Informações básicas da conta
- Sem funcionalidades complexas (documentos, pagamentos, etc)

### 3. Painel Admin (`/admin`)
**Dashboard Principal com visão de Gestor TVDE:**

#### KPIs Financeiros (Últimos 30 dias)
- Receita Total (€)
- Despesas Totais (€)
- Lucro Líquido (€)
- Margem de Lucro (%)
- Total de Viagens

#### Performance Operacional
- Veículos Ativos
- Taxa de Utilização da Frota (%)
- Motoristas Ativos
- Divisão: Afiliados vs Locatários

#### Status das Integrações
- Uber, Bolt, Cartrack, ViaVerde, FONOA, myprio
- Indicador online/offline
- Última sincronização

#### Ações Rápidas
- Gestão de Solicitações → `/admin/requests`
- Métricas Detalhadas → `/admin/metrics`
- Gestão de Conteúdo → `/admin/content`

### 4. Integrações com Plataformas
Conectar e buscar dados de:
- **Uber** - info@alvoradamagistral.eu / Alvorada@25
- **Bolt** - caroline@alvoradamagistral.eu / Muffin@2017
- **Cartrack** - ALVO00008 / Alvorada2025@
- **FONOA** - info@alvoradamagistral.eu / Muffin@2017
- **ViaVerde** - info@alvoradamagistral.eu / Alvorada2025@
- **myprio** - 606845 / Alvorada25@

---

## Requisitos Técnicos Detalhados

### 1. Sistema de Tradução

**Estrutura:**
```
translations/
├── common/constants.ts
├── navigation/constants.ts
├── forms/constants.ts
├── services/constants.ts
├── auth/constants.ts
└── admin/constants.ts

locales/
├── pt/
│   ├── common.json
│   ├── home.json
│   ├── request.json
│   └── admin.json
└── en/
    ├── common.json
    ├── home.json
    ├── request.json
    └── admin.json
```

**Regras:**
- Todas as traduções devem usar constantes (ex: `t(COMMON.NAVIGATION.HOME)`)
- Cada página carrega `common` + suas próprias traduções
- Tudo SSR (Server-Side Rendering) - nada no cliente
- Editor de conteúdo para textos dinâmicos com suporte PT/EN

**Traduções Obrigatórias em `common.json`:**
```json
{
  "navigation": {
    "home": "Início",
    "drivers": "Motoristas", 
    "about": "Sobre",
    "contact": "Contacto"
  },
  "seo": {
    "default": {
      "title": "Conduz PT - Plataforma para Motoristas TVDE",
      "description": "..."
    }
  },
  "hero": {
    "title": "...",
    "subtitle": "...",
    "ctaPrimary": "Candidatar-me Agora",
    "ctaSecondary": "Falar no WhatsApp"
  },
  "actions": { ... },
  "status": { ... },
  "messages": { ... },
  "validation": { ... },
  "company": { ... },
  "footer": { ... },
  "faq": { ... },
  "testimonials": { ... }
}
```

### 2. Modelo de Negócio Simplificado

**Remover:**
- ❌ Página `/services/companies`
- ❌ Referências a "Para Empresas"
- ❌ `/signup.tsx` (cadastro complexo)
- ❌ `/drivers/onboarding.tsx`
- ❌ `/drivers/documents.tsx`
- ❌ `/drivers/payments.tsx`
- ❌ `/drivers/subscription.tsx`
- ❌ APIs de billing, documentos, check-in

**Manter:**
- ✅ `/request` - Formulário de solicitação
- ✅ `/drivers` - Dashboard simplificado
- ✅ `/admin` - Painel administrativo

### 3. Formulário de Solicitação (`/request`)

**Campos:**
```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  driverType: 'affiliate' | 'renter'; // Afiliado ou Locatário
  vehicle?: { // Apenas se affiliate
    make: string;
    model: string;
    year: number;
    plate: string;
  };
}
```

**Fluxo:**
1. Motorista preenche formulário
2. Cria registro na tabela `requests` no Firebase
3. Status inicial: `pending`
4. Admin recebe notificação

### 4. Painel Admin - Dashboard Principal

**Arquivo:** `/pages/admin/index.tsx`

**Layout:** Usar `LoggedInLayout` (NÃO AdminLayout)

**Estrutura:**
```tsx
<Container maxW="container.xl">
  {/* Header */}
  <Heading>Dashboard de Gestão TVDE</Heading>
  <Text>Visão geral do negócio - Últimos 30 dias</Text>

  {/* KPIs Principais - Grid 4 colunas */}
  <SimpleGrid columns={4}>
    <Card>Receita Total</Card>
    <Card>Despesas Totais</Card>
    <Card>Lucro Líquido</Card>
    <Card>Total de Viagens</Card>
  </SimpleGrid>

  {/* Frota e Motoristas - Grid 2 colunas */}
  <SimpleGrid columns={2}>
    <Card>
      Frota Ativa
      - Número de veículos
      - Taxa de utilização (Progress bar)
    </Card>
    <Card>
      Motoristas Ativos
      - Total
      - Afiliados vs Locatários
    </Card>
  </SimpleGrid>

  {/* Status das Integrações */}
  <Card>
    <SimpleGrid columns={3}>
      {integrações.map(i => (
        <HStack>
          <Text>{i.name}</Text>
          <Icon status={i.status} />
          <Text>{i.lastSync}</Text>
        </HStack>
      ))}
    </SimpleGrid>
  </Card>

  {/* Ações Rápidas - Grid 3 colunas */}
  <SimpleGrid columns={3}>
    <Button href="/admin/requests">Gestão de Solicitações</Button>
    <Button href="/admin/metrics">Métricas Detalhadas</Button>
    <Button href="/admin/content">Gestão de Conteúdo</Button>
  </SimpleGrid>

  {/* Alertas */}
  {errors.length > 0 && (
    <Alert status="warning">
      Problemas nas integrações
    </Alert>
  )}
</Container>
```

**API para métricas:**
```
GET /api/admin/metrics/unified?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

Response:
{
  success: true,
  data: {
    summary: {
      totalEarnings: 50000,
      totalExpenses: 30000,
      netProfit: 20000,
      totalTrips: 1500,
      activeVehicles: 25,
      activeDrivers: 30
    },
    platforms: {
      uber: { ... },
      bolt: { ... },
      cartrack: { ... },
      viaverde: { ... },
      fonoa: { ... },
      myprio: { ... }
    },
    errors: []
  }
}
```

### 5. Gestão de Solicitações (`/admin/requests`)

**Funcionalidades:**
- Listar todas as solicitações
- Filtros: Todas / Pendentes / Aprovadas / Rejeitadas
- Estatísticas: Total, Pendentes, Aprovadas, Rejeitadas
- Ações por solicitação:
  - ✅ Aprovar (com notas opcionais)
  - ❌ Rejeitar (motivo obrigatório)
  - 📝 Adicionar notas administrativas

**APIs:**
```
GET /api/admin/requests/index?status=all|pending|approved|rejected
POST /api/admin/requests/approve { requestId, adminNotes }
POST /api/admin/requests/reject { requestId, rejectionReason }
```

### 6. Métricas Detalhadas (`/admin/metrics`)

**Funcionalidades:**
- Filtros de período: Hoje, Semana, Mês, Trimestre, Ano, Personalizado
- Tabs por plataforma (Uber, Bolt, Cartrack, etc)
- Visualização de dados brutos em JSON
- Indicadores de sucesso/erro
- Botão para testar conexão com cada plataforma

**Métricas por Plataforma:**

**Uber/Bolt:**
- Total de viagens
- Receita total
- Ticket médio
- Motoristas ativos

**Cartrack:**
- Veículos rastreados
- Km rodados
- Tempo de operação
- Alertas de manutenção

**ViaVerde:**
- Transações (portagens, estacionamento, combustível)
- Valor total gasto
- Gastos por categoria

**FONOA:**
- Faturas emitidas
- Total faturado
- Impostos pagos

**myprio:**
- Despesas por categoria
- Total de despesas
- Comparação mensal

### 7. Integrações - Estrutura

**Arquivo:** `/lib/integrations/`

**Base Client:**
```typescript
class BaseIntegrationClient {
  protected baseUrl: string;
  protected credentials: any;
  
  async authenticate(): Promise<void>;
  async makeRequest(method, endpoint, data?): Promise<any>;
  async testConnection(): Promise<{ success: boolean; error?: string }>;
}
```

**Cada plataforma:**
```typescript
class UberClient extends BaseIntegrationClient {
  async getTrips(startDate, endDate): Promise<Trip[]>;
  async getEarnings(startDate, endDate): Promise<Earnings>;
  async getDrivers(): Promise<Driver[]>;
}

class BoltClient extends BaseIntegrationClient { ... }
class CartrackClient extends BaseIntegrationClient { ... }
class ViaVerdeClient extends BaseIntegrationClient { ... }
class FONOAClient extends BaseIntegrationClient { ... }
class MyprioClient extends BaseIntegrationClient { ... }
```

**API para testar:**
```
POST /api/admin/integrations/test
Body: { platform: "uber" | "bolt" | ... }

Response:
{
  success: true,
  platform: "uber",
  data: { ... },
  error: null
}
```

### 8. Painel do Motorista (`/drivers`)

**Funcionalidades:**
- Ver status da candidatura
- Informações básicas da conta
- Mensagem do admin (se houver)

**Layout:**
```tsx
<LoggedInLayout>
  <Container>
    <Heading>Bem-vindo, {name}</Heading>
    
    <Card>
      <Heading>Status da Candidatura</Heading>
      <Badge status={request.status}>
        {status === 'pending' && '⏳ Pendente'}
        {status === 'approved' && '✅ Aprovado'}
        {status === 'rejected' && '❌ Rejeitado'}
      </Badge>
      
      {status === 'pending' && (
        <Text>Sua candidatura está em análise...</Text>
      )}
      
      {status === 'approved' && (
        <Text>Parabéns! Você foi aprovado.</Text>
      )}
      
      {status === 'rejected' && (
        <Text>Motivo: {rejectionReason}</Text>
      )}
      
      {adminNotes && (
        <Alert>
          <Text>Nota do Admin: {adminNotes}</Text>
        </Alert>
      )}
    </Card>
    
    <Card>
      <Heading>Informações da Conta</Heading>
      <Text>Email: {email}</Text>
      <Text>Telefone: {phone}</Text>
      <Text>Tipo: {driverType === 'affiliate' ? 'Afiliado' : 'Locatário'}</Text>
    </Card>
  </Container>
</LoggedInLayout>
```

---

## Checklist de Implementação

### Fase 1: Traduções
- [ ] Criar todas as constantes em `/translations/`
- [ ] Preencher `/locales/pt/common.json` com todas as chaves
- [ ] Preencher `/locales/en/common.json` com todas as chaves
- [ ] Criar `/locales/pt/home.json` e `/locales/en/home.json`
- [ ] Criar `/locales/pt/request.json` e `/locales/en/request.json`
- [ ] Criar `/locales/pt/admin.json` e `/locales/en/admin.json`
- [ ] Testar menu (deve mostrar "Início", "Motoristas", etc)
- [ ] Testar troca de idioma PT ↔ EN

### Fase 2: Limpeza
- [ ] Remover `/pages/signup.tsx`
- [ ] Remover `/pages/drivers/onboarding.tsx`
- [ ] Remover `/pages/drivers/documents.tsx`
- [ ] Remover `/pages/drivers/payments.tsx`
- [ ] Remover `/pages/drivers/subscription.tsx`
- [ ] Remover `/pages/services/companies.tsx`
- [ ] Remover `/pages/api/billing/`
- [ ] Remover `/pages/api/drivers/checkin.ts`
- [ ] Remover `/pages/api/drivers/documents.ts`
- [ ] Atualizar `/pages/index.tsx` (remover seção empresas)
- [ ] Atualizar menu (remover link empresas)

### Fase 3: Formulário de Solicitação
- [ ] Criar schema `/schemas/request.ts`
- [ ] Criar API `POST /api/requests/create`
- [ ] Criar página `/pages/request.tsx`
- [ ] Formulário com campos: nome, email, telefone, cidade, tipo
- [ ] Se afiliado, mostrar campos de veículo
- [ ] Validação com Zod
- [ ] Salvar no Firebase collection `requests`
- [ ] Mensagem de sucesso após envio

### Fase 4: Painel Admin - Dashboard
- [ ] Substituir `/pages/admin/index.tsx` completamente
- [ ] Usar `LoggedInLayout` (não AdminLayout)
- [ ] Criar seção KPIs (4 cards)
- [ ] Criar seção Frota e Motoristas (2 cards)
- [ ] Criar seção Status das Integrações (6 plataformas)
- [ ] Criar seção Ações Rápidas (3 botões)
- [ ] Criar seção Alertas (se houver erros)
- [ ] Buscar dados da API `/api/admin/metrics/unified`
- [ ] Formatar valores em EUR (€)
- [ ] Mostrar percentuais e variações

### Fase 5: Gestão de Solicitações
- [ ] Criar API `GET /api/admin/requests/index`
- [ ] Criar API `POST /api/admin/requests/approve`
- [ ] Criar API `POST /api/admin/requests/reject`
- [ ] Criar página `/pages/admin/requests.tsx`
- [ ] Listar solicitações em tabela
- [ ] Filtros por status
- [ ] Cards com estatísticas
- [ ] Modal para aprovar (com campo de notas)
- [ ] Modal para rejeitar (com campo de motivo obrigatório)
- [ ] Atualizar lista após ação

### Fase 6: Integrações
- [ ] Criar `/lib/integrations/base-client.ts`
- [ ] Criar `/lib/integrations/uber/client.ts`
- [ ] Criar `/lib/integrations/bolt/client.ts`
- [ ] Criar `/lib/integrations/cartrack/client.ts`
- [ ] Criar `/lib/integrations/viaverde/client.ts`
- [ ] Criar `/lib/integrations/fonoa/client.ts`
- [ ] Criar `/lib/integrations/myprio/client.ts`
- [ ] Implementar método `testConnection()` em cada
- [ ] Implementar métodos de busca de dados
- [ ] Criar API `POST /api/admin/integrations/test`
- [ ] Criar API `GET /api/admin/metrics/unified`
- [ ] Adicionar variáveis de ambiente no `.env`

### Fase 7: Métricas Detalhadas
- [ ] Criar página `/pages/admin/metrics.tsx`
- [ ] Filtros de período (hoje, semana, mês, etc)
- [ ] Tabs por plataforma
- [ ] Visualização de métricas consolidadas
- [ ] Visualização de dados brutos (JSON)
- [ ] Indicadores de status (online/offline)
- [ ] Botão "Testar Conexão" por plataforma
- [ ] Gráficos (opcional)

### Fase 8: Painel do Motorista
- [ ] Simplificar `/pages/drivers/index.tsx`
- [ ] Mostrar apenas status da candidatura
- [ ] Mostrar informações básicas
- [ ] Mostrar notas do admin (se houver)
- [ ] Remover funcionalidades complexas

### Fase 9: Testes
- [ ] Build sem erros (`yarn build`)
- [ ] TypeCheck sem erros (`yarn typecheck`)
- [ ] Testar menu em PT
- [ ] Testar menu em EN
- [ ] Testar formulário de solicitação
- [ ] Testar painel admin (todas as páginas)
- [ ] Testar painel motorista
- [ ] Testar responsividade (mobile, tablet, desktop)
- [ ] Testar integrações (se APIs disponíveis)

### Fase 10: Deploy
- [ ] Commit e push para GitHub
- [ ] Deploy no Vercel
- [ ] Configurar variáveis de ambiente
- [ ] Testar site em produção
- [ ] Verificar traduções
- [ ] Verificar painel admin

---

## Variáveis de Ambiente

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Session
SESSION_SECRET=

# Uber
UBER_CLIENT_ID=
UBER_CLIENT_SECRET=
UBER_ORG_UUID=

# Bolt
BOLT_EMAIL=caroline@alvoradamagistral.eu
BOLT_PASSWORD=Muffin@2017

# Cartrack
CARTRACK_USERNAME=ALVO00008
CARTRACK_PASSWORD=Alvorada2025@

# FONOA
FONOA_EMAIL=info@alvoradamagistral.eu
FONOA_PASSWORD=Muffin@2017

# ViaVerde
VIAVERDE_EMAIL=info@alvoradamagistral.eu
VIAVERDE_PASSWORD=Alvorada2025@

# myprio
MYPRIO_ACCOUNT_ID=606845
MYPRIO_PASSWORD=Alvorada25@
```

---

## Estrutura Final de Arquivos

```
conduz-pt/
├── pages/
│   ├── index.tsx                      # Home (sem seção empresas)
│   ├── request.tsx                    # Formulário de solicitação
│   ├── about.tsx
│   ├── contact.tsx
│   ├── login.tsx
│   ├── drivers/
│   │   └── index.tsx                  # Dashboard simplificado
│   ├── admin/
│   │   ├── index.tsx                  # Dashboard TVDE (NOVO)
│   │   ├── requests.tsx               # Gestão de solicitações
│   │   ├── metrics.tsx                # Métricas detalhadas
│   │   └── content.tsx                # Editor de conteúdo
│   └── api/
│       ├── requests/
│       │   └── create.ts
│       └── admin/
│           ├── requests/
│           │   ├── index.ts
│           │   ├── approve.ts
│           │   └── reject.ts
│           ├── metrics/
│           │   └── unified.ts
│           └── integrations/
│               └── test.ts
├── lib/
│   ├── integrations/
│   │   ├── base-client.ts
│   │   ├── uber/client.ts
│   │   ├── bolt/client.ts
│   │   ├── cartrack/client.ts
│   │   ├── viaverde/client.ts
│   │   ├── fonoa/client.ts
│   │   ├── myprio/client.ts
│   │   └── index.ts
│   ├── translations.ts
│   └── session/
├── translations/
│   ├── common/constants.ts
│   ├── navigation/constants.ts
│   ├── forms/constants.ts
│   ├── services/constants.ts
│   ├── auth/constants.ts
│   ├── admin/constants.ts
│   └── index.ts
├── locales/
│   ├── pt/
│   │   ├── common.json
│   │   ├── home.json
│   │   ├── request.json
│   │   └── admin.json
│   └── en/
│       ├── common.json
│       ├── home.json
│       ├── request.json
│       └── admin.json
├── schemas/
│   └── request.ts
└── components/
    ├── Header.tsx
    ├── LoggedInLayout.tsx
    └── ...
```

---

## Critérios de Sucesso

### ✅ Site Público
- [ ] Menu mostra textos traduzidos (não chaves)
- [ ] Troca de idioma PT ↔ EN funciona
- [ ] Não há seção "Para Empresas"
- [ ] Formulário de solicitação funciona
- [ ] Responsivo em todos os dispositivos

### ✅ Painel Admin
- [ ] Dashboard mostra KPIs financeiros corretos
- [ ] Dashboard mostra métricas operacionais
- [ ] Status das integrações visível
- [ ] Gestão de solicitações funciona (aprovar/rejeitar)
- [ ] Métricas detalhadas por plataforma
- [ ] Usa LoggedInLayout (não AdminLayout)

### ✅ Painel Motorista
- [ ] Mostra status da candidatura
- [ ] Mostra informações básicas
- [ ] Não tem funcionalidades complexas

### ✅ Integrações
- [ ] Estrutura de clientes criada
- [ ] Método testConnection() funciona
- [ ] APIs retornam dados (mesmo que mock)

### ✅ Qualidade
- [ ] Build sem erros
- [ ] TypeCheck sem erros
- [ ] Código limpo e organizado
- [ ] Sem código duplicado
- [ ] Comentários onde necessário

---

## Notas Importantes

1. **Prioridade:** Traduções primeiro, depois painel admin, depois integrações
2. **Layout:** Admin DEVE usar `LoggedInLayout`, NÃO `AdminLayout`
3. **Simplicidade:** Menos é mais - remover tudo que não é essencial
4. **Foco:** Gestor TVDE precisa tomar decisões de negócio rapidamente
5. **Dados:** Se APIs reais não disponíveis, usar dados mock realistas
6. **Performance:** Cache de métricas (opcional mas recomendado)
7. **Segurança:** Validar todas as entradas, proteger rotas admin
8. **UX:** Interface limpa, clara e objetiva

---

## Perguntas que o Dashboard Deve Responder

### Para o Gestor:
1. **Quanto estou ganhando?** → Receita Total
2. **Quanto estou gastando?** → Despesas Totais
3. **Qual meu lucro real?** → Lucro Líquido
4. **Minha operação está saudável?** → Margem de Lucro
5. **Quantos veículos estão trabalhando?** → Veículos Ativos
6. **Minha frota está sendo bem utilizada?** → Taxa de Utilização
7. **Quantos motoristas tenho?** → Motoristas Ativos
8. **Qual a composição da equipe?** → Afiliados vs Locatários
9. **As plataformas estão funcionando?** → Status das Integrações
10. **Há problemas que preciso resolver?** → Alertas

---

## Exemplo de Dashboard Ideal

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard de Gestão TVDE                                   │
│  Visão geral do negócio - Últimos 30 dias                   │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Receita      │ Despesas     │ Lucro        │ Viagens      │
│ €50.000      │ €30.000      │ €20.000      │ 1.500        │
│ ↑ 12.5%      │ ↓ 3.2%       │ Margem: 40%  │ €33/viagem   │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────┬─────────────────────────────┐
│ Frota Ativa                 │ Motoristas Ativos           │
│                             │                             │
│ 25 Veículos                 │ 30 Motoristas               │
│                             │                             │
│ Taxa de Utilização          │ Afiliados: 18               │
│ ████████████░░░░ 85%        │ Locatários: 12              │
└─────────────────────────────┴─────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Status das Integrações                                      │
│                                                             │
│ ✅ Uber (2 min)  ✅ Bolt (5 min)  ✅ Cartrack (1 min)      │
│ ✅ ViaVerde (3)  ⚠️  FONOA (2h)   ✅ myprio (10 min)       │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ [Solicitações]│ [Métricas]  │ [Conteúdo]   │
└──────────────┴──────────────┴──────────────┘

⚠️  Atenção: 1 plataforma com problemas
```

---

## Conclusão

Este prompt contém **TUDO** que precisa ser implementado no projeto Conduz PT. Siga fase por fase, testando cada etapa antes de avançar. O objetivo é criar uma plataforma simples, funcional e focada nas necessidades reais de um gestor TVDE.
