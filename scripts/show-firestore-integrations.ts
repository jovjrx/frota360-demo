/**
 * Script para visualizar TODA a estrutura de integrações no Firestore
 */

import integrationService from '../lib/integrations/integration-service';
import { IntegrationPlatform } from '../schemas/integration';

async function showFirestoreData() {
  console.log('🔍 Analisando dados no Firestore...\n');
  console.log('=' .repeat(80));

  const platforms: IntegrationPlatform[] = ['uber', 'bolt', 'cartrack', 'viaverde', 'fonoa', 'myprio'];

  for (const platform of platforms) {
    const integration = await integrationService.getIntegration(platform);
    
    if (!integration) {
      console.log(`\n❌ ${platform.toUpperCase()}: Não encontrado`);
      continue;
    }

    console.log(`\n📦 ${integration.name.toUpperCase()} (${platform})`);
    console.log('-'.repeat(80));
    
    console.log('\n🔧 CONFIGURAÇÃO BÁSICA:');
    console.log(`   Platform: ${integration.platform}`);
    console.log(`   Name: ${integration.name}`);
    console.log(`   Type: ${integration.type}`);
    console.log(`   Enabled: ${integration.enabled}`);
    console.log(`   Status: ${integration.status}`);
    
    console.log('\n🔑 CREDENCIAIS:');
    for (const [key, value] of Object.entries(integration.credentials)) {
      const masked = value ? `${value.substring(0, 3)}***${value.substring(value.length - 3)}` : '(vazio)';
      console.log(`   ${key}: ${masked}`);
    }
    
    console.log('\n🌐 CONFIG:');
    console.log(`   baseUrl: ${integration.config.baseUrl}`);
    if (integration.config.authUrl) {
      console.log(`   authUrl: ${integration.config.authUrl}`);
    }
    if (integration.config.tokenUrl) {
      console.log(`   tokenUrl: ${integration.config.tokenUrl}`);
    }
    if (integration.config.endpoints) {
      console.log('   endpoints:', JSON.stringify(integration.config.endpoints, null, 2).replace(/\n/g, '\n   '));
    }
    if (integration.config.options) {
      console.log('   options:', JSON.stringify(integration.config.options, null, 2).replace(/\n/g, '\n   '));
    }
    
    if (integration.oauth) {
      console.log('\n🔐 OAUTH:');
      if (integration.oauth.accessToken) {
        console.log(`   accessToken: ${integration.oauth.accessToken.substring(0, 10)}...`);
      }
      if (integration.oauth.refreshToken) {
        console.log(`   refreshToken: ${integration.oauth.refreshToken.substring(0, 10)}...`);
      }
      if (integration.oauth.tokenType) {
        console.log(`   tokenType: ${integration.oauth.tokenType}`);
      }
      if (integration.oauth.expiresAt) {
        console.log(`   expiresAt: ${integration.oauth.expiresAt.toDate()}`);
      }
      if (integration.oauth.scope) {
        console.log(`   scope: ${integration.oauth.scope}`);
      }
    }
    
    console.log('\n📊 ESTATÍSTICAS:');
    console.log(`   totalRequests: ${integration.stats?.totalRequests || 0}`);
    console.log(`   successfulRequests: ${integration.stats?.successfulRequests || 0}`);
    console.log(`   failedRequests: ${integration.stats?.failedRequests || 0}`);
    if (integration.stats?.lastSync) {
      console.log(`   lastSync: ${integration.stats.lastSync.toDate().toISOString()}`);
    }
    if (integration.stats?.lastSuccess) {
      console.log(`   lastSuccess: ${integration.stats.lastSuccess.toDate().toISOString()}`);
    }
    if (integration.stats?.lastError) {
      console.log(`   lastError: ${integration.stats.lastError.toDate().toISOString()}`);
    }
    if (integration.stats?.errorMessage) {
      console.log(`   errorMessage: ${integration.stats.errorMessage}`);
    }
    
    console.log('\n📅 METADADOS:');
    if (integration.metadata?.createdAt) {
      console.log(`   createdAt: ${integration.metadata.createdAt.toDate().toISOString()}`);
    }
    if (integration.metadata?.updatedAt) {
      console.log(`   updatedAt: ${integration.metadata.updatedAt.toDate().toISOString()}`);
    }
    if (integration.metadata?.createdBy) {
      console.log(`   createdBy: ${integration.metadata.createdBy}`);
    }
    if (integration.metadata?.updatedBy) {
      console.log(`   updatedBy: ${integration.metadata.updatedBy}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Análise completa!\n');
}

showFirestoreData().catch(console.error);
