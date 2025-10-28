import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { SessionRequest, withIronSessionApiRoute } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { serializeDatasets } from '@/lib/utils/serializeFirestore';
import type { DocumentCategory } from '@/schemas/document-category';

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const db = getFirestore(firebaseAdmin);
      const snapshot = await db
        .collection('documentCategories')
        .orderBy('createdAt', 'desc')
        .get();

      const categories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<DocumentCategory, 'id'>),
      }));

      const serialized = serializeDatasets({ categories });

      return res.json({
        data: serialized.categories,
        total: categories.length,
      });
    } catch (error: any) {
      console.error('[GET /api/admin/document-categories]', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description, type } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const db = getFirestore(firebaseAdmin);

      const docRef = await db.collection('documentCategories').add({
        name,
        description: description || '',
        type,
        isActive: true,
        createdBy: user.id,
        createdAt: Timestamp.now().toDate().toISOString(),
        updatedAt: Timestamp.now().toDate().toISOString(),
      } as Omit<DocumentCategory, 'id'>);

      const newDoc = await docRef.get();
      const category = {
        id: docRef.id,
        ...(newDoc.data() as Omit<DocumentCategory, 'id'>),
      };

      const serialized = serializeDatasets({ category });

      return res.json({
        id: docRef.id,
        data: serialized.category,
        message: 'Category created successfully',
      });
    } catch (error: any) {
      console.error('[POST /api/admin/document-categories]', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
