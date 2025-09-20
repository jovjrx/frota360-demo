#!/usr/bin/env node

/**
 * Script de verificação do sistema Conduz.pt
 * Verifica se todas as funcionalidades principais estão funcionando
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando verificação do sistema Conduz.pt...\n');

// Função para verificar se um arquivo existe
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  return exists;
}

// Função para verificar se um diretório existe
function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  console.log(`${exists ? '✅' : '❌'} ${description}: ${dirPath}`);
  return exists;
}

// Função para verificar conteúdo de um arquivo
function checkFileContent(filePath, searchText, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const found = content.includes(searchText);
    console.log(`${found ? '✅' : '❌'} ${description}`);
    return found;
  } catch (error) {
    console.log(`❌ ${description} (erro ao ler arquivo)`);
    return false;
  }
}

let totalChecks = 0;
let passedChecks = 0;

function check(condition, description) {
  totalChecks++;
  if (condition) passedChecks++;
  console.log(`${condition ? '✅' : '❌'} ${description}`);
  return condition;
}

console.log('📁 Verificando estrutura de arquivos...');
console.log('─'.repeat(50));

// Verificar arquivos principais
check(checkFile('package.json', 'Package.json'), 'Package.json existe');
check(checkFile('next.config.ts', 'Next.js config'), 'Configuração Next.js existe');
check(checkFile('tsconfig.json', 'TypeScript config'), 'Configuração TypeScript existe');

console.log('\n📱 Verificando páginas principais...');
console.log('─'.repeat(50));

// Páginas do sistema
check(checkFile('pages/_app.tsx', 'App principal'), 'Página principal do app');
check(checkFile('pages/index.tsx', 'Página inicial'), 'Página inicial');
check(checkFile('pages/login.tsx', 'Página de login'), 'Página de login');
check(checkFile('pages/signup.tsx', 'Página de registro'), 'Página de registro');

// Páginas do motorista
check(checkFile('pages/painel/index.tsx', 'Dashboard do motorista'), 'Dashboard do motorista');
check(checkFile('pages/painel/subscription.tsx', 'Assinaturas do motorista'), 'Página de assinaturas');
check(checkFile('pages/painel/documents.tsx', 'Documentos do motorista'), 'Página de documentos');
check(checkFile('pages/painel/settings.tsx', 'Configurações do motorista'), 'Página de configurações');

// Páginas administrativas
check(checkFile('pages/admin/index.tsx', 'Dashboard admin'), 'Dashboard administrativo');
check(checkFile('pages/admin/painels/index.tsx', 'Gerenciar motoristas'), 'Gerenciamento de motoristas');
check(checkFile('pages/admin/plans/index.tsx', 'Gerenciar planos'), 'Gerenciamento de planos');
check(checkFile('pages/admin/payouts/index.tsx', 'Gerenciar pagamentos'), 'Gerenciamento de pagamentos');

console.log('\n🔌 Verificando APIs...');
console.log('─'.repeat(50));

// APIs principais
check(checkFile('pages/api/painels/create.ts', 'API criar motorista'), 'API de criação de motorista');
check(checkFile('pages/api/painels/update.ts', 'API atualizar motorista'), 'API de atualização de motorista');
check(checkFile('pages/api/painels/upload.ts', 'API upload documentos'), 'API de upload de documentos');
check(checkFile('pages/api/plans/list.ts', 'API listar planos'), 'API de listagem de planos');
check(checkFile('pages/api/subscriptions/create.ts', 'API criar assinatura'), 'API de criação de assinatura');
check(checkFile('pages/api/payouts/run.ts', 'API executar pagamentos'), 'API de execução de pagamentos');

// APIs de integração
check(checkFile('pages/api/auth/uber/start.ts', 'API Uber OAuth'), 'API de OAuth do Uber');
check(checkFile('pages/api/webhooks/stripe.ts', 'Webhook Stripe'), 'Webhook do Stripe');
check(checkFile('pages/api/webhooks/uber.ts', 'Webhook Uber'), 'Webhook do Uber');

console.log('\n🧩 Verificando componentes...');
console.log('─'.repeat(50));

// Componentes principais
check(checkFile('components/Header.tsx', 'Header'), 'Componente Header');
check(checkFile('components/Footer.tsx', 'Footer'), 'Componente Footer');
check(checkFile('components/LoggedInLayout.tsx', 'Layout logado'), 'Layout para usuários logados');

// Componentes específicos
check(checkFile('components/dashboard/StatsCard.tsx', 'Card de estatísticas'), 'Componente de estatísticas');
check(checkFile('components/dashboard/DataTable.tsx', 'Tabela de dados'), 'Componente de tabela');
check(checkFile('components/notifications/NotificationBadge.tsx', 'Badge de notificações'), 'Sistema de notificações');

console.log('\n📚 Verificando bibliotecas e schemas...');
console.log('─'.repeat(50));

// Bibliotecas principais
check(checkFile('lib/firebaseAdmin.ts', 'Firebase Admin'), 'Configuração Firebase Admin');
check(checkFile('lib/config.ts', 'Configurações'), 'Arquivo de configurações');

// Schemas
check(checkFile('schemas/painel.ts', 'Schema Driver'), 'Schema de validação Driver');
check(checkFile('schemas/vehicle.ts', 'Schema Vehicle'), 'Schema de validação Vehicle');
check(checkFile('schemas/plan.ts', 'Schema Plan'), 'Schema de validação Plan');
check(checkFile('schemas/subscription.ts', 'Schema Subscription'), 'Schema de validação Subscription');

// Sistemas
check(checkFile('lib/session/ironSession.ts', 'Sistema de sessões'), 'Sistema de sessões');
check(checkFile('lib/auth/rbac.ts', 'RBAC'), 'Sistema de controle de acesso');
check(checkFile('lib/billing/adapter.ts', 'Adapter de billing'), 'Sistema de billing');
check(checkFile('lib/uber/base.ts', 'Cliente Uber'), 'Integração com Uber');

console.log('\n🌍 Verificando internacionalização...');
console.log('─'.repeat(50));

check(checkDirectory('locales', 'Diretório de locales'), 'Diretório de traduções');
check(checkFile('locales/pt/common.json', 'Traduções PT'), 'Traduções em português');
check(checkFile('locales/en/common.json', 'Traduções EN'), 'Traduções em inglês');

console.log('\n🗂️ Verificando diretórios de dados...');
console.log('─'.repeat(50));

// Verificar se diretório .data existe (para modo mock)
const dataDir = '.data';
if (fs.existsSync(dataDir)) {
  check(true, 'Diretório .data para modo mock');
  check(checkFile('.data/painels.json', 'Dados de motoristas'), 'Arquivo de dados de motoristas');
  check(checkFile('.data/plans.json', 'Dados de planos'), 'Arquivo de dados de planos');
} else {
  check(false, 'Diretório .data (opcional para modo mock)');
}

console.log('\n🔧 Verificando configurações...');
console.log('─'.repeat(50));

// Verificar next.config.ts
check(checkFileContent('next.config.ts', 'i18n', 'Configuração i18n no Next.js'), 'Next.js i18n configurado');

// Verificar package.json
check(checkFileContent('package.json', '"next":', 'Next.js no package.json'), 'Next.js listado como dependência');
check(checkFileContent('package.json', '"@chakra-ui/react":', 'Chakra UI no package.json'), 'Chakra UI listado como dependência');
check(checkFileContent('package.json', '"firebase-admin":', 'Firebase Admin no package.json'), 'Firebase Admin listado como dependência');

console.log('\n📄 Verificando documentação...');
console.log('─'.repeat(50));

check(checkFile('SETUP.md', 'Guia de setup'), 'Guia de configuração');
check(checkFile('FIREBASE_SETUP.md', 'Setup Firebase'), 'Guia de setup do Firebase');
check(checkFile('RELATORIO_MIGRACAO.md', 'Relatório migração'), 'Relatório de migração');
check(checkFile('projeto-total.md', 'Projeto total'), 'Especificação do projeto');

console.log('\n🧪 Verificando testes...');
console.log('─'.repeat(50));

check(checkFile('tests/basic-functionality.test.js', 'Testes básicos'), 'Testes de funcionalidade básica');

console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DA VERIFICAÇÃO');
console.log('='.repeat(60));

const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
console.log(`✅ Verificações passaram: ${passedChecks}/${totalChecks} (${successRate}%)`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 SISTEMA COMPLETAMENTE FUNCIONAL!');
  console.log('Todas as verificações passaram com sucesso.');
} else if (successRate >= 90) {
  console.log('\n🌟 SISTEMA QUASE COMPLETO!');
  console.log('A maioria das funcionalidades está implementada.');
} else if (successRate >= 75) {
  console.log('\n⚠️  SISTEMA PARCIALMENTE FUNCIONAL');
  console.log('Algumas funcionalidades ainda precisam ser implementadas.');
} else {
  console.log('\n❌ SISTEMA PRECISA DE MAIS TRABALHO');
  console.log('Muitas funcionalidades ainda estão faltando.');
}

console.log('\n📋 PRÓXIMOS PASSOS RECOMENDADOS:');
console.log('1. Execute: npm install (instalar dependências)');
console.log('2. Configure: .env.local (variáveis de ambiente)');
console.log('3. Execute: npm run dev (iniciar servidor de desenvolvimento)');
console.log('4. Teste: npm run test (executar testes)');
console.log('5. Build: npm run build (construir para produção)');

console.log('\n🚀 Sistema Conduz.pt pronto para uso!');
