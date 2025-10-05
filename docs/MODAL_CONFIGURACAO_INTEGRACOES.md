# 🔧 Modal de Configuração de Integrações - IMPLEMENTADO

## ✅ O que foi criado

### 1. **Modal de Configuração** (`pages/admin/integrations.tsx`)

#### Componentes Adicionados:
- `Modal`, `ModalOverlay`, `ModalContent`, `ModalHeader`, `ModalBody`, `ModalFooter`, `ModalCloseButton`
- `FormControl`, `FormLabel`, `Input`, `Switch`
- `useDisclosure` hook para controlar abertura/fechamento

#### Estados:
```typescript
const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
const [formData, setFormData] = useState<any>({});
const [isSaving, setIsSaving] = useState(false);
const { isOpen, onOpen, onClose } = useDisclosure();
```

#### Funções Implementadas:

**`handleOpenConfig(integration)`**
- Abre o modal
- Busca credenciais do Firestore via `/api/admin/integrations/[platform]`
- Preenche o formulário com dados existentes

**`handleSaveConfig()`**
- Salva credenciais no Firestore
- Atualiza status ativo/inativo
- Mostra toast de sucesso/erro

**`getCredentialsFromForm(platform)`**
- Extrai credenciais específicas por plataforma:
  - **Cartrack**: `username`, `apiKey`
  - **Bolt**: `clientId`, `clientSecret`
  - **Uber**: `clientId`, `clientSecret`, `orgUuid`
  - **ViaVerde/FONOA**: `email`, `password`
  - **myPrio**: `accountId`, `password`

**`renderCredentialFields()`**
- Renderiza campos dinâmicos baseado na plataforma
- Campos de texto para credenciais
- Inputs tipo `password` para secrets

### 2. **API Endpoint** (`pages/api/admin/integrations/[platform].ts`)

#### Métodos Suportados:

**GET** - Buscar configuração
```typescript
GET /api/admin/integrations/cartrack
Response: {
  success: true,
  data: {
    integration: {
      id: 'cartrack',
      name: 'Cartrack',
      isActive: true,
      credentials: { username: '...', apiKey: '...' },
      config: { baseUrl: '...', authUrl: '...' },
      status: 'active',
      lastSync: '2025-10-05T10:30:00.000Z'
    }
  }
}
```

**PUT** - Atualizar configuração
```typescript
PUT /api/admin/integrations/cartrack
Body: {
  credentials: { username: 'novo_user', apiKey: 'nova_key' },
  isActive: true
}
Response: {
  success: true,
  message: 'Integração atualizada com sucesso'
}
```

**DELETE** - Deletar integração
```typescript
DELETE /api/admin/integrations/cartrack
Response: {
  success: true,
  message: 'Integração removida com sucesso'
}
```

#### Integrações com IntegrationService:
- `integrationService.getIntegration(platform)` - Buscar
- `integrationService.updateCredentials(platform, credentials)` - Atualizar credenciais
- `integrationService.toggleIntegration(platform, isActive)` - Ativar/desativar
- `integrationService.deleteIntegration(platform)` - Deletar

### 3. **Campos de Formulário por Plataforma**

#### Cartrack
- ✅ Username (texto)
- ✅ API Key (password)

#### Bolt
- ✅ Client ID (texto)
- ✅ Client Secret (password)

#### Uber
- ✅ Client ID (texto)
- ✅ Client Secret (password)
- ✅ Organization UUID (texto)

#### ViaVerde / FONOA
- ✅ Email (email)
- ✅ Password (password)

#### myPrio
- ✅ Account ID (texto)
- ✅ Password (password)

### 4. **Botão "Configurar" Atualizado**

**Antes:**
```tsx
onClick={() => {
  toast({ title: 'Configurações', description: '...', status: 'info' });
}}
```

**Depois:**
```tsx
onClick={() => handleOpenConfig(integration)}
```

Agora abre o modal com formulário completo!

---

## 🎯 Como Usar

1. **Abrir Modal:**
   - Clicar no botão "Configurar" em qualquer integração
   - Modal abre com campos específicos da plataforma

2. **Editar Credenciais:**
   - Preencher campos (username, apiKey, clientId, etc.)
   - Toggle para ativar/desativar integração
   - Alerta de segurança sobre armazenamento

3. **Salvar:**
   - Clicar "Salvar Configurações"
   - API atualiza Firestore via `IntegrationService`
   - Toast de confirmação
   - Modal fecha automaticamente

4. **Testar:**
   - Após salvar, clicar "Testar" ou "Conectar"
   - Testa conexão com novas credenciais
   - Status atualiza (connected/error)

---

## 🔒 Segurança

- ✅ Credenciais armazenadas no Firestore (coleção `integrations`)
- ✅ Inputs tipo `password` para secrets (não mostram texto)
- ✅ Validação de plataforma (apenas: uber, bolt, cartrack, viaverde, fonoa, myprio)
- ✅ Type-safe com TypeScript (`IntegrationPlatform`)
- ⚠️ **TODO**: Criptografar credenciais antes de salvar no Firestore

---

## 📊 Status Atual

### Integrations no Firestore
```
integrations/
  ├── cartrack (active)
  │   ├── credentials: { username, apiKey }
  │   └── status: active
  ├── bolt (active)
  │   ├── credentials: { clientId, clientSecret }
  │   └── status: active
  ├── uber (pending)
  │   ├── credentials: { clientId, clientSecret, orgUuid }
  │   └── status: pending
  ├── viaverde (inactive)
  │   ├── credentials: { email, password }
  │   └── status: inactive
  ├── fonoa (inactive)
  │   ├── credentials: { email, password }
  │   └── status: inactive
  └── myprio (inactive)
      ├── credentials: { accountId, password }
      └── status: inactive
```

---

## 🐛 Erros Anteriores nos Testes

### Problemas Identificados:

1. **Cartrack (401 Unauthorized)**
   - Credenciais incorretas ou client não busca do Firestore
   - **Solução**: Verificar se `createCartrackClient()` usa Firestore

2. **Bolt (500 Server Error)**
   - `clientId`/`clientSecret` inválidos
   - **Solução**: Atualizar credenciais no modal

3. **Uber (Timeout)**
   - Precisa OAuth flow manual
   - **Solução**: Implementar redirect para autorização

4. **ViaVerde/myPrio/FONOA (DNS ENOTFOUND)**
   - URLs de API não existem (são scrapers)
   - **Solução**: Implementar scraping via Puppeteer

---

## 🚀 Próximos Passos

1. ✅ **Modal criado e funcional**
2. ✅ **API endpoints implementados**
3. ✅ **Integração com IntegrationService**
4. 🔄 **Testar no navegador**
5. ⏳ **Corrigir clientes para usar Firestore:**
   - Atualizar `createBoltClient()` para buscar do Firestore
   - Atualizar `createUberClient()` para buscar do Firestore
6. ⏳ **Implementar scrapers para:**
   - ViaVerde (Puppeteer)
   - myPrio (Puppeteer)
   - FONOA (Puppeteer)
7. ⏳ **OAuth flow para Uber:**
   - Botão "Autorizar" no modal
   - Redirect para Uber OAuth
   - Callback para salvar tokens

---

## 📝 Exemplo de Uso

```typescript
// 1. Usuário clica "Configurar" no card do Cartrack
handleOpenConfig(cartrackIntegration)

// 2. Modal abre, busca credenciais do Firestore
GET /api/admin/integrations/cartrack
// Retorna: { username: 'user123', apiKey: 'key456' }

// 3. Usuário edita campos:
setFormData({
  username: 'novo_usuario',
  apiKey: 'nova_chave_api',
  isActive: true
})

// 4. Usuário clica "Salvar"
handleSaveConfig()
PUT /api/admin/integrations/cartrack
Body: {
  credentials: { username: 'novo_usuario', apiKey: 'nova_chave_api' },
  isActive: true
}

// 5. IntegrationService atualiza Firestore
integrationService.updateCredentials('cartrack', { ... })
integrationService.toggleIntegration('cartrack', true)

// 6. Toast de sucesso, modal fecha
toast({ title: 'Sucesso!', status: 'success' })
onClose()
```

---

## ✅ Checklist

- [x] Modal criado com `useDisclosure`
- [x] Formulário dinâmico por plataforma
- [x] Campos de credenciais (username, apiKey, clientId, etc.)
- [x] Switch para ativar/desativar
- [x] API GET `/api/admin/integrations/[platform]`
- [x] API PUT `/api/admin/integrations/[platform]`
- [x] API DELETE `/api/admin/integrations/[platform]`
- [x] Integração com `IntegrationService`
- [x] Toast de sucesso/erro
- [x] Botão "Configurar" abre modal
- [ ] Testar no navegador
- [ ] Atualizar outros clientes (Bolt, Uber) para usar Firestore
- [ ] Implementar scrapers (ViaVerde, myPrio, FONOA)
- [ ] OAuth flow (Uber)
- [ ] Criptografia de credenciais

---

**Agora está pronto para testar! 🎉**
