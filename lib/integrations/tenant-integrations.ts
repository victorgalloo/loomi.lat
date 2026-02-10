/**
 * Tenant Integrations CRUD
 * Manages OAuth integrations (Cal.com, Stripe Connect) per tenant
 */

import { getSupabase } from '@/lib/memory/supabase';
import { encrypt, decrypt } from '@/lib/crypto';

export type IntegrationProvider = 'calcom' | 'stripe_connect';
export type IntegrationStatus = 'disconnected' | 'pending' | 'connected' | 'error';

export interface TenantIntegration {
  id: string;
  tenantId: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  calClientId: string | null;
  calEventTypeId: string | null;
  calUsername: string | null;
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
  connectedAt: string | null;
  errorMessage: string | null;
  settings: Record<string, unknown>;
}

export interface CalConfig {
  accessToken: string;
  eventTypeId: string;
}

function mapRow(row: Record<string, unknown>): TenantIntegration {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    provider: row.provider as IntegrationProvider,
    status: row.status as IntegrationStatus,
    calClientId: row.cal_client_id as string | null,
    calEventTypeId: row.cal_event_type_id as string | null,
    calUsername: row.cal_username as string | null,
    stripeAccountId: row.stripe_account_id as string | null,
    stripeOnboardingComplete: (row.stripe_onboarding_complete as boolean) ?? false,
    connectedAt: row.connected_at as string | null,
    errorMessage: row.error_message as string | null,
    settings: (row.settings as Record<string, unknown>) ?? {},
  };
}

/**
 * Get all integrations for a tenant
 */
export async function getIntegrations(tenantId: string): Promise<TenantIntegration[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tenant_integrations')
    .select('id, tenant_id, provider, status, cal_client_id, cal_event_type_id, cal_username, stripe_account_id, stripe_onboarding_complete, connected_at, error_message, settings')
    .eq('tenant_id', tenantId);

  if (error || !data) return [];
  return data.map(mapRow);
}

/**
 * Get a specific integration
 */
export async function getIntegration(
  tenantId: string,
  provider: IntegrationProvider
): Promise<TenantIntegration | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tenant_integrations')
    .select('id, tenant_id, provider, status, cal_client_id, cal_event_type_id, cal_username, stripe_account_id, stripe_onboarding_complete, connected_at, error_message, settings')
    .eq('tenant_id', tenantId)
    .eq('provider', provider)
    .single();

  if (error || !data) return null;
  return mapRow(data);
}

/**
 * Create or update an integration
 */
export async function upsertIntegration(
  tenantId: string,
  provider: IntegrationProvider,
  data: Record<string, unknown>
): Promise<TenantIntegration> {
  const supabase = getSupabase();

  const { data: row, error } = await supabase
    .from('tenant_integrations')
    .upsert(
      { tenant_id: tenantId, provider, ...data },
      { onConflict: 'tenant_id,provider' }
    )
    .select('id, tenant_id, provider, status, cal_client_id, cal_event_type_id, cal_username, stripe_account_id, stripe_onboarding_complete, connected_at, error_message, settings')
    .single();

  if (error) {
    console.error('[Integrations] Upsert error:', error);
    throw error;
  }

  return mapRow(row);
}

/**
 * Disconnect an integration — clears tokens and sets status to disconnected
 */
export async function disconnectIntegration(
  tenantId: string,
  provider: IntegrationProvider
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('tenant_integrations')
    .update({
      status: 'disconnected',
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      token_expires_at: null,
      cal_client_id: null,
      cal_client_secret_encrypted: null,
      cal_event_type_id: null,
      cal_username: null,
      stripe_account_id: null,
      stripe_onboarding_complete: false,
      connected_at: null,
      error_message: null,
    })
    .eq('tenant_id', tenantId)
    .eq('provider', provider);

  if (error) {
    console.error('[Integrations] Disconnect error:', error);
    throw error;
  }
}

/**
 * Get decrypted Cal.com config for a tenant (used by calendar tools)
 */
export async function getCalConfig(tenantId: string): Promise<CalConfig | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tenant_integrations')
    .select('access_token_encrypted, cal_event_type_id, status')
    .eq('tenant_id', tenantId)
    .eq('provider', 'calcom')
    .eq('status', 'connected')
    .single();

  if (error || !data) return null;

  const accessTokenEncrypted = data.access_token_encrypted as string | null;
  const eventTypeId = data.cal_event_type_id as string | null;

  if (!accessTokenEncrypted || !eventTypeId) return null;

  try {
    return {
      accessToken: decrypt(accessTokenEncrypted),
      eventTypeId,
    };
  } catch (e) {
    console.error('[Integrations] Failed to decrypt Cal.com token:', e);
    return null;
  }
}

/**
 * Get decrypted Cal.com OAuth app credentials for a tenant
 */
export async function getCalCredentials(
  tenantId: string
): Promise<{ clientId: string; clientSecret: string } | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tenant_integrations')
    .select('cal_client_id, cal_client_secret_encrypted')
    .eq('tenant_id', tenantId)
    .eq('provider', 'calcom')
    .single();

  if (error || !data) return null;

  const clientId = data.cal_client_id as string | null;
  const secretEncrypted = data.cal_client_secret_encrypted as string | null;

  if (!clientId || !secretEncrypted) return null;

  try {
    return { clientId, clientSecret: decrypt(secretEncrypted) };
  } catch (e) {
    console.error('[Integrations] Failed to decrypt Cal.com client secret:', e);
    return null;
  }
}

/**
 * Save Cal.com OAuth app credentials (client_id + encrypted client_secret)
 */
export async function saveCalCredentials(
  tenantId: string,
  clientId: string,
  clientSecret: string
): Promise<void> {
  await upsertIntegration(tenantId, 'calcom', {
    cal_client_id: clientId,
    cal_client_secret_encrypted: encrypt(clientSecret),
  });
}

/**
 * Helper: encrypt and store Cal.com tokens
 */
export async function saveCalTokens(
  tenantId: string,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    calUsername?: string;
    calEventTypeId?: string;
  }
): Promise<void> {
  await upsertIntegration(tenantId, 'calcom', {
    status: 'connected',
    access_token_encrypted: encrypt(tokens.accessToken),
    refresh_token_encrypted: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
    token_expires_at: tokens.expiresAt?.toISOString() ?? null,
    cal_username: tokens.calUsername ?? null,
    cal_event_type_id: tokens.calEventTypeId ?? null,
    connected_at: new Date().toISOString(),
    error_message: null,
  });
}
