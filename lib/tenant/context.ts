/**
 * Tenant Context Utilities
 * Provides functions for multi-tenant data access and configuration
 */

import { getSupabase } from '@/lib/memory/supabase';
import { decryptAccessToken } from '@/lib/crypto';

// Types for tenant data
export interface Tenant {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  metaBusinessId: string | null;
  subscriptionTier: 'starter' | 'growth' | 'pro' | 'enterprise';
  subscriptionStatus: 'pending' | 'active' | 'past_due' | 'canceled';
  settings: Record<string, unknown>;
  createdAt: Date;
}

export interface WhatsAppAccount {
  id: string;
  tenantId: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string | null;
  businessName: string | null;
  status: 'pending' | 'active' | 'inactive' | 'error';
  connectedAt: Date;
}

export interface TenantCredentials {
  phoneNumberId: string;
  accessToken: string;
  tenantId: string;
}

export interface FewShotExample {
  id: string;
  tags: string[];
  context: string;
  conversation: string;
  whyItWorked: string;
}

export interface AgentConfig {
  id: string;
  tenantId: string;
  businessName: string | null;
  businessDescription: string | null;
  productsServices: string | null;
  tone: 'professional' | 'friendly' | 'casual' | 'formal';
  customInstructions: string | null;
  businessHours: Record<string, unknown>;
  autoReplyEnabled: boolean;
  greetingMessage: string | null;
  fallbackMessage: string | null;
  // Custom prompt fields for multi-tenant personalization
  systemPrompt: string | null;
  fewShotExamples: FewShotExample[];
  productsCatalog: Record<string, unknown>;
  // Model override per tenant (e.g. 'gpt-4o', 'gpt-5.2')
  model: string | null;
  // Configurable tenant context fields
  productContext: string | null;
  pricingContext: string | null;
  salesProcessContext: string | null;
  qualificationContext: string | null;
  competitorContext: string | null;
  objectionHandlers: Record<string, string>;
  analysisEnabled: boolean;
  maxResponseTokens: number;
  temperature: number;
  agentName: string | null;
  agentRole: string | null;
}

// Cache for tenant lookups (phone_number_id -> tenant_id)
const tenantCache = new Map<string, { tenantId: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get tenant by phone_number_id from WhatsApp webhook
 * Uses caching to reduce database lookups
 */
export async function getTenantFromPhoneNumberId(
  phoneNumberId: string
): Promise<{ tenantId: string; accessToken: string } | null> {
  const supabase = getSupabase();

  // Check cache first
  const cached = tenantCache.get(phoneNumberId);
  if (cached && cached.expiresAt > Date.now()) {
    // Still need to get the access token from DB (not cached for security)
    const { data } = await supabase
      .from('whatsapp_accounts')
      .select('access_token_encrypted')
      .eq('phone_number_id', phoneNumberId)
      .eq('status', 'active')
      .single();

    if (data?.access_token_encrypted) {
      return {
        tenantId: cached.tenantId,
        accessToken: decryptAccessToken(data.access_token_encrypted)
      };
    }
    return null;
  }

  // Query database
  const { data, error } = await supabase
    .from('whatsapp_accounts')
    .select('tenant_id, access_token_encrypted')
    .eq('phone_number_id', phoneNumberId)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    console.log(`[Tenant] No active WhatsApp account found for phone_number_id: ${phoneNumberId}`);
    return null;
  }

  // Update cache
  tenantCache.set(phoneNumberId, {
    tenantId: data.tenant_id,
    expiresAt: Date.now() + CACHE_TTL_MS
  });

  return {
    tenantId: data.tenant_id,
    accessToken: decryptAccessToken(data.access_token_encrypted)
  };
}

/**
 * Get tenant credentials for sending messages
 * When multiple numbers exist, returns the first active one unless a specific phoneNumberId is provided
 */
export async function getTenantCredentials(
  tenantId: string,
  phoneNumberId?: string
): Promise<TenantCredentials | null> {
  const supabase = getSupabase();

  let query = supabase
    .from('whatsapp_accounts')
    .select('phone_number_id, access_token_encrypted')
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  if (phoneNumberId) {
    query = query.eq('phone_number_id', phoneNumberId);
  }

  const { data, error } = await query.limit(1);

  if (error || !data || data.length === 0) {
    console.error(`[Tenant] No active WhatsApp account for tenant: ${tenantId}`);
    return null;
  }

  return {
    phoneNumberId: data[0].phone_number_id,
    accessToken: decryptAccessToken(data[0].access_token_encrypted),
    tenantId
  };
}

/**
 * Get agent configuration for a tenant
 */
export async function getAgentConfig(tenantId: string): Promise<AgentConfig | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    // Return default config if none exists
    return {
      id: '',
      tenantId,
      businessName: null,
      businessDescription: null,
      productsServices: null,
      tone: 'professional',
      customInstructions: null,
      businessHours: {},
      autoReplyEnabled: true,
      greetingMessage: null,
      fallbackMessage: null,
      systemPrompt: null,
      fewShotExamples: [],
      productsCatalog: {},
      model: null,
      productContext: null,
      pricingContext: null,
      salesProcessContext: null,
      qualificationContext: null,
      competitorContext: null,
      objectionHandlers: {},
      analysisEnabled: true,
      maxResponseTokens: 500,
      temperature: 0.7,
      agentName: null,
      agentRole: null,
    };
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    businessName: data.business_name,
    businessDescription: data.business_description,
    productsServices: data.products_services,
    tone: data.tone,
    customInstructions: data.custom_instructions,
    businessHours: data.business_hours,
    autoReplyEnabled: data.auto_reply_enabled,
    greetingMessage: data.greeting_message,
    fallbackMessage: data.fallback_message,
    systemPrompt: data.system_prompt || null,
    fewShotExamples: data.few_shot_examples || [],
    productsCatalog: data.products_catalog || {},
    model: data.model || null,
    productContext: data.product_context || null,
    pricingContext: data.pricing_context || null,
    salesProcessContext: data.sales_process_context || null,
    qualificationContext: data.qualification_context || null,
    competitorContext: data.competitor_context || null,
    objectionHandlers: data.objection_handlers || {},
    analysisEnabled: data.analysis_enabled ?? true,
    maxResponseTokens: data.max_response_tokens ?? 500,
    temperature: data.temperature != null ? Number(data.temperature) : 0.7,
    agentName: data.agent_name || null,
    agentRole: data.agent_role || null,
  };
}

/**
 * Get tenant by ID
 */
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    companyName: data.company_name,
    metaBusinessId: data.meta_business_id || null,
    subscriptionTier: data.subscription_tier,
    subscriptionStatus: data.subscription_status,
    settings: data.settings,
    createdAt: new Date(data.created_at)
  };
}

/**
 * Get tenant by email (for dashboard authentication)
 */
export async function getTenantByEmail(email: string): Promise<Tenant | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    companyName: data.company_name,
    metaBusinessId: data.meta_business_id || null,
    subscriptionTier: data.subscription_tier,
    subscriptionStatus: data.subscription_status,
    settings: data.settings,
    createdAt: new Date(data.created_at)
  };
}

/**
 * Get or create tenant by email
 */
export async function getOrCreateTenant(
  email: string,
  name?: string,
  companyName?: string
): Promise<Tenant> {
  const supabase = getSupabase();

  // Try to get existing tenant first
  let tenant = await getTenantByEmail(email);
  if (tenant) {
    return tenant;
  }

  // Create new tenant
  const { data, error } = await supabase
    .from('tenants')
    .insert({
      email,
      name: name || email,
      company_name: companyName
    })
    .select()
    .single();

  if (error) {
    console.error('[Tenant] Error creating tenant:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    companyName: data.company_name,
    metaBusinessId: data.meta_business_id || null,
    subscriptionTier: data.subscription_tier,
    subscriptionStatus: data.subscription_status,
    settings: data.settings,
    createdAt: new Date(data.created_at)
  };
}

/**
 * Get all WhatsApp accounts for a tenant
 */
export async function getWhatsAppAccounts(tenantId: string): Promise<WhatsAppAccount[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('whatsapp_accounts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('connected_at', { ascending: false });

  if (error || !data || data.length === 0) {
    return [];
  }

  return data.map(d => ({
    id: d.id,
    tenantId: d.tenant_id,
    wabaId: d.waba_id,
    phoneNumberId: d.phone_number_id,
    displayPhoneNumber: d.display_phone_number,
    businessName: d.business_name,
    status: d.status,
    connectedAt: new Date(d.connected_at)
  }));
}

/**
 * Update agent configuration
 */
export async function updateAgentConfig(
  tenantId: string,
  config: Partial<Omit<AgentConfig, 'id' | 'tenantId'>>
): Promise<AgentConfig> {
  const supabase = getSupabase();

  const updateData: Record<string, unknown> = {};
  if (config.businessName !== undefined) updateData.business_name = config.businessName;
  if (config.businessDescription !== undefined) updateData.business_description = config.businessDescription;
  if (config.productsServices !== undefined) updateData.products_services = config.productsServices;
  if (config.tone !== undefined) updateData.tone = config.tone;
  if (config.customInstructions !== undefined) updateData.custom_instructions = config.customInstructions;
  if (config.businessHours !== undefined) updateData.business_hours = config.businessHours;
  if (config.autoReplyEnabled !== undefined) updateData.auto_reply_enabled = config.autoReplyEnabled;
  if (config.greetingMessage !== undefined) updateData.greeting_message = config.greetingMessage;
  if (config.fallbackMessage !== undefined) updateData.fallback_message = config.fallbackMessage;
  if (config.systemPrompt !== undefined) updateData.system_prompt = config.systemPrompt;
  if (config.fewShotExamples !== undefined) updateData.few_shot_examples = config.fewShotExamples;
  if (config.productsCatalog !== undefined) updateData.products_catalog = config.productsCatalog;
  if (config.model !== undefined) updateData.model = config.model;
  if (config.productContext !== undefined) updateData.product_context = config.productContext;
  if (config.pricingContext !== undefined) updateData.pricing_context = config.pricingContext;
  if (config.salesProcessContext !== undefined) updateData.sales_process_context = config.salesProcessContext;
  if (config.qualificationContext !== undefined) updateData.qualification_context = config.qualificationContext;
  if (config.competitorContext !== undefined) updateData.competitor_context = config.competitorContext;
  if (config.objectionHandlers !== undefined) updateData.objection_handlers = config.objectionHandlers;
  if (config.analysisEnabled !== undefined) updateData.analysis_enabled = config.analysisEnabled;
  if (config.maxResponseTokens !== undefined) updateData.max_response_tokens = config.maxResponseTokens;
  if (config.temperature !== undefined) updateData.temperature = config.temperature;
  if (config.agentName !== undefined) updateData.agent_name = config.agentName;
  if (config.agentRole !== undefined) updateData.agent_role = config.agentRole;

  // Upsert: create if not exists, update if exists
  const { data, error } = await supabase
    .from('agent_configs')
    .upsert({
      tenant_id: tenantId,
      ...updateData
    }, {
      onConflict: 'tenant_id'
    })
    .select()
    .single();

  if (error) {
    console.error('[Tenant] Error updating agent config:', error);
    throw error;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    businessName: data.business_name,
    businessDescription: data.business_description,
    productsServices: data.products_services,
    tone: data.tone,
    customInstructions: data.custom_instructions,
    businessHours: data.business_hours,
    autoReplyEnabled: data.auto_reply_enabled,
    greetingMessage: data.greeting_message,
    fallbackMessage: data.fallback_message,
    systemPrompt: data.system_prompt || null,
    fewShotExamples: data.few_shot_examples || [],
    productsCatalog: data.products_catalog || {},
    model: data.model || null,
    productContext: data.product_context || null,
    pricingContext: data.pricing_context || null,
    salesProcessContext: data.sales_process_context || null,
    qualificationContext: data.qualification_context || null,
    competitorContext: data.competitor_context || null,
    objectionHandlers: data.objection_handlers || {},
    analysisEnabled: data.analysis_enabled ?? true,
    maxResponseTokens: data.max_response_tokens ?? 500,
    temperature: data.temperature != null ? Number(data.temperature) : 0.7,
    agentName: data.agent_name || null,
    agentRole: data.agent_role || null,
  };
}

/**
 * Clear tenant cache (useful after updates)
 */
export function clearTenantCache(phoneNumberId?: string): void {
  if (phoneNumberId) {
    tenantCache.delete(phoneNumberId);
  } else {
    tenantCache.clear();
  }
}

/**
 * Check if a subscription is active
 */
export function isSubscriptionActive(tenant: Tenant): boolean {
  return tenant.subscriptionStatus === 'active';
}

/**
 * Get subscription limits based on tier
 */
export function getSubscriptionLimits(tier: Tenant['subscriptionTier']): {
  dailyMessages: number;
  monthlyMessages: number;
  features: string[];
} {
  const limits = {
    starter: {
      dailyMessages: 100,
      monthlyMessages: 3000,
      features: ['Basic AI responses', 'WhatsApp integration', 'Dashboard']
    },
    growth: {
      dailyMessages: 300,
      monthlyMessages: 9000,
      features: ['All Starter features', 'Priority support', 'Custom greeting']
    },
    pro: {
      dailyMessages: 1000,
      monthlyMessages: 30000,
      features: ['All Growth features', 'API access', 'Advanced analytics', 'Multiple agents']
    },
    enterprise: {
      dailyMessages: -1, // unlimited
      monthlyMessages: -1,
      features: ['All Pro features', 'Dedicated support', 'Custom integrations', 'SLA']
    }
  };

  return limits[tier];
}
