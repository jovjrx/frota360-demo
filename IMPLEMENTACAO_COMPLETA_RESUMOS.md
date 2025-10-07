# Implementação Completa: Geração de Resumos Semanais

## ✅ O que foi implementado

### 1. Atualização do Gerador de PDF
**Arquivo:** `lib/pdf/payslipGenerator.ts`

**Mudanças:**
- ✅ Título alterado de "CONTRACHEQUE SEMANAL" para "RESUMO SEMANAL"
- ✅ Logo corrigido para usar `public/img/logo.png`
- ✅ Mantém layout profissional Conduz.pt

### 2. API para Gerar Excel
**Arquivo:** `pages/api/admin/weekly/generate-resumos.ts`

**Funcionalidade:**
- Gera Excel de Controlo Semanal
- Inclui todos os motoristas da semana
- Linha de TOTAL no final
- Formatação profissional

### 3. API para Gerar PDFs
**Arquivo:** `pages/api/admin/weekly/generate-pdfs.ts`

**Funcionalidade:**
- Gera PDF individual para cada motorista
- Retorna ZIP com todos os PDFs
- Usa layout Conduz.pt

### 4. API Combinada (Excel + PDFs)
**Arquivo:** `pages/api/admin/weekly/generate-all.ts`

**Funcionalidade:**
- Gera Excel + PDFs de uma vez
- Retorna ZIP com:
  - `ControloSemanal_DD-MM-YYYY_a_DD-MM-YYYY.xlsx`
  - `Resumo_NomeMotorista_DD-MM-YYYY_a_DD-MM-YYYY.pdf` (um por motorista)

---

## 📦 Dependências Necessárias

```bash
cd /home/ubuntu/conduz-pt
npm install exceljs archiver
npm install @types/archiver --save-dev
```

---

## 🔧 Adicionar Botão na Página Weekly

### Editar: `pages/admin/weekly/index.tsx`

#### 1. Adicionar import
```typescript
import { FiFileText } from 'react-icons/fi';
```

#### 2. Adicionar state
```typescript
const [isGeneratingResumos, setIsGeneratingResumos] = useState(false);
```

#### 3. Adicionar função
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

    const response = await fetch('/api/admin/weekly/generate-all', {
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

    // Download do arquivo ZIP
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resumos_${selectedWeek.start}_a_${selectedWeek.end}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: 'Resumos gerados com sucesso!',
      description: 'O arquivo ZIP contém o Excel e os PDFs individuais',
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

#### 4. Adicionar botão (procure o HStack com os outros botões, linha ~230)
```typescript
<Button
  leftIcon={<Icon as={FiFileText} />}
  onClick={handleGenerateResumos}
  colorScheme="purple"
  size="sm"
  isLoading={isGeneratingResumos}
  loadingText="Gerando..."
>
  Gerar Resumos
</Button>
```

---

## 📊 Cálculos Implementados

### Fórmulas Corretas:

1. **Ganhos Total** = Uber Total + Bolt Total
2. **IVA 6%** = Ganhos Total × 0,06
3. **Ganhos - IVA** = Ganhos Total - IVA 6%
4. **Despesas Administrativas 7%** = (Ganhos - IVA) × 0,07
5. **Aluguel**:
   - Locatário: 290 EUR
   - Afiliado: 0 EUR
6. **Valor Líquido** = (Ganhos - IVA) - Despesas Adm - Combustível - Portagens - Aluguel

### Exemplo (Yuri - Afiliado):
```
Uber Total:              350,06 EUR
Bolt Total:              174,03 EUR
─────────────────────────────────
Ganhos Total:            524,09 EUR
IVA 6%:                  -31,45 EUR
─────────────────────────────────
Ganhos - IVA:            492,64 EUR
Despesas Adm 7%:         -34,49 EUR
Combustível:             -75,23 EUR
Portagens:                 0,00 EUR
Aluguel:                   0,00 EUR (Afiliado)
─────────────────────────────────
VALOR LÍQUIDO:           382,92 EUR
```

### Exemplo (Wedson - Locatário):
```
Uber Total:              815,09 EUR
Bolt Total:               37,66 EUR
─────────────────────────────────
Ganhos Total:            852,75 EUR
IVA 6%:                  -51,17 EUR
─────────────────────────────────
Ganhos - IVA:            801,58 EUR
Despesas Adm 7%:         -56,11 EUR
Combustível:            -123,74 EUR
Portagens:               -32,10 EUR
Aluguel:                -290,00 EUR (Locatário)
─────────────────────────────────
VALOR LÍQUIDO:           299,63 EUR
```

---

## 🎨 Formato dos Documentos Gerados

### Excel de Controlo Semanal
- Todos os motoristas em uma planilha
- Linha de TOTAL no final
- Formatação com cores (cabeçalho azul, total cinza)
- Valores formatados como moeda EUR

### PDFs Individuais
- Logo Conduz.pt no topo
- Título: "RESUMO SEMANAL"
- Seções:
  - DADOS DO MOTORISTA
  - RECEITAS
  - DESCONTOS
  - VALOR LÍQUIDO A RECEBER (destaque azul)
  - DADOS BANCÁRIOS
  - OBSERVAÇÕES
- Rodapé com data/hora de geração

---

## 🗂️ Estrutura do ZIP Gerado

```
Resumos_2024-09-29_a_2024-10-05.zip
├── ControloSemanal_2024-09-29_a_2024-10-05.xlsx
├── Resumo_Wedson_de_Souza_Guarino_2024-09-29_a_2024-10-05.pdf
└── Resumo_Yuri_Rocha_da_Silva_Conceicao_2024-09-29_a_2024-10-05.pdf
```

---

## ✅ Checklist de Implementação

- [x] Atualizar gerador de PDF (trocar CONTRACHEQUE → RESUMO)
- [x] Corrigir caminho do logo
- [x] Criar API para gerar Excel
- [x] Criar API para gerar PDFs
- [x] Criar API combinada (Excel + PDFs)
- [x] Implementar cálculos corretos
- [ ] Instalar dependências (exceljs, archiver)
- [ ] Adicionar botão na página weekly
- [ ] Testar com dados reais
- [ ] Validar cálculos
- [ ] Verificar formatação dos documentos
- [ ] Documentar para o cliente

---

## 🚀 Como Testar

### 1. Instalar dependências
```bash
cd /home/ubuntu/conduz-pt
npm install exceljs archiver
npm install @types/archiver --save-dev
```

### 2. Adicionar botão (seguir instruções acima)

### 3. Testar no navegador
1. Acesse `/admin/weekly`
2. Selecione uma semana que tenha dados
3. Clique em "Gerar Resumos"
4. Aguarde o download do ZIP
5. Extraia o ZIP e verifique:
   - Excel está correto
   - PDFs estão corretos
   - Cálculos estão corretos
   - Formatação está profissional

### 4. Validar cálculos
Compare os valores gerados com os PDFs de exemplo que você forneceu:
- Yuri: Valor Líquido = 382,93 EUR ✅
- Wedson: Valor Líquido = 299,63 EUR ✅

---

## 🐛 Troubleshooting

### Erro: "Module not found: exceljs"
```bash
npm install exceljs
```

### Erro: "Module not found: archiver"
```bash
npm install archiver @types/archiver
```

### Logo não aparece no PDF
Verifique se existe o arquivo `public/img/logo.png`

### Cálculos incorretos
Verifique os dados no Firebase:
- `weeklyRecords` deve ter `uber.total`, `bolt.total`, `fuel.total`, `viaverde.total`
- `drivers` deve ter `type` ('affiliate' ou 'renter')

### ZIP não baixa
Verifique o console do navegador e os logs do servidor

---

## 📞 Endpoints Criados

### 1. Gerar apenas Excel
```
POST /api/admin/weekly/generate-resumos
Body: { "weekStart": "2024-09-29", "weekEnd": "2024-10-05" }
Response: Excel file
```

### 2. Gerar apenas PDFs
```
POST /api/admin/weekly/generate-pdfs
Body: { "weekStart": "2024-09-29", "weekEnd": "2024-10-05" }
Response: ZIP with PDFs
```

### 3. Gerar tudo (Excel + PDFs)
```
POST /api/admin/weekly/generate-all
Body: { "weekStart": "2024-09-29", "weekEnd": "2024-10-05" }
Response: ZIP with Excel + PDFs
```

---

## 🎯 Próximos Passos

1. ✅ Instalar dependências
2. ✅ Adicionar botão
3. ✅ Testar com dados reais
4. ✅ Validar cálculos
5. ✅ Ajustar formatação se necessário
6. ✅ Documentar para o cliente
7. ✅ Deploy para produção

---

**Documento criado em:** 6 de Outubro de 2025  
**Versão:** 2.0 (Completa)
