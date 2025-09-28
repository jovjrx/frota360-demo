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

    const { contentId } = req.query;

    if (!contentId || typeof contentId !== 'string') {
      return res.status(400).json({ error: 'contentId is required' });
    }

    const contentRef = adminDb.collection('content_management').doc(contentId);
    const contentDoc = await contentRef.get();

    if (!contentDoc.exists) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (req.method === 'GET') {
      // Get specific content item
      const contentData = contentDoc.data();
      return res.status(200).json({ 
        id: contentDoc.id,
        ...contentData 
      });

    } else if (req.method === 'PUT') {
      // Update content item
      const { page, section, key, content, active } = req.body;

      const updateData: any = {
        updatedAt: Date.now(),
        updatedBy: session.userId,
      };

      if (page !== undefined) updateData.page = page;
      if (section !== undefined) updateData.section = section;
      if (key !== undefined) updateData.key = key;
      if (content !== undefined) updateData.content = content;
      if (active !== undefined) updateData.active = active;

      // If updating page/section/key, check for duplicates
      if (page || section || key) {
        const currentData = contentDoc.data();
        const checkPage = page || currentData?.page;
        const checkSection = section || currentData?.section;
        const checkKey = key || currentData?.key;

        const existingSnap = await adminDb
          .collection('content_management')
          .where('page', '==', checkPage)
          .where('section', '==', checkSection)
          .where('key', '==', checkKey)
          .get();

        // Check if there's another document with the same combination (excluding current)
        const duplicate = existingSnap.docs.find(doc => doc.id !== contentId);
        if (duplicate) {
          return res.status(400).json({ 
            error: 'Content with this page/section/key combination already exists' 
          });
        }
      }

      await contentRef.update(updateData);

      return res.status(200).json({ 
        success: true, 
        message: 'Content updated successfully' 
      });

    } else if (req.method === 'DELETE') {
      // Delete content item
      await contentRef.delete();

      return res.status(200).json({ 
        success: true, 
        message: 'Content deleted successfully' 
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in content API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
