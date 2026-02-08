/**
 * Twilio Phone Number Provisioning
 *
 * Business logic for searching, purchasing, and managing phone numbers.
 * Numbers are purchased via Twilio, then registered with WhatsApp via Meta Embedded Signup.
 */

import { getTwilioClient } from './client';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  monthlyPrice: number;
}

export interface ProvisionedNumber {
  id: string;
  tenantId: string;
  twilioSid: string;
  phoneNumber: string;
  friendlyName: string | null;
  countryCode: string;
  status: 'active' | 'pending_whatsapp' | 'whatsapp_connected' | 'released' | 'error';
  whatsappAccountId: string | null;
  verificationCode: string | null;
  verificationCodeExpiresAt: string | null;
  monthlyCost: number | null;
  currency: string;
  purchasedAt: string;
  createdAt: string;
}

/**
 * Search available phone numbers in a country.
 * Returns up to 10 SMS-enabled numbers.
 */
export async function searchAvailableNumbers(
  country: 'MX' | 'US',
  options?: { areaCode?: string; contains?: string }
): Promise<AvailableNumber[]> {
  const client = getTwilioClient();

  const searchOpts: Record<string, unknown> = {
    smsEnabled: true,
    limit: 10,
  };

  if (options?.areaCode) searchOpts.areaCode = options.areaCode;
  if (options?.contains) searchOpts.contains = options.contains;

  // MX uses mobile numbers, US uses local
  const numbers = country === 'MX'
    ? await client.availablePhoneNumbers(country).mobile.list(searchOpts)
    : await client.availablePhoneNumbers(country).local.list(searchOpts);

  return numbers.map(n => ({
    phoneNumber: n.phoneNumber,
    friendlyName: n.friendlyName,
    locality: n.locality || '',
    region: n.region || '',
    // Twilio MX mobile ~$3/mo, US local ~$1.15/mo
    monthlyPrice: country === 'MX' ? 3.00 : 1.15,
  }));
}

/**
 * Purchase a phone number and configure SMS webhook.
 */
export async function purchaseNumber(
  phoneNumber: string,
  tenantId: string,
  webhookBaseUrl: string
): Promise<ProvisionedNumber> {
  const client = getTwilioClient();
  const supabase = getSupabaseAdmin();

  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber,
    smsUrl: `${webhookBaseUrl}/api/twilio/sms/webhook`,
    smsMethod: 'POST',
    friendlyName: `Loomi - ${tenantId.slice(0, 8)}`,
  });

  const countryCode = phoneNumber.startsWith('+52') ? 'MX' : 'US';
  const monthlyPrice = countryCode === 'MX' ? 3.00 : 1.15;

  const { data, error } = await supabase
    .from('twilio_provisioned_numbers')
    .insert({
      tenant_id: tenantId,
      twilio_sid: purchased.sid,
      phone_number: purchased.phoneNumber,
      friendly_name: purchased.friendlyName,
      country_code: countryCode,
      status: 'active',
      monthly_cost: monthlyPrice,
      currency: 'USD',
    })
    .select()
    .single();

  if (error) throw new Error(`DB insert failed: ${error.message}`);

  return mapRow(data);
}

/**
 * Mock purchase for testing the UI flow without spending money.
 * Inserts a fake record in the DB but doesn't call Twilio.
 */
export async function mockPurchaseNumber(
  phoneNumber: string,
  tenantId: string
): Promise<ProvisionedNumber> {
  const supabase = getSupabaseAdmin();
  const countryCode = phoneNumber.startsWith('+52') ? 'MX' : 'US';
  const monthlyPrice = countryCode === 'MX' ? 3.00 : 1.15;

  const { data, error } = await supabase
    .from('twilio_provisioned_numbers')
    .insert({
      tenant_id: tenantId,
      twilio_sid: `MOCK_${Date.now()}`,
      phone_number: phoneNumber,
      friendly_name: `Mock - ${phoneNumber}`,
      country_code: countryCode,
      status: 'active',
      monthly_cost: monthlyPrice,
      currency: 'USD',
    })
    .select()
    .single();

  if (error) throw new Error(`DB insert failed: ${error.message}`);

  return mapRow(data);
}

/**
 * Release a number back to Twilio and mark as released.
 */
export async function releaseNumber(twilioSid: string, tenantId: string): Promise<void> {
  const client = getTwilioClient();
  const supabase = getSupabaseAdmin();

  await client.incomingPhoneNumbers(twilioSid).remove();

  await supabase
    .from('twilio_provisioned_numbers')
    .update({ status: 'released', released_at: new Date().toISOString() })
    .eq('twilio_sid', twilioSid)
    .eq('tenant_id', tenantId);
}

/**
 * List provisioned numbers for a tenant.
 */
export async function getProvisionedNumbers(tenantId: string): Promise<ProvisionedNumber[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('twilio_provisioned_numbers')
    .select('*')
    .eq('tenant_id', tenantId)
    .neq('status', 'released')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`DB query failed: ${error.message}`);

  return (data || []).map(mapRow);
}

/**
 * Store a verification code received via SMS webhook.
 * Code expires after 10 minutes.
 */
export async function updateVerificationCode(
  phoneNumber: string,
  code: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase
    .from('twilio_provisioned_numbers')
    .update({
      verification_code: code,
      verification_code_expires_at: expiresAt,
    })
    .eq('phone_number', phoneNumber)
    .in('status', ['active', 'pending_whatsapp']);
}

/**
 * Retrieve the captured verification code for a number.
 * Returns null if no code or expired.
 */
export async function getVerificationCode(
  numberId: string,
  tenantId: string
): Promise<{ code: string | null; expiresAt: string | null; expired: boolean }> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('twilio_provisioned_numbers')
    .select('verification_code, verification_code_expires_at')
    .eq('id', numberId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    return { code: null, expiresAt: null, expired: false };
  }

  const code = data.verification_code;
  const expiresAt = data.verification_code_expires_at;
  const expired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return {
    code: expired ? null : code,
    expiresAt,
    expired,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): ProvisionedNumber {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    twilioSid: row.twilio_sid,
    phoneNumber: row.phone_number,
    friendlyName: row.friendly_name,
    countryCode: row.country_code,
    status: row.status,
    whatsappAccountId: row.whatsapp_account_id,
    verificationCode: row.verification_code,
    verificationCodeExpiresAt: row.verification_code_expires_at,
    monthlyCost: row.monthly_cost,
    currency: row.currency || 'USD',
    purchasedAt: row.purchased_at,
    createdAt: row.created_at,
  };
}
