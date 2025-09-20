import { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';
import { billingProvider } from '@/lib/billing/adapter';
import { requireDriver } from '@/lib/auth/rbac';

const handler = requireDriver(async (req: NextApiRequest, res: NextApiResponse, context) => {
  try {
    if (req.method === 'GET') {
      // Get customer information for the authenticated driver
      const driver = await store.drivers.findByUserId(context.user.userId!);
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      // In a real implementation, you would have a separate customers collection
      // For now, we'll simulate getting customer data
      const customerData = {
        id: driver.id,
        email: driver.email,
        name: driver.name,
        phone: driver.phone,
        paymentMethods: [], // This would come from your billing provider
      };

      res.status(200).json({ 
        success: true, 
        data: customerData 
      });
    } else if (req.method === 'POST') {
      // Create or update customer
      const { name, phone } = req.body;
      
      const driver = await store.drivers.findByUserId(context.user.userId!);
      if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      // Update driver information
      await store.drivers.update(driver.id, {
        name: name || driver.name,
        phone: phone || driver.phone,
        updatedAt: Date.now(),
      });

      res.status(200).json({ 
        success: true,
        message: 'Customer information updated successfully' 
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Customer API error:', error);
    res.status(500).json({ error: error.message || 'Failed to process customer request' });
  }
});

export default handler;
