#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function initializeFirebase() {
  try {
    logInfo('Inicializando Firebase Admin SDK...');
    
    const credentialsPath = path.join(process.cwd(), 'conduz-pt.json');
    
    if (!fs.existsSync(credentialsPath)) {
      throw new Error('Arquivo conduz-pt.json não encontrado na raiz do projeto');
    }
    
    const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    }
    
    logSuccess('Firebase Admin SDK inicializado com sucesso!');
    logInfo(`Projeto: ${serviceAccount.project_id}`);
    
    return admin.firestore();
  } catch (error) {
    logError(`Erro ao inicializar Firebase: ${error.message}`);
    throw error;
  }
}

async function createInitialData(db) {
  try {
    logInfo('Criando dados iniciais...');
    
    // 1. Criar plano básico
    const basicPlan = {
      id: 'plan_basic',
      name: 'Plano Básico',
      description: 'Plano básico para motoristas iniciantes',
      priceCents: 2999, // €29.99
      currency: 'EUR',
      interval: 'month',
      trialDays: 7,
      active: true,
      features: [
        'Gestão de motoristas',
        'Relatórios básicos',
        'Suporte por email'
      ],
      maxDrivers: 10,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await db.collection('plans').doc('plan_basic').set(basicPlan);
    logSuccess('Plano básico criado');
    
    // 2. Criar plano premium
    const premiumPlan = {
      id: 'plan_premium',
      name: 'Plano Premium',
      description: 'Plano premium com recursos avançados',
      priceCents: 5999, // €59.99
      currency: 'EUR',
      interval: 'month',
      trialDays: 14,
      active: true,
      features: [
        'Gestão de motoristas',
        'Relatórios avançados',
        'API completa',
        'Suporte prioritário',
        'Integração com Uber',
        'Análises detalhadas'
      ],
      maxDrivers: 100,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await db.collection('plans').doc('plan_premium').set(premiumPlan);
    logSuccess('Plano premium criado');
    
    // 3. Criar plano enterprise
    const enterprisePlan = {
      id: 'plan_enterprise',
      name: 'Plano Enterprise',
      description: 'Plano enterprise para grandes operações',
      priceCents: 9999, // €99.99
      currency: 'EUR',
      interval: 'month',
      trialDays: 30,
      active: true,
      features: [
        'Gestão ilimitada de motoristas',
        'Relatórios personalizados',
        'API completa',
        'Suporte 24/7',
        'Integração com Uber',
        'Análises em tempo real',
        'White-label',
        'Consultoria dedicada'
      ],
      maxDrivers: -1, // Ilimitado
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await db.collection('plans').doc('plan_enterprise').set(enterprisePlan);
    logSuccess('Plano enterprise criado');
    
    logSuccess('Todos os dados iniciais foram criados com sucesso!');
    
  } catch (error) {
    logError(`Erro ao criar dados iniciais: ${error.message}`);
    throw error;
  }
}

async function checkExistingData(db) {
  try {
    logInfo('Verificando dados existentes...');
    
    const plansSnapshot = await db.collection('plans').get();
    const driversSnapshot = await db.collection('drivers').get();
    const usersSnapshot = await db.collection('users').get();
    
    logInfo(`Plans: ${plansSnapshot.size} documentos`);
    logInfo(`Drivers: ${driversSnapshot.size} documentos`);
    logInfo(`Users: ${usersSnapshot.size} documentos`);
    
    return {
      plans: plansSnapshot.size,
      drivers: driversSnapshot.size,
      users: usersSnapshot.size
    };
  } catch (error) {
    logError(`Erro ao verificar dados: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    log('🔥 CONDUZ.PT - Setup Firebase', 'bright');
    log('================================', 'cyan');
    
    const db = await initializeFirebase();
    
    const existingData = await checkExistingData(db);
    
    if (existingData.plans > 0) {
      logWarning('Já existem plans no banco de dados');
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        readline.question('Deseja recriar os plans? (y/N): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        logInfo('Removendo plans existentes...');
        const batch = db.batch();
        const plansSnapshot = await db.collection('plans').get();
        
        plansSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        logSuccess('Plans removidos');
        
        await createInitialData(db);
      } else {
        logInfo('Mantendo dados existentes');
      }
    } else {
      await createInitialData(db);
    }
    
    log('\n🎉 Setup concluído com sucesso!', 'green');
    log('Agora você pode:', 'cyan');
    log('1. Executar yarn dev para iniciar o servidor', 'cyan');
    log('2. Acessar http://localhost:3000/admin/setup para criar o usuário admin', 'cyan');
    log('3. Fazer login em http://localhost:3000/login', 'cyan');
    
  } catch (error) {
    logError(`Setup falhou: ${error.message}`);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { initializeFirebase, createInitialData, checkExistingData };
