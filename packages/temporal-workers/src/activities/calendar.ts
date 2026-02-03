import { CalSlot, BookingResult } from '../types';

const CAL_API_BASE = 'https://api.cal.com/v1';
const DEFAULT_TIMEZONE = 'America/Mexico_City';
const DEFAULT_DURATION_MINUTES = 30;

function getCalApiKey(): string {
  const key = process.env.CAL_API_KEY;
  if (!key) {
    throw new Error('CAL_API_KEY environment variable is required');
  }
  return key;
}

function getEventTypeId(): string {
  return process.env.CAL_EVENT_TYPE_ID || '1';
}

function addMinutes(isoTime: string, minutes: number): string {
  const date = new Date(isoTime);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

export async function checkAvailability(
  dates: string[] // Array of YYYY-MM-DD dates
): Promise<CalSlot[]> {
  const apiKey = getCalApiKey();
  const eventTypeId = getEventTypeId();

  // Build date range from provided dates
  const sortedDates = [...dates].sort();
  const startTime = `${sortedDates[0]}T00:00:00`;
  const endDate = sortedDates[sortedDates.length - 1];
  const endTime = `${endDate}T23:59:59`;

  const params = new URLSearchParams({
    apiKey,
    eventTypeId,
    startTime,
    endTime,
    timeZone: DEFAULT_TIMEZONE,
  });

  const response = await fetch(`${CAL_API_BASE}/slots?${params}`);

  if (!response.ok) {
    console.error('Cal.com availability error:', await response.text());
    return [];
  }

  const data = await response.json() as { slots?: Record<string, string[]> };
  const slots: CalSlot[] = [];

  // Transform Cal.com response to our slot format
  if (data.slots) {
    for (const [date, times] of Object.entries(data.slots)) {
      for (const time of times as string[]) {
        const timeDate = new Date(time);
        slots.push({
          date,
          time: timeDate.toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: DEFAULT_TIMEZONE,
          }),
        });
      }
    }
  }

  return slots;
}

export async function createEvent(params: {
  slot: CalSlot;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}): Promise<BookingResult> {
  const apiKey = getCalApiKey();
  const eventTypeId = getEventTypeId();

  // Build ISO datetime from slot
  const startTime = `${params.slot.date}T${params.slot.time}:00`;
  const endTime = addMinutes(startTime, DEFAULT_DURATION_MINUTES);

  const body = {
    eventTypeId: parseInt(eventTypeId),
    start: new Date(startTime).toISOString(),
    end: new Date(endTime).toISOString(),
    responses: {
      name: params.name,
      email: params.email,
      phone: params.phone,
      notes: params.notes || '',
    },
    timeZone: DEFAULT_TIMEZONE,
    language: 'es',
    metadata: {
      ...params.metadata,
      source: 'loomi-temporal',
    },
  };

  const response = await fetch(`${CAL_API_BASE}/bookings?apiKey=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cal.com booking error:', errorText);
    return { success: false, error: errorText };
  }

  const data = await response.json() as { id?: number; uid?: string; meetingUrl?: string };
  return {
    success: true,
    eventId: data.id?.toString() || data.uid,
    meetingUrl: data.meetingUrl,
  };
}

export async function cancelEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = getCalApiKey();

  const response = await fetch(`${CAL_API_BASE}/bookings/${eventId}?apiKey=${apiKey}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cal.com cancel error:', errorText);
    return { success: false, error: errorText };
  }

  return { success: true };
}

export async function updateEventEmail(
  eventId: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = getCalApiKey();

  const response = await fetch(`${CAL_API_BASE}/bookings/${eventId}?apiKey=${apiKey}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      responses: { email },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cal.com update error:', errorText);
    return { success: false, error: errorText };
  }

  return { success: true };
}

export async function rescheduleEvent(
  eventId: string,
  newSlot: CalSlot
): Promise<BookingResult> {
  const apiKey = getCalApiKey();

  const startTime = `${newSlot.date}T${newSlot.time}:00`;
  const endTime = addMinutes(startTime, DEFAULT_DURATION_MINUTES);

  const response = await fetch(`${CAL_API_BASE}/bookings/${eventId}?apiKey=${apiKey}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      start: new Date(startTime).toISOString(),
      end: new Date(endTime).toISOString(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cal.com reschedule error:', errorText);
    return { success: false, error: errorText };
  }

  const data = await response.json() as { id?: number; uid?: string; meetingUrl?: string };
  return {
    success: true,
    eventId: data.id?.toString() || data.uid,
    meetingUrl: data.meetingUrl,
  };
}

// Activity exports for Temporal
export const calendarActivities = {
  checkAvailability,
  createEvent,
  cancelEvent,
  updateEventEmail,
  rescheduleEvent,
};
