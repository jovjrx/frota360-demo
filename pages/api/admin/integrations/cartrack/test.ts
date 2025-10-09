import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const db = getFirestore();

    // Buscar credenciais da integração Cartrack
    const integrationDoc = await db.collection('integrations').doc('cartrack').get();

    if (!integrationDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cartrack integration not configured' 
      });
    }

    const integration = integrationDoc.data();

    if (!integration?.enabled) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cartrack integration is disabled' 
      });
    }

    const { username, apiKey } = integration.credentials || {};
    const { baseUrl } = integration.config || {};

    if (!username || !apiKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cartrack credentials not configured' 
      });
    }

    const url = `${baseUrl || 'https://fleetapi-pt.cartrack.com/rest'}/vehicles/status`;
    const auth = Buffer.from(`${username}:${apiKey}`).toString('base64');

    // Testar conexão com a API Cartrack
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Atualizar status de erro no Firestore
      await db.collection('integrations').doc('cartrack').update({
        status: 'error',
        errorMessage: `API returned ${response.status}: ${errorText}`,
        lastSync: new Date().toISOString(),
      });

      return res.status(200).json({ 
        success: false, 
        error: `Cartrack API returned ${response.status}` 
      });
    }

    const data = await response.json();

    // Atualizar status de sucesso no Firestore
    await db.collection('integrations').doc('cartrack').update({
      status: 'connected',
      errorMessage: null,
      lastSync: new Date().toISOString(),
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Connection successful',
      data: {
        vehicleCount: data.vehicles?.length || 0,
      }
    });
  } catch (error) {
    console.error('Error testing Cartrack connection:', error);
    
    // Tentar atualizar status de erro no Firestore
    try {
      const db = getFirestore();
      await db.collection('integrations').doc('cartrack').update({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        lastSync: new Date().toISOString(),
      });
    } catch (updateError) {
      console.error('Error updating Firestore:', updateError);
    }

    return res.status(200).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal Server Error' 
    });
  }
}
