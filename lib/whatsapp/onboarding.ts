/**
 * WhatsApp Onboarding Utilities
 * Handles the Embedded Signup flow for connecting WABA accounts
 */

import { encryptAccessToken, generateWebhookVerifyToken } from '@/lib/crypto';
import { getSupabase } from '@/lib/memory/supabase';

// Meta Graph API configuration
const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Meta App credentials
const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || '816459297543576';
const META_APP_SECRET = process.env.META_APP_SECRET;

interface TokenExchangeResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface PhoneNumberInfo {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating: string;
}

interface WABAInfo {
  id: string;
  name: string;
  phone_numbers: {
    data: PhoneNumberInfo[];
  };
}

export interface OnboardingResult {
  success: boolean;
  wabaId?: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  businessName?: string;
  error?: string;
}

/**
 * Exchange authorization code for access token
 * This exchanges the code from Embedded Signup for a long-lived token
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  if (!META_APP_SECRET) {
    throw new Error('META_APP_SECRET is not configured');
  }

  const params = new URLSearchParams({
    client_id: META_APP_ID,
    client_secret: META_APP_SECRET,
    code: code
  });

  const response = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`, {
    method: 'GET'
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Onboarding] Token exchange failed:', error);
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  const data: TokenExchangeResponse = await response.json();
  return data.access_token;
}

/**
 * Get WABA information using access token
 */
export async function getWABAInfo(wabaId: string, accessToken: string): Promise<WABAInfo> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${wabaId}?fields=id,name,phone_numbers{id,display_phone_number,verified_name,quality_rating}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('[Onboarding] Failed to get WABA info:', error);
    throw new Error(`Failed to get WABA info: ${error}`);
  }

  return response.json();
}

/**
 * Subscribe webhook to WABA
 * This uses the System User Token to subscribe our webhook to the WABA
 */
export async function subscribeToWebhook(
  wabaId: string,
  systemUserToken?: string
): Promise<void> {
  const token = systemUserToken || process.env.META_SYSTEM_USER_TOKEN;

  if (!token) {
    console.warn('[Onboarding] No system user token available for webhook subscription');
    return;
  }

  // Subscribe to messages webhook field
  const response = await fetch(
    `${GRAPH_API_BASE}/${wabaId}/subscribed_apps`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('[Onboarding] Failed to subscribe webhook:', error);
    // Don't throw - webhook subscription can be done later
  } else {
    console.log(`[Onboarding] Successfully subscribed webhook for WABA: ${wabaId}`);
  }
}

/**
 * Register phone number for messaging
 * Required step after Embedded Signup to enable messaging
 */
export async function registerPhoneNumber(
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${phoneNumberId}/register`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        pin: '123456' // This is the 2FA pin - should be made configurable
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('[Onboarding] Failed to register phone number:', error);
    // This might fail if already registered, which is okay
    return false;
  }

  console.log(`[Onboarding] Successfully registered phone number: ${phoneNumberId}`);
  return true;
}

/**
 * Complete the onboarding process
 * 1. Exchange code for access token
 * 2. Get WABA information
 * 3. Subscribe webhook
 * 4. Save credentials to database
 */
export async function completeOnboarding(params: {
  tenantId: string;
  code: string;
  wabaId: string;
  phoneNumberId: string;
}): Promise<OnboardingResult> {
  const { tenantId, code, wabaId, phoneNumberId } = params;
  const supabase = getSupabase();

  try {
    // 1. Exchange code for access token
    console.log('[Onboarding] Exchanging code for access token...');
    const accessToken = await exchangeCodeForToken(code);

    // 2. Get WABA and phone number info
    console.log('[Onboarding] Getting WABA info...');
    const wabaInfo = await getWABAInfo(wabaId, accessToken);

    // Find the phone number in the WABA
    const phoneInfo = wabaInfo.phone_numbers.data.find(p => p.id === phoneNumberId);
    const displayPhoneNumber = phoneInfo?.display_phone_number || null;
    const businessName = wabaInfo.name || phoneInfo?.verified_name || null;

    // 3. Subscribe webhook
    console.log('[Onboarding] Subscribing webhook...');
    await subscribeToWebhook(wabaId);

    // 4. Register phone number (may fail if already registered)
    console.log('[Onboarding] Registering phone number...');
    await registerPhoneNumber(phoneNumberId, accessToken);

    // 5. Generate webhook verify token
    const webhookVerifyToken = generateWebhookVerifyToken();

    // 6. Encrypt and save to database
    console.log('[Onboarding] Saving credentials...');
    const encryptedToken = encryptAccessToken(accessToken);

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from('whatsapp_accounts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('waba_id', wabaId)
      .single();

    if (existingAccount) {
      // Update existing account
      const { error } = await supabase
        .from('whatsapp_accounts')
        .update({
          phone_number_id: phoneNumberId,
          display_phone_number: displayPhoneNumber,
          business_name: businessName,
          access_token_encrypted: encryptedToken,
          webhook_verify_token: webhookVerifyToken,
          status: 'active',
          last_synced_at: new Date().toISOString()
        })
        .eq('id', existingAccount.id);

      if (error) {
        throw new Error(`Failed to update WhatsApp account: ${error.message}`);
      }
    } else {
      // Create new account
      const { error } = await supabase
        .from('whatsapp_accounts')
        .insert({
          tenant_id: tenantId,
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          display_phone_number: displayPhoneNumber,
          business_name: businessName,
          access_token_encrypted: encryptedToken,
          webhook_verify_token: webhookVerifyToken,
          status: 'active'
        });

      if (error) {
        throw new Error(`Failed to create WhatsApp account: ${error.message}`);
      }
    }

    console.log('[Onboarding] Onboarding completed successfully');

    return {
      success: true,
      wabaId,
      phoneNumberId,
      displayPhoneNumber: displayPhoneNumber || undefined,
      businessName: businessName || undefined
    };

  } catch (error) {
    console.error('[Onboarding] Onboarding failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Disconnect WhatsApp account
 */
export async function disconnectWhatsApp(tenantId: string): Promise<boolean> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('whatsapp_accounts')
    .update({ status: 'inactive' })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('[Onboarding] Failed to disconnect WhatsApp:', error);
    return false;
  }

  return true;
}

/**
 * Refresh access token (if needed)
 * Meta tokens don't expire typically, but this is here for future use
 */
export async function refreshAccessToken(
  tenantId: string,
  currentToken: string
): Promise<string | null> {
  // For Meta tokens, they're typically long-lived after exchange
  // This function is a placeholder for token refresh logic if needed
  console.log('[Onboarding] Token refresh requested for tenant:', tenantId);
  return currentToken;
}

/**
 * Verify webhook connection is working
 */
export async function verifyWebhookConnection(
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  try {
    // Try to get phone number info as a simple health check
    const response = await fetch(
      `${GRAPH_API_BASE}/${phoneNumberId}?fields=id,display_phone_number`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}
