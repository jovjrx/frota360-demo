import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId é obrigatório' });
  }

  try {
    if (req.method === 'GET') {
      // Buscar documentos do motorista
      const docsSnap = await adminDb
        .collection('drivers')
        .doc(userId)
        .collection('documents')
        .orderBy('uploadedAt', 'desc')
        .get();
      
      const documents = docsSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return res.status(200).json({ documents });

    } else if (req.method === 'DELETE') {
      // Deletar documento
      const { documentId } = req.body;
      
      if (!documentId) {
        return res.status(400).json({ error: 'documentId é obrigatório' });
      }

      const docRef = adminDb
        .collection('drivers')
        .doc(userId)
        .collection('documents')
        .doc(documentId);

      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        return res.status(404).json({ error: 'Documento não encontrado' });
      }

      // Deletar do Firestore
      await docRef.delete();

      // Criar notificação
      await adminDb
        .collection('drivers')
        .doc(userId)
        .collection('notifications')
        .add({
          type: 'document_deleted',
          title: 'Documento Removido',
          message: 'Um documento foi removido do seu perfil.',
          read: false,
          createdAt: Date.now(),
          createdBy: 'system',
        });

      return res.status(200).json({ success: true });

    } else if (req.method === 'PUT') {
      // Atualizar status do documento (admin)
      const { documentId, status, adminId } = req.body;
      
      if (!documentId || !status) {
        return res.status(400).json({ error: 'documentId e status são obrigatórios' });
      }

      const docRef = adminDb
        .collection('drivers')
        .doc(userId)
        .collection('documents')
        .doc(documentId);

      await docRef.update({
        status,
        reviewedAt: Date.now(),
        reviewedBy: adminId || 'admin',
      });

      // Criar notificação para o motorista
      const docSnap = await docRef.get();
      const docData = docSnap.data();
      
      let message = '';
      let title = '';
      
      if (status === 'approved') {
        title = 'Documento Aprovado';
        message = `Seu documento ${docData?.type} foi aprovado e está ativo.`;
      } else if (status === 'rejected') {
        title = 'Documento Rejeitado';
        message = `Seu documento ${docData?.type} foi rejeitado. Verifique os requisitos e envie novamente.`;
      }

      await adminDb
        .collection('drivers')
        .doc(userId)
        .collection('notifications')
        .add({
          type: 'document_reviewed',
          title,
          message,
          read: false,
          createdAt: Date.now(),
          createdBy: adminId || 'admin',
        });

      return res.status(200).json({ success: true });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Erro com documentos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
