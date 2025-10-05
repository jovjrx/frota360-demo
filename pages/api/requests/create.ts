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

    // Enviar emails usando a mesma API do contact
    try {
      // Email para admin
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-mail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          email: validatedData.email,
          phone: validatedData.phone,
          interest: `Candidatura ${validatedData.driverType === 'affiliate' ? 'Afiliado' : 'Locatário'}`,
          message: `
Nova Candidatura de Motorista

Nome: ${validatedData.firstName} ${validatedData.lastName}
Email: ${validatedData.email}
Telefone: ${validatedData.phone}
Cidade: ${validatedData.city}
Tipo: ${validatedData.driverType === 'affiliate' ? 'Afiliado (veículo próprio)' : 'Locatário (aluguer de veículo)'}

${validatedData.vehicle ? `
Informações do Veículo:
- Marca: ${validatedData.vehicle.make}
- Modelo: ${validatedData.vehicle.model}
- Ano: ${validatedData.vehicle.year}
- Matrícula: ${validatedData.vehicle.plate}
` : ''}

ID da Solicitação: ${docRef.id}
Data: ${new Date().toLocaleString('pt-PT')}

Ver no painel: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/requests
          `,
        }),
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Não falhar a requisição se o email falhar
    }

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
