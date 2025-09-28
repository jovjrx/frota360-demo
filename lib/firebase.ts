import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuração do Firebase (hardcoded para produção)
const firebaseConfig = {
  apiKey: "AIzaSyAWGGU-8_johpBlIds2aZO_vmI4Mtrx0mE",
  authDomain: "conduz-pt.firebaseapp.com",
  projectId: "conduz-pt",
  storageBucket: "conduz-pt.firebasestorage.app",
  messagingSenderId: "458923540711",
  appId: "1:458923540711:web:7aefb35302fd02e78ea242",
  measurementId: "G-JZ5Y99TEGK",
};

// Inicializa a app Firebase apenas uma vez para evitar warnings em hot reload
function createFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
    return getApp();
}

const app = createFirebaseApp();

// Exporta instâncias de autenticador, banco de dados e storage para uso no cliente
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Inicializa o Analytics no lado do cliente quando disponível
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : undefined;

export default app;
