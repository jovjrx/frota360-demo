# Transformação Conduz-PT → Frota360-Demo

## Objetivo
Transformar uma réplica do `conduz-pt` em `frota360-demo` com dados mockados, cores/logo customizadas e autenticação chumbada, mantendo a mesma arquitetura Pages Router.

---

## 📋 Checklist de Transformação

Este documento é um **guia executável** para transformar o projeto. Siga cada seção em ordem.

---

## 1️⃣ Configuração de Cores e Branding

### 1.1 Modificar o Tema (Chakra UI)

**Arquivo:** `lib/theme.ts`

**Ação:** Substituir a paleta de cores verde Portugal pela paleta Frota360 (azul escuro + ciano).

**Código Original:**
```typescript
const colors = {
  brand: {
    50:  "#E8F5E8",
    100: "#C6E6C6",
    200: "#9DD49D",
    300: "#74C274",
    400: "#4BB04B",
    500: "#228B22", // verde principal
    600: "#1E7A1E",
    700: "#1A691A",
    800: "#165816",
    900: "#124712",
  }
};
```

**Código Novo (Frota360):**
```typescript
const colors = {
  brand: {
    50:  "#F0F4FF",
    100: "#D9E5FF",
    200: "#B3CBFF",
    300: "#8DB2FF",
    400: "#6799FF",
    500: "#0066FF", // azul principal Frota360
    600: "#0052CC",
    700: "#003D99",
    800: "#002966",
    900: "#001433",
  },
  accent: {
    50:  "#F0FFFE",
    100: "#D9FFFC",
    200: "#B3FFF9",
    300: "#8DFFF5",
    400: "#67FFF1",
    500: "#00D4FF", // ciano Frota360
    600: "#00A8CC",
    700: "#007C99",
    800: "#005066",
    900: "#002433",
  }
};
```

**Impacto:** Todas as referências a `brand.500` mudarão de verde para azul. Componentes que usam `colorScheme="brand"` (Checkbox, Switch, Progress) também mudarão.

---

### 1.2 Atualizar Logo e Imagens

**Arquivos a Modificar:**
- `public/logo.png` → Substituir pela logo Frota360
- `public/logo-white.png` → Versão branca da logo
- `public/favicon.ico` → Favicon Frota360
- `public/og-image.png` → Imagem Open Graph

**Ação:**
1. Substituir os arquivos PNG/ICO com as versões Frota360
2. Manter os mesmos nomes de arquivo para não quebrar referências

**Componentes que Usam Logo:**
- `components/Header.tsx` → Referencia `public/logo.png`
- `components/Footer.tsx` → Referencia `public/logo-white.png`
- `components/LoggedInLayout.tsx` → Referencia `public/logo.png`

---

### 1.3 Atualizar Metadados e SEO

**Arquivo:** `lib/seo.ts` (ou similar)

**Ações:**
1. Substituir `title` de "Conduz.pt" para "Frota360"
2. Substituir `description` para descrição Frota360
3. Atualizar `og:image` para imagem Frota360
4. Atualizar `og:url` para URL demo (`demo.frota360.pt`)

**Exemplo:**
```typescript
export const SEO = {
  title: "Frota360 - Gestão TVDE Completa",
  description: "Plataforma de gestão de frotas TVDE com painel admin, app motorista e integrações.",
  og: {
    image: "/og-image-frota360.png",
    url: "https://demo.frota360.pt",
  }
};
```

---

## 2️⃣ Autenticação Chumbada

### 2.1 Criar Sistema de Autenticação Mockado

**Arquivo:** `lib/auth-mock.ts` (novo arquivo)

**Ação:** Criar um sistema de autenticação que simula login com credenciais chumbadas.

**Código:**
```typescript
// lib/auth-mock.ts

export interface MockUser {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'driver';
  driverId?: string;
}

export const MOCK_USERS = {
  admin: {
    email: 'admin@frota360-demo.pt',
    password: 'Demo@2025',
    uid: 'admin-001',
    name: 'Admin Demo',
    role: 'admin' as const,
  },
  driver: {
    email: 'motorista@frota360-demo.pt',
    password: 'Demo@2025',
    uid: 'driver-001',
    name: 'João Silva',
    role: 'driver' as const,
    driverId: 'MOT001',
  },
};

export function validateMockCredentials(email: string, password: string): MockUser | null {
  for (const [key, user] of Object.entries(MOCK_USERS)) {
    if (user.email === email && user.password === password) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as MockUser;
    }
  }
  return null;
}

export function getMockUserByEmail(email: string): MockUser | null {
  for (const [key, user] of Object.entries(MOCK_USERS)) {
    if (user.email === email) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as MockUser;
    }
  }
  return null;
}
```

---

### 2.2 Modificar Página de Login

**Arquivo:** `pages/login.tsx`

**Ação:** Substituir autenticação Firebase por autenticação mockada.

**Mudanças:**
1. Importar `validateMockCredentials` de `lib/auth-mock.ts`
2. Substituir chamada Firebase por validação local
3. Armazenar credenciais em localStorage ou cookie (para SSR)
4. Redirecionar para `/admin` ou `/dashboard` conforme role

**Exemplo de Função de Login:**
```typescript
async function handleLogin(email: string, password: string) {
  const user = validateMockCredentials(email, password);
  
  if (!user) {
    toast.error('Email ou senha incorretos');
    return;
  }
  
  // Armazenar em localStorage (ou cookie para SSR)
  localStorage.setItem('frota360_user', JSON.stringify(user));
  
  // Redirecionar conforme role
  if (user.role === 'admin') {
    router.push('/admin');
  } else {
    router.push('/dashboard');
  }
}
```

---

### 2.3 Modificar AuthProvider

**Arquivo:** `lib/auth.tsx`

**Ação:** Adaptar o AuthProvider para ler dados mockados em vez de Firebase.

**Mudanças:**
1. Remover `onAuthStateChanged` do Firebase
2. Ler `localStorage` para recuperar usuário
3. Simular SSR com dados mockados

**Exemplo:**
```typescript
export function AuthProvider({ children, initialUserData }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(initialUserData || null);
  const [loading, setLoading] = useState(!initialUserData);

  useEffect(() => {
    if (initialUserData) {
      setUserData(initialUserData);
      setLoading(false);
      return;
    }

    // Ler do localStorage (mock)
    const stored = localStorage.getItem('frota360_user');
    if (stored) {
      setUserData(JSON.parse(stored));
    }
    setLoading(false);
  }, [initialUserData]);

  // ... resto do código
}
```

---

## 3️⃣ Dados Mockados (JSON)

### 3.1 Criar Estrutura de Dados Mockados

**Diretório:** `data/` (novo)

**Arquivos a Criar:**
- `data/motoristas.json` - Lista de motoristas
- `data/pagamentos.json` - Histórico de pagamentos
- `data/metas.json` - Metas ativas
- `data/comissoes.json` - Configurações de comissão
- `data/indicacoes.json` - Dados de indicação/recrutamento

---

### 3.2 Exemplo: `data/motoristas.json`

```json
{
  "motoristas": [
    {
      "id": "MOT001",
      "nome": "João Silva",
      "email": "joao.silva@example.pt",
      "telefone": "+351 912 345 678",
      "status": "Ativo",
      "dataEfetivacao": "2024-01-15",
      "plataformas": ["Uber", "Bolt"],
      "corridas_semana": 45,
      "ganho_bruto": 1250.50,
      "comissao": 125.05,
      "indicacoes_aprovadas": 2,
      "bonus_indicacao": 200.00,
      "documentos": {
        "cartao_cidadao": "verified",
        "carta_conducao": "verified",
        "seguro": "verified"
      }
    },
    {
      "id": "MOT002",
      "nome": "Maria Santos",
      "email": "maria.santos@example.pt",
      "telefone": "+351 912 345 679",
      "status": "Ativo",
      "dataEfetivacao": "2024-02-20",
      "plataformas": ["Uber"],
      "corridas_semana": 38,
      "ganho_bruto": 950.75,
      "comissao": 95.08,
      "indicacoes_aprovadas": 0,
      "bonus_indicacao": 0,
      "documentos": {
        "cartao_cidadao": "verified",
        "carta_conducao": "verified",
        "seguro": "pending"
      }
    },
    {
      "id": "MOT003",
      "nome": "Pedro Oliveira",
      "email": "pedro.oliveira@example.pt",
      "telefone": "+351 912 345 680",
      "status": "Inativo",
      "dataEfetivacao": "2023-06-10",
      "plataformas": ["Bolt", "MyPRIO"],
      "corridas_semana": 0,
      "ganho_bruto": 0,
      "comissao": 0,
      "indicacoes_aprovadas": 1,
      "bonus_indicacao": 100.00,
      "documentos": {
        "cartao_cidadao": "verified",
        "carta_conducao": "expired",
        "seguro": "verified"
      }
    }
  ]
}
```

---

### 3.3 Exemplo: `data/pagamentos.json`

```json
{
  "pagamentos": [
    {
      "id": "PAG001",
      "motorista_id": "MOT001",
      "semana": "2025-10-20",
      "status": "Pago",
      "data_pagamento": "2025-10-21",
      "repasse": 1125.45,
      "comissao": 125.05,
      "bonus_indicacao": 0,
      "bonus_metas": 50.00,
      "total": 1300.50,
      "detalhes": {
        "corridas": 45,
        "ganho_bruto": 1250.50,
        "taxa_admin": 5.00,
        "retencao": 120.05
      }
    },
    {
      "id": "PAG002",
      "motorista_id": "MOT001",
      "semana": "2025-10-13",
      "status": "Pago",
      "data_pagamento": "2025-10-14",
      "repasse": 1100.00,
      "comissao": 110.00,
      "bonus_indicacao": 100.00,
      "bonus_metas": 0,
      "total": 1310.00,
      "detalhes": {
        "corridas": 42,
        "ganho_bruto": 1200.00,
        "taxa_admin": 5.00,
        "retencao": 95.00
      }
    },
    {
      "id": "PAG003",
      "motorista_id": "MOT002",
      "semana": "2025-10-20",
      "status": "Pendente",
      "data_pagamento": null,
      "repasse": 855.67,
      "comissao": 85.57,
      "bonus_indicacao": 0,
      "bonus_metas": 0,
      "total": 941.24,
      "detalhes": {
        "corridas": 38,
        "ganho_bruto": 950.75,
        "taxa_admin": 5.00,
        "retencao": 90.08
      }
    }
  ]
}
```

---

### 3.4 Exemplo: `data/metas.json`

```json
{
  "metas": [
    {
      "id": "META001",
      "nome": "Corridas de Ouro",
      "descricao": "Atinja 50 corridas em uma semana",
      "tipo": "corridas",
      "meta_valor": 50,
      "bonus_tipo": "fixo",
      "bonus_valor": 150,
      "status": "Ativa",
      "data_inicio": "2025-10-01",
      "data_fim": "2025-12-31"
    },
    {
      "id": "META002",
      "nome": "Ganho Máximo",
      "descricao": "Ganhe €1500 em ganho bruto",
      "tipo": "ganho_bruto",
      "meta_valor": 1500,
      "bonus_tipo": "percentual",
      "bonus_valor": 10,
      "status": "Ativa",
      "data_inicio": "2025-10-01",
      "data_fim": "2025-12-31"
    },
    {
      "id": "META003",
      "nome": "Estrela do Mês",
      "descricao": "Melhor avaliação do mês",
      "tipo": "rating",
      "meta_valor": 4.9,
      "bonus_tipo": "fixo",
      "bonus_valor": 200,
      "status": "Ativa",
      "data_inicio": "2025-10-01",
      "data_fim": "2025-10-31"
    }
  ]
}
```

---

### 3.5 Criar Funções de Acesso aos Dados Mockados

**Arquivo:** `lib/mock-db.ts` (novo)

**Ação:** Criar funções que simulam queries ao Firebase.

```typescript
// lib/mock-db.ts

import motoristas from '@/data/motoristas.json';
import pagamentos from '@/data/pagamentos.json';
import metas from '@/data/metas.json';

export const mockDB = {
  // Motoristas
  getMotoristas: () => motoristas.motoristas,
  getMotoristaById: (id: string) => motoristas.motoristas.find(m => m.id === id),
  getMotoristasByStatus: (status: string) => motoristas.motoristas.filter(m => m.status === status),

  // Pagamentos
  getPagamentos: () => pagamentos.pagamentos,
  getPagamentosByMotorista: (motorista_id: string) => pagamentos.pagamentos.filter(p => p.motorista_id === motorista_id),
  getPagamentosBySemana: (semana: string) => pagamentos.pagamentos.filter(p => p.semana === semana),

  // Metas
  getMetas: () => metas.metas,
  getMetasAtivas: () => metas.metas.filter(m => m.status === 'Ativa'),
  getMetaById: (id: string) => metas.metas.find(m => m.id === id),
};
```

---

## 4️⃣ Modificar Páginas para Usar Dados Mockados

### 4.1 Modificar `pages/admin/data.tsx`

**Ação:** Substituir chamadas Firebase por dados mockados.

**Mudança Antes:**
```typescript
const motoristas = await db.collection('drivers').get();
```

**Mudança Depois:**
```typescript
import { mockDB } from '@/lib/mock-db';

const motoristas = mockDB.getMotoristas();
```

---

### 4.2 Modificar `pages/admin/weekly/index.tsx`

**Ação:** Usar dados mockados para exibir pagamentos semanais.

```typescript
import { mockDB } from '@/lib/mock-db';

export async function getServerSideProps(context) {
  const semana = context.query.semana || '2025-10-20';
  const pagamentos = mockDB.getPagamentosBySemana(semana);
  
  return {
    props: { pagamentos },
  };
}
```

---

### 4.3 Modificar `pages/dashboard/index.tsx`

**Ação:** Usar dados mockados para exibir dashboard do motorista.

```typescript
import { mockDB } from '@/lib/mock-db';

export async function getServerSideProps(context) {
  const userData = context.req.user; // Do SSR/Auth
  const motorista = mockDB.getMotoristaById(userData.driverId);
  const pagamentos = mockDB.getPagamentosByMotorista(userData.driverId);
  
  return {
    props: { motorista, pagamentos },
  };
}
```

---

## 5️⃣ Remover Integrações Firebase (Opcional)

### 5.1 Desabilitar Firebase em Produção

**Arquivo:** `lib/firebase.ts`

**Ação:** Adicionar flag para desabilitar Firebase em ambiente demo.

```typescript
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

if (!USE_MOCK_DATA) {
  // Inicializar Firebase normalmente
  initializeApp(firebaseConfig);
} else {
  console.log('🎯 DEMO MODE: Usando dados mockados, Firebase desabilitado');
}
```

**Arquivo:** `.env.local` (para demo)

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

---

## 6️⃣ Atualizar Variáveis de Ambiente

**Arquivo:** `.env.local` (para desenvolvimento local)

```env
# Demo Mode
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_DEMO_MODE=true

# Branding
NEXT_PUBLIC_APP_NAME=Frota360
NEXT_PUBLIC_COMPANY_NAME=Alvorada Magistral

# Cores (opcional, se usar CSS variables)
NEXT_PUBLIC_BRAND_PRIMARY=#0066FF
NEXT_PUBLIC_BRAND_ACCENT=#00D4FF

# URLs
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=frota360_demo_secret_key_demo_only
```

---

## 7️⃣ Atualizar Traduções (i18n)

### 7.1 Modificar `locales/pt/common.json`

**Ações:**
1. Substituir "Conduz" por "Frota360"
2. Atualizar descrições do sistema
3. Atualizar nomes de empresas/clientes

**Exemplo:**
```json
{
  "app_name": "Frota360",
  "app_description": "Gestão TVDE Completa",
  "company_name": "Alvorada Magistral",
  "demo_mode": "Modo Demonstração - Dados Fictícios"
}
```

---

## 8️⃣ Adicionar Banner de Demo

### 8.1 Criar Componente de Banner

**Arquivo:** `components/DemoBanner.tsx` (novo)

```typescript
export function DemoBanner() {
  return (
    <Box bg="yellow.100" p={2} textAlign="center" fontSize="sm">
      ⚠️ Modo Demonstração - Usando dados fictícios. Nenhum dado será salvo.
    </Box>
  );
}
```

### 8.2 Adicionar ao Layout

**Arquivo:** `components/LoggedInLayout.tsx`

```typescript
import { DemoBanner } from './DemoBanner';

export function LoggedInLayout({ children }) {
  return (
    <>
      <DemoBanner />
      {/* resto do layout */}
    </>
  );
}
```

---

## 9️⃣ Testar Fluxos Principais

### 9.1 Checklist de Testes

- [ ] Login com credenciais chumbadas funciona
- [ ] Redirecionamento para `/admin` ou `/dashboard` funciona
- [ ] Dashboard do admin exibe dados mockados
- [ ] Dashboard do motorista exibe dados mockados
- [ ] Cores Frota360 aparecem em toda a UI
- [ ] Logo Frota360 aparece no header/footer
- [ ] Sem erros de Firebase no console
- [ ] Sem chamadas de API reais (apenas mock)

---

## 🔟 Deploy em Subdomínio

### 10.1 Configurar Deploy no Vercel

**Passos:**
1. Criar novo projeto Vercel para `frota360-demo`
2. Conectar repositório (branch `demo` ou novo repo)
3. Configurar variáveis de ambiente:
   ```
   NEXT_PUBLIC_USE_MOCK_DATA=true
   NEXT_PUBLIC_DEMO_MODE=true
   ```
4. Deploy automático

### 10.2 Configurar DNS

**Ação:** Apontar `demo.frota360.pt` para Vercel.

```
demo.frota360.pt CNAME cname.vercel-dns.com
```

---

## 📝 Resumo de Arquivos Modificados

| Arquivo | Mudança | Prioridade |
|---------|---------|-----------|
| `lib/theme.ts` | Cores verde → azul/ciano | 🔴 Alta |
| `lib/auth.ts` | Firebase → Mock | 🔴 Alta |
| `lib/auth-mock.ts` | Novo arquivo | 🔴 Alta |
| `lib/mock-db.ts` | Novo arquivo | 🔴 Alta |
| `data/motoristas.json` | Novo arquivo | 🔴 Alta |
| `data/pagamentos.json` | Novo arquivo | 🔴 Alta |
| `data/metas.json` | Novo arquivo | 🔴 Alta |
| `pages/login.tsx` | Usar auth-mock | 🔴 Alta |
| `pages/admin/*.tsx` | Usar mock-db | 🟡 Média |
| `pages/dashboard/*.tsx` | Usar mock-db | 🟡 Média |
| `public/logo.png` | Substituir | 🟡 Média |
| `public/favicon.ico` | Substituir | 🟡 Média |
| `locales/pt/common.json` | Atualizar nomes | 🟡 Média |
| `.env.local` | Novo arquivo | 🟡 Média |
| `components/DemoBanner.tsx` | Novo arquivo | 🟢 Baixa |

---

## ⏱️ Tempo Estimado

- **Cores e Branding:** 1-2 horas
- **Autenticação Mockada:** 2-3 horas
- **Dados Mockados:** 3-4 horas
- **Modificar Páginas:** 4-6 horas
- **Testes e Deploy:** 2-3 horas

**Total:** 12-18 horas de trabalho

---

## 🎯 Resultado Final

Após completar todas as etapas, você terá:

✅ Uma réplica funcional do Conduz.pt com branding Frota360  
✅ Autenticação chumbada (sem Firebase)  
✅ Dados completamente mockados (JSON)  
✅ Sem dependência de credenciais reais  
✅ Pronto para demonstração ao vivo  
✅ Fácil de manter e atualizar  

---

## 📞 Suporte

Se encontrar problemas:

1. Verificar console do navegador (erros de JavaScript)
2. Verificar terminal (erros de build)
3. Confirmar que todos os arquivos JSON estão no diretório `data/`
4. Confirmar que as importações estão corretas

---

**Documento Gerado por:** Manus AI  
**Data:** 25 de Outubro de 2025  
**Versão:** 1.0

