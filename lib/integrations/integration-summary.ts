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

function normalizeTimestamp(value: unknown): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  if (typeof value === 'object') {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number; nanoseconds?: number };

    if (typeof maybeTimestamp.toDate === 'function') {
      const parsed = maybeTimestamp.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }

    if (typeof maybeTimestamp.seconds === 'number') {
      const millis = maybeTimestamp.seconds * 1000 + (maybeTimestamp.nanoseconds ?? 0) / 1_000_000;
      const parsed = new Date(millis);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
  }

  return null;
}

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

  const rawStats = (integration as any).stats ?? {};
  const rawErrorMessage = (integration as any).errorMessage;

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
    lastSync: normalizeTimestamp((stats as any).lastSync ?? rawStats.lastSync ?? (integration as any).lastSync),
    lastSuccess: normalizeTimestamp((stats as any).lastSuccess ?? rawStats.lastSuccess ?? (integration as any).lastSuccess),
    lastError: normalizeTimestamp((stats as any).lastError ?? rawStats.lastError ?? (integration as any).lastError),
    errorMessage: (stats as any).errorMessage ?? rawStats.errorMessage ?? rawErrorMessage ?? null,
    updatedAt: normalizeTimestamp(integration.metadata?.updatedAt ?? (integration as any).updatedAt),
  };
}
