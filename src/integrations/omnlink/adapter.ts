import { getOmniLinkConfig } from './config';
import type { OmniLinkEvent, OmniLinkHealthStatus } from './types';

let warnedDisabled = false;

export function isEnabled(): boolean {
  const config = getOmniLinkConfig();
  return config.state === 'enabled';
}

/**
 * Safe no-op when the port is disabled or misconfigured.
 * Sends a POST to the OMNiLiNK hub when enabled & configured.
 */
export async function sendEvent(event: OmniLinkEvent): Promise<void> {
  const config = getOmniLinkConfig();

  if (config.state !== 'enabled' || !config.baseUrl || !config.tenantId) {
    if (!warnedDisabled) {
      console.info('[OmniLink] Port disabled or misconfigured; dropping event.');
      warnedDisabled = true;
    }
    return;
  }

  const target = `${config.baseUrl.replace(/\/+$/, '')}/tenants/${encodeURIComponent(config.tenantId)}/events`;

  try {
    const response = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...event,
        timestamp: event.timestamp ?? new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn('[OmniLink] Hub responded with non-OK status:', response.status);
    }
  } catch (error) {
    console.warn('[OmniLink] Failed to send event:', error);
  }
}

/**
 * Health snapshot for wiring into a health endpoint or diagnostics panel.
 */
export function getOmniLinkHealth(): OmniLinkHealthStatus {
  const config = getOmniLinkConfig();

  if (config.state === 'disabled') {
    return {
      status: 'disabled',
      details: {
        enabled: false,
        baseUrlConfigured: false,
        tenantConfigured: false,
      },
      message: 'OMNiLiNK port disabled by configuration.',
    };
  }

  const status = config.state === 'enabled' ? 'ok' : 'error';

  return {
    status,
    details: {
      enabled: config.enabled,
      baseUrlConfigured: Boolean(config.baseUrl),
      tenantConfigured: Boolean(config.tenantId),
    },
    message: status === 'ok'
      ? 'OMNiLiNK port enabled.'
      : 'OMNiLiNK port enabled but missing configuration.',
  };
}

export const omniLinkAdapter = {
  isEnabled,
  sendEvent,
  getOmniLinkHealth,
};

