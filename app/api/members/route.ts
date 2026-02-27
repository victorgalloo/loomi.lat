import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabase } from '@/lib/memory/supabase';

/**
 * GET /api/members — List all members for the current tenant
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getSupabase();

    // Use service role to find caller's tenant (avoids RLS recursion issues)
    const { data: callerMembership } = await db
      .from('tenant_members')
      .select('tenant_id')
      .eq('email', user.email)
      .limit(1)
      .single();

    if (!callerMembership) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const { data: members, error } = await db
      .from('tenant_members')
      .select('id, tenant_id, email, role, invited_at, joined_at')
      .eq('tenant_id', callerMembership.tenant_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Members] Error listing members:', error);
      return NextResponse.json({ error: 'Failed to list members' }, { status: 500 });
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error('[Members] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/members — Invite a new member
 * Body: { email: string, role: 'admin' | 'member' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getSupabase();

    // Use service role to check caller's membership (avoids RLS recursion issues)
    const { data: callerMembership } = await db
      .from('tenant_members')
      .select('tenant_id, role')
      .eq('email', user.email)
      .limit(1)
      .single();

    if (!callerMembership) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const tenantId = callerMembership.tenant_id;
    const callerRole = callerMembership.role;

    // Only owner/admin can invite
    if (callerRole === 'member') {
      return NextResponse.json({ error: 'Solo owners y admins pueden invitar miembros' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate role
    const allowedRoles = ['admin', 'member'];
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Rol debe ser admin o member' }, { status: 400 });
    }

    // Only owners can invite admins
    if (role === 'admin' && callerRole !== 'owner') {
      return NextResponse.json({ error: 'Solo el owner puede invitar admins' }, { status: 403 });
    }

    // Check for duplicate
    const { data: existing } = await db
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Este email ya es miembro del equipo' }, { status: 409 });
    }

    // Check if email belongs to another tenant (as owner)
    const { data: otherTenant } = await db
      .from('tenants')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (otherTenant && otherTenant.id !== tenantId) {
      return NextResponse.json({ error: 'Este email ya tiene su propia cuenta de tenant' }, { status: 409 });
    }

    // Insert member
    const { data: member, error } = await db
      .from('tenant_members')
      .insert({
        tenant_id: tenantId,
        email: normalizedEmail,
        role,
        invited_by: tenantId,
        joined_at: null,
      })
      .select('id, tenant_id, email, role, invited_at, joined_at')
      .single();

    if (error) {
      console.error('[Members] Error inviting member:', error);
      return NextResponse.json({ error: 'Error al invitar miembro' }, { status: 500 });
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('[Members] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
