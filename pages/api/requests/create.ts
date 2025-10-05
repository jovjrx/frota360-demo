import { NextApiRequest, NextApiResponse } from 'next';
import { requestSchema } from '@/schemas/request';
import { db } from '@/lib/firebaseAdmin';
import { ApiResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Validar dados
    const validatedData = requestSchema.parse(req.body);

    // Criar solicitação no Firestore
    const requestData = {
      ...validatedData,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const docRef = await db.collection('requests').add(requestData);

    // Atualizar com o ID
    await docRef.update({ id: docRef.id });

    return res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        ...requestData,
      },
      message: 'Solicitação criada com sucesso',
    });
  } catch (error: any) {
    console.error('Error creating request:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        message: error.errors[0]?.message || 'Erro de validação',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro ao criar solicitação',
      message: error.message,
    });
  }
}
