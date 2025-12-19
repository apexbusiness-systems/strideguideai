import type { OmniLinkPortState } from './types';

interface OmniLinkConfig {
  enabled: boolean;
  baseUrl?: string;
  tenantId?: string;
  state: OmniLinkPortState;
  details: {
    enabledFlag: boolean;
    baseUrlConfigured: boolean;
    tenantConfigured: boolean;
  };
}

/**
 * Read OMNiLiNK configuration from environment.
 * The port is optional and remains a safe no-op unless explicitly enabled.
 */
export function getOmniLinkConfig(): OmniLinkConfig {
  const env = import.meta.env as Record<string, string | boolean | undefined>;

  // Support both canonical env vars and Vite-prefixed fallbacks
  const rawEnabled = env.OMNILINK_ENABLED ?? env.VITE_OMNILINK_ENABLED;
  const rawBaseUrl = (env.OMNILINK_BASE_URL ?? env.VITE_OMNILINK_BASE_URL) as string | undefined;
  const rawTenantId = (env.OMNILINK_TENANT_ID ?? env.VITE_OMNILINK_TENANT_ID) as string | undefined;

  const enabledFlag = String(rawEnabled ?? '').toLowerCase() === 'true';
  const baseUrlConfigured = Boolean(rawBaseUrl && rawBaseUrl.trim().length > 0);
  const tenantConfigured = Boolean(rawTenantId && rawTenantId.trim().length > 0);

  let state: OmniLinkPortState = 'disabled';
  if (enabledFlag) {
    state = baseUrlConfigured && tenantConfigured ? 'enabled' : 'misconfigured';
  }

  return {
    enabled: state === 'enabled',
    baseUrl: baseUrlConfigured ? rawBaseUrl?.trim() : undefined,
    tenantId: tenantConfigured ? rawTenantId?.trim() : undefined,
    state,
    details: {
      enabledFlag,
      baseUrlConfigured,
      tenantConfigured,
    },
  };
}


