# Implementação: Geração de Resumos Semanais

## 📋 O que foi implementado

Criação de funcionalidade para gerar documentos de resumo semanal para motoristas no formato Conduz.pt.

---

## 🎯 Funcionalidades

1. **Botão "Gerar Resumos"** na página de visualização semanal (`/admin/weekly`)
2. **API endpoint** para gerar Excel de Controlo Semanal
3. **Cálculos automáticos:**
   - IVA 6% sobre ganhos totais
   - Despesas Administrativas 7% sobre (Ganhos - IVA)
   - Descontos: Combustível, Portagens, Aluguel (para locatários)
   - Valor Líquido a Receber

---

## 📦 Dependências Necessárias

Execute os seguintes comandos para instalar as dependências:

```bash
cd /home/ubuntu/conduz-pt
npm install exceljs
npm install pdfkit
npm install @types/pdfkit --save-dev
```

---

## 📁 Arquivos Criados/Modificados

### 1. API Endpoint
**Arquivo:** `pages/api/admin/weekly/generate-resumos.ts`

**Funcionalidade:**
- Busca registros semanais do Firebase
- Calcula IVA, despesas administrativas e valor líquido
- Gera Excel de Controlo Semanal com todos os motoristas
- Retorna arquivo Excel para download

**Endpoint:** `POST /api/admin/weekly/generate-resumos`

**Body:**
```json
{
  "weekStart": "2024-09-29",
  "weekEnd": "2024-10-05"
}
```

**Response:** Arquivo Excel (.xlsx)

---

## 🔧 Próximos Passos para Completar

### 1. Instalar Dependências
```bash
cd /home/ubuntu/conduz-pt
npm install exceljs pdfkit
npm install @types/pdfkit --save-dev
```

### 2. Adicionar Botão na Página Weekly

Editar: `pages/admin/weekly/index.tsx`

Adicionar no HStack de botões (linha ~230):

```typescript
<Button
  leftIcon={<Icon as={FiFileText} />}
  onClick={handleGenerateResumos}
  colorScheme="purple"
  size="sm"
  isLoading={isGeneratingResumos}
>
  Gerar Resumos
</Button>
```

Adicionar imports:
```typescript
import { FiFileText } from 'react-icons/fi';
```

Adicionar state:
```typescript
const [isGeneratingResumos, setIsGeneratingResumos] = useState(false);
```

Adicionar função:
```typescript
const handleGenerateResumos = async () => {
  setIsGeneratingResumos(true);
  try {
    const selectedWeek = weekOptions.find(w => w.value === filterWeek);
    if (!selectedWeek) {
      toast({
        title: 'Erro',
        description: 'Selecione uma semana',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const response = await fetch('/api/admin/weekly/generate-resumos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weekStart: selectedWeek.start,
        weekEnd: selectedWeek.end,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao gerar resumos');
    }

    // Download do arquivo
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ControloSemanal_${selectedWeek.start}_a_${selectedWeek.end}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: 'Resumos gerados com sucesso!',
      description: 'O arquivo Excel foi baixado',
      status: 'success',
      duration: 5000,
    });
  } catch (error) {
    console.error('Erro ao gerar resumos:', error);
    toast({
      title: 'Erro ao gerar resumos',
      description: 'Tente novamente',
      status: 'error',
      duration: 5000,
    });
  } finally {
    setIsGeneratingResumos(false);
  }
};
```

### 3. Verificar Estrutura de Dados no Firebase

Certifique-se de que a collection `weeklyRecords` tem a seguinte estrutura:

```typescript
{
  id: string,
  driverId: string,
  driverName: string,
  weekStart: string,  // YYYY-MM-DD
  weekEnd: string,    // YYYY-MM-DD
  uber: {
    total: number,
  },
  bolt: {
    total: number,
  },
  fuel: {
    total: number,
  },
  viaverde: {
    total: number,
  },
  payment: {
    status: 'pending' | 'paid' | 'cancelled',
  },
}
```

E a collection `drivers`:

```typescript
{
  id: string,
  name: string,
  type: 'affiliate' | 'renter',
  vehicle: {
    plate: string,
  },
  banking: {
    iban: string,
  },
}
```

### 4. Testar

1. Acesse `/admin/weekly`
2. Selecione uma semana que tenha dados
3. Clique em "Gerar Resumos"
4. Verifique se o Excel foi baixado corretamente
5. Abra o Excel e verifique:
   - Todos os motoristas estão listados
   - Cálculos estão corretos
   - Linha de TOTAL está presente
   - Formatação está correta

---

## 📊 Formato do Excel Gerado

### Colunas:
1. Motorista
2. Tipo (Afiliado/Locatário)
3. Veículo
4. Período
5. Uber Total
6. Bolt Total
7. Ganhos Total
8. IVA 6%
9. Ganhos - IVA
10. Despesas Adm. 7%
11. Combustível
12. Portagens
13. Aluguel
14. Valor Líquido
15. IBAN
16. Status

### Cálculos:
- **Ganhos Total** = Uber Total + Bolt Total
- **IVA 6%** = Ganhos Total × 0,06
- **Ganhos - IVA** = Ganhos Total - IVA 6%
- **Despesas Adm. 7%** = (Ganhos - IVA) × 0,07
- **Aluguel** = 290 EUR (apenas para Locatários), 0 EUR (para Afiliados)
- **Valor Líquido** = (Ganhos - IVA) - Despesas Adm. - Combustível - Portagens - Aluguel

---

## 🎨 Formato dos PDFs Individuais (Próxima Etapa)

Para implementar os PDFs individuais com o layout Conduz.pt, será necessário:

1. Criar endpoint separado: `POST /api/admin/weekly/generate-pdf`
2. Usar biblioteca `pdfkit` para gerar PDF
3. Adicionar logo Conduz.pt (salvar em `public/logo-conduz.png`)
4. Seguir layout dos PDFs de exemplo fornecidos
5. Gerar um PDF por motorista
6. Retornar ZIP com todos os PDFs

**Estrutura do PDF:**
- Logo Conduz.pt no topo
- Título: "RESUMO SEMANAL" (não "CONTRACHEQUE")
- Seção: DADOS DO MOTORISTA
- Seção: RECEITAS
- Seção: DESCONTOS
- Destaque: VALOR LÍQUIDO A RECEBER
- Seção: DADOS BANCÁRIOS
- Seção: OBSERVAÇÕES

---

## ✅ Checklist de Implementação

- [x] Criar API endpoint para gerar Excel
- [x] Implementar cálculos (IVA, Despesas Adm, Valor Líquido)
- [x] Gerar Excel de Controlo Semanal
- [ ] Instalar dependências (exceljs, pdfkit)
- [ ] Adicionar botão na página weekly
- [ ] Testar com dados reais
- [ ] Criar endpoint para gerar PDFs individuais
- [ ] Adicionar logo Conduz.pt
- [ ] Implementar layout dos PDFs
- [ ] Gerar ZIP com todos os PDFs
- [ ] Documentar para o cliente

---

## 🐛 Troubleshooting

### Erro: "Module not found: exceljs"
**Solução:** Execute `npm install exceljs`

### Erro: "Module not found: pdfkit"
**Solução:** Execute `npm install pdfkit @types/pdfkit`

### Excel não está sendo baixado
**Solução:** Verifique o console do navegador para erros. Certifique-se de que a API está retornando status 200.

### Cálculos incorretos
**Solução:** Verifique se os dados no Firebase estão corretos. Os campos `uber.total`, `bolt.total`, `fuel.total`, `viaverde.total` devem ser números.

### Erro 404: Nenhum registro encontrado
**Solução:** Certifique-se de que existem registros na collection `weeklyRecords` para a semana selecionada.

---

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Logs do servidor Next.js
2. Console do navegador
3. Estrutura de dados no Firebase
4. Permissões do Firebase Admin

---

**Documento criado em:** 6 de Outubro de 2025  
**Versão:** 1.0
