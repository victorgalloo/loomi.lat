/**
 * Onboarding Progress API
 *
 * GET - Get current onboarding status
 * POST - Update onboarding progress (complete step, save data)
 *
 * Validates tenant from session for security.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import {
  getOnboardingStatus,
  completeStep,
  updateOnboardingStatus,
  initializeOnboarding,
  type OnboardingStep,
  type OnboardingStatus,
} from '@/lib/onboarding/progress';

export async function GET() {
  try {
    // Get authenticated user from session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant ID from session (secure)
    const tenantId = await getTenantIdForUser(user.email);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    let status = await getOnboardingStatus(tenantId);

    // If no status exists, initialize it
    if (!status) {
      status = await initializeOnboarding(tenantId);
    }

    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant ID from session (secure)
    const tenantId = await getTenantIdForUser(user.email);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    const body = await request.json();
    const { action, step, data } = body;

    let updatedStatus: OnboardingStatus | null = null;

    switch (action) {
      case 'complete_step':
        // Mark a step as complete and move to next
        if (!step) {
          return NextResponse.json(
            { error: 'step is required for complete_step action' },
            { status: 400 }
          );
        }
        updatedStatus = await completeStep(tenantId, step as OnboardingStep, data);
        break;

      case 'save_progress':
        // Just save data without completing step
        updatedStatus = await updateOnboardingStatus(tenantId, data);
        break;

      case 'go_to_step':
        // Navigate to a specific step
        if (!step) {
          return NextResponse.json(
            { error: 'step is required for go_to_step action' },
            { status: 400 }
          );
        }
        updatedStatus = await updateOnboardingStatus(tenantId, {
          currentStep: step as OnboardingStep,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: complete_step, save_progress, go_to_step' },
          { status: 400 }
        );
    }

    if (!updatedStatus) {
      return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
    }

    return NextResponse.json({ status: updatedStatus });
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
  }
}
