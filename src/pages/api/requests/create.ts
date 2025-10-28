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

    // Capturar referência (se veio de link de convite / slug)
    const referralReferrerId = req.cookies?.['referral_referrer_id'] || null;
    const referralInviteCode = req.cookies?.['referral_invite_code'] || null;

    // Converter para formato do admin (driver_requests)
    const requestData = {
      fullName: validatedData.fullName,
      birthDate: validatedData.birthDate,
      email: validatedData.email,
      phone: validatedData.phone,
      city: validatedData.city,
      nif: validatedData.nif,
      licenseNumber: validatedData.licenseNumber || null,
      type: validatedData.driverType, // Converter driverType → type
      vehicle: validatedData.vehicle || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Dados de referência (se existentes)
      referrerId: referralReferrerId,
      referralInviteCode: referralInviteCode,
    };

    // ✅ CORREÇÃO: Salvar em driver_requests (mesma collection que o admin usa)
    const docRef = await db.collection('driver_requests').add(requestData);

    // Atualizar com o ID
    await docRef.update({ id: docRef.id });

    // Enviar emails usando a mesma API do contact
    try {
      // Email para admin
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-mail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: requestData.fullName,
          email: requestData.email,
          phone: requestData.phone,
          interest: `Candidatura ${requestData.type === 'affiliate' ? 'Afiliado' : 'Locatário'}`,
          message: `
🚗 Nova Candidatura de Motorista

Nome: ${requestData.fullName}
Data de Nascimento: ${new Date(requestData.birthDate).toLocaleDateString('pt-PT')}
Email: ${requestData.email}
Telefone: ${requestData.phone}
Cidade: ${requestData.city}
NIF: ${requestData.nif}
${requestData.licenseNumber ? `Carta de Condução: ${requestData.licenseNumber}` : ''}
Tipo: ${requestData.type === 'affiliate' ? 'Afiliado (veículo próprio)' : 'Locatário (aluguer de veículo)'}

${validatedData.vehicle ? `
📋 Informações do Veículo:
- Marca: ${validatedData.vehicle.make}
- Modelo: ${validatedData.vehicle.model}
- Ano: ${validatedData.vehicle.year}
- Matrícula: ${validatedData.vehicle.plate}
` : ''}

🔑 ID da Solicitação: ${docRef.id}
📅 Data: ${new Date().toLocaleString('pt-PT')}

👉 Ver no painel: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/requests
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

