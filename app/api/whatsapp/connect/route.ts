/**
 * WhatsApp Connect API
 * POST /api/whatsapp/connect
 *
 * Handles the Embedded Signup completion:
 * 1. Receives code, waba_id, phone_number_id from frontend
 * 2. Exchanges code for access token
 * 3. Subscribes to webhook
 * 4. Saves encrypted credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateTenant } from '@/lib/tenant/context';
import { completeOnboarding, disconnectWhatsApp } from '@/lib/whatsapp/onboarding';
import { getSupabase } from '@/lib/memory/supabase';

interface ConnectRequestBody {
  code: string;
  waba_id: string;
  phone_number_id: string;
  business_id?: string;
}

interface DisconnectRequestBody {
  action: 'disconnect';
  phone_number_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Handle disconnect action
    if ('action' in body && body.action === 'disconnect') {
      const tenant = await getOrCreateTenant(user.email);
      const success = await disconnectWhatsApp(tenant.id, body.phone_number_id);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to disconnect WhatsApp' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'WhatsApp disconnected successfully'
      });
    }

    // Handle connect action
    const { code, waba_id, phone_number_id, business_id } = body as ConnectRequestBody;

    // Validate required fields
    if (!code || !waba_id || !phone_number_id) {
      return NextResponse.json(
        { error: 'Missing required fields: code, waba_id, phone_number_id' },
        { status: 400 }
      );
    }

    console.log(`[API] WhatsApp connect request from ${user.email}`);
    console.log(`[API] WABA ID: ${waba_id}, Phone Number ID: ${phone_number_id}`);

    // Get or create tenant for this user
    const tenant = await getOrCreateTenant(user.email, user.user_metadata?.name);

    // Complete the onboarding process
    const result = await completeOnboarding({
      tenantId: tenant.id,
      code,
      wabaId: waba_id,
      phoneNumberId: phone_number_id
    });

    if (!result.success) {
      console.error(`[API] Onboarding failed for ${user.email}:`, result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to connect WhatsApp' },
        { status: 500 }
      );
    }

    // Save Meta Business ID if provided (for tech provider API)
    if (business_id) {
      const adminSupabase = getSupabase();
      await adminSupabase
        .from('tenants')
        .update({ meta_business_id: business_id })
        .eq('id', tenant.id);
      console.log(`[API] Saved meta_business_id ${business_id} for tenant ${tenant.id}`);
    }

    console.log(`[API] WhatsApp connected successfully for ${user.email}`);

    return NextResponse.json({
      success: true,
      data: {
        wabaId: result.wabaId,
        phoneNumberId: result.phoneNumberId,
        displayPhoneNumber: result.displayPhoneNumber,
        businessName: result.businessName
      }
    });

  } catch (error) {
    console.error('[API] WhatsApp connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/whatsapp/connect
 * Get current WhatsApp connection status for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!tenant) {
      return NextResponse.json({
        connected: false,
        message: 'No tenant found'
      });
    }

    // Get all WhatsApp accounts
    const { data: whatsappAccounts } = await supabase
      .from('whatsapp_accounts')
      .select('id, waba_id, phone_number_id, display_phone_number, business_name, status, connected_at')
      .eq('tenant_id', tenant.id)
      .order('connected_at', { ascending: false });

    const activeAccounts = (whatsappAccounts || []).filter(a => a.status === 'active');

    if (activeAccounts.length === 0) {
      return NextResponse.json({
        connected: false,
        accounts: [],
        message: 'No active WhatsApp connection'
      });
    }

    return NextResponse.json({
      connected: true,
      accounts: activeAccounts.map(a => ({
        wabaId: a.waba_id,
        phoneNumberId: a.phone_number_id,
        displayPhoneNumber: a.display_phone_number,
        businessName: a.business_name,
        status: a.status,
        connectedAt: a.connected_at
      }))
    });

  } catch (error) {
    console.error('[API] WhatsApp status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
