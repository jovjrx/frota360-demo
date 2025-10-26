# Análise de Manutenção: Reestruturação de Comissão, Indicação e Metas

**Autor:** Manus AI
**Data:** 25 de Outubro de 2025
**Repositório Analisado:** `jovjrx/conduz-pt`

## 1. Mapeamento da Lógica de Negócio Atual

A análise detalhada do código-fonte revela que os módulos de **Comissão**, **Indicação** (Recrutamento) e **Metas** já possuem estruturas de código no *backend*, mas estão misturados ou incompletos em relação às novas regras de negócio.

### 1.1. Comissão e Indicação (Status Atual)

| Módulo | Localização Atual | Observações |
| :--- | :--- | :--- |
| **Comissão (Padrão)** | `lib/commission/engine.ts` | Esta *engine* é responsável pelo cálculo de **Repasse**, deduzindo comissões e taxas (Taxa Adm, Combustível, etc.) do Ganho Bruto. **Não** é o módulo de bônus/comissão extra. |
| **Indicação (Bônus)** | `lib/commissions/compute.ts` | Este arquivo lida com o cálculo do **Bônus de Afiliados (Multinível)**, utilizando a *chain* `referredBy` e armazenando o resultado na coleção `affiliate_bonuses`. **Este é o módulo de Indicação/Recrutamento**. O nome do diretório (`commissions`) é confuso. |
| **Comissão Extra** | `lib/api/driver-week-data.ts` (linhas 462-496) | A lógica para a **Comissão Extra** (percentual ou valor fixo, ativada por *config*) está **diretamente injetada** no cálculo semanal de `getDriverWeekData`. |

### 1.2. Metas (Status Atual)

| Módulo | Localização Atual | Observações |
| :--- | :--- | :--- |
| **Metas (Goals)** | `lib/goals/service.ts` | O serviço já existe e calcula o *status* de metas (`RewardConfig`) com base em **Ganho Bruto** e **Viagens**. A lógica de cálculo do bônus (`valorGanho`) também está pronta. |
| **Injeção no Pagamento** | `lib/api/driver-week-data.ts` (linhas 498-510) | O resultado do `computeDriverGoals` é **adicionado ao registro semanal** (`completeRecord.goals`), mas **não** é somado diretamente ao `repasse` neste bloco de código. |

## 2. Análise do Fluxo de Pagamento (Ponto de Injeção)

O ponto central do processamento semanal é a função **`getDriverWeekData`** em `lib/api/driver-week-data.ts`. É aqui que todos os dados (plataformas, custos fixos, comissões, metas) são consolidados para gerar o registro semanal final.

| Componente | Localização | Ação no Repasse (`completeRecord.repasse`) |
| :--- | :--- | :--- |
| **Cálculo Base** | `lib/api/driver-week-data.ts` (linhas 343-348) | Calcula o `repasse` inicial: `ganhosMenosIVA - despesasAdm - custosOperacionais - aluguel - financiamento`. |
| **Comissão Extra** | `lib/api/driver-week-data.ts` (linhas 462-496) | **Soma** o `commissionAmount` (Comissão Extra) ao `repasse`. |
| **Bônus de Indicação** | `lib/api/driver-week-data.ts` (linhas 517-527) | **Soma** o `affiliateBonus` (Bônus de Indicação) ao `repasse`. |

**Conclusão sobre o Ponto de Injeção:**

O `getDriverWeekData` é o local correto para injetar os bônus. No entanto, a lógica de **Comissão Extra** está misturada com o fluxo principal de cálculo, e a lógica de **Metas** precisa ter seu bônus somado ao `repasse`.

## 3. Proposta de Reestruturação e Manutenção

Para atender à sua solicitação de separação clara de módulos e à regra de negócio da Indicação, a manutenção deve seguir os seguintes passos:

### 3.1. Reorganização do Código (*Backend*)

1.  **Renomear Módulo de Indicação:**
    *   Renomear `lib/commissions/` para **`lib/recruitment/`** ou **`lib/referral/`**.
    *   Mover `lib/commissions/compute.ts` para **`lib/referral/bonus.ts`**.
2.  **Módulo de Comissão (Padrão/Extra):**
    *   Criar um novo arquivo **`lib/commission/extra.ts`** para isolar a lógica de Comissão Extra (atualmente em `driver-week-data.ts`).
    *   O `lib/commission/engine.ts` deve ser renomeado para **`lib/payout/base-calculator.ts`** para refletir seu papel de cálculo base do repasse, não apenas comissão.
3.  **Módulo de Metas:**
    *   **Injetar o Bônus:** Adicionar a soma do `valorGanho` das metas ao `repasse` em `lib/api/driver-week-data.ts` (após a linha 510).

### 3.2. Implementação da Regra de Pagamento de Indicação (Ponto Crítico)

A regra de "somente no segundo pagamento posterior à semana de efetivação" exige um controle de *status* mais granular.

*   **Ação Necessária:** O módulo de Indicação (agora `lib/referral/bonus.ts`) precisa ser modificado para que o bônus seja **calculado** na semana de referência, mas **marcado como `pending`** (pendente) na coleção `affiliate_bonuses`.
*   **Nova Regra:** Um novo processo (ou uma checagem em `getDriverWeekData`) deve verificar se o motorista indicado atingiu o número de semanas mínimas e se o bônus está `pending`. Se sim, o bônus deve ser **liberado** para a semana de pagamento atual do indicador.

### 3.3. Reestruturação da Interface (UI/UX)

1.  **Visão Admin:**
    *   Criar rotas e menus separados para **Indicação** (Gestão de Indicados, Configuração de Bônus) e **Comissão** (Configuração da Comissão Extra).
    *   Ajustar a rota de **Metas** para permitir a criação/gestão de `RewardConfig`.
2.  **Visão Motorista:**
    *   Revisar o menu principal para incluir **Indicação** (Geração de Link, Status de Indicados) e **Metas** (Acompanhamento do Status/Bônus).
    *   Manter o menu de **Performance** separado.

## 4. Conteúdo Esperado do Markdown Final

O documento Markdown final para o seu *co-pilot* (a ser gerado após sua confirmação) conterá:

| Seção | Conteúdo Detalhado |
| :--- | :--- |
| **1. Resumo das Alterações** | Visão geral da reestruturação e dos objetivos de negócio alcançados. |
| **2. Reorganização do Código** | Lista de **renomeações** e **criações** de arquivos e diretórios (`lib/commissions` -> `lib/referral`, etc.). |
| **3. Correção: Lógica de Indicação** | Detalhes da modificação em `lib/referral/bonus.ts` para implementar o *status* `pending` e a lógica de **liberação de bônus** com base na data de efetivação do indicado. |
| **4. Correção: Lógica de Comissão Extra** | Movimentação da lógica de Comissão Extra de `driver-week-data.ts` para um novo arquivo `lib/commission/extra.ts` e sua reinjeção correta. |
| **5. Correção: Lógica de Metas** | Injeção da soma do `valorGanho` das metas ao `repasse` em `lib/api/driver-week-data.ts`. |
| **6. Ajustes de UI/UX** | Mapeamento das rotas e componentes de menu que precisam ser criados/ajustados nas áreas `/admin` e `/dashboard` para refletir a nova estrutura. |

Este nível de detalhe confirma que compreendi a complexidade das regras de negócio e o impacto no fluxo de pagamento. Confirme se este é o entendimento que você esperava.
