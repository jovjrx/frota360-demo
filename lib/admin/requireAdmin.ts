import { GetServerSidePropsContext } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { parseCookies } from 'nookies';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'admin';
}

export async function requireAdmin(
  context: GetServerSidePropsContext
): Promise<AdminUser | null> {
  try {
    const cookies = parseCookies(context);
    const token = cookies.token || context.req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return null;
    }

    // Verificar token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);

    if (!decodedToken) {
      return null;
    }

    // Buscar dados do usuário
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();

    // Verificar se é admin
    if (userData?.role !== 'admin') {
      return null;
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: decodedToken.name || null,
      role: 'admin',
    };
  } catch (error) {
    console.error('Error verifying admin:', error);
    return null;
  }
}
