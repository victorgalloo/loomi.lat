/**
 * /api/auth/confirm-signup
 * Auto-confirms a newly signed-up user using service role key
 * Only confirms users created in the last 5 minutes (prevents abuse)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY!;

    if (!serviceKey) {
      return NextResponse.json(
        { error: 'Service key not configured' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get user to verify they exist and were recently created
    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only confirm users created in the last 5 minutes
    const createdAt = new Date(user.created_at).getTime();
    if (Date.now() - createdAt > 5 * 60 * 1000) {
      return NextResponse.json(
        { error: 'User too old to auto-confirm' },
        { status: 400 }
      );
    }

    // Already confirmed
    if (user.email_confirmed_at) {
      return NextResponse.json({ confirmed: true });
    }

    // Confirm the user
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (updateError) {
      console.error('[ConfirmSignup] Error confirming user:', updateError);
      return NextResponse.json(
        { error: 'Failed to confirm user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ confirmed: true });
  } catch (error) {
    console.error('[ConfirmSignup] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
