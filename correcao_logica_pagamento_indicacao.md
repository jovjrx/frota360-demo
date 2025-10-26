# Correção de Lógica: Liberação de Bônus de Indicação

**Objetivo:** Refinar a lógica de liberação de bônus de indicação (`PENDING` → `PAYABLE`) para garantir que a elegibilidade seja baseada no **número de pagamentos semanais processados** (registros em `driverWeeklyRecords`) do motorista indicado, e não apenas em datas.

## 1. Ajuste na Lógica de Liberação de Bônus

**Localização:** `conduz-pt/lib/referral/bonus-calculator.ts` (na função `releasePendingBonuses`)

### 1.1. Lógica a ser implementada na `releasePendingBonuses`

A função deve ser ajustada para realizar a seguinte verificação para cada bônus com *status* `PENDING`:

1.  **Obter Configuração:** Obter o valor de `minWeeksToPayBonus` do Admin.
2.  **Contar Pagamentos Processados:** Para o `referredDriverId` (o motorista indicado), contar o número de documentos existentes na coleção **`driverWeeklyRecords`**.
    *   **Critério de Contagem:** A contagem deve incluir apenas registros onde o `paymentStatus` é **`paid`** ou **`processed`** (se existir um *status* de processamento antes de `paid`).
3.  **Verificação de Elegibilidade:**
    *   Se `Contagem de Registros Processados >= minWeeksToPayBonus`:
        *   Atualizar o *status* do bônus na coleção `affiliate_bonuses` para **`PAYABLE`**.

**Instrução para o Co-Pilot:**

> O critério de liberação do bônus de indicação é o **número de pagamentos semanais processados** do motorista indicado. Certifique-se de que a função `releasePendingBonuses` consulta a coleção `driverWeeklyRecords` e conta os registros processados/pagos para o motorista indicado. Somente se essa contagem atingir o `minWeeksToPayBonus` configurado, o bônus deve ter seu *status* alterado de `PENDING` para `PAYABLE`.

## 2. Ajuste na Lógica de Injeção (Confirmação)

**Localização:** `conduz-pt/lib/referral/bonus-calculator.ts` (na função `getBonusForDriverWeek`)

**Instrução para o Co-Pilot:**

> Confirme que a função `getBonusForDriverWeek` busca **apenas** bônus com *status* **`PAYABLE`** para injeção no repasse semanal. Após a injeção, o *status* deve ser atualizado para **`PAID`**.

Esta correção garante que a regra de negócio de "pagamento após X pagamentos" seja aplicada corretamente.
