import { adminDb } from '@/lib/firebaseAdmin';

export interface StorageProvider {
  drivers: {
    create(data: any): Promise<string>;
    update(id: string, data: any): Promise<void>;
    findById(id: string): Promise<any | null>;
    findAll(): Promise<any[]>;
    findByUserId(userId: string): Promise<any | null>;
    delete(id: string): Promise<void>;
  };
  plans: {
    create(data: any): Promise<string>;
    update(id: string, data: any): Promise<void>;
    findById(id: string): Promise<any | null>;
    findAll(): Promise<any[]>;
    delete(id: string): Promise<void>;
  };
  subscriptions: {
    create(data: any): Promise<string>;
    update(id: string, data: any): Promise<void>;
    findById(id: string): Promise<any | null>;
    findAll(): Promise<any[]>;
    findByDriverId(driverId: string): Promise<any | null>;
    delete(id: string): Promise<void>;
  };
  invoices: {
    create(data: any): Promise<string>;
    update(id: string, data: any): Promise<void>;
    findById(id: string): Promise<any | null>;
    findAll(): Promise<any[]>;
    findByDriverId(driverId: string): Promise<any[]>;
    delete(id: string): Promise<void>;
  };
  tripRevenues: {
    create(data: any): Promise<string>;
    update(id: string, data: any): Promise<void>;
    findById(id: string): Promise<any | null>;
    findAll(): Promise<any[]>;
    findByDriverId(driverId: string): Promise<any[]>;
    delete(id: string): Promise<void>;
  };
  payouts: {
    create(data: any): Promise<string>;
    update(id: string, data: any): Promise<void>;
    findById(id: string): Promise<any | null>;
    findAll(): Promise<any[]>;
    findByDriverId(driverId: string): Promise<any[]>;
    delete(id: string): Promise<void>;
  };
  audit: {
    create(data: any): Promise<string>;
    findAll(): Promise<any[]>;
    findByActorId(actorId: string): Promise<any[]>;
  };
  driverPayments: {
    create(data: any): Promise<string>;
    update(id: string, data: any): Promise<void>;
    findById(id: string): Promise<any | null>;
    findAll(): Promise<any[]>;
    findByDriverId(driverId: string): Promise<any[]>;
    findByRecordId(recordId: string): Promise<any | null>;
    delete(id: string): Promise<void>;
  };
}

class FirestoreProvider implements StorageProvider {
  drivers = {
    async create(data: any): Promise<string> {
      const docRef = await adminDb.collection('drivers').add({
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return docRef.id;
    },
    async update(id: string, data: any): Promise<void> {
      await adminDb.collection('drivers').doc(id).update({
        ...data,
        updatedAt: Date.now(),
      });
    },
    async findById(id: string): Promise<any | null> {
      const doc = await adminDb.collection('drivers').doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    async findAll(): Promise<any[]> {
      const snapshot = await adminDb.collection('drivers').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async findByUserId(userId: string): Promise<any | null> {
      const snapshot = await adminDb.collection('drivers').where('userId', '==', userId).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    },
    async delete(id: string): Promise<void> {
      await adminDb.collection('drivers').doc(id).delete();
    },
  };

  plans = {
    async create(data: any): Promise<string> {
      const docRef = await adminDb.collection('plans').add({
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return docRef.id;
    },
    async update(id: string, data: any): Promise<void> {
      await adminDb.collection('plans').doc(id).update({
        ...data,
        updatedAt: Date.now(),
      });
    },
    async findById(id: string): Promise<any | null> {
      const doc = await adminDb.collection('plans').doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    async findAll(): Promise<any[]> {
      const snapshot = await adminDb.collection('plans').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async delete(id: string): Promise<void> {
      await adminDb.collection('plans').doc(id).delete();
    },
  };

  subscriptions = {
    async create(data: any): Promise<string> {
      const docRef = await adminDb.collection('subscriptions').add({
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return docRef.id;
    },
    async update(id: string, data: any): Promise<void> {
      await adminDb.collection('subscriptions').doc(id).update({
        ...data,
        updatedAt: Date.now(),
      });
    },
    async findById(id: string): Promise<any | null> {
      const doc = await adminDb.collection('subscriptions').doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    async findAll(): Promise<any[]> {
      const snapshot = await adminDb.collection('subscriptions').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async findByDriverId(driverId: string): Promise<any | null> {
      const snapshot = await adminDb.collection('subscriptions').where('driverId', '==', driverId).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    },
    async delete(id: string): Promise<void> {
      await adminDb.collection('subscriptions').doc(id).delete();
    },
  };

  invoices = {
    async create(data: any): Promise<string> {
      const docRef = await adminDb.collection('invoices').add({
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return docRef.id;
    },
    async update(id: string, data: any): Promise<void> {
      await adminDb.collection('invoices').doc(id).update({
        ...data,
        updatedAt: Date.now(),
      });
    },
    async findById(id: string): Promise<any | null> {
      const doc = await adminDb.collection('invoices').doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    async findAll(): Promise<any[]> {
      const snapshot = await adminDb.collection('invoices').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async findByDriverId(driverId: string): Promise<any[]> {
      const snapshot = await adminDb.collection('invoices').where('driverId', '==', driverId).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async delete(id: string): Promise<void> {
      await adminDb.collection('invoices').doc(id).delete();
    },
  };

  tripRevenues = {
    async create(data: any): Promise<string> {
      const docRef = await adminDb.collection('tripRevenues').add({
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return docRef.id;
    },
    async update(id: string, data: any): Promise<void> {
      await adminDb.collection('tripRevenues').doc(id).update({
        ...data,
        updatedAt: Date.now(),
      });
    },
    async findById(id: string): Promise<any | null> {
      const doc = await adminDb.collection('tripRevenues').doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    async findAll(): Promise<any[]> {
      const snapshot = await adminDb.collection('tripRevenues').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async findByDriverId(driverId: string): Promise<any[]> {
      const snapshot = await adminDb.collection('tripRevenues').where('driverId', '==', driverId).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async delete(id: string): Promise<void> {
      await adminDb.collection('tripRevenues').doc(id).delete();
    },
  };

  payouts = {
    async create(data: any): Promise<string> {
      const docRef = await adminDb.collection('payouts').add({
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return docRef.id;
    },
    async update(id: string, data: any): Promise<void> {
      await adminDb.collection('payouts').doc(id).update({
        ...data,
        updatedAt: Date.now(),
      });
    },
    async findById(id: string): Promise<any | null> {
      const doc = await adminDb.collection('payouts').doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    async findAll(): Promise<any[]> {
      const snapshot = await adminDb.collection('payouts').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async findByDriverId(driverId: string): Promise<any[]> {
      const snapshot = await adminDb.collection('payouts').where('driverId', '==', driverId).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async delete(id: string): Promise<void> {
      await adminDb.collection('payouts').doc(id).delete();
    },
  };

  audit = {
    async create(data: any): Promise<string> {
      const docRef = await adminDb.collection('audit').add({
        ...data,
        at: Date.now(),
      });
      return docRef.id;
    },
    async findAll(): Promise<any[]> {
      const snapshot = await adminDb.collection('audit').orderBy('at', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async findByActorId(actorId: string): Promise<any[]> {
      const snapshot = await adminDb.collection('audit').where('actorId', '==', actorId).orderBy('at', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
  };

  driverPayments = {
    async create(data: any): Promise<string> {
      const now = new Date().toISOString();
      const docRef = await adminDb.collection('driverPayments').add({
        ...data,
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    },
    async update(id: string, data: any): Promise<void> {
      await adminDb.collection('driverPayments').doc(id).update({
        ...data,
        updatedAt: new Date().toISOString(),
      });
    },
    async findById(id: string): Promise<any | null> {
      const doc = await adminDb.collection('driverPayments').doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },
    async findAll(): Promise<any[]> {
      const snapshot = await adminDb.collection('driverPayments').orderBy('paymentDate', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async findByDriverId(driverId: string): Promise<any[]> {
      const snapshot = await adminDb.collection('driverPayments').where('driverId', '==', driverId).orderBy('paymentDate', 'desc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    async findByRecordId(recordId: string): Promise<any | null> {
      const snapshot = await adminDb.collection('driverPayments').where('recordId', '==', recordId).orderBy('paymentDate', 'desc').limit(1).get();
      if (snapshot.empty) {
        return null;
      }
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    },
    async delete(id: string): Promise<void> {
      await adminDb.collection('driverPayments').doc(id).delete();
    },
  };
}

function createStorageProvider(): StorageProvider {
  // Sempre usa Firebase Firestore
  return new FirestoreProvider();
}

export const store = createStorageProvider();
