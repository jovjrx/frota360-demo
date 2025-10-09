import { Integration, IntegrationPlatform, REQUIRED_CREDENTIALS } from '@/schemas/integration';

type ScopeSource = string | string[] | null | undefined;

export type IntegrationSummaryRecord = {
  platform: IntegrationPlatform;
  name: string;
  enabled: boolean;
  status: string;
  credentials: Record<string, string>;
  missingCredentials: string[];
  scopes: string[];
  missingScopes: string[];
  totalRequests: number;
  failedRequests: number;
  lastSync?: string | null;
  lastSuccess?: string | null;
  lastError?: string | null;
  errorMessage?: string | null;
  updatedAt?: string | null;
};

export function normalizeScopes(scope: ScopeSource): string[] {
  if (!scope) return [];
  if (Array.isArray(scope)) {
    return scope.flatMap((item) => item.split(/[\s,]+/)).filter(Boolean);
  }
  if (typeof scope === 'string') {
    return scope.split(/[\s,]+/).filter(Boolean);
  }
  return [];
}

export function buildIntegrationSummary(integration: Integration): IntegrationSummaryRecord {
  const credentials = integration.credentials ?? {};
  const requiredCredentials = REQUIRED_CREDENTIALS[integration.platform] ?? [];
  const missingCredentials = requiredCredentials.filter((key) => {
    const value = credentials[key];
    return !value || String(value).trim().length === 0;
  });

  const oauthScopes = normalizeScopes(integration.oauth?.scope);
  const configuredScopes = normalizeScopes(
    (integration.config?.options as Record<string, any> | undefined)?.requiredScopes ??
      (integration.config?.options as Record<string, any> | undefined)?.scopes
  );
  const missingScopes = configuredScopes.length
    ? configuredScopes.filter((scope) => !oauthScopes.includes(scope))
    : [];

  const stats = integration.stats ?? {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
  };

  return {
    platform: integration.platform,
    name: integration.name,
    enabled: integration.enabled,
    status: integration.status,
    credentials,
    missingCredentials,
    scopes: oauthScopes,
    missingScopes,
    totalRequests: stats.totalRequests ?? 0,
    failedRequests: stats.failedRequests ?? 0,
    lastSync: stats.lastSync ? stats.lastSync.toDate().toISOString() : null,
    lastSuccess: stats.lastSuccess ? stats.lastSuccess.toDate().toISOString() : null,
    lastError: stats.lastError ? stats.lastError.toDate().toISOString() : null,
    errorMessage: stats.errorMessage ?? null,
    updatedAt: integration.metadata?.updatedAt ? integration.metadata.updatedAt.toDate().toISOString() : null,
  };
}
