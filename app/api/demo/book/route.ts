/**
 * POST /api/demo/book
 * Creates a calendar booking for demo
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEvent } from '@/lib/tools/calendar';

// Simple rate limiting for booking
const bookingLimiter = new Map<string, { count: number; resetAt: number }>();
const BOOKING_LIMIT = 3; // 3 bookings per hour
const BOOKING_WINDOW_MS = 60 * 60 * 1000;

function checkBookingLimit(ip: string): boolean {
  const now = Date.now();
  const entry = bookingLimiter.get(ip);

  if (!entry || entry.resetAt < now) {
    bookingLimiter.set(ip, { count: 1, resetAt: now + BOOKING_WINDOW_MS });
    return true;
  }

  if (entry.count >= BOOKING_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') || 'unknown';

    if (!checkBookingLimit(ip)) {
      return NextResponse.json(
        { error: 'Booking limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const { email, date, time, name } = await request.json();

    if (!email || !date || !time) {
      return NextResponse.json(
        { error: 'email, date, and time are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log(`[Demo Book] Creating booking for ${email} on ${date} ${time}`);

    const result = await createEvent({
      date,
      time,
      name: name || 'Demo Lead',
      phone: '', // No phone for web demo
      email
    });

    if (result.success) {
      console.log(`[Demo Book] Success! Event ID: ${result.eventId}`);
      return NextResponse.json({
        success: true,
        eventId: result.eventId,
        meetingUrl: result.meetingUrl
      });
    } else {
      console.error(`[Demo Book] Failed:`, result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to create booking' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Demo Book] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
