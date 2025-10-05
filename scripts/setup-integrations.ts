/**
 * ============================================================================
 * SETUP: Inicializar Integrações no Firestore
 * ============================================================================
 * 
 * Este script configura todas as integrações TVDE no Firestore
 * 
 * O QUE ELE FAZ:
 * ✅ Cria a coleção "integrations" no Firestore
 * ✅ Adiciona todas as 6 plataformas com configurações padrão
 * ✅ Importa credenciais de variáveis de ambiente (.env)
 * ✅ Valida e testa as conexões
 * 
 * COMO USAR:
 * ```bash
 * # 1. Configure o .env.local com as credenciais
 * cp .env.local.example .env.local
 * 
 * # 2. Execute o script
 * npx tsx scripts/setup-integrations.ts
 * 
 * # 3. Verifique no Firestore: integrations/
 * ```
 * 
 * ============================================================================
 */

import integrationService from '../lib/integrations/integration-service';
import { IntegrationPlatform } from '../schemas/integration';

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

function logWarning(message: string) {
  console.log(`⚠️  ${message}`);
}

function logError(message: string) {
  console.log(`❌ ${message}`);
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Inicializa integrações com valores padrão
 */
async function initializeDefaultIntegrations() {
  console.log('\n📦 Etapa 1: Inicializando integrações padrão...\n');
  
  try {
    await integrationService.initializeDefaultIntegrations();
    logSuccess('Integrações padrão criadas com sucesso!');
  } catch (error) {
    logError(`Erro ao inicializar integrações: ${error}`);
    throw error;
  }
}

/**
 * Sincroniza credenciais de variáveis de ambiente
 */
async function syncCredentialsFromEnv() {
  console.log('\n🔄 Etapa 2: Sincronizando credenciais do .env...\n');
  
  try {
    await integrationService.syncFromEnv();
    logSuccess('Credenciais sincronizadas do .env!');
  } catch (error) {
    logWarning(`Aviso: Algumas credenciais podem estar faltando no .env`);
    console.error(error);
  }
}

/**
 * Verifica status de todas as integrações
 */
async function checkIntegrationsStatus() {
  console.log('\n🔍 Etapa 3: Verificando status das integrações...\n');
  
  const integrations = await integrationService.getAllIntegrations();
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  PLATAFORMA     │ STATUS       │ TIPO      │ CREDENCIAIS      ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  
  for (const integration of integrations) {
    if (!integration || !integration.platform) continue;
    
    const platform = (integration.platform || '').padEnd(15);
    const statusIcon = integration.enabled ? '🟢 Ativa' : '🔴 Inativa';
    const status = statusIcon.padEnd(13);
    const type = (integration.type || '').padEnd(10);
    
    // Verificar credenciais
    const credentials = integration.credentials || {};
    const hasCredentials = Object.keys(credentials).length > 0;
    const allCredentialsFilled = Object.values(credentials).every(v => v && v !== '');
    
    let credStatus = '';
    if (!hasCredentials) {
      credStatus = '❌ Não config.';
    } else if (allCredentialsFilled) {
      credStatus = '✅ Completa';
    } else {
      credStatus = '⚠️  Incompleta';
    }
    
    console.log(`║  ${platform} │ ${status} │ ${type} │ ${credStatus.padEnd(17)}║`);
  }
  
  console.log('╚════════════════════════════════════════════════════════════════╝');
}

/**
 * Testa conexão com integrações configuradas
 */
async function testConnections() {
  console.log('\n🧪 Etapa 4: Testando conexões...\n');
  
  const platforms: IntegrationPlatform[] = ['cartrack', 'bolt', 'uber'];
  
  for (const platform of platforms) {
    try {
      const integration = await integrationService.getIntegration(platform);
      
      if (!integration) {
        logWarning(`${platform}: Não encontrada`);
        continue;
      }
      
      if (!integration.enabled) {
        logInfo(`${platform}: Desabilitada, pulando teste`);
        continue;
      }
      
      const hasCredentials = Object.values(integration.credentials).every(v => v && v !== '');
      if (!hasCredentials) {
        logWarning(`${platform}: Credenciais incompletas, pulando teste`);
        continue;
      }
      
      logInfo(`Testando ${platform}...`);
      const result = await integrationService.testConnection(platform);
      
      if (result.success) {
        logSuccess(`${platform}: Conexão OK (${result.responseTime}ms)`);
      } else {
        logError(`${platform}: ${result.error}`);
      }
    } catch (error) {
      logError(`${platform}: Erro no teste - ${error}`);
    }
  }
}

/**
 * Exibe resumo final
 */
async function showSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(70));
  
  const integrations = await integrationService.getAllIntegrations();
  const enabled = integrations.filter(i => i && i.enabled).length;
  const configured = integrations.filter(i => {
    if (!i || !i.credentials) return false;
    return Object.values(i.credentials).every(v => v && v !== '');
  }).length;
  
  console.log(`\n📦 Total de integrações: ${integrations.length}`);
  console.log(`🟢 Ativas: ${enabled}`);
  console.log(`✅ Configuradas: ${configured}`);
  console.log(`⚙️  Cache: ${integrationService.getCacheStats().size} em memória`);
  
  console.log('\n💡 PRÓXIMOS PASSOS:\n');
  
  if (configured < integrations.length) {
    console.log('1. Configure as credenciais faltantes no .env.local');
    console.log('2. Execute novamente: npx tsx scripts/setup-integrations.ts');
  } else {
    console.log('1. ✅ Todas as integrações estão configuradas!');
    console.log('2. Teste individualmente: npx tsx scripts/test-cartrack.ts');
    console.log('3. Use no código: const client = await createCartrackClient();');
  }
  
  console.log('\n📚 DOCUMENTAÇÃO:');
  console.log('   - Schema: schemas/integration.ts');
  console.log('   - Service: lib/integrations/integration-service.ts');
  console.log('   - Clients: lib/integrations/*/client.ts');
  
  console.log('\n' + '='.repeat(70) + '\n');
}

// ============================================================================
// SCRIPT PRINCIPAL
// ============================================================================

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║           🚀 CONDUZ PT - SETUP DE INTEGRAÇÕES TVDE            ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  try {
    // Etapa 1: Criar integrações padrão
    await initializeDefaultIntegrations();
    
    // Etapa 2: Sincronizar credenciais do .env
    await syncCredentialsFromEnv();
    
    // Etapa 3: Verificar status
    await checkIntegrationsStatus();
    
    // Etapa 4: Testar conexões
    await testConnections();
    
    // Resumo final
    await showSummary();
    
    logSuccess('Setup concluído com sucesso! 🎉');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erro fatal durante setup:', error);
    process.exit(1);
  }
}

// Executar
main();
