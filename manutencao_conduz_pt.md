# Guia de Manutenção: Reestruturação de Módulos de Pagamento

**Objetivo:** Reestruturar os módulos de Comissão, Indicação (Recrutamento) e Metas para garantir a separação de responsabilidades, a correta aplicação das novas regras de negócio e a manutenção da arquitetura Server-First, i18n customizado e padrões de UI (Chakra UI).

## 1. Reorganização e Isolamento do Backend

### 1.1. Renomeação e Movimentação de Diretórios

1.  **Renomear Módulo de Indicação:**
    *   Renomear o diretório `conduz-pt/lib/commissions` para **`conduz-pt/lib/referral`**.
    *   Mover o arquivo `conduz-pt/lib/referral/compute.ts` para **`conduz-pt/lib/referral/bonus-calculator.ts`**.
    *   Atualizar todos os *imports* que referenciam o caminho antigo (`@/lib/commissions/compute`) para o novo (`@/lib/referral/bonus-calculator`).

2.  **Isolar Lógica de Comissão Extra:**
    *   Criar o arquivo **`conduz-pt/lib/commission/extra-calculator.ts`**.
    *   Mover a lógica de cálculo da **Comissão Extra** (linhas 462-496) do arquivo `conduz-pt/lib/api/driver-week-data.ts` para a função `calculateExtraCommission` neste novo arquivo.

3.  **Renomear Módulo de Repasse Base:**
    *   Renomear `conduz-pt/lib/commission/engine.ts` para **`conduz-pt/lib/payout/base-calculator.ts`** (Reflete melhor seu papel no cálculo do repasse base).

### 1.2. Criação de Coleções e Estruturas de Dados

1.  **Metas (Goals):** Garantir que a coleção `settings/goals` no Firebase Admin suporte a criação e recuperação de metas pelo Admin.
2.  **Indicação (Referral):**
    *   Atualizar a coleção `affiliate_bonuses` para incluir um campo **`status`** (valores possíveis: `PENDING`, `PAYABLE`, `PAID`).
    *   Adicionar um campo **`effectiveWeekId`** ou **`effectiveDate`** ao registro de bônus para controlar a data de efetivação do indicado.

## 2. Implementação da Lógica de Indicação (Pagamento Inteligente)

### 2.1. Regra de Liberação de Bônus

1.  **Modificar `lib/referral/bonus-calculator.ts`:**
    *   A função de cálculo de bônus deve **sempre** salvar o bônus na coleção `affiliate_bonuses` com o *status* **`PENDING`**, independentemente do critério de semanas.
    *   **Criar uma nova função** (e.g., `releasePendingBonuses`) que será executada semanalmente (ou sob demanda) para verificar:
        *   Se o motorista indicado atingiu o número de semanas mínimas de trabalho (parâmetro configurável pelo Admin).
        *   Se o bônus está `PENDING`.
        *   Se ambas as condições forem verdadeiras, atualizar o *status* do bônus para **`PAYABLE`**.

### 2.2. Injeção no Repasse

1.  **Modificar `lib/referral/bonus-calculator.ts`:**
    *   A função `getBonusForDriverWeek` deve ser modificada para buscar **apenas** bônus com *status* **`PAYABLE`** (ou `PAID` na semana anterior) e marcá-los como **`PAID`** após a injeção no repasse.

## 3. Ajustes na Lógica Central de Pagamento

### 3.1. Injeção de Bônus de Metas

1.  **Modificar `conduz-pt/lib/api/driver-week-data.ts`:**
    *   Após o cálculo das metas (linha 506), iterar sobre o array `completeRecord.goals`.
    *   Para cada meta onde `atingido` é `true`, **somar** o `valorGanho` ao `completeRecord.repasse`.

```typescript
// Exemplo de injeção após a linha 510
// ...
    // Adicionar metas/recompensas semanais (rewards/goals)
    // ... (cálculo das metas)
    
    let goalsBonus = 0;
    completeRecord.goals.forEach((goal: any) => {
      if (goal.atingido && goal.valorGanho > 0) {
        goalsBonus += goal.valorGanho;
      }
    });
    
    if (goalsBonus > 0) {
      completeRecord.repasse += goalsBonus;
      // Opcional: Adicionar goalsBonus como campo separado para transparência
      (completeRecord as any).goalsBonus = goalsBonus; 
    }
// ...
```

### 3.2. Injeção de Comissão Extra

1.  **Modificar `conduz-pt/lib/api/driver-week-data.ts`:**
    *   Substituir a lógica de cálculo de Comissão Extra (antigas linhas 462-496) pela chamada ao novo `extra-calculator.ts`.

## 4. Ajustes de UI/UX (Rotas, Menus e Traduções)

### 4.1. Traduções (i18n)

1.  **Atualizar `conduz-pt/locales/pt/common/common.json`:**
    *   Adicionar novas chaves de menu e títulos para **Metas (`goals`)** e **Indicação (`referral`)** em `menu` e `seo`.
    *   Exemplo: `"menu": { "referral": "Indicação", "goals": "Metas" }`.

### 4.2. Visão do Motorista (`/dashboard`)

1.  **Menu de Navegação:**
    *   **Remover** itens de menu desnecessários ou não funcionais.
    *   **Adicionar** links para as novas rotas:
        *   `/dashboard/referral` (Indicação)
        *   `/dashboard/goals` (Metas)

2.  **Criação de Páginas:**
    *   Criar a página **`conduz-pt/pages/dashboard/referral.tsx`**.
        *   Deve usar **`withDashboardSSR`** para carregar dados e traduções.
        *   Exibir o link de indicação e o *status* dos indicados.
    *   Criar a página **`conduz-pt/pages/dashboard/goals.tsx`**.
        *   Deve usar **`withDashboardSSR`**.
        *   Exibir as metas ativas e o progresso do motorista.

### 4.3. Visão do Administrador (`/admin`)

1.  **Menu de Navegação:**
    *   **Separar** as configurações de **Comissão** e **Indicação** no menu.
    *   **Adicionar** link para a nova rota de Metas.

2.  **Criação de Páginas/Rotas:**
    *   Criar a página **`conduz-pt/pages/admin/referral/index.tsx`**.
        *   Deve usar **`withAdminSSR`**.
        *   Permitir a gestão de indicados e a configuração dos parâmetros de bônus (Valor, Semanas Mínimas).
    *   Criar a página **`conduz-pt/pages/admin/goals/index.tsx`**.
        *   Deve usar **`withAdminSSR`**.
        *   Permitir a criação e gestão das `RewardConfig` (Metas).

---
**NOTA PARA O CO-PILOT:** Todas as novas páginas e componentes devem seguir o padrão de **SSR**, utilizar o sistema de **i18n customizado** para textos e respeitar o **layout e componentes do Chakra UI** existentes no projeto. A lógica de negócio deve ser implementada no *backend* (API Routes ou `lib/` functions).
