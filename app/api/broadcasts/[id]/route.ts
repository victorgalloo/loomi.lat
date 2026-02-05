import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await getTenantIdForUser(user.email);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('broadcast_campaigns')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from('broadcast_recipients')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: true });

    if (recipientsError) {
      return NextResponse.json({ error: recipientsError.message }, { status: 500 });
    }

    return NextResponse.json({ ...campaign, recipients: recipients || [] });
  } catch (error) {
    console.error('Error in GET /api/broadcasts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
