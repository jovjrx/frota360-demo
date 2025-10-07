
import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '@/lib/session/ironSession';
import { ApiResponse } from '@/types';
import {
  createBoltClient,
  createCartrackClient,
  createViaVerdeClient,
  createMyprioClient,
} from '@/lib/integrations';
import { createUberConfig } from '@/lib/uber/base';
import { UberBusinessClient } from '@/lib/uber/client-business';
import { adminDb } from '@/lib/firebaseAdmin';

export default withIronSessionApiRoute(async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { platform } = req.body;

    if (!platform) {
      return res.status(400).json({
        success: false,
        error: 'Plataforma não especificada',
      });
    }

    let result;

    switch (platform.toLowerCase()) {
      case 'uber':
        const uberConfig = createUberConfig();
        const uberClient = new UberBusinessClient(uberConfig);
        result = await uberClient.testConnection();
        break;

      case 'bolt':
        const boltClient = await createBoltClient();
        result = await boltClient.testConnection();
        break;

      case 'cartrack':
        const cartrackClient = await createCartrackClient();
        result = await cartrackClient.testConnection();
        break;

      case 'viaverde':
        const viaverdeClient = await createViaVerdeClient();
        result = await viaverdeClient.testConnection();
        break;

      case 'myprio':
        const myprioClient = await createMyprioClient();
        result = await myprioClient.testConnection();
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Plataforma não suportada',
        });
    }

    if (result.success) {
      // Atualizar status no Firestore
      await adminDb.collection('integrations').doc(platform.toLowerCase()).update({
        status: 'connected',
        lastSync: new Date().toISOString(),
        errorMessage: null,
      });

      return res.status(200).json({
        success: true,
        message: `Conexão com ${platform} estabelecida com sucesso`,
        data: result.data,
      });
    } else {
      // Atualizar status de erro no Firestore
      await adminDb.collection('integrations').doc(platform.toLowerCase()).update({
        status: 'error',
        errorMessage: result.error || 'Erro na conexão',
      });

      return res.status(500).json({
        success: false,
        error: `Erro ao conectar com ${platform}`,
        message: result.error,
      });
    }
  } catch (error: any) {
    console.error('Error testing integration:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao testar integração',
      message: error.message,
    });
  }
}, sessionOptions);

