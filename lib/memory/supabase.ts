/**
 * Supabase Database Operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lead, Conversation, Message, Appointment } from '@/types';
import { trackLeadQualified } from '@/lib/integrations/meta-conversions';

// Singleton pattern for Supabase client
let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

// ============================================
// Lead Operations
// ============================================

export async function getLeadByPhone(phone: string): Promise<Lead | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    phone: data.phone,
    name: data.name,
    email: data.email,
    company: data.company,
    industry: data.industry,
    stage: data.stage,
    createdAt: new Date(data.created_at),
    lastInteraction: new Date(data.last_interaction)
  };
}

/**
 * Get lead by phone and tenant_id (multi-tenant)
 */
export async function getLeadByPhoneAndTenant(phone: string, tenantId: string): Promise<Lead | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', phone)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    phone: data.phone,
    name: data.name,
    email: data.email,
    company: data.company,
    industry: data.industry,
    stage: data.stage,
    createdAt: new Date(data.created_at),
    lastInteraction: new Date(data.last_interaction)
  };
}

export async function getLeadById(leadId: string): Promise<Lead | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    phone: data.phone,
    name: data.name,
    email: data.email,
    company: data.company,
    industry: data.industry,
    stage: data.stage,
    createdAt: new Date(data.created_at),
    lastInteraction: new Date(data.last_interaction)
  };
}

export async function createLead(
  phone: string,
  name: string = 'Usuario',
  options?: { isTest?: boolean; tenantId?: string }
): Promise<Lead> {
  const supabase = getSupabase();

  const insertData: Record<string, unknown> = {
    phone,
    name,
    stage: options?.tenantId ? 'Lead' : 'initial', // Use CRM stage for multi-tenant
    is_test: options?.isTest ?? false
  };

  // Add tenant_id for multi-tenant leads
  if (options?.tenantId) {
    insertData.tenant_id = options.tenantId;
  }

  const { data, error } = await supabase
    .from('leads')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    throw error;
  }

  return {
    id: data.id,
    phone: data.phone,
    name: data.name,
    email: data.email,
    company: data.company,
    industry: data.industry,
    stage: data.stage,
    createdAt: new Date(data.created_at),
    lastInteraction: new Date(data.last_interaction)
  };
}

export async function updateLead(
  phone: string,
  updates: Partial<Pick<Lead, 'name' | 'email' | 'company' | 'industry' | 'stage'>>
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('phone', phone);

  if (error) {
    console.error('Error updating lead:', error);
  }
}

export async function updateLeadStage(phone: string, stage: string): Promise<void> {
  await updateLead(phone, { stage });
}

export async function updateLeadIndustry(phone: string, industry: string): Promise<void> {
  await updateLead(phone, { industry });
}

/**
 * Save lead qualification data from WhatsApp Flow
 */
export async function saveLeadQualification(
  phone: string,
  qualification: {
    challenge: string;
    messageVolume: string;
    industry: string;
  }
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('leads')
    .update({
      challenge: qualification.challenge,
      message_volume: qualification.messageVolume,
      industry: qualification.industry,
      is_qualified: true,
      stage: 'Lead',
      last_interaction: new Date().toISOString(),
    })
    .eq('phone', phone);

  if (error) {
    console.error('[Supabase] Error saving qualification:', error.message);
    throw error;
  }

  console.log(`[Supabase] Lead ${phone} qualified with:`, qualification);

  // Track conversion event for Meta (non-blocking)
  trackLeadQualified({ phone }).catch((err) => {
    console.error('[Meta] Failed to track lead qualified:', err);
  });
}

// ============================================
// Conversation Operations
// ============================================

export async function getActiveConversation(leadId: string): Promise<Conversation | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('lead_id', leadId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    leadId: data.lead_id,
    startedAt: new Date(data.started_at),
    endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
    summary: data.summary
  };
}

export async function createConversation(leadId: string): Promise<Conversation> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('conversations')
    .insert({ lead_id: leadId })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }

  return {
    id: data.id,
    leadId: data.lead_id,
    startedAt: new Date(data.started_at),
    summary: data.summary
  };
}

export async function endConversation(conversationId: string, summary?: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('conversations')
    .update({
      ended_at: new Date().toISOString(),
      summary
    })
    .eq('id', conversationId);

  if (error) {
    console.error('Error ending conversation:', error);
  }
}

// ============================================
// Message Operations
// ============================================

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  leadId?: string
): Promise<string> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving message:', error);
    throw error;
  }

  // Update last_interaction is handled by trigger, but we can also do it explicitly
  if (leadId) {
    await supabase
      .from('leads')
      .update({ last_interaction: new Date().toISOString() })
      .eq('id', leadId);
  }

  return data.id;
}

export async function getRecentMessages(
  conversationId: string,
  limit: number = 20
): Promise<Message[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  return data.map(m => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    timestamp: new Date(m.created_at)
  }));
}

// ============================================
// Memory Operations
// ============================================

export async function getLeadMemory(leadId: string): Promise<string | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('lead_memory')
    .select('memory')
    .eq('lead_id', leadId)
    .single();

  if (error || !data) return null;

  return data.memory;
}

export async function saveLeadMemory(leadId: string, memory: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('lead_memory')
    .upsert({
      lead_id: leadId,
      memory,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'lead_id'
    });

  if (error) {
    console.error('Error saving memory:', error);
  }
}

// ============================================
// Appointment Operations
// ============================================

export async function createAppointment(
  leadId: string,
  scheduledAt: Date,
  eventId?: string
): Promise<Appointment> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      lead_id: leadId,
      scheduled_at: scheduledAt.toISOString(),
      event_id: eventId,
      status: 'scheduled'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }

  return {
    id: data.id,
    scheduledAt: new Date(data.scheduled_at),
    eventId: data.event_id
  };
}

export async function getActiveAppointment(leadId: string): Promise<Appointment | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('lead_id', leadId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    scheduledAt: new Date(data.scheduled_at),
    eventId: data.event_id
  };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId);

  if (error) {
    console.error('Error updating appointment:', error);
  }
}

// ============================================
// Cold Leads Query (for re-engagement cron)
// ============================================

export async function getColdLeads(hoursInactive: number = 48, limit: number = 50): Promise<Lead[]> {
  const supabase = getSupabase();

  const cutoffDate = new Date(Date.now() - hoursInactive * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .lt('last_interaction', cutoffDate.toISOString())
    .not('stage', 'in', '("Demo Agendada","Ganado")')
    .order('last_interaction', { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  return data.map(lead => ({
    id: lead.id,
    phone: lead.phone,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    industry: lead.industry,
    stage: lead.stage,
    createdAt: new Date(lead.created_at),
    lastInteraction: new Date(lead.last_interaction)
  }));
}

// ============================================
// Stats/Analytics
// ============================================

export async function getConversationCount(leadId: string): Promise<number> {
  const supabase = getSupabase();

  const { count, error } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('lead_id', leadId);

  if (error) return 0;
  return count || 0;
}

export async function getFirstInteractionDate(leadId: string): Promise<Date | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('leads')
    .select('created_at')
    .eq('id', leadId)
    .single();

  if (error || !data) return null;
  return new Date(data.created_at);
}

// ============================================
// Test Data Management
// ============================================

/**
 * Reset test data for a specific phone number
 * Deletes lead, conversations, and messages
 */
export async function resetTestLead(phone: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  try {
    // Get the lead
    const { data: lead } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .eq('is_test', true)
      .single();

    if (!lead) {
      return { success: false, error: 'Test lead not found' };
    }

    // Delete messages from all conversations
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', lead.id);

    if (conversations && conversations.length > 0) {
      const convIds = conversations.map(c => c.id);
      await supabase.from('messages').delete().in('conversation_id', convIds);
      await supabase.from('conversations').delete().eq('lead_id', lead.id);
    }

    // Delete lead memory
    await supabase.from('lead_memory').delete().eq('lead_id', lead.id);

    // Delete the lead
    await supabase.from('leads').delete().eq('id', lead.id);

    console.log(`[DB] Reset test lead: ${phone}`);
    return { success: true };

  } catch (error) {
    console.error('[DB] Error resetting test lead:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Reset ALL test data (all leads with is_test=true)
 */
export async function resetAllTestData(): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = getSupabase();

  try {
    // Call the SQL function we created
    const { error } = await supabase.rpc('reset_test_data');

    if (error) {
      throw error;
    }

    console.log('[DB] All test data reset');
    return { success: true, count: 0 };

  } catch (error) {
    console.error('[DB] Error resetting all test data:', error);
    return { success: false, count: 0, error: String(error) };
  }
}
