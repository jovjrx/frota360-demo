# 🎯 PROMPT PARA COPILOT - INTEGRAÇÃO COMPLETA APIS TVDE

## 📋 CONTEXTO

Você está trabalhando no projeto **Conduz PT**, uma plataforma de gestão TVDE em Next.js (Pages Router) + TypeScript. O objetivo é integrar 6 plataformas externas para consolidar métricas no dashboard admin.

**Estrutura atual:**
- `lib/integrations/` - Clientes e scrapers das plataformas
- `lib/integrations/unified-scraper.ts` - Consolidador central
- `scripts/test-integrations.ts` - Script de teste

**Credenciais disponíveis:**
- Uber: info@alvoradamagistral.eu / Alvorada@25
- Bolt: caroline@alvoradamagistral.eu / Muffin@2017
- Cartrack: ALVO00008 / Alvorada2025@
- FONOA: info@alvoradamagistral.eu / Muffin@2017
- ViaVerde: info@alvoradamagistral.eu / Alvorada2025@
- myprio: 606845 / Alvorada25@

---

## 🎯 OBJETIVO

Implementar scrapers funcionais para **todas as 6 plataformas**, garantindo que o `UnifiedScraper` consiga buscar dados mensais de cada uma.

---

## ✅ FASE 1: AUDITORIA DAS INTEGRAÇÕES

### Tarefa 1.1: Verificar status atual

Para cada plataforma, verifique:

1. **Bolt** (`lib/integrations/bolt/`)
   - ✓ Existe `client.ts` e `scraper.ts`
   - ❓ Qual está funcionando?
   - ❓ Consegue fazer login e extrair dados?

2. **Cartrack** (`lib/integrations/cartrack/`)
   - ✓ Existe `client.ts`
   - ❓ API está funcionando?
   - ❓ Método `getMonthlyData()` retorna dados?

3. **Uber** (`lib/integrations/uber/`)
   - ✓ Existe `client.ts`
   - ❓ API está funcionando?
   - ❓ OAuth está configurado?
   - ⚠️ Se não funcionar, criar scraper

4. **FONOA** (`lib/integrations/fonoa/`)
   - ✓ Existe `client.ts`
   - ❓ API está funcionando?
   - ⚠️ Se não funcionar, criar scraper

5. **ViaVerde** (`lib/integrations/viaverde/`)
   - ✓ Existe `client.ts` e `scraper.ts`
   - ❓ Qual está funcionando?
   - ⚠️ Priorizar scraper

6. **myprio** (`lib/integrations/myprio/`)
   - ✓ Existe `client.ts` e `scraper.ts`
   - ❓ Qual está funcionando?
   - ⚠️ Priorizar scraper

### Tarefa 1.2: Criar relatório

Crie um arquivo `INTEGRACAO_STATUS.md` com:

```markdown
# Status das Integrações

## ✅ Funcionando
- [x] Bolt - Scraper OK
- [x] Cartrack - API OK

## ⚠️ Parcialmente Funcionando
- [ ] Uber - API com problemas (descrever)

## ❌ Não Funcionando
- [ ] FONOA - (descrever problema)
- [ ] ViaVerde - (descrever problema)
- [ ] myprio - (descrever problema)

## 📝 Notas
- Bolt: Login funciona, extração de dados OK
- Cartrack: API retorna veículos mas não viagens
- etc...
```

---

## 🔧 FASE 2: IMPLEMENTAR SCRAPERS FALTANTES

Para cada plataforma que **NÃO está funcionando**, implemente um scraper com Puppeteer.

### Template de Scraper

```typescript
import puppeteer, { Browser, Page } from 'puppeteer';

interface [Platform]Transaction {
  date: string;
  amount: number;
  // ... outros campos relevantes
}

interface [Platform]MonthlyData {
  success: boolean;
  data?: {
    total: number;
    transactions: [Platform]Transaction[];
  };
  error?: string;
  timestamp: string;
}

export class [Platform]Scraper {
  private browser?: Browser;
  private page?: Page;
  private email: string;
  private password: string;

  constructor() {
    this.email = process.env.[PLATFORM]_EMAIL || '[email_padrao]';
    this.password = process.env.[PLATFORM]_PASSWORD || '[senha_padrao]';
  }

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  }

  async login(): Promise<boolean> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      console.log(`[[Platform]] Navegando para login...`);
      await this.page.goto('[URL_LOGIN]', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Aguardar campos de login
      await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

      console.log(`[[Platform]] Preenchendo credenciais...`);
      await this.page.type('input[type="email"], input[name="email"]', this.email, { delay: 100 });
      await this.page.type('input[type="password"]', this.password, { delay: 100 });

      console.log(`[[Platform]] Submetendo formulário...`);
      await Promise.all([
        this.page.click('button[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      ]);

      const url = this.page.url();
      const isLoggedIn = !url.includes('/login');

      if (isLoggedIn) {
        console.log(`[[Platform]] ✓ Login bem-sucedido!`);
        return true;
      } else {
        console.error(`[[Platform]] ✗ Login falhou`);
        return false;
      }
    } catch (error) {
      console.error(`[[Platform]] Erro durante login:`, error);
      return false;
    }
  }

  async getMonthlyData(year: number, month: number): Promise<[Platform]MonthlyData> {
    try {
      if (!this.browser) await this.init();

      const loginSuccess = await this.login();
      if (!loginSuccess) {
        return {
          success: false,
          error: 'Login failed',
          timestamp: new Date().toISOString()
        };
      }

      if (!this.page) throw new Error('Page not initialized');

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      console.log(`[[Platform]] Navegando para dados...`);
      await this.page.goto('[URL_DADOS]', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Aplicar filtro de data (se necessário)
      // ...

      // Extrair dados
      console.log(`[[Platform]] Extraindo dados...`);
      const transactions = await this.page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr, [seletor_linhas]'));
        
        return rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td, [seletor_celulas]'));
          
          if (cells.length >= 2) {
            return {
              date: cells[0]?.textContent?.trim() || '',
              amount: parseFloat(cells[1]?.textContent?.replace(/[^0-9.]/g, '') || '0'),
              // ... outros campos
            };
          }
          
          return null;
        }).filter(Boolean);
      });

      const total = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);

      console.log(`[[Platform]] ✓ ${transactions.length} transações, €${total.toFixed(2)}`);

      return {
        success: true,
        data: {
          total: Math.round(total * 100) / 100,
          transactions
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`[[Platform]] Erro:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
      this.page = undefined;
    }
  }
}

export const create[Platform]Scraper = () => new [Platform]Scraper();
```

### Tarefa 2.1: Uber Scraper (se API não funcionar)

**URL**: https://drivers.uber.com/ ou https://partners.uber.com/

**Dados necessários:**
- Total de viagens no mês
- Ganhos totais
- Gorjetas
- Portagens

**Passos:**
1. Criar `lib/integrations/uber/scraper.ts`
2. Login com: info@alvoradamagistral.eu / Alvorada@25
3. Navegar para "Viagens" ou "Earnings"
4. Aplicar filtro de data (mês específico)
5. Extrair dados da tabela/lista
6. Calcular totais

**Seletores a investigar:**
- Tabela de viagens: `table.trips`, `div[data-testid="trip-list"]`
- Valores: `span.earnings`, `div.amount`
- Filtros de data: `input[type="date"]`, `button[aria-label*="date"]`

### Tarefa 2.2: FONOA Scraper (se API não funcionar)

**URL**: https://app.fonoa.com/ ou portal específico

**Dados necessários:**
- Total de faturas no mês
- Valor total de impostos (IVA)

**Passos:**
1. Criar `lib/integrations/fonoa/scraper.ts`
2. Login com: info@alvoradamagistral.eu / Muffin@2017
3. Navegar para "Invoices" ou "Faturas"
4. Filtrar por mês
5. Extrair valores

### Tarefa 2.3: ViaVerde Scraper

**URL**: https://www.viaverde.pt/particulares/login

**Dados necessários:**
- Portagens
- Estacionamento
- Combustível (se disponível)

**Passos:**
1. Melhorar `lib/integrations/viaverde/scraper.ts` existente
2. Login com: info@alvoradamagistral.eu / Alvorada2025@
3. Navegar para "Movimentos" ou "Transações"
4. Filtrar por mês
5. Separar por tipo (portagem, estacionamento, combustível)

### Tarefa 2.4: myprio Scraper

**URL**: https://myprio.com/login (ou URL correta)

**Dados necessários:**
- Despesas por categoria
- Combustível
- Manutenção
- Outros

**Passos:**
1. Melhorar `lib/integrations/myprio/scraper.ts` existente
2. Login com: 606845 / Alvorada25@
3. Navegar para "Despesas" ou "Expenses"
4. Filtrar por mês
5. Agrupar por categoria

---

## 🔍 FASE 3: DEBUGGING E AJUSTES

### Tarefa 3.1: Testar cada scraper individualmente

Para cada scraper, crie um teste standalone:

```typescript
// scripts/test-[platform].ts
import { [Platform]Scraper } from '../lib/integrations/[platform]/scraper';

async function main() {
  const scraper = new [Platform]Scraper();
  
  try {
    const data = await scraper.getMonthlyData(2024, 10);
    console.log(JSON.stringify(data, null, 2));
  } finally {
    await scraper.close();
  }
}

main();
```

Adicionar ao `package.json`:
```json
{
  "scripts": {
    "test:uber": "ts-node scripts/test-uber.ts",
    "test:fonoa": "ts-node scripts/test-fonoa.ts",
    "test:viaverde": "ts-node scripts/test-viaverde.ts",
    "test:myprio": "ts-node scripts/test-myprio.ts"
  }
}
```

### Tarefa 3.2: Ajustar seletores CSS

Se um scraper falhar:

1. Rodar com `headless: false` para ver o navegador
2. Usar DevTools para inspecionar elementos
3. Ajustar seletores CSS
4. Adicionar `await this.page.screenshot({ path: 'debug.png' })` para debug

### Tarefa 3.3: Tratar erros comuns

**Erro: "Timeout waiting for selector"**
- Aumentar timeout
- Verificar se o seletor está correto
- Aguardar carregamento: `await this.page.waitForSelector('[seletor]', { timeout: 10000 })`

**Erro: "Navigation timeout"**
- Aumentar timeout de navegação
- Usar `waitUntil: 'domcontentloaded'` ao invés de `networkidle2`

**Erro: "Login falhou"**
- Verificar credenciais
- Verificar se há CAPTCHA
- Adicionar delays: `await new Promise(r => setTimeout(r, 2000))`

---

## 🔗 FASE 4: INTEGRAR NO UNIFIED SCRAPER

### Tarefa 4.1: Atualizar UnifiedScraper

Arquivo: `lib/integrations/unified-scraper.ts`

Para cada plataforma, garantir que está usando o scraper correto:

```typescript
// Se Uber API não funcionar, usar scraper
import { UberScraper } from './uber/scraper'; // ao invés de UberClient

// No constructor
this.uber = new UberScraper();

// No método syncUber
private async syncUber(year: number, month: number): Promise<any> {
  console.log('[Uber] Iniciando sincronização...');
  try {
    const result = await this.uber.getMonthlyData(year, month);
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }

    console.log(`[Uber] ✓ ${result.data?.totalTrips} viagens, €${result.data?.totalEarnings.toFixed(2)}`);
    
    return result.data;
  } catch (error: any) {
    console.error(`[Uber] ✗ Erro: ${error.message}`);
    throw error;
  } finally {
    await this.uber.close();
  }
}
```

### Tarefa 4.2: Testar UnifiedScraper completo

```bash
npm run test:integrations 2024 10
```

Deve retornar:
- ✓ Todas as 6 plataformas com sucesso
- ✓ Dados consolidados corretos
- ✓ Nenhum erro

---

## 📊 FASE 5: VALIDAÇÃO FINAL

### Tarefa 5.1: Checklist de validação

Para cada plataforma, confirmar:

- [ ] **Bolt**
  - [ ] Login funciona
  - [ ] Extrai viagens do mês
  - [ ] Extrai ganhos totais
  - [ ] Extrai gorjetas
  - [ ] Dados estão corretos

- [ ] **Cartrack**
  - [ ] Autenticação funciona
  - [ ] Retorna veículos ativos
  - [ ] Retorna distância percorrida
  - [ ] Retorna combustível (se disponível)

- [ ] **Uber**
  - [ ] Login/API funciona
  - [ ] Extrai viagens do mês
  - [ ] Extrai ganhos totais
  - [ ] Extrai gorjetas
  - [ ] Extrai portagens

- [ ] **FONOA**
  - [ ] Login/API funciona
  - [ ] Extrai faturas do mês
  - [ ] Calcula impostos (IVA)

- [ ] **ViaVerde**
  - [ ] Login funciona
  - [ ] Extrai portagens
  - [ ] Extrai estacionamento
  - [ ] Extrai combustível (se houver)

- [ ] **myprio**
  - [ ] Login funciona
  - [ ] Extrai despesas do mês
  - [ ] Separa por categoria (combustível, manutenção, outros)

### Tarefa 5.2: Testar com dados reais

```bash
# Testar mês atual
npm run test:integrations

# Testar mês anterior
npm run test:integrations 2024 9

# Testar mês específico
npm run test:integrations 2024 10
```

Verificar:
- ✓ Todos os valores fazem sentido
- ✓ Totais batem com os portais originais
- ✓ Não há erros de parsing
- ✓ Datas estão corretas

### Tarefa 5.3: Documentar resultados

Criar arquivo `INTEGRACAO_FINAL.md`:

```markdown
# Integração Final - Resultados

## ✅ Status
- [x] Bolt - Scraper funcionando
- [x] Cartrack - API funcionando
- [x] Uber - Scraper funcionando (API não disponível)
- [x] FONOA - Scraper funcionando
- [x] ViaVerde - Scraper funcionando
- [x] myprio - Scraper funcionando

## 📊 Teste Realizado

**Período**: Outubro 2024

**Resultados**:
- Total de Viagens: 434
- Receitas: €16,004.95
- Despesas: €4,926.85
- Lucro Líquido: €11,078.10

**Taxa de Sucesso**: 100% (6/6 plataformas)

## 🔧 Ajustes Realizados

### Uber
- Implementado scraper porque API requer OAuth complexo
- Seletores ajustados para nova interface
- Adicionado tratamento de paginação

### FONOA
- Implementado scraper porque API não estava disponível
- Calculando IVA (23%) sobre valores das faturas

### ViaVerde
- Ajustados seletores CSS
- Adicionado filtro de data
- Separação por tipo de transação

### myprio
- Ajustados seletores CSS
- Categorização automática de despesas
- Tratamento de valores em diferentes formatos

## 📝 Notas Técnicas

- Puppeteer configurado com stealth plugin
- Timeouts ajustados para 30s
- Screenshots de debug salvos em caso de erro
- Logs detalhados para cada etapa
```

---

## 🎯 CRITÉRIOS DE SUCESSO

A integração está completa quando:

1. ✅ **Todas as 6 plataformas retornam dados**
   - Bolt, Cartrack, Uber, FONOA, ViaVerde, myprio

2. ✅ **UnifiedScraper funciona sem erros**
   - `npm run test:integrations` executa sem falhas
   - Taxa de sucesso = 100%

3. ✅ **Dados são consistentes**
   - Valores batem com os portais originais
   - Cálculos de totais estão corretos
   - Datas estão no formato esperado

4. ✅ **Código está limpo**
   - TypeScript compila sem erros
   - Logs são claros e informativos
   - Tratamento de erros robusto

5. ✅ **Documentação está completa**
   - README atualizado
   - Variáveis de ambiente documentadas
   - Exemplos de uso fornecidos

---

## 🚀 EXECUÇÃO

Execute as fases em ordem:

```bash
# Fase 1: Auditoria
# - Verificar cada integração manualmente
# - Criar INTEGRACAO_STATUS.md

# Fase 2: Implementar scrapers
npm run test:uber
npm run test:fonoa
npm run test:viaverde
npm run test:myprio

# Fase 3: Debug
# - Ajustar seletores conforme necessário
# - Testar com headless: false

# Fase 4: Integrar
npm run test:integrations 2024 10

# Fase 5: Validar
# - Verificar todos os dados
# - Criar INTEGRACAO_FINAL.md
```

---

## 📦 ENTREGÁVEIS

1. ✅ Scrapers funcionando para todas as plataformas
2. ✅ UnifiedScraper consolidando tudo
3. ✅ Scripts de teste individuais
4. ✅ Documentação completa
5. ✅ Variáveis de ambiente configuradas
6. ✅ Relatórios de status e resultados

---

## 💡 DICAS IMPORTANTES

### Para Scrapers com Puppeteer:

1. **Sempre usar stealth plugin**
   ```typescript
   import puppeteer from 'puppeteer-extra';
   import StealthPlugin from 'puppeteer-extra-plugin-stealth';
   puppeteer.use(StealthPlugin());
   ```

2. **Aguardar elementos antes de interagir**
   ```typescript
   await page.waitForSelector('[seletor]', { timeout: 10000 });
   await page.click('[seletor]');
   ```

3. **Adicionar delays entre ações**
   ```typescript
   await page.type('input', 'texto', { delay: 100 });
   await new Promise(r => setTimeout(r, 2000));
   ```

4. **Salvar screenshots para debug**
   ```typescript
   await page.screenshot({ path: `debug-${Date.now()}.png`, fullPage: true });
   ```

5. **Tratar paginação**
   ```typescript
   let allData = [];
   let hasNextPage = true;
   
   while (hasNextPage) {
     const pageData = await page.evaluate(() => { /* extrair dados */ });
     allData.push(...pageData);
     
     const nextButton = await page.$('button.next');
     if (nextButton) {
       await nextButton.click();
       await page.waitForTimeout(2000);
     } else {
       hasNextPage = false;
     }
   }
   ```

### Para APIs:

1. **Sempre verificar autenticação**
   ```typescript
   if (!this.authToken || this.isTokenExpired()) {
     await this.authenticate();
   }
   ```

2. **Tratar rate limiting**
   ```typescript
   if (response.status === 429) {
     await new Promise(r => setTimeout(r, 60000)); // Aguardar 1 minuto
     return this.retry();
   }
   ```

3. **Validar respostas**
   ```typescript
   if (!response.ok) {
     throw new Error(`API error: ${response.status} ${response.statusText}`);
   }
   ```

---

## ✅ CHECKLIST FINAL

Antes de considerar completo:

- [ ] Todas as 6 plataformas funcionando
- [ ] UnifiedScraper retorna dados consolidados
- [ ] Scripts de teste executam sem erros
- [ ] TypeScript compila sem erros
- [ ] Documentação criada e atualizada
- [ ] Variáveis de ambiente configuradas
- [ ] Testado com dados reais de pelo menos 2 meses diferentes
- [ ] Commit e push para o GitHub
- [ ] README.md atualizado com instruções

---

**🎯 OBJETIVO FINAL: Sistema 100% funcional que busca dados mensais de todas as 6 plataformas TVDE e consolida em métricas unificadas para o dashboard admin.**
