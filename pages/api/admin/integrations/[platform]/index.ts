import { NextApiResponse } from 'next';
import { withIronSessionApiRoute, SessionRequest } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { ApiResponse } from '@/types';
import integrationService from '@/lib/integrations/integration-service';
import { IntegrationPlatform } from '@/schemas/integration';

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse<ApiResponse>
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { platform } = req.query;

  if (!platform || typeof platform !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Plataforma não especificada',
    });
  }

  // Validar se é uma plataforma válida
  const validPlatforms: IntegrationPlatform[] = ['uber', 'bolt', 'cartrack', 'viaverde', 'myprio'];
  if (!validPlatforms.includes(platform as IntegrationPlatform)) {
    return res.status(400).json({
      success: false,
      error: 'Plataforma inválida',
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Buscar configuração da integração
        const integration = await integrationService.getIntegration(platform as IntegrationPlatform);
        
        if (!integration) {
          return res.status(404).json({
            success: false,
            error: 'Integração não encontrada',
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            integration: {
              id: integration.platform,
              name: integration.name,
              isActive: integration.enabled,
              status: integration.status,
              credentials: integration.credentials,
              config: integration.config,
              oauth: integration.oauth ? {
                accessToken: integration.oauth.accessToken,
                refreshToken: integration.oauth.refreshToken,
                tokenType: integration.oauth.tokenType,
                expiresAt: integration.oauth.expiresAt?.toDate().toISOString(),
                scope: integration.oauth.scope,
              } : undefined,
              stats: {
                totalRequests: integration.stats.totalRequests,
                successfulRequests: integration.stats.successfulRequests,
                failedRequests: integration.stats.failedRequests,
                lastSync: integration.stats.lastSync?.toDate().toISOString(),
                lastSuccess: integration.stats.lastSuccess?.toDate().toISOString(),
                lastError: integration.stats.lastError?.toDate().toISOString(),
                errorMessage: integration.stats.errorMessage,
              },
              createdAt: integration.metadata.createdAt.toDate().toISOString(),
              updatedAt: integration.metadata.updatedAt.toDate().toISOString(),
              createdBy: integration.metadata.createdBy,
              updatedBy: integration.metadata.updatedBy,
            },
          },
        });

      case 'PUT':
        // Atualizar configuração da integração
        const { credentials, isActive } = req.body;

        if (!credentials) {
          return res.status(400).json({
            success: false,
            error: 'Credenciais não fornecidas',
          });
        }

        // Atualizar credenciais
        await integrationService.updateCredentials(platform as IntegrationPlatform, credentials);

        // Atualizar status ativo/inativo
        if (typeof isActive === 'boolean') {
          await integrationService.toggleIntegration(platform as IntegrationPlatform, isActive);
        }

        return res.status(200).json({
          success: true,
          message: 'Integração atualizada com sucesso',
        });

      case 'DELETE':
        // Deletar integração
        await integrationService.deleteIntegration(platform as IntegrationPlatform);
        
        return res.status(200).json({
          success: true,
          message: 'Integração removida com sucesso',
        });

      default:
        return res.status(405).json({
          success: false,
          error: 'Método não permitido',
        });
    }
  } catch (error) {
    console.error(`Error handling integration ${platform}:`, error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar integração',
    });
  }
}, sessionOptions);
