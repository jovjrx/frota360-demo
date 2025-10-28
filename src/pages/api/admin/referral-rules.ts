import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import {
  ReferralRuleSchema,
  CreateReferralRuleSchema,
  UpdateReferralRuleSchema,
  createReferralRule,
  getActiveReferralRules,
  type ReferralRule,
} from '@/schemas/referral-rule';

type ApiResponse = 
  | { success: true; data?: ReferralRule | ReferralRule[] }
  | { success: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    // Verificar autenticação (admin)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // GET - Listar regras de referral
    if (req.method === 'GET') {
      const rules = await getActiveReferralRules();
      return res.status(200).json({ success: true, data: rules });
    }

    // POST - Criar nova regra
    if (req.method === 'POST') {
      const body = CreateReferralRuleSchema.safeParse({
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (!body.success) {
        return res
          .status(400)
          .json({ success: false, error: `Validação falhou: ${body.error.message}` });
      }

      const rule = createReferralRule(body.data as any);
      await adminDb.collection('referralRules').doc(rule.id).set(rule);

      return res.status(201).json({ success: true, data: rule });
    }

    // PUT - Atualizar regra
    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ success: false, error: 'ID da regra é obrigatório' });
      }

      const body = UpdateReferralRuleSchema.safeParse(updateData);

      if (!body.success) {
        return res
          .status(400)
          .json({ success: false, error: `Validação falhou: ${body.error.message}` });
      }

      const updatedData = {
        ...body.data,
        updatedAt: new Date().toISOString(),
      };

      await adminDb.collection('referralRules').doc(id).update(updatedData);

      // Retornar documento atualizado
      const updated = await adminDb.collection('referralRules').doc(id).get();
      const updatedRule = { id: updated.id, ...updated.data() } as ReferralRule;

      return res.status(200).json({ success: true, data: updatedRule });
    }

    // DELETE - Deletar regra (soft delete)
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res
          .status(400)
          .json({ success: false, error: 'ID da regra é obrigatório' });
      }

      await adminDb.collection('referralRules').doc(id).update({
        ativo: false,
        updatedAt: new Date().toISOString(),
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[/api/admin/referral-rules]', error);
    return res.status(500).json({ success: false, error: message });
  }
}
