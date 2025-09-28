const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
try {
  const serviceAccount = require('../firebase-service-account.json');
  initializeApp({
    credential: cert(serviceAccount)
  });
} catch (error) {
  console.log('⚠️  Using mock Firebase for migration (development mode)');
  // Mock Firebase for development
  const mockDb = {
    collection: (name) => ({
      get: async () => ({ empty: true, docs: [] }),
      add: async (data) => {
        console.log(`📝 Would add to ${name}:`, data);
        return { id: `mock_${Date.now()}` };
      }
    })
  };
  global.mockFirestore = mockDb;
}

const db = global.mockFirestore || getFirestore();

// Default plans data
const defaultPlans = [
  {
    name: 'Carro Próprio',
    description: 'Para quem já tem veículo TVDE',
    priceCents: 1200, // €12.00
    interval: 'month',
    features: [
      'Onboarding completo incluído',
      'Suporte 7 dias por semana',
      'Portal do motorista',
      'Pagamentos semanais',
      'Formação contínua',
      'Compliance TVDE garantido'
    ],
    active: true,
    featured: true,
    trialDays: 7,
    commission: 12, // 12% commission
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    name: 'Carro Alugado',
    description: 'Aluguer de veículo TVDE incluído',
    priceCents: 1800, // €18.00
    interval: 'month',
    features: [
      'Tudo do plano Carro Próprio',
      'Veículo TVDE certificado',
      'Manutenção incluída',
      'Seguro comprehensive',
      'Combustível não incluído'
    ],
    active: true,
    featured: false,
    trialDays: 7,
    commission: 18, // 18% commission
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    name: 'Parceria Premium',
    description: 'Para motoristas experientes',
    priceCents: 1000, // €10.00
    interval: 'month',
    features: [
      'Comissão reduzida',
      'Suporte prioritário',
      'Relatórios avançados',
      'Formação especializada',
      'Acesso a eventos exclusivos'
    ],
    active: true,
    featured: false,
    trialDays: 14,
    commission: 10, // 10% commission
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

async function createDefaultPlans() {
  console.log('🚀 Creating default plans...');
  
  try {
    const batch = db.batch();
    
    // Check if plans already exist
    const existingPlans = await db.collection('plans').get();
    
    if (!existingPlans.empty) {
      console.log('⚠️  Plans already exist, skipping creation');
      return;
    }
    
    // Create each plan
    defaultPlans.forEach((plan, index) => {
      const planRef = db.collection('plans').doc();
      batch.set(planRef, plan);
      console.log(`📋 Created plan: ${plan.name}`);
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log('✅ Default plans created successfully!');
    console.log(`📊 Total plans created: ${defaultPlans.length}`);
    
  } catch (error) {
    console.error('❌ Failed to create plans:', error);
    process.exit(1);
  }
}

// Run plan creation
createDefaultPlans();
