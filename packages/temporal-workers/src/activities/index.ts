// Export all activities for worker registration
export { whatsappActivities } from './whatsapp';
export { calendarActivities } from './calendar';
export { stripeActivities } from './stripe';
export { supabaseActivities } from './supabase';
export { integrationActivities } from './integrations';

// Re-export individual functions for direct use
export * from './whatsapp';
export * from './calendar';
export * from './stripe';
export * from './supabase';
export * from './integrations';

// Combined activities object for worker
import { whatsappActivities } from './whatsapp';
import { calendarActivities } from './calendar';
import { stripeActivities } from './stripe';
import { supabaseActivities } from './supabase';
import { integrationActivities } from './integrations';

export const allActivities = {
  ...whatsappActivities,
  ...calendarActivities,
  ...stripeActivities,
  ...supabaseActivities,
  ...integrationActivities,
};
