import { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';
import { requireAdmin } from '@/lib/auth/rbac';

const handler = requireAdmin(async (req: NextApiRequest, res: NextApiResponse, context) => {
  try {
    if (req.method === 'GET') {
      const { 
        driverId, 
        status, 
        limit = '50', 
        offset = '0' 
      } = req.query;

      let invoices = await store.invoices.findAll();

      // Filter by driver if specified
      if (driverId && typeof driverId === 'string') {
        invoices = invoices.filter(invoice => invoice.driverId === driverId);
      }

      // Filter by status if specified
      if (status && typeof status === 'string') {
        invoices = invoices.filter(invoice => invoice.status === status);
      }

      // Sort by creation date (newest first)
      invoices.sort((a, b) => b.createdAt - a.createdAt);

      // Apply pagination
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      const paginatedInvoices = invoices.slice(offsetNum, offsetNum + limitNum);

      res.status(200).json({ 
        success: true, 
        data: paginatedInvoices,
        pagination: {
          total: invoices.length,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < invoices.length,
        }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('List invoices error:', error);
    res.status(500).json({ error: error.message || 'Failed to list invoices' });
  }
});

export default handler;
