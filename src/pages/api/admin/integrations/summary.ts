import { NextApiResponse } from 'next';
import { withIronSessionApiRoute, SessionRequest } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import integrationService from '@/lib/integrations/integration-service';
import { buildIntegrationSummary, IntegrationSummaryRecord } from '@/lib/integrations/integration-summary';

interface SummaryResponse {
  success: boolean;
  integrations?: IntegrationSummaryRecord[];
  error?: string;
}

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse<SummaryResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const integrations = await integrationService.getAllIntegrations();

    const summaries = integrations.map(buildIntegrationSummary);

    return res.status(200).json({ success: true, integrations: summaries });
  } catch (error) {
    console.error('Failed to load integration summaries:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}, sessionOptions);

