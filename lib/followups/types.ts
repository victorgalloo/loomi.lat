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

export type FollowUpStatus = 'pending' | 'sent' | 'cancelled' | 'failed';

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
export const FOLLOWUP_DELAYS: Record<FollowUpType, number> = {
  'pre_demo_reminder': 15 * 60 * 1000,        // 15 minutes before
  'pre_demo_24h': 12 * 60 * 60 * 1000,        // 12 hours before
  'post_demo': 2 * 60 * 1000,                 // 2 minutes after
  'cold_lead_reengagement': 24 * 60 * 60 * 1000,  // 24 hours
  'no_show_followup': 7 * 60 * 1000,          // 7 minutes after missed demo
  'proposal_reminder': 12 * 60 * 60 * 1000,   // 12 hours
  'said_later': 12 * 60 * 60 * 1000,          // 12 hours
  'reengagement_2': 2.5 * 24 * 60 * 60 * 1000,  // 2.5 days
  'reengagement_3': 7 * 24 * 60 * 60 * 1000   // 1 week
};
