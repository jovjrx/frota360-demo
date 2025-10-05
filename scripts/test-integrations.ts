#!/usr/bin/env ts-node

/**
 * Script de teste para integração com todas as APIs TVDE
 * 
 * Uso:
 *   npm run test:integrations
 *   ou
 *   ts-node scripts/test-integrations.ts
 */

import { UnifiedScraper } from '../lib/integrations/unified-scraper';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  TESTE DE INTEGRAÇÃO - CONDUZ PT - APIS TVDE          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Obter mês atual ou usar parâmetros
  const now = new Date();
  const year = parseInt(process.argv[2]) || now.getFullYear();
  const month = parseInt(process.argv[3]) || now.getMonth() + 1;

  console.log(`📅 Período: ${year}-${String(month).padStart(2, '0')}\n`);

  const scraper = new UnifiedScraper();

  try {
    // Executar coleta de dados
    const metrics = await scraper.getMonthlyMetrics(year, month);

    // Exibir resultados
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  RESULTADOS CONSOLIDADOS                              ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('💰 RECEITAS:');
    console.log(`   Total de Viagens: ${metrics.totalTrips}`);
    console.log(`   Ganhos Totais: €${metrics.totalEarnings.toFixed(2)}`);
    console.log(`   Gorjetas: €${metrics.totalTips.toFixed(2)}`);
    console.log(`   TOTAL RECEITAS: €${(metrics.totalEarnings + metrics.totalTips).toFixed(2)}\n`);

    console.log('💸 DESPESAS:');
    console.log(`   Combustível: €${metrics.totalFuelCost.toFixed(2)}`);
    console.log(`   Portagens: €${metrics.totalTollsCost.toFixed(2)}`);
    console.log(`   Manutenção: €${metrics.totalMaintenanceCost.toFixed(2)}`);
    console.log(`   Impostos: €${metrics.totalTaxes.toFixed(2)}`);
    console.log(`   TOTAL DESPESAS: €${metrics.totalExpenses.toFixed(2)}\n`);

    console.log('🚗 FROTA:');
    console.log(`   Veículos Ativos: ${metrics.activeVehicles}/${metrics.totalVehicles}`);
    console.log(`   Distância Total: ${metrics.totalDistance.toFixed(2)} km\n`);

    console.log('📊 RESULTADO:');
    const profitColor = metrics.netProfit >= 0 ? '\x1b[32m' : '\x1b[31m'; // Verde ou vermelho
    console.log(`   ${profitColor}Lucro Líquido: €${metrics.netProfit.toFixed(2)}\x1b[0m\n`);

    // Exibir status das plataformas
    console.log('🔌 STATUS DAS INTEGRAÇÕES:');
    const platforms = [
      { name: 'Uber', data: metrics.platforms.uber },
      { name: 'Bolt', data: metrics.platforms.bolt },
      { name: 'Cartrack', data: metrics.platforms.cartrack },
      { name: 'FONOA', data: metrics.platforms.fonoa },
      { name: 'ViaVerde', data: metrics.platforms.viaverde },
      { name: 'myprio', data: metrics.platforms.myprio }
    ];

    platforms.forEach(platform => {
      const status = platform.data ? '✓' : '✗';
      const color = platform.data ? '\x1b[32m' : '\x1b[31m';
      console.log(`   ${color}${status}\x1b[0m ${platform.name}`);
    });

    if (metrics.errors.length > 0) {
      console.log('\n⚠️  ERROS:');
      metrics.errors.forEach(error => {
        console.log(`   ✗ ${error.platform}: ${error.error}`);
      });
    }

    // Salvar resultados em arquivo JSON
    const outputDir = path.join(__dirname, '../data/metrics');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `metrics_${year}_${String(month).padStart(2, '0')}.json`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2));
    console.log(`\n💾 Dados salvos em: ${filepath}`);

    // Estatísticas finais
    const successRate = ((6 - metrics.errors.length) / 6 * 100).toFixed(0);
    console.log(`\n📈 Taxa de Sucesso: ${successRate}%`);
    console.log(`⏱️  Timestamp: ${metrics.timestamp}`);

    console.log('\n✅ Teste concluído com sucesso!\n');

  } catch (error: any) {
    console.error('\n❌ Erro durante o teste:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

// Executar
main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
