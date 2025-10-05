import { NextApiRequest, NextApiResponse } from 'next';
import { requestSchema } from '@/schemas/request';
import { db } from '@/lib/firebaseAdmin';
import { ApiResponse } from '@/types';
import { sendEmail } from '@/lib/email/mailer';

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

    // Enviar email de notificação para admin
    try {
      await sendEmail({
        to: 'conduz@alvoradamagistral.eu',
        subject: `Nova Candidatura de Motorista - ${validatedData.firstName} ${validatedData.lastName}`,
        html: `
          <h2>Nova Candidatura Recebida</h2>
          <p><strong>Nome:</strong> ${validatedData.firstName} ${validatedData.lastName}</p>
          <p><strong>Email:</strong> ${validatedData.email}</p>
          <p><strong>Telefone:</strong> ${validatedData.phone}</p>
          <p><strong>Cidade:</strong> ${validatedData.city}</p>
          <p><strong>Tipo:</strong> ${validatedData.driverType === 'affiliate' ? 'Afiliado' : 'Locatário'}</p>
          ${validatedData.vehicle ? `
            <h3>Informações do Veículo:</h3>
            <p><strong>Marca:</strong> ${validatedData.vehicle.make}</p>
            <p><strong>Modelo:</strong> ${validatedData.vehicle.model}</p>
            <p><strong>Ano:</strong> ${validatedData.vehicle.year}</p>
            <p><strong>Matrícula:</strong> ${validatedData.vehicle.plate}</p>
          ` : ''}
          <p><strong>ID da Solicitação:</strong> ${docRef.id}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString('pt-PT')}</p>
          <br>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/requests">Ver no Painel Admin</a></p>
        `,
      });

      // Enviar email de confirmação para o candidato
      await sendEmail({
        to: validatedData.email,
        subject: 'Candidatura Recebida - Conduz PT',
        html: `
          <h2>Olá ${validatedData.firstName}!</h2>
          <p>Recebemos a sua candidatura para motorista TVDE na Conduz PT.</p>
          <p><strong>Você conduz, nós cuidamos do resto!</strong></p>
          <p>A nossa equipa irá analisar a sua candidatura e entrar em contacto em breve.</p>
          <p><strong>Tipo de Motorista:</strong> ${validatedData.driverType === 'affiliate' ? 'Afiliado (veículo próprio)' : 'Locatário (aluguer de veículo)'}</p>
          <br>
          <p>Qualquer dúvida, entre em contacto:</p>
          <p>📧 conduz@alvoradamagistral.eu</p>
          <p>📱 +351 913 415 670</p>
          <br>
          <p>Obrigado,<br>Equipa Conduz PT</p>
        `,
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
