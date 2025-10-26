# Visão de Negócio e Arquitetura Pós-Manutenção

**Autor:** Manus AI
**Data:** 25 de Outubro de 2025
**Objetivo:** Descrever o estado final do sistema `conduz-pt` após a reestruturação dos módulos de Comissão, Indicação e Metas, garantindo o alinhamento com as regras de negócio solicitadas.

## 1. Arquitetura de Pagamento Semanal Pós-Manutenção

O fluxo de processamento de pagamento semanal será mantido centralizado na função `getDriverWeekData` (`lib/api/driver-week-data.ts`), que atuará como o **Orquestrador de Repasse**. A principal mudança é a **separação lógica** dos cálculos de bônus em módulos dedicados, garantindo que o `repasse` final seja a soma correta de todos os componentes.

### 1.1. Fluxo de Cálculo do Repasse

O cálculo do `repasse` final seguirá a seguinte ordem de operações, com cada componente sendo isolado em sua respectiva lógica:

$$\text{Repasse Final} = \text{Ganhos Liquidos} - \text{Despesas} + \text{Bônus}$$

| Componente | Cálculo | Módulo de Origem |
| :--- | :--- | :--- |
| **Ganhos Líquidos** | Ganhos Totais (Uber/Bolt) - IVA (6%) - Taxa Administrativa | `lib/payout/base-calculator.ts` |
| **Despesas** | Combustível + Portagens + Aluguel + Financiamento | `lib/api/driver-week-data.ts` (Dados Fixos) |
| **Bônus de Comissão Extra** | Percentual ou Valor Fixo (configurável) | **Novo:** `lib/commission/extra.ts` |
| **Bônus de Metas** | Soma dos `valorGanho` das metas atingidas | `lib/goals/service.ts` |
| **Bônus de Indicação** | Valor liberado para pagamento na semana atual | **Novo:** `lib/referral/bonus.ts` |

## 2. Módulo de Indicação (Recrutamento)

O módulo de Indicação será totalmente separado da lógica de Comissão Padrão, focando no rastreamento do motorista indicado e na aplicação da regra de pagamento inteligente.

### 2.1. Regra de Pagamento Inteligente (Indicação)

O pagamento do bônus ao motorista indicador será dissociado da semana em que o motorista indicado gerou receita, seguindo a regra:

> O bônus de indicação será pago ao indicador somente no **segundo pagamento semanal posterior** à semana em que o motorista indicado atingiu o número mínimo de semanas de trabalho efetivo (ex: 2 semanas).

| Status do Bônus | Descrição | Ação no Sistema |
| :--- | :--- | :--- |
| **Calculado** | O bônus é calculado na semana em que a receita é gerada pelo indicado. | O valor é armazenado na coleção `affiliate_bonuses` com o *status* **`PENDING`**. |
| **Liberado** | O sistema verifica se o indicado cumpriu o critério de semanas de trabalho. | O bônus é movido para o *status* **`PAYABLE`** (ou similar) e fica disponível para ser somado ao próximo repasse do indicador. |
| **Pago** | O bônus é somado ao `repasse` do indicador. | O *status* é atualizado para **`PAID`** e o valor é injetado no `repasse` final via `getDriverWeekData`. |

### 2.2. Interfaces (Indicação)

| Visão | Funcionalidade |
| :--- | :--- |
| **Admin** | **Nova Rota:** `/admin/referral` (ou similar). Gestão de Indicados, *status* de efetivação, e **Configuração dos Parâmetros** (Valor Base do Bônus, Semanas Mínimas de Trabalho). |
| **Motorista** | **Novo Menu:** `/dashboard/referral`. Geração do link de indicação e acompanhamento do *status* de cada indicado (Solicitado, Aprovado/Em Trabalho, Bônus Liberado). |

## 3. Módulo de Comissão (Padrão e Extra)

O módulo de Comissão será focado exclusivamente na remuneração do motorista, separando a lógica de comissão extra da lógica de repasse base.

### 3.1. Comissão Extra (Bônus)

A lógica de Comissão Extra será isolada em um novo módulo (`lib/commission/extra.ts`) e será injetada no `repasse` como um bônus.

| Parâmetro | Descrição |
| :--- | :--- |
| **Modo** | Percentual sobre Ganhos Líquidos ou Valor Fixo. |
| **Ativação** | Configurável pelo Admin (Ativado/Desativado). |
| **Injeção** | O valor é **somado** ao `repasse` final em `getDriverWeekData`. |

## 4. Módulo de Recompensa por Metas (Goals)

O módulo de Metas será mantido em `lib/goals/service.ts`, mas com a adição da injeção do bônus no cálculo semanal.

### 4.1. Lógica de Injeção do Bônus

O bônus de metas (`valorGanho` em `DriverGoalStatus`) será somado ao `repasse` final:

*   **Ação Necessária:** O `getDriverWeekData` será modificado para iterar sobre a lista de `completeRecord.goals` e somar o `valorGanho` de todas as metas atingidas ao `completeRecord.repasse`.

### 4.2. Interfaces (Metas)

| Visão | Funcionalidade |
| :--- | :--- |
| **Admin** | **Nova Rota:** `/admin/goals`. Criação e gestão das metas (Critério: Ganho Bruto ou Viagens; Recompensa: % ou Valor Fixo). |
| **Motorista** | **Novo Menu:** `/dashboard/goals`. Acompanhamento das metas ativas, *status* de progresso e visualização dos bônus ganhos na semana. |

## 5. Resumo da Reestruturação da Interface do Motorista

O menu do Motorista (`/dashboard`) será limpo e organizado para refletir apenas os módulos funcionais, garantindo uma experiência de usuário clara:

| Menu Atualizado | Rota | Observações |
| :--- | :--- | :--- |
| **Dashboard** | `/dashboard` | Visão geral. |
| **Resumos** | `/dashboard/payslips` | Histórico de pagamentos/holerites. |
| **Performance** | `/dashboard/performance` | (Mantido para análise futura). |
| **Indicação** | `/dashboard/referral` | Novo módulo de recrutamento. |
| **Metas** | `/dashboard/goals` | Novo módulo de acompanhamento de metas. |
| **Meus Dados** | `/dashboard/profile` | Perfil e informações pessoais. |

Este documento reflete o entendimento completo das regras de negócio e a arquitetura necessária para implementá-las de forma isolada e manutenível no sistema.
