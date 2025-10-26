// lib/auth-mock.ts

export interface MockUser {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'driver';
  driverId?: string;
}

export const MOCK_USERS = {
  admin: {
    email: 'admin@frota360.pt',
    password: 'Demo@2025',
    uid: 'admin-001',
    name: 'Admin Demo',
    role: 'admin' as const,
  },
  driver: {
    email: 'motorista@frota360.pt',
    password: 'Demo@2025',
    uid: 'driver-001',
    name: 'João Silva',
    role: 'driver' as const,
    driverId: 'MOT001',
  },
};

export function validateMockCredentials(email: string, password: string): MockUser | null {
  for (const [key, user] of Object.entries(MOCK_USERS)) {
    if (user.email === email && user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as MockUser;
    }
  }
  return null;
}

export function getMockUserByEmail(email: string): MockUser | null {
  for (const [key, user] of Object.entries(MOCK_USERS)) {
    if (user.email === email) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as MockUser;
    }
  }
  return null;
}

export function getMockUserByUid(uid: string): MockUser | null {
  for (const [key, user] of Object.entries(MOCK_USERS)) {
    if (user.uid === uid) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as MockUser;
    }
  }
  return null;
}

