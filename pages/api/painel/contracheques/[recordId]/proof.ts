import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * API para baixar comprovante de pagamento
 * GET /api/painel/contracheques/[recordId]/proof
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { recordId } = req.query;

    if (!recordId || typeof recordId !== 'string') {
      return res.status(400).json({ error: 'Record ID inválido' });
    }

    // Buscar pagamento
    const paymentSnapshot = await adminDb
      .collection('driverPayments')
      .where('recordId', '==', recordId)
      .limit(1)
      .get();

    let proofUrl = null;
    let proofFileName = null;
    let proofContentType = null;

    if (!paymentSnapshot.empty) {
      const paymentData = paymentSnapshot.docs[0].data();
      proofUrl = paymentData.proofUrl;
      proofFileName = paymentData.proofFileName;
      proofContentType = paymentData.proofContentType;
    } else {
      // Fallback: buscar no driverWeeklyRecords
      const recordDoc = await adminDb
        .collection('driverWeeklyRecords')
        .doc(recordId)
        .get();

      if (recordDoc.exists) {
        const recordData = recordDoc.data();
        if (recordData?.paymentInfo) {
          proofUrl = recordData.paymentInfo.proofUrl;
          proofFileName = recordData.paymentInfo.proofFileName;
          proofContentType = recordData.paymentInfo.proofContentType;
        }
      }
    }

    if (!proofUrl) {
      return res.status(404).json({ error: 'Comprovante não disponível' });
    }

    // Buscar o arquivo da URL
    const fileResponse = await fetch(proofUrl);

    if (!fileResponse.ok) {
      throw new Error('Erro ao buscar arquivo');
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // Definir headers para download
    const fileName = proofFileName || 'Comprovante_Pagamento.pdf';
    
    res.setHeader('Content-Type', proofContentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);

  } catch (error: any) {
    console.error('[Proof] Erro ao baixar comprovante:', error);
    return res.status(500).json({ 
      error: 'Erro ao baixar comprovante',
      details: error.message,
    });
  }
}
