import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabase } from '@/lib/memory/supabase';

/**
 * DELETE /api/members/[id] — Remove a member
 */
export async function DELETE(
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

    // Only owner/admin can remove
    if (callerRole === 'member') {
      return NextResponse.json({ error: 'Solo owners y admins pueden remover miembros' }, { status: 403 });
    }

    // Get the member being removed
    const { data: target } = await db
      .from('tenant_members')
      .select('id, email, role, tenant_id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!target) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
    }

    // Cannot remove the last owner
    if (target.role === 'owner') {
      const { count } = await db
        .from('tenant_members')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('role', 'owner');

      if ((count ?? 0) <= 1) {
        return NextResponse.json({ error: 'No se puede eliminar al último owner' }, { status: 400 });
      }
    }

    // Admins cannot remove other admins or owners
    if (callerRole === 'admin' && (target.role === 'admin' || target.role === 'owner')) {
      return NextResponse.json({ error: 'Solo el owner puede remover admins' }, { status: 403 });
    }

    const { error } = await db
      .from('tenant_members')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('[Members] Error removing member:', error);
      return NextResponse.json({ error: 'Error al remover miembro' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Members] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/members/[id] — Change a member's role
 * Body: { role: 'admin' | 'member' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Only owner can change roles
    if (callerMembership.role !== 'owner') {
      return NextResponse.json({ error: 'Solo el owner puede cambiar roles' }, { status: 403 });
    }

    const body = await request.json();
    const { role } = body;

    const allowedRoles = ['admin', 'member'];
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Rol debe ser admin o member' }, { status: 400 });
    }

    // Get the target member
    const { data: target } = await db
      .from('tenant_members')
      .select('id, role, tenant_id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (!target) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
    }

    // Cannot change role of last owner
    if (target.role === 'owner') {
      const { count } = await db
        .from('tenant_members')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('role', 'owner');

      if ((count ?? 0) <= 1) {
        return NextResponse.json({ error: 'No se puede degradar al último owner' }, { status: 400 });
      }
    }

    const { data: updated, error } = await db
      .from('tenant_members')
      .update({ role })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, tenant_id, email, role, invited_at, joined_at')
      .single();

    if (error) {
      console.error('[Members] Error updating role:', error);
      return NextResponse.json({ error: 'Error al cambiar rol' }, { status: 500 });
    }

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error('[Members] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
