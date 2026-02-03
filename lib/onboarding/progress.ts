/**
 * Onboarding Progress Tracking
 *
 * Tracks tenant progress through the self-service onboarding flow.
 * Stored in tenants.onboarding_status JSONB column.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
);

export type OnboardingStep =
  | 'industry'      // Step 1: Select industry
  | 'business_info' // Step 2: Business name, description
  | 'customize'     // Step 3: Customize prompt
  | 'test'          // Step 4: Test the agent
  | 'connect'       // Step 5: Connect WhatsApp
  | 'complete';     // Done

export interface OnboardingStatus {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  startedAt: string;
  completedAt: string | null;
  // Saved data from each step
  selectedIndustry: string | null;
  businessInfo: {
    name: string;
    description: string;
    productsServices: string;
  } | null;
  customizations: {
    tone: string;
    customInstructions: string;
    systemPromptModified: boolean;
  } | null;
  testResults: {
    messagesExchanged: number;
    lastTestedAt: string;
  } | null;
}

const DEFAULT_STATUS: OnboardingStatus = {
  currentStep: 'industry',
  completedSteps: [],
  startedAt: new Date().toISOString(),
  completedAt: null,
  selectedIndustry: null,
  businessInfo: null,
  customizations: null,
  testResults: null,
};

const STEP_ORDER: OnboardingStep[] = [
  'industry',
  'business_info',
  'customize',
  'test',
  'connect',
  'complete',
];

/**
 * Get onboarding status for a tenant
 */
export async function getOnboardingStatus(
  tenantId: string
): Promise<OnboardingStatus | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select('onboarding_status')
    .eq('id', tenantId)
    .single();

  if (error) {
    console.error('Error fetching onboarding status:', error);
    return null;
  }

  return data?.onboarding_status || DEFAULT_STATUS;
}

/**
 * Initialize onboarding for a new tenant
 */
export async function initializeOnboarding(
  tenantId: string
): Promise<OnboardingStatus> {
  const status: OnboardingStatus = {
    ...DEFAULT_STATUS,
    startedAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('tenants')
    .update({ onboarding_status: status })
    .eq('id', tenantId);

  if (error) {
    console.error('Error initializing onboarding:', error);
  }

  return status;
}

/**
 * Update onboarding progress
 */
export async function updateOnboardingStatus(
  tenantId: string,
  updates: Partial<OnboardingStatus>
): Promise<OnboardingStatus | null> {
  // Get current status first
  const current = await getOnboardingStatus(tenantId);
  if (!current) return null;

  const updated: OnboardingStatus = {
    ...current,
    ...updates,
  };

  const { error } = await supabase
    .from('tenants')
    .update({ onboarding_status: updated })
    .eq('id', tenantId);

  if (error) {
    console.error('Error updating onboarding status:', error);
    return null;
  }

  return updated;
}

/**
 * Mark a step as complete and move to next
 */
export async function completeStep(
  tenantId: string,
  step: OnboardingStep,
  stepData?: Partial<OnboardingStatus>
): Promise<OnboardingStatus | null> {
  const current = await getOnboardingStatus(tenantId);
  if (!current) return null;

  // Add to completed steps if not already there
  const completedSteps = current.completedSteps.includes(step)
    ? current.completedSteps
    : [...current.completedSteps, step];

  // Determine next step
  const currentIndex = STEP_ORDER.indexOf(step);
  const nextStep = currentIndex < STEP_ORDER.length - 1
    ? STEP_ORDER[currentIndex + 1]
    : 'complete';

  const updated: OnboardingStatus = {
    ...current,
    ...stepData,
    completedSteps,
    currentStep: nextStep,
    completedAt: nextStep === 'complete' ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from('tenants')
    .update({ onboarding_status: updated })
    .eq('id', tenantId);

  if (error) {
    console.error('Error completing step:', error);
    return null;
  }

  return updated;
}

/**
 * Go back to a previous step
 */
export async function goToStep(
  tenantId: string,
  step: OnboardingStep
): Promise<OnboardingStatus | null> {
  return updateOnboardingStatus(tenantId, { currentStep: step });
}

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(tenantId: string): Promise<boolean> {
  const status = await getOnboardingStatus(tenantId);
  return status?.completedAt !== null;
}

/**
 * Get completion percentage
 */
export function getCompletionPercentage(status: OnboardingStatus): number {
  const totalSteps = STEP_ORDER.length - 1; // Exclude 'complete'
  const completed = status.completedSteps.filter(s => s !== 'complete').length;
  return Math.round((completed / totalSteps) * 100);
}

/**
 * Reset onboarding to start over
 */
export async function resetOnboarding(
  tenantId: string
): Promise<OnboardingStatus> {
  const status: OnboardingStatus = {
    ...DEFAULT_STATUS,
    startedAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('tenants')
    .update({ onboarding_status: status })
    .eq('id', tenantId);

  if (error) {
    console.error('Error resetting onboarding:', error);
  }

  return status;
}
