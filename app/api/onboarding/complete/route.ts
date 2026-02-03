/**
 * Complete Onboarding API
 *
 * POST - Finalize onboarding and save all configuration
 *
 * This endpoint:
 * 1. Validates tenant from session (secure)
 * 2. Saves the agent configuration to agent_configs table
 * 3. Marks onboarding as complete
 * 4. Returns success with redirect URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getTenantIdForUser } from '@/lib/supabase/user-role';
import {
  getTemplateById,
  applyTemplateVariables,
  type IndustryId,
} from '@/lib/onboarding/templates';
import { completeStep, getOnboardingStatus } from '@/lib/onboarding/progress';

// Admin client for writes
const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
);

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

    // Get tenant ID from session (secure - not from client)
    const tenantId = await getTenantIdForUser(user.email);

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
    }

    const body = await request.json();
    const {
      // Configuration from client
      industry,
      businessName,
      businessDescription,
      productsServices,
      customInstructions,
      tone,
      customSystemPrompt,
      fewShotExamples,
      productsCatalog,
    } = body;

    // Validate required fields
    if (!businessName) {
      return NextResponse.json({ error: 'businessName is required' }, { status: 400 });
    }

    // Build the final system prompt
    let finalSystemPrompt: string | null = null;

    if (customSystemPrompt) {
      // User fully customized the prompt
      finalSystemPrompt = customSystemPrompt;
    } else if (industry && industry !== 'custom') {
      // Apply template with variables
      const template = getTemplateById(industry as IndustryId);
      if (template) {
        finalSystemPrompt = applyTemplateVariables(template.systemPrompt, {
          businessName,
          businessDescription,
          productsServices,
          customInstructions,
        });
      }
    }

    // Get template few-shot examples if using a template
    let finalFewShotExamples = fewShotExamples || [];
    if (!fewShotExamples?.length && industry && industry !== 'custom') {
      const template = getTemplateById(industry as IndustryId);
      if (template) {
        finalFewShotExamples = template.fewShotExamples;
      }
    }

    // Save to agent_configs
    const { data: existingConfig } = await adminSupabase
      .from('agent_configs')
      .select('id')
      .eq('tenant_id', tenantId)
      .single();

    const configData = {
      tenant_id: tenantId,
      business_name: businessName,
      business_description: businessDescription,
      products_services: productsServices,
      custom_instructions: customInstructions,
      tone: tone || 'professional',
      system_prompt: finalSystemPrompt,
      few_shot_examples: finalFewShotExamples,
      products_catalog: productsCatalog || {},
      industry: industry || 'custom',
      auto_reply_enabled: true,
      updated_at: new Date().toISOString(),
    };

    if (existingConfig) {
      // Update existing config
      const { error: updateError } = await adminSupabase
        .from('agent_configs')
        .update(configData)
        .eq('id', existingConfig.id);

      if (updateError) {
        console.error('Error updating agent config:', updateError);
        return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
      }
    } else {
      // Insert new config
      const { error: insertError } = await adminSupabase.from('agent_configs').insert(configData);

      if (insertError) {
        console.error('Error creating agent config:', insertError);
        return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
      }
    }

    // Mark onboarding as complete
    const onboardingData = {
      selectedIndustry: industry,
      businessInfo: {
        name: businessName,
        description: businessDescription,
        productsServices,
      },
      customizations: {
        tone: tone || 'professional',
        customInstructions: customInstructions || '',
        systemPromptModified: !!customSystemPrompt,
      },
    };

    // Complete the 'connect' step (last step before complete)
    const currentStatus = await getOnboardingStatus(tenantId);
    if (currentStatus?.currentStep !== 'complete') {
      // If they haven't connected WhatsApp yet, mark customize as complete
      // and let them continue to connect step
      if (currentStatus?.currentStep === 'test') {
        await completeStep(tenantId, 'test', onboardingData);
      } else {
        // Force complete all steps
        await completeStep(tenantId, 'connect', onboardingData);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      redirectUrl: '/dashboard',
      config: {
        businessName,
        industry,
        tone,
        hasCustomPrompt: !!customSystemPrompt,
        fewShotExamplesCount: finalFewShotExamples.length,
      },
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
  }
}
