/**
 * ============================================================================
 * FIX: Corrigir Credenciais das Integrações no Firestore
 * ============================================================================
 * 
 * Este script corrige as credenciais e ativa as integrações no Firestore
 * 
 * COMO USAR:
 * ```bash
 * npx tsx scripts/fix-integrations.ts
 * ```
 * 
 * ============================================================================
 */

import integrationService from '../lib/integrations/integration-service';
import integrationLogService from '../lib/integrations/integration-log-service';

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔧 CORRIGINDO INTEGRAÇÕES NO FIRESTORE');
  console.log('='.repeat(70) + '\n');

  try {
    // ========================================================================
    // 1. CARTRACK
    // ========================================================================
    console.log('📝 1. Atualizando Cartrack...');
    
    await integrationService.updateIntegration('cartrack', {
      enabled: true,
      status: 'active',
      credentials: {
        username: 'ALVO00008',
        apiKey: '4204acaf6943762f716ce3301f38d9f10e699512bbbca783f96aec223cbef805',
      },
      config: {
        baseUrl: 'https://fleetapi-pt.cartrack.com/rest',
        options: {
          authType: 'basic',
          dateFormat: 'YYYY-MM-DD HH:MM:SS',
          timezone: 'Europe/Lisbon',
        },
      },
    });
    
    await integrationLogService.logInfo(
      'cartrack',
      'Credenciais atualizadas via script de correção'
    );
    
    console.log('✅ Cartrack atualizado e ATIVADO\n');

    // ========================================================================
    // 2. BOLT
    // ========================================================================
    console.log('📝 2. Atualizando Bolt...');
    
    await integrationService.updateIntegration('bolt', {
      enabled: true,
      status: 'active',
      credentials: {
        clientId: 'G__hozQ4Baf39Xk9PjVH7',
        clientSecret: 'SL5zIEeoQCAdz_wPOqEl1F4wL24xaYMoVws5jtemEZE_WZzBPIfSawHE-oaZ14UquJG6iejy84zs_njFjJ4wsA',
      },
      config: {
        baseUrl: 'https://node.bolt.eu/fleet-integration-gateway',
        authUrl: 'https://oidc.bolt.eu/token',
      },
    });
    
    await integrationLogService.logInfo(
      'bolt',
      'Credenciais atualizadas via script de correção'
    );
    
    console.log('✅ Bolt atualizado e ATIVADO\n');

    // ========================================================================
    // 3. UBER
    // ========================================================================
    console.log('📝 3. Atualizando Uber...');
    
    await integrationService.updateIntegration('uber', {
      enabled: true,
      status: 'pending', // Aguardando OAuth
      credentials: {
        clientId: '0W89Kw8QMgGdesno5dBdvNdabnMw8KkL',
        clientSecret: 'mQdZgiooj9SId57DuR5w9t6TSq10HHfG7acVTq1A',
        orgUuid: '',
      },
      config: {
        baseUrl: 'https://api.uber.com/v1',
        authUrl: 'https://auth.uber.com/oauth/v2/authorize',
        tokenUrl: 'https://auth.uber.com/oauth/v2/token',
      },
    });
    
    await integrationLogService.logInfo(
      'uber',
      'Credenciais atualizadas via script de correção (aguardando OAuth)'
    );
    
    console.log('✅ Uber atualizado (aguardando autorização OAuth)\n');

    // ========================================================================
    // 4. VIAVERDE
    // ========================================================================
    console.log('📝 4. Atualizando ViaVerde...');
    
    await integrationService.updateIntegration('viaverde', {
      enabled: false, // Desabilitado até testar scraper
      status: 'inactive',
      credentials: {
        email: 'info@alvoradamagistral.eu',
        password: 'Alvorada2025@',
      },
      config: {
        baseUrl: 'https://www.viaverde.pt',
        endpoints: {
          login: 'https://www.viaverde.pt/particulares/login',
        },
      },
    });
    
    await integrationLogService.logInfo(
      'viaverde',
      'Credenciais configuradas (desabilitado até testar scraper)'
    );
    
    console.log('✅ ViaVerde configurado (desabilitado)\n');

    // ========================================================================
    // 5. FONOA
    // ========================================================================
    console.log('📝 5. Atualizando FONOA...');
    
    await integrationService.updateIntegration('fonoa', {
      enabled: false, // Não implementado
      status: 'inactive',
      credentials: {
        email: 'info@alvoradamagistral.eu',
        password: 'Muffin@2017',
      },
      config: {
        baseUrl: 'https://app.fonoa.com',
        endpoints: {
          login: 'https://app.fonoa.com/login',
        },
      },
    });
    
    await integrationLogService.logInfo(
      'fonoa',
      'Credenciais configuradas (não implementado)'
    );
    
    console.log('✅ FONOA configurado (não implementado)\n');

    // ========================================================================
    // 6. MYPRIO
    // ========================================================================
    console.log('📝 6. Atualizando myPrio...');
    
    await integrationService.updateIntegration('myprio', {
      enabled: false, // Desabilitado até testar scraper
      status: 'inactive',
      credentials: {
        accountId: '606845',
        password: 'Alvorada25@',
      },
      config: {
        baseUrl: 'https://www.myprio.pt',
        endpoints: {
          login: 'https://www.myprio.pt/login',
        },
      },
    });
    
    await integrationLogService.logInfo(
      'myprio',
      'Credenciais configuradas (desabilitado até testar scraper)'
    );
    
    console.log('✅ myPrio configurado (desabilitado)\n');

    // ========================================================================
    // RESUMO FINAL
    // ========================================================================
    console.log('='.repeat(70));
    console.log('📊 RESUMO');
    console.log('='.repeat(70));
    
    const integrations = await integrationService.getAllIntegrations();
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  PLATAFORMA     │ STATUS       │ CREDENCIAIS                  ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    
    for (const integration of integrations) {
      if (!integration) continue;
      
      const platform = (integration.platform || '').padEnd(15);
      const statusIcon = integration.enabled ? '🟢 Ativa' : '🔴 Inativa';
      const status = statusIcon.padEnd(13);
      
      const credentials = integration.credentials || {};
      const hasAllCreds = Object.values(credentials).every(v => v && v !== '');
      const credStatus = hasAllCreds ? '✅ Completa' : '⚠️  Incompleta';
      
      console.log(`║  ${platform} │ ${status} │ ${credStatus.padEnd(29)}║`);
    }
    
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('💡 PRÓXIMOS PASSOS:\n');
    console.log('   1. Teste Cartrack: npx tsx scripts/test-cartrack.ts');
    console.log('   2. Teste Bolt: npx tsx scripts/test-bolt.ts');
    console.log('   3. Autorizar Uber: http://localhost:3000/admin/integrations/uber');
    console.log('   4. Ver logs: Firestore > integration_logs\n');

    console.log('='.repeat(70));
    console.log('✅ CORREÇÃO CONCLUÍDA COM SUCESSO! 🎉');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Erro durante correção:', error);
    process.exit(1);
  }
}

main();
