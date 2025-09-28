import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check admin authentication
    const session = await getSession(req, res);
    if (!session.userId || session.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get all content items
      const contentSnap = await adminDb.collection('content_management').get();
      const contentItems = contentSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json(contentItems);

    } else if (req.method === 'POST') {
      // Create new content item
      const { page, section, key, content, active = true } = req.body;

      if (!page || !section || !key || !content) {
        return res.status(400).json({ 
          error: 'Page, section, key, and content are required' 
        });
      }

      // Check if content with same page/section/key already exists
      const existingSnap = await adminDb
        .collection('content_management')
        .where('page', '==', page)
        .where('section', '==', section)
        .where('key', '==', key)
        .get();

      if (!existingSnap.empty) {
        return res.status(400).json({ 
          error: 'Content with this page/section/key combination already exists' 
        });
      }

      const newContentData = {
        page,
        section,
        key,
        content,
        active,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        updatedBy: session.userId,
      };

      const docRef = await adminDb.collection('content_management').add(newContentData);

      return res.status(201).json({ 
        id: docRef.id,
        ...newContentData 
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in content API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
