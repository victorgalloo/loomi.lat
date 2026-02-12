import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';

export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    if (!body.name || !body.phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // Create lead
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: body.name,
        phone: body.phone,
        company_name: body.company_name || null,
        contact_email: body.contact_email || null,
        deal_value: body.deal_value || null,
        stage: body.stage || 'Cold',
        priority: body.priority || 'medium',
        tenant_id: tenantId,
        is_test: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Get leads for tenant
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
