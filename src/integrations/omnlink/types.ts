export type OmniLinkPortState = 'disabled' | 'misconfigured' | 'enabled';

export interface OmniLinkEvent {
  type: string;
  payload?: Record<string, unknown>;
  /**
   * Optional ISO timestamp provided by the caller.
   * If omitted, the adapter will let the backend timestamp the event.
   */
  timestamp?: string;
  meta?: Record<string, unknown>;
}

export interface OmniLinkHealthStatus {
  status: 'disabled' | 'ok' | 'error';
  details: {
    enabled: boolean;
    baseUrlConfigured: boolean;
    tenantConfigured: boolean;
  };
  message?: string;
}


