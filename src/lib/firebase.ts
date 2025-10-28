// Firebase desabilitado no modo demo/local (sem dependências)
const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const mockAuth = {
  onAuthStateChanged: () => () => {},
  signOut: () => Promise.resolve(),
};

const mockDb = {};
const mockStorage = {};
const mockAnalytics = {};

export const auth = isDemo ? mockAuth : undefined as any;
export const db = isDemo ? mockDb : undefined as any;
export const storage = isDemo ? mockStorage : undefined as any;
export const analytics = isDemo ? mockAnalytics : undefined as any;
export default undefined;

