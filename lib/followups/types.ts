/**
 * Follow-up Types
 */

export type FollowUpType =
  | 'pre_demo_reminder'       // 30 min before demo
  | 'pre_demo_24h'            // 24h before demo
  | 'post_demo'               // 5 min after demo ended
  | 'cold_lead_reengagement'  // 48h without response
  | 'no_show_followup'        // Didn't show up to demo
  | 'proposal_reminder'       // 24h after proposal sent
  | 'said_later'              // User said "later" - follow up in 24h
  | 'reengagement_2'          // 5 days - second attempt
  | 'reengagement_3';         // 2 weeks - final attempt

export type FollowUpStatus = 'pending' | 'sent' | 'cancelled' | 'failed' | 'opted_out';

export interface FollowUp {
  id: string;
  leadId: string;
  appointmentId?: string;
  scheduledFor: Date;
  type: FollowUpType;
  message: string;
  status: FollowUpStatus;
  sentAt?: Date;
  createdAt: Date;
  attempt?: number; // For re-engagement sequences
  metadata?: Record<string, unknown>;
}

export interface FollowUpScheduleParams {
  leadId: string;
  type: FollowUpType;
  scheduledFor: Date;
  message: string;
  appointmentId?: string;
  attempt?: number;
  metadata?: Record<string, unknown>;
}

// Time delays for each follow-up type (in milliseconds)
// IMPORTANT: Keep these spaced out to avoid being annoying
export const FOLLOWUP_DELAYS: Record<FollowUpType, number> = {
  'pre_demo_reminder': 30 * 60 * 1000,         // 30 minutes before demo
  'pre_demo_24h': 24 * 60 * 60 * 1000,         // 24 hours before demo
  'post_demo': 5 * 60 * 1000,                  // 5 minutes after demo
  'cold_lead_reengagement': 48 * 60 * 60 * 1000,   // 48 hours (2 days) - first contact
  'no_show_followup': 15 * 60 * 1000,          // 15 minutes after missed demo
  'proposal_reminder': 24 * 60 * 60 * 1000,    // 24 hours after proposal
  'said_later': 24 * 60 * 60 * 1000,           // 24 hours - they said "later"
  'reengagement_2': 5 * 24 * 60 * 60 * 1000,   // 5 days after first attempt
  'reengagement_3': 14 * 24 * 60 * 60 * 1000   // 14 days (2 weeks) - final attempt
};

// Minimum time between any follow-ups to same lead (24 hours)
export const MIN_FOLLOWUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
