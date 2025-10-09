import { NextApiResponse } from 'next';
import { withIronSessionApiRoute, SessionRequest } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import integrationLogService from '@/lib/integrations/integration-log-service';
import {
  IntegrationLog,
  IntegrationLogFilters,
  IntegrationLogSeverity,
  IntegrationLogType,
} from '@/schemas/integration-log';
import { IntegrationPlatform } from '@/schemas/integration';

interface LogsResponse {
  success: boolean;
  logs?: Array<Omit<IntegrationLog, 'timestamp' | 'expiresAt'> & {
    id: string;
    timestamp: string;
    expiresAt?: string;
  }>;
  error?: string;
}

function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp);
}

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse<LogsResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const {
    platform,
    type,
    severity,
    startDate,
    endDate,
    limit,
  } = req.query;

  const filters: IntegrationLogFilters = {};

  if (platform && typeof platform === 'string') {
    filters.platform = platform as IntegrationPlatform;
  }

  if (type && typeof type === 'string') {
    filters.type = type as IntegrationLogType;
  }

  if (severity && typeof severity === 'string') {
    filters.severity = severity as IntegrationLogSeverity;
  }

  if (limit && typeof limit === 'string') {
    const parsed = Number(limit);
    if (!Number.isNaN(parsed)) {
      filters.limit = parsed;
    }
  }

  const parsedStart = typeof startDate === 'string' ? toDate(startDate) : undefined;
  const parsedEnd = typeof endDate === 'string' ? toDate(endDate) : undefined;

  if (parsedStart) filters.startDate = parsedStart;
  if (parsedEnd) filters.endDate = parsedEnd;

  try {
    const logs = await integrationLogService.getLogs(filters);

    return res.status(200).json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id ?? '',
        platform: log.platform,
        type: log.type,
        severity: log.severity,
        message: log.message,
        details: log.details,
        endpoint: log.endpoint,
        method: log.method,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        metadata: log.metadata,
        timestamp: log.timestamp.toDate().toISOString(),
        expiresAt: log.expiresAt ? log.expiresAt.toDate().toISOString() : undefined,
      })),
    });
  } catch (error) {
    console.error('Failed to load integration logs:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}, sessionOptions);
