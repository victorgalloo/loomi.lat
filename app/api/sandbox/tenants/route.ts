/**
 * GET /api/sandbox/tenants
 * Returns list of available tenants with their agent configs for the sandbox selector
 * Public endpoint - no authentication required
 */

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/memory/supabase';

export interface SandboxTenant {
  id: string;
  name: string;
  companyName: string | null;
  businessName: string | null;
  tone: string;
}

export async function GET() {
  try {
    const supabase = getSupabase();

    // Get all active tenants with their agent configs
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select(`
        id,
        name,
        company_name,
        subscription_status
      `)
      .eq('subscription_status', 'active')
      .order('created_at', { ascending: false });

    if (tenantsError) {
      console.error('[Sandbox] Error fetching tenants:', tenantsError);
      return NextResponse.json(
        { error: 'Failed to fetch tenants' },
        { status: 500 }
      );
    }

    // Get agent configs for each tenant
    const tenantIds = tenants?.map(t => t.id) || [];

    const { data: configs, error: configsError } = await supabase
      .from('agent_configs')
      .select('tenant_id, business_name, tone')
      .in('tenant_id', tenantIds);

    if (configsError) {
      console.error('[Sandbox] Error fetching configs:', configsError);
    }

    // Map configs by tenant_id
    const configMap = new Map(
      configs?.map(c => [c.tenant_id, c]) || []
    );

    // Build response
    const result: SandboxTenant[] = (tenants || []).map(t => ({
      id: t.id,
      name: t.name,
      companyName: t.company_name,
      businessName: configMap.get(t.id)?.business_name || null,
      tone: configMap.get(t.id)?.tone || 'professional'
    }));

    // Add a default "Demo" option for when no tenants exist
    if (result.length === 0) {
      result.push({
        id: 'demo',
        name: 'Sofi (Seguros)',
        companyName: 'NetBrokrs',
        businessName: 'NetBrokrs Seguros',
        tone: 'friendly'
      });
    }

    return NextResponse.json({ tenants: result });
  } catch (error) {
    console.error('[Sandbox] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
