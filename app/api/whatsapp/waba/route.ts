/**
 * WABA Management API (Tech Provider)
 * GET  /api/whatsapp/waba — List client WABAs
 * POST /api/whatsapp/waba — Create solution, add number, share number, sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantByEmail } from '@/lib/tenant/context';
import { getSupabase } from '@/lib/memory/supabase';
import {
  listClientWABAs,
  createSolution,
  addPreverifiedNumber,
  sharePhoneNumber,
  getWABADetails,
} from '@/lib/meta/waba';

/**
 * GET — List WABAs for the current tenant
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantByEmail(user.email);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (!tenant.metaBusinessId) {
      return NextResponse.json({ error: 'No Meta Business ID configured for this tenant' }, { status: 400 });
    }

    const wabas = await listClientWABAs(tenant.metaBusinessId);

    return NextResponse.json({ wabas });
  } catch (error) {
    console.error('[API WABA] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST — WABA management actions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantByEmail(user.email);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (!tenant.metaBusinessId) {
      return NextResponse.json({ error: 'No Meta Business ID configured for this tenant' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create_solution': {
        const { solution_name } = body;
        if (!solution_name) {
          return NextResponse.json({ error: 'solution_name is required' }, { status: 400 });
        }
        const result = await createSolution(tenant.metaBusinessId, solution_name);
        return NextResponse.json({ success: true, solution: result });
      }

      case 'add_number': {
        const { phone_number } = body;
        if (!phone_number) {
          return NextResponse.json({ error: 'phone_number is required' }, { status: 400 });
        }
        const result = await addPreverifiedNumber(tenant.metaBusinessId, phone_number);
        return NextResponse.json({ success: true, preverified: result });
      }

      case 'share_number': {
        const { phone_number_id, preverified_id } = body;
        if (!phone_number_id || !preverified_id) {
          return NextResponse.json({ error: 'phone_number_id and preverified_id are required' }, { status: 400 });
        }
        const result = await sharePhoneNumber(phone_number_id, preverified_id);
        return NextResponse.json({ success: true, result });
      }

      case 'sync': {
        const wabas = await listClientWABAs(tenant.metaBusinessId);
        const adminSupabase = getSupabase();

        // Update account_review_status for each known WABA
        for (const waba of wabas) {
          if (waba.account_review_status) {
            await adminSupabase
              .from('whatsapp_accounts')
              .update({ account_review_status: waba.account_review_status })
              .eq('waba_id', waba.id)
              .eq('tenant_id', tenant.id);
          }

          // Fetch phone numbers for each WABA and update details
          try {
            const details = await getWABADetails(waba.id);
            if (details.phone_numbers?.data) {
              for (const phone of details.phone_numbers.data) {
                await adminSupabase
                  .from('whatsapp_accounts')
                  .update({
                    display_phone_number: phone.display_phone_number,
                    business_name: phone.verified_name,
                  })
                  .eq('phone_number_id', phone.id)
                  .eq('tenant_id', tenant.id);
              }
            }
          } catch (e) {
            console.warn(`[API WABA] Could not fetch details for WABA ${waba.id}:`, e);
          }
        }

        return NextResponse.json({ success: true, wabas });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[API WABA] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
