# Análise das Páginas Admin

## 📄 Páginas Encontradas

1. `pages/admin/index.tsx` - Dashboard principal
2. `pages/admin/drivers/index.tsx` - Lista de motoristas
3. `pages/admin/drivers/add.tsx` - Adicionar motorista
4. `pages/admin/requests.tsx` - Solicitações
5. `pages/admin/weekly/index.tsx` - Controle semanal
6. `pages/admin/weekly/import.tsx` - Importar dados
7. `pages/admin/fleet.tsx` - Frota
8. `pages/admin/monitor.tsx` - Monitor
9. `pages/admin/data.tsx` - Dados
10. `pages/admin/integrations.tsx` - Integrações
11. `pages/admin/metrics.tsx` - Métricas
12. `pages/admin/users.tsx` - Usuários

## 🎯 Estrutura Comum Necessária

### 1. Autenticação SSR
- Verificar se usuário está logado
- Verificar se tem role `admin`
- Redirecionar se não autorizado

### 2. Traduções SSR
- Carregar traduções do locale atual
- Passar como props

### 3. Layout
- Usar AdminLayout consistentemente
- Breadcrumbs
- Título e subtítulo

### 4. Dados Iniciais
- Carregar via SSR quando possível
- Usar SWR com fallback para dados dinâmicos

## 🏗️ Arquitetura Proposta

```
lib/
  admin/
    withAdminSSR.ts          # HOC para SSR admin
    adminQueries.ts          # Queries reutilizáveis
    
pages/admin/
  [page].tsx                 # Cada página usa withAdminSSR
```

### withAdminSSR

```typescript
export function withAdminSSR<P extends AdminPageProps>(
  getPageData?: (context: GetServerSidePropsContext) => Promise<P>
) {
  return async (context: GetServerSidePropsContext) => {
    // 1. Verificar autenticação
    // 2. Verificar role admin
    // 3. Carregar traduções
    // 4. Carregar dados da página (se getPageData fornecido)
    // 5. Retornar props ou redirect
  }
}
```

### Uso nas páginas

```typescript
export const getServerSideProps = withAdminSSR(async (context) => {
  // Queries específicas da página
  const drivers = await getDrivers();
  
  return {
    drivers,
  };
});
```

## 📋 Checklist de Implementação

- [ ] Criar `lib/admin/withAdminSSR.ts`
- [ ] Criar `lib/admin/adminQueries.ts`
- [ ] Criar `lib/admin/requireAdmin.ts` (verificação de auth)
- [ ] Atualizar todas as 12 páginas admin
- [ ] Testar autenticação em todas as rotas
- [ ] Testar traduções em todas as páginas
- [ ] Garantir SWR com fallback onde necessário
