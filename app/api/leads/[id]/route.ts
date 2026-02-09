import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import { trackCustomerWon } from '@/lib/integrations/meta-conversions';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant ID for user
    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const body = await request.json();

    // Get current lead to check ownership and current stage
    const { data: currentLead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !currentLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (body.stage !== undefined) updates.stage = body.stage;
    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.company_name !== undefined) updates.company_name = body.company_name;
    if (body.contact_email !== undefined) updates.contact_email = body.contact_email;
    if (body.deal_value !== undefined) updates.deal_value = body.deal_value;
    if (body.priority !== undefined) updates.priority = body.priority;

    // Update lead
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Track Meta conversion when moved to "Ganado"
    if (body.stage === 'Ganado' && currentLead.stage !== 'Ganado') {
      try {
        await trackCustomerWon({
          phone: currentLead.phone,
          leadId: currentLead.id,
          email: currentLead.contact_email,
          name: currentLead.name,
          value: currentLead.deal_value || 0,
          currency: 'MXN'
        });
      } catch (err) {
        console.error('[Meta] Failed to track customer won:', err);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/leads/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    // Delete related messages first
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', id)
      .eq('tenant_id', tenantId);

    if (conversations && conversations.length > 0) {
      const convIds = conversations.map(c => c.id);
      await supabase.from('messages').delete().in('conversation_id', convIds);
      await supabase.from('conversations').delete().in('id', convIds);
    }

    // Delete appointments
    await supabase.from('appointments').delete().eq('lead_id', id);

    // Delete the lead (verify tenant ownership)
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error deleting lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/leads/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant ID for user
    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    // Get lead
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/leads/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
