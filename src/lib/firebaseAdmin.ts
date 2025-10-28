import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Inicializa o Firebase Admin com credenciais de serviço fornecidas via
// variáveis de ambiente, arquivo JSON ou variáveis individuais.
let serviceAccount: any;

// Método 1: Arquivo JSON (prioritário para produção)
const serviceAccountPath = path.join(process.cwd(), 'conduz-pt.json');
if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(serviceAccountFile);
    console.log('✅ Firebase Admin SDK: Usando arquivo conduz-pt.json');
  } catch (error) {
    console.error('❌ Erro ao ler conduz-pt.json:', error);
  }
}
// Método 2: Variável de ambiente com JSON completo
else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log('Firebase Admin SDK: Usando FIREBASE_SERVICE_ACCOUNT_KEY');
  } catch (error) {
    console.error('Erro ao fazer parse da FIREBASE_SERVICE_ACCOUNT_KEY:', error);
  }
}
// Método 3: Variáveis individuais
else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
  console.log('Firebase Admin SDK: Usando variáveis individuais');
}

if (!admin.apps.length) {
  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'default-bucket-name', // Adicionado um fallback para evitar erro
      });
      if (typeof window === 'undefined') {
      console.log('Firebase Admin SDK inicializado com sucesso');
    }
    } catch (error) {
      console.error('Erro ao inicializar Firebase Admin SDK:', error);
    }
  } else {
    console.error('Firebase Admin SDK não pode ser inicializado: variáveis de ambiente ausentes');
    console.error('Verifique se FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY estão definidas');
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage().bucket();

// Aliases para compatibilidade
export const db = adminDb;
export const auth = adminAuth;

