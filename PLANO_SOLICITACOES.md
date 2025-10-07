# Sistema de Solicitações de Motoristas

## 🎯 Objetivo

Criar sistema completo de solicitações de motoristas com 4 status e fluxo automatizado.

## 📋 Requisitos

### 1. Tela de Solicitações (Admin)
- Renomear "Pedidos" → "Solicitações"
- 4 Status:
  1. **Pendente** - Aguardando análise
  2. **Em Avaliação** - Admin marcou que vai ligar
  3. **Aprovado** - Criar usuário + enviar senha por email
  4. **Negado** - Rejeitar + enviar email

### 2. Fluxo de Aprovação
- Admin pode mudar status
- Aprovado: Cria driver na collection drivers + envia email com senha
- Negado: Envia email de rejeição

### 3. Configuração de Motorista
- Admin configura após aprovação:
  - 4 integrações (uber, bolt, myprio, viaverde)
  - Dados bancários (IBAN)
  - Se locatário: valor do aluguel
  - Tipo: Afiliado ou Locatário

### 4. Painel do Motorista
- Login funcionando
- Tela inicial: Resumo da semana (só dele)
- Se locatário: Ver Cartrack do carro
- Todas as ações funcionais

## 🗄️ Estrutura de Dados

### Collection: driver_requests
```typescript
{
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'pending' | 'evaluation' | 'approved' | 'rejected';
  type: 'affiliate' | 'renter'; // Escolhido na solicitação
  createdAt: timestamp;
  updatedAt: timestamp;
  notes?: string; // Notas do admin
  rejectionReason?: string; // Motivo da rejeição
}
```

### Collection: drivers (após aprovação)
```typescript
{
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  type: 'affiliate' | 'renter';
  password: string; // Hash
  integrations: {
    uber: { key: string, enabled: boolean },
    bolt: { key: string, enabled: boolean },
    myprio: { key: string, enabled: boolean },
    viaverde: { key: string, enabled: boolean }
  };
  banking: {
    iban: string;
    accountHolder: string;
  };
  rental?: {
    amount: number; // Valor do aluguel (se locatário)
  };
  vehicle: {
    plate: string;
    make: string;
    model: string;
    year: number;
  };
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

## 📁 Arquivos a Criar/Modificar

### 1. Páginas
- [ ] `pages/admin/requests/index.tsx` - Lista de solicitações
- [ ] `pages/admin/requests/[id].tsx` - Detalhes da solicitação
- [ ] `pages/driver/dashboard.tsx` - Painel do motorista
- [ ] `pages/driver/weekly.tsx` - Resumo semanal do motorista

### 2. APIs
- [ ] `pages/api/admin/requests/index.ts` - Listar solicitações
- [ ] `pages/api/admin/requests/[id].ts` - Atualizar status
- [ ] `pages/api/admin/requests/approve.ts` - Aprovar solicitação
- [ ] `pages/api/admin/requests/reject.ts` - Rejeitar solicitação
- [ ] `pages/api/driver/auth/login.ts` - Login do motorista
- [ ] `pages/api/driver/weekly.ts` - Dados semanais do motorista

### 3. Schemas
- [ ] `schemas/driver-request.ts` - Schema de solicitação
- [ ] Atualizar `schemas/driver.ts` - Adicionar campos rental

### 4. Lib
- [ ] `lib/email/templates.ts` - Templates de email
- [ ] `lib/auth/driverAuth.ts` - Autenticação de motorista

## 🔄 Fluxo Completo

```
1. Motorista preenche formulário de solicitação
   ↓
2. Salvo em driver_requests com status=pending
   ↓
3. Admin vê em /admin/requests
   ↓
4. Admin muda para "Em Avaliação" (vai ligar)
   ↓
5. Admin decide:
   
   A) APROVAR:
      - Cria registro em drivers
      - Gera senha aleatória
      - Envia email com credenciais
      - Status = approved
      - Admin configura integrações
   
   B) NEGAR:
      - Envia email de rejeição
      - Status = rejected
   ↓
6. Motorista recebe email
   ↓
7. Motorista faz login em /driver/login
   ↓
8. Motorista vê dashboard com:
   - Resumo da semana
   - Cartrack (se locatário)
   - Histórico de pagamentos
```

## 📧 Templates de Email

### Email de Aprovação
```
Assunto: Bem-vindo à Conduz.pt! 🎉

Olá [Nome],

Sua solicitação foi aprovada!

Credenciais de acesso:
Email: [email]
Senha: [senha_gerada]

Acesse: https://conduz.pt/driver/login

Bem-vindo à equipe!

Conduz.pt
```

### Email de Rejeição
```
Assunto: Atualização sobre sua solicitação

Olá [Nome],

Infelizmente não podemos aprovar sua solicitação neste momento.

Motivo: [motivo]

Se tiver dúvidas, entre em contato conosco.

Conduz.pt
```

## ✅ Checklist de Implementação

### Fase 1: Backend
- [ ] Criar schemas
- [ ] Criar APIs de solicitações
- [ ] Criar API de aprovação
- [ ] Criar API de rejeição
- [ ] Criar templates de email
- [ ] Criar autenticação de motorista

### Fase 2: Admin
- [ ] Criar página de lista de solicitações
- [ ] Criar página de detalhes
- [ ] Implementar mudança de status
- [ ] Implementar aprovação
- [ ] Implementar rejeição
- [ ] Testar fluxo completo

### Fase 3: Motorista
- [ ] Criar página de login
- [ ] Criar dashboard
- [ ] Criar página de resumo semanal
- [ ] Integrar Cartrack (se locatário)
- [ ] Testar login e acesso

### Fase 4: Testes
- [ ] Testar solicitação → aprovação → login
- [ ] Testar solicitação → rejeição → email
- [ ] Testar dashboard do motorista
- [ ] Testar resumo semanal
- [ ] Testar Cartrack

## 🚀 Prioridade

1. ✅ Corrigir erro Excel (FEITO)
2. 🔄 Criar sistema de solicitações (EM ANDAMENTO)
3. 🔄 Criar painel do motorista
4. 🔄 Testar tudo

---

**Status:** EM DESENVOLVIMENTO  
**Início:** 07/10/2025 06:00  
**Prazo:** 4 horas
