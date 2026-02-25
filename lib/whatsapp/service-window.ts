/**
 * WhatsApp Service Window Tracking
 *
 * Meta pricing (July 2025+):
 * - Standard window (24h): Customer-initiated → service msgs + utility templates FREE
 * - CTWA window (72h): Click-to-WhatsApp Ad → ALL templates FREE
 * - Marketing templates always cost outside window
 */

const WINDOW_HOURS = {
  standard: 24,
  ctwa: 72,
} as const;

export type WindowType = keyof typeof WINDOW_HOURS;

export interface ServiceWindowStatus {
  isActive: boolean;
  windowType: WindowType | null;
  windowExpires: Date | null;
  minutesRemaining: number;
}

/**
 * Get full service window status for a lead
 */
export function getServiceWindowStatus(
  windowStart: Date | string | null | undefined,
  windowType: WindowType | null | undefined
): ServiceWindowStatus {
  if (!windowStart || !windowType) {
    return { isActive: false, windowType: null, windowExpires: null, minutesRemaining: 0 };
  }

  const start = typeof windowStart === 'string' ? new Date(windowStart) : windowStart;
  const hours = WINDOW_HOURS[windowType] ?? 24;
  const expires = new Date(start.getTime() + hours * 60 * 60 * 1000);
  const now = new Date();
  const remaining = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 60000));

  return {
    isActive: now < expires,
    windowType,
    windowExpires: expires,
    minutesRemaining: remaining,
  };
}

/**
 * Shortcut: is the service window currently active?
 */
export function isInServiceWindow(
  windowStart: Date | string | null | undefined,
  windowType: WindowType | null | undefined
): boolean {
  return getServiceWindowStatus(windowStart, windowType).isActive;
}
