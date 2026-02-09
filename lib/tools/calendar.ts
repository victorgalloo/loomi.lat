/**
 * Cal.com Calendar Integration
 * Handles availability checking and booking
 */

interface CalSlot {
  date: string;
  time: string;
}

interface BookingResult {
  success: boolean;
  eventId?: string;
  meetingUrl?: string;
  error?: string;
}

const CAL_API_KEY = process.env.CAL_API_KEY;
const CAL_EVENT_TYPE_ID = process.env.CAL_EVENT_TYPE_ID;
const CAL_API_URL = 'https://api.cal.com/v1';

// Timezone for Mexico City
const TIMEZONE = 'America/Mexico_City';

// Cache event type duration to avoid repeated API calls
let cachedEventLength: number | null = null;

async function getEventLength(): Promise<number> {
  if (cachedEventLength) return cachedEventLength;
  try {
    const res = await fetch(`${CAL_API_URL}/event-types/${CAL_EVENT_TYPE_ID}?apiKey=${CAL_API_KEY}`);
    if (res.ok) {
      const data = await res.json();
      cachedEventLength = data.event_type?.length || 15;
      return cachedEventLength as number;
    }
  } catch (e) {
    console.error('[Calendar] Failed to fetch event length:', e);
  }
  return 15; // fallback
}

/**
 * Get the UTC offset string for Mexico City at a given date
 * Mexico City is UTC-6 (CST) or UTC-5 (CDT during DST)
 */
function getMexicoCityOffset(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z');
  // Create a formatter to check if DST is active
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    timeZoneName: 'shortOffset'
  });
  const parts = formatter.formatToParts(date);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  // Parse offset like "GMT-6" or "GMT-5"
  const match = tzPart?.value?.match(/GMT([+-]\d+)/);
  if (match) {
    const hours = parseInt(match[1]);
    const sign = hours < 0 ? '-' : '+';
    return `${sign}${String(Math.abs(hours)).padStart(2, '0')}:00`;
  }
  return '-06:00'; // fallback CST
}

/**
 * Check availability for given dates
 * @param dates Comma-separated dates in YYYY-MM-DD format
 */
export async function checkAvailability(dates: string): Promise<CalSlot[]> {
  // Mock mode for testing
  if (process.env.CAL_MOCK_MODE === 'true') {
    return getMockSlots(dates);
  }

  try {
    const dateList = dates.split(',').map(d => d.trim());
    const allSlots: CalSlot[] = [];

    for (const date of dateList) {
      const startTime = `${date}T00:00:00`;
      const endTime = `${date}T23:59:59`;

      const response = await fetch(
        `${CAL_API_URL}/slots?apiKey=${CAL_API_KEY}&eventTypeId=${CAL_EVENT_TYPE_ID}&startTime=${startTime}&endTime=${endTime}&timeZone=${TIMEZONE}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        console.error(`[Calendar] Availability error for ${date}:`, await response.text());
        continue;
      }

      const data = await response.json();
      console.log(`[Calendar] Raw response for ${date}:`, JSON.stringify(data));

      // Parse slots from response
      const slots = data.slots || {};
      for (const [dateKey, times] of Object.entries(slots)) {
        const timeArray = times as Array<string | { time: string }>;
        for (const slot of timeArray) {
          // Handle both formats: string or {time: string}
          const timeStr = typeof slot === 'string' ? slot : slot.time;
          // Extract time from ISO string (e.g., "2026-02-04T09:00:00-06:00" -> "09:00")
          const time = timeStr.split('T')[1]?.substring(0, 5) || timeStr;
          allSlots.push({
            date: dateKey.split('T')[0] || date,
            time
          });
        }
      }
    }

    return allSlots;

  } catch (error) {
    console.error('[Calendar] Availability error:', error);
    return [];
  }
}

/**
 * Create a calendar event/booking
 */
export async function createEvent(params: {
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
}): Promise<BookingResult> {
  // Mock mode for testing
  if (process.env.CAL_MOCK_MODE === 'true') {
    return {
      success: true,
      eventId: `mock-${Date.now()}`,
      meetingUrl: 'https://cal.com/demo/mock-meeting'
    };
  }

  try {
    const offset = getMexicoCityOffset(params.date);
    const startTime = `${params.date}T${params.time}:00${offset}`;
    const eventLength = await getEventLength();
    const endTime = `${params.date}T${addMinutesFormatted(params.time, eventLength)}:00${offset}`;

    console.log(`[Calendar] Booking: start=${startTime}, end=${endTime}, length=${eventLength}min`);

    const response = await fetch(`${CAL_API_URL}/bookings?apiKey=${CAL_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventTypeId: parseInt(CAL_EVENT_TYPE_ID || '0'),
        start: startTime,
        end: endTime,
        responses: {
          name: params.name,
          email: params.email,
          phone: params.phone
        },
        timeZone: TIMEZONE,
        language: 'es',
        metadata: {
          source: 'whatsapp_agent'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Calendar] Booking error:', error);
      return { success: false, error };
    }

    const data = await response.json();

    return {
      success: true,
      eventId: data.id?.toString() || data.uid,
      meetingUrl: data.meetingUrl || data.metadata?.videoCallUrl
    };

  } catch (error) {
    console.error('[Calendar] Booking error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Cancel a booking
 */
export async function cancelEvent(eventId: string): Promise<boolean> {
  if (process.env.CAL_MOCK_MODE === 'true') {
    return true;
  }

  try {
    const response = await fetch(
      `${CAL_API_URL}/bookings/${eventId}?apiKey=${CAL_API_KEY}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationReason: 'Cancelled by WhatsApp agent' })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[Calendar] Cancel error:', error);
    return false;
  }
}

/**
 * Update the email of an existing booking
 */
export async function updateEventEmail(eventId: string, email: string): Promise<boolean> {
  if (process.env.CAL_MOCK_MODE === 'true') {
    console.log(`[Calendar Mock] Updated event ${eventId} email to ${email}`);
    return true;
  }

  try {
    const response = await fetch(`${CAL_API_URL}/bookings/${eventId}?apiKey=${CAL_API_KEY}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        responses: {
          email
        }
      })
    });

    if (response.ok) {
      console.log(`[Calendar] Updated event ${eventId} email to ${email}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Calendar] Update email error:', error);
    return false;
  }
}

// Helper to add minutes to HH:MM time string, returns HH:MM
function addMinutesFormatted(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// Mock slots for testing
function getMockSlots(dates: string): CalSlot[] {
  const slots: CalSlot[] = [];
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  for (const date of dates.split(',')) {
    const trimmedDate = date.trim();
    for (const time of times) {
      slots.push({ date: trimmedDate, time });
    }
  }

  return slots;
}
