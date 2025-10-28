import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import {
  CommissionRuleSchema,
  CreateCommissionRuleSchema,
  UpdateCommissionRuleSchema,
  createCommissionRule,
  getActiveCommissionRules,
  type CommissionRule,
} from '@/schemas/commission-rule';
import { checkDemoMode } from '@/lib/demo-guard';

type ApiResponse = 
  | { success: true; data?: CommissionRule | CommissionRule[] }
  | { success: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Verificar modo demo para ações de escrita
  if (checkDemoMode(req, res)) {
    return; // Retorna erro 403 se em modo demo
  }

  try {
    // Verificar autenticação (admin)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // GET - Listar regras de comissão
    if (req.method === 'GET') {
      const rules = await getActiveCommissionRules();
      return res.status(200).json({ success: true, data: rules });
    }

    // POST - Criar nova regra
    if (req.method === 'POST') {
      const body = CreateCommissionRuleSchema.safeParse({
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (!body.success) {
        return res
          .status(400)
          .json({ success: false, error: `Validação falhou: ${body.error.message}` });
      }

      const rule = createCommissionRule(body.data as any);
      await adminDb.collection('commissions').doc(rule.id).set(rule);

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

      const body = UpdateCommissionRuleSchema.safeParse(updateData);

      if (!body.success) {
        return res
          .status(400)
          .json({ success: false, error: `Validação falhou: ${body.error.message}` });
      }

      const updatedData = {
        ...body.data,
        updatedAt: new Date().toISOString(),
      };

      await adminDb.collection('commissions').doc(id).update(updatedData);

      // Retornar documento atualizado
      const updated = await adminDb.collection('commissions').doc(id).get();
      const updatedRule = { id: updated.id, ...updated.data() } as CommissionRule;

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

      await adminDb.collection('commissions').doc(id).update({
        ativo: false,
        updatedAt: new Date().toISOString(),
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[/api/admin/commission-rules]', error);
    return res.status(500).json({ success: false, error: message });
  }
}
