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

async function initializeFirebase() {
  try {
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
    
    return admin.firestore();
  } catch (error) {
    logError(`Erro ao inicializar Firebase: ${error.message}`);
    throw error;
  }
}

async function addDriver(db, driverData) {
  try {
    const docRef = await db.collection('drivers').add({
      ...driverData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    logSuccess(`Motorista adicionado com ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logError(`Erro ao adicionar motorista: ${error.message}`);
    throw error;
  }
}

async function addPlan(db, planData) {
  try {
    const docRef = await db.collection('plans').add({
      ...planData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    logSuccess(`Plano adicionado com ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logError(`Erro ao adicionar plano: ${error.message}`);
    throw error;
  }
}

async function addUser(db, userData) {
  try {
    const docRef = await db.collection('users').add({
      ...userData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    logSuccess(`Usuário adicionado com ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logError(`Erro ao adicionar usuário: ${error.message}`);
    throw error;
  }
}

async function listData(db) {
  try {
    logInfo('Listando dados existentes...');
    
    // Listar plans
    const plansSnapshot = await db.collection('plans').get();
    log(`\n📋 Plans (${plansSnapshot.size}):`, 'cyan');
    plansSnapshot.docs.forEach(doc => {
      const data = doc.data();
      log(`  - ${data.name} (${data.priceCents/100}€/${data.interval})`, 'reset');
    });
    
    // Listar drivers
    const driversSnapshot = await db.collection('drivers').get();
    log(`\n🚗 Drivers (${driversSnapshot.size}):`, 'cyan');
    driversSnapshot.docs.forEach(doc => {
      const data = doc.data();
      log(`  - ${data.name} (${data.email})`, 'reset');
    });
    
    // Listar users
    const usersSnapshot = await db.collection('users').get();
    log(`\n👤 Users (${usersSnapshot.size}):`, 'cyan');
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      log(`  - ${data.email} (${data.role})`, 'reset');
    });
    
  } catch (error) {
    logError(`Erro ao listar dados: ${error.message}`);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    log('🔥 CONDUZ.PT - Add Data', 'bright');
    log('========================', 'cyan');
    log('\nComandos disponíveis:', 'yellow');
    log('  node scripts/add-data.js list           - Listar dados existentes', 'cyan');
    log('  node scripts/add-data.js plan           - Adicionar plano básico', 'cyan');
    log('  node scripts/add-data.js driver         - Adicionar motorista exemplo', 'cyan');
    log('  node scripts/add-data.js user           - Adicionar usuário admin', 'cyan');
    log('  node scripts/add-data.js setup          - Setup completo inicial', 'cyan');
    return;
  }
  
  try {
    const db = await initializeFirebase();
    
    switch (command) {
      case 'list':
        await listData(db);
        break;
        
      case 'plan':
        await addPlan(db, {
          name: 'Plano Básico',
          description: 'Plano básico para motoristas iniciantes',
          priceCents: 2999,
          currency: 'EUR',
          interval: 'month',
          trialDays: 7,
          active: true,
          features: ['Gestão de motoristas', 'Relatórios básicos'],
          maxDrivers: 10
        });
        break;
        
      case 'driver':
        await addDriver(db, {
          name: 'João Silva',
          email: 'joao.silva@example.com',
          phone: '+351912345678',
          status: 'active',
          kyc: {
            docType: 'CNH',
            docNumber: '123456789',
            files: []
          },
          vehicle: {
            make: 'Toyota',
            model: 'Corolla',
            year: 2020,
            plate: 'AB-12-CD'
          },
          availability: {
            active: true
          },
          commission: {
            percentage: 15,
            type: 'percentage'
          }
        });
        break;
        
      case 'user':
        await addUser(db, {
          email: 'admin@conduz.pt',
          role: 'admin',
          name: 'Administrador',
          active: true
        });
        break;
        
      case 'setup':
        logInfo('Executando setup completo...');
        
        // Adicionar plans
        await addPlan(db, {
          name: 'Plano Básico',
          description: 'Plano básico para motoristas iniciantes',
          priceCents: 2999,
          currency: 'EUR',
          interval: 'month',
          trialDays: 7,
          active: true,
          features: ['Gestão de motoristas', 'Relatórios básicos'],
          maxDrivers: 10
        });
        
        await addPlan(db, {
          name: 'Plano Premium',
          description: 'Plano premium com recursos avançados',
          priceCents: 5999,
          currency: 'EUR',
          interval: 'month',
          trialDays: 14,
          active: true,
          features: ['Gestão de motoristas', 'Relatórios avançados', 'API completa'],
          maxDrivers: 100
        });
        
        // Adicionar motorista exemplo
        await addDriver(db, {
          name: 'João Silva',
          email: 'joao.silva@example.com',
          phone: '+351912345678',
          status: 'active',
          kyc: {
            docType: 'CNH',
            docNumber: '123456789',
            files: []
          },
          vehicle: {
            make: 'Toyota',
            model: 'Corolla',
            year: 2020,
            plate: 'AB-12-CD'
          },
          availability: {
            active: true
          },
          commission: {
            percentage: 15,
            type: 'percentage'
          }
        });
        
        // Adicionar usuário admin
        await addUser(db, {
          email: 'admin@conduz.pt',
          role: 'admin',
          name: 'Administrador',
          active: true
        });
        
        logSuccess('Setup completo finalizado!');
        break;
        
      default:
        logError(`Comando desconhecido: ${command}`);
        log('Use "node scripts/add-data.js" para ver os comandos disponíveis', 'yellow');
    }
    
  } catch (error) {
    logError(`Erro: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { addDriver, addPlan, addUser, listData, initializeFirebase };
