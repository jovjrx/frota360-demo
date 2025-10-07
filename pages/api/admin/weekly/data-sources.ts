_# Refatoração do Endpoint de Fontes de Dados Semanais

Este documento detalha a refatoração do endpoint da API localizado em `pages/api/admin/weekly/data-sources.ts`. O objetivo principal desta atualização é alinhar o endpoint com a nova arquitetura de dados do Firebase, que agora utiliza a coleção `weeklyReports` para centralizar as informações semanais.

## Estrutura Anterior vs. Estrutura Nova

### Estrutura Anterior

Anteriormente, o endpoint consultava uma coleção genérica chamada `weeks`. Essa coleção continha um resumo do estado de importação para cada plataforma (Uber, Bolt, etc.) dentro de um único documento por semana. A lógica para determinar as semanas disponíveis e seu status estava acoplada à estrutura dessa coleção, que se mostrou pouco flexível e foi descontinuada.

```typescript
// Lógica antiga em pages/api/admin/weekly/data-sources.ts

const weeksRef = db.collection('weeks');
const snapshot = await weeksRef.orderBy('weekStart', 'desc').get();

// ... processamento complexo para montar as opções de semana
```

### Estrutura Nova e Otimizada

A nova abordagem é mais direta e eficiente. O endpoint agora consulta diretamente a coleção `weeklyReports`. Nesta coleção, cada documento representa uma semana de trabalho e seu ID corresponde ao `weekId` (por exemplo, `"2025-W40"`). A simples existência de um documento nesta coleção já indica que há dados processados para aquela semana.

O endpoint realiza os seguintes passos:

1.  **Consulta a `weeklyReports`**: Executa uma consulta `get()` na coleção `weeklyReports` para obter todos os documentos existentes.
2.  **Mapeamento para Opções de Semana**: Itera sobre os documentos retornados. Para cada documento, utiliza o ID (`weekId`) para gerar as informações necessárias para o frontend:
    *   `value`: O próprio `weekId`.
    *   `start` e `end`: As datas de início e fim da semana, obtidas através da função utilitária `getWeekDates(weekId)`.
    *   `label`: Um texto descritivo para exibição no seletor do frontend, como "Semana 2025-W40 (2025-09-29 a 2025-10-05)".
3.  **Ordenação**: As opções de semana são ordenadas em ordem decrescente, garantindo que a semana mais recente sempre apareça primeiro na interface.

```typescript
// Nova lógica implementada em pages/api/admin/weekly/data-sources.ts

import { adminDb } from '@/lib/firebaseAdmin';
import { getWeekDates } from '@/schemas/driver-weekly-record';

// ... (código do handler)

const weeklyReportsSnapshot = await adminDb.collection('weeklyReports').get();

const weekOptions = [];
weeklyReportsSnapshot.docs.forEach(doc => {
  const weekId = doc.id;
  const { start, end } = getWeekDates(weekId);
  weekOptions.push({
    label: `Semana ${weekId} (${start} a ${end})`,
    value: weekId,
    start: start,
    end: end,
  });
});

weekOptions.sort((a, b) => b.value.localeCompare(a.value));

return res.status(200).json({ data: weekOptions });
```

## Benefícios da Refatoração

*   **Simplicidade**: A lógica para obter as semanas disponíveis foi drasticamente simplificada, tornando o código mais legível e de fácil manutenção.
*   **Desempenho**: A consulta direta a `weeklyReports` é mais performática do que a abordagem anterior, que poderia envolver consultas mais complexas.
*   **Consistência**: O endpoint agora reflete diretamente o estado da nova estrutura de dados, garantindo consistência em todo o sistema.
*   **Manutenibilidade**: Qualquer alteração futura na forma como os relatórios são armazenados exigirá apenas ajustes neste endpoint centralizado, sem impactar outras partes do código.

