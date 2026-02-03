import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lead, LeadStage, Appointment, FollowUpRecord, FollowUpType, FollowUpContext } from '../types';

let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    supabaseClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseClient;
}

// Lead operations
export async function getLeadById(leadId: string): Promise<Lead | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error) {
    console.error('Error fetching lead:', error);
    return null;
  }
  return data;
}

export async function getLeadByPhone(phone: string): Promise<Lead | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching lead by phone:', error);
    return null;
  }
  return data;
}

export async function updateLeadStage(
  leadId: string,
  stage: LeadStage
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('leads')
    .update({ stage, last_interaction: new Date().toISOString() })
    .eq('id', leadId);

  if (error) {
    console.error('Error updating lead stage:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updateLead(
  leadId: string,
  updates: Partial<Lead>
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('leads')
    .update({ ...updates, last_interaction: new Date().toISOString() })
    .eq('id', leadId);

  if (error) {
    console.error('Error updating lead:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Message operations
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  leadId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving message:', error);
    return { success: false, error: error.message };
  }

  // Update lead last_interaction if provided
  if (leadId) {
    await supabase
      .from('leads')
      .update({ last_interaction: new Date().toISOString() })
      .eq('id', leadId);
  }

  return { success: true, messageId: data.id };
}

export async function getRecentMessages(
  conversationId: string,
  limit: number = 20
): Promise<Array<{ role: string; content: string; created_at: string }>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return data?.reverse() || [];
}

// Appointment operations
export async function createAppointment(
  leadId: string,
  scheduledAt: string,
  eventId?: string
): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      lead_id: leadId,
      scheduled_at: scheduledAt,
      event_id: eventId,
      status: 'scheduled',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating appointment:', error);
    return { success: false, error: error.message };
  }
  return { success: true, appointmentId: data.id };
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

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching appointment:', error);
    return null;
  }
  return data;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId);

  if (error) {
    console.error('Error updating appointment status:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Memory operations
export async function getLeadMemory(leadId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('lead_memory')
    .select('memory')
    .eq('lead_id', leadId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching lead memory:', error);
    return null;
  }
  return data?.memory || null;
}

export async function saveLeadMemory(
  leadId: string,
  memory: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('lead_memory')
    .upsert(
      {
        lead_id: leadId,
        memory,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'lead_id' }
    );

  if (error) {
    console.error('Error saving lead memory:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// Follow-up operations (for legacy compatibility during migration)
export async function createFollowUp(params: {
  leadId: string;
  appointmentId?: string;
  scheduledFor: string;
  type: FollowUpType;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; followUpId?: string; error?: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('follow_ups')
    .insert({
      lead_id: params.leadId,
      appointment_id: params.appointmentId,
      scheduled_for: params.scheduledFor,
      type: params.type,
      message: params.message,
      status: 'pending',
      attempt: 1,
      metadata: params.metadata,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating follow-up:', error);
    return { success: false, error: error.message };
  }
  return { success: true, followUpId: data.id };
}

export async function markFollowUpSent(
  followUpId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('follow_ups')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', followUpId);

  if (error) {
    console.error('Error marking follow-up sent:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function cancelFollowUps(
  leadId: string,
  types?: FollowUpType[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  let query = supabase
    .from('follow_ups')
    .update({ status: 'cancelled' })
    .eq('lead_id', leadId)
    .eq('status', 'pending');

  if (types && types.length > 0) {
    query = query.in('type', types);
  }

  const { error } = await query;

  if (error) {
    console.error('Error cancelling follow-ups:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getPendingFollowUps(
  windowMinutes: number = 5
): Promise<FollowUpRecord[]> {
  const supabase = getSupabase();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);

  const { data, error } = await supabase
    .from('follow_ups')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', windowEnd.toISOString())
    .order('scheduled_for', { ascending: true });

  if (error) {
    console.error('Error fetching pending follow-ups:', error);
    return [];
  }
  return data || [];
}

// Cold leads for re-engagement
export async function getColdLeads(
  hoursInactive: number = 24,
  limit: number = 50
): Promise<Lead[]> {
  const supabase = getSupabase();
  const cutoffDate = new Date(Date.now() - hoursInactive * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .lt('last_interaction', cutoffDate.toISOString())
    .not('stage', 'in', '("won","lost")')
    .order('last_interaction', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching cold leads:', error);
    return [];
  }
  return data || [];
}

// Activity exports for Temporal
export const supabaseActivities = {
  getLeadById,
  getLeadByPhone,
  updateLeadStage,
  updateLead,
  saveMessage,
  getRecentMessages,
  createAppointment,
  getActiveAppointment,
  updateAppointmentStatus,
  getLeadMemory,
  saveLeadMemory,
  createFollowUp,
  markFollowUpSent,
  cancelFollowUps,
  getPendingFollowUps,
  getColdLeads,
};
