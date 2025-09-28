import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { page, locale: localeParam = 'pt' } = req.query;

    if (!page || typeof page !== 'string') {
      return res.status(400).json({ error: 'Page parameter is required' });
    }

    // Ensure locale is a string (not an array)
    const locale = Array.isArray(localeParam) ? localeParam[0] : localeParam;

    // Get content for specific page and locale
    const contentSnap = await adminDb
      .collection('content_management')
      .where('page', '==', page)
      .where('active', '==', true)
      .get();

    const content: { [key: string]: any } = {};

    contentSnap.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.section}.${data.key}`;
      
      // Get content for the requested locale, fallback to 'pt' if not available
      const localizedContent = data.content[locale] || data.content['pt'] || '';
      
      // Create nested object structure
      const keys = key.split('.');
      let current = content;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = localizedContent;
    });

    return res.status(200).json(content);

  } catch (error) {
    console.error('Error in public content API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
