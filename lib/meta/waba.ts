/**
 * Meta WABA Management (Tech Provider API)
 * Wrapper over Meta Graph API v23.0 for programmatic WABA management
 */

const GRAPH_API_VERSION = 'v23.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const META_SYSTEM_USER_TOKEN = process.env.META_SYSTEM_USER_TOKEN;
const META_LOOMI_BUSINESS_ID = process.env.META_LOOMI_BUSINESS_ID;

// --- Interfaces ---

export interface MetaPhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating?: string;
}

export interface MetaWABA {
  id: string;
  name: string;
  currency?: string;
  timezone_id?: string;
  account_review_status?: string;
  phone_numbers?: {
    data: MetaPhoneNumber[];
  };
}

export interface CreateSolutionResult {
  id: string;
}

interface MetaListResponse<T> {
  data: T[];
  paging?: {
    cursors?: { before: string; after: string };
    next?: string;
  };
}

// --- Helpers ---

function getToken(): string {
  if (!META_SYSTEM_USER_TOKEN) {
    throw new Error('[Meta WABA] META_SYSTEM_USER_TOKEN is not configured');
  }
  return META_SYSTEM_USER_TOKEN;
}

function getLoomiBusinessId(): string {
  if (!META_LOOMI_BUSINESS_ID) {
    throw new Error('[Meta WABA] META_LOOMI_BUSINESS_ID is not configured');
  }
  return META_LOOMI_BUSINESS_ID;
}

async function metaFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Meta WABA] API error (${response.status}):`, error);
    throw new Error(`Meta API error ${response.status}: ${error}`);
  }

  return response.json();
}

// --- API Functions ---

/**
 * Create a multi-partner solution (tech provider partnership) with a client business
 */
export async function createSolution(
  clientBusinessId: string,
  solutionName: string
): Promise<CreateSolutionResult> {
  console.log(`[Meta WABA] Creating solution for business ${clientBusinessId}: ${solutionName}`);

  return metaFetch<CreateSolutionResult>(
    `${GRAPH_API_BASE}/${clientBusinessId}/whatsapp_business_solutions`,
    {
      method: 'POST',
      body: JSON.stringify({
        solution_name: solutionName,
        partner_business_id: getLoomiBusinessId(),
      }),
    }
  );
}

/**
 * List WABAs of a client business (visible through tech provider relationship)
 */
export async function listClientWABAs(
  clientBusinessId: string
): Promise<MetaWABA[]> {
  console.log(`[Meta WABA] Listing client WABAs for business ${clientBusinessId}`);

  const result = await metaFetch<MetaListResponse<MetaWABA>>(
    `${GRAPH_API_BASE}/${clientBusinessId}/client_whatsapp_business_accounts?fields=id,name,currency,timezone_id,account_review_status`
  );

  return result.data || [];
}

/**
 * List WABAs owned by Loomi's business
 */
export async function listOwnedWABAs(
  businessId?: string
): Promise<MetaWABA[]> {
  const bid = businessId || getLoomiBusinessId();
  console.log(`[Meta WABA] Listing owned WABAs for business ${bid}`);

  const result = await metaFetch<MetaListResponse<MetaWABA>>(
    `${GRAPH_API_BASE}/${bid}/owned_whatsapp_business_accounts?fields=id,name,currency,timezone_id,account_review_status`
  );

  return result.data || [];
}

/**
 * Register a pre-verified phone number for a client business
 */
export async function addPreverifiedNumber(
  clientBusinessId: string,
  phoneNumber: string
): Promise<{ id: string }> {
  console.log(`[Meta WABA] Adding pre-verified number ${phoneNumber} to business ${clientBusinessId}`);

  return metaFetch<{ id: string }>(
    `${GRAPH_API_BASE}/${clientBusinessId}/preverified_numbers`,
    {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        partner_business_id: getLoomiBusinessId(),
      }),
    }
  );
}

/**
 * Share a phone number with a partner business
 */
export async function sharePhoneNumber(
  phoneNumberId: string,
  preverifiedId: string,
  partnerBusinessId?: string
): Promise<{ success: boolean }> {
  const partnerId = partnerBusinessId || getLoomiBusinessId();
  console.log(`[Meta WABA] Sharing phone ${phoneNumberId} with partner ${partnerId}`);

  return metaFetch<{ success: boolean }>(
    `${GRAPH_API_BASE}/${phoneNumberId}/share`,
    {
      method: 'POST',
      body: JSON.stringify({
        preverified_id: preverifiedId,
        partner_business_id: partnerId,
      }),
    }
  );
}

/**
 * Get detailed information about a specific WABA, including phone numbers
 */
export async function getWABADetails(wabaId: string): Promise<MetaWABA> {
  console.log(`[Meta WABA] Getting details for WABA ${wabaId}`);

  return metaFetch<MetaWABA>(
    `${GRAPH_API_BASE}/${wabaId}?fields=id,name,currency,timezone_id,account_review_status,phone_numbers{id,display_phone_number,verified_name,quality_rating}`
  );
}
