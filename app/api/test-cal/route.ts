import { NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/tools/calendar';

export async function GET() {
  try {
    const today = new Date();
    const dates: string[] = [];
    let daysAdded = 0;
    let currentDate = new Date(today);

    while (daysAdded < 3) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(currentDate.toISOString().split('T')[0]);
        daysAdded++;
      }
    }

    const dateStr = dates.join(',');
    console.log(`[TestCal] Checking: ${dateStr}`);
    console.log(`[TestCal] CAL_API_KEY: ${process.env.CAL_API_KEY ? 'SET (' + process.env.CAL_API_KEY.length + ' chars)' : 'NOT SET'}`);
    console.log(`[TestCal] CAL_EVENT_TYPE_ID: ${process.env.CAL_EVENT_TYPE_ID || 'NOT SET'}`);

    const slots = await checkAvailability(dateStr);

    return NextResponse.json({
      success: true,
      dates: dateStr,
      slotsCount: slots.length,
      slots: slots.slice(0, 10),
      env: {
        CAL_API_KEY_SET: !!process.env.CAL_API_KEY,
        CAL_API_KEY_LENGTH: process.env.CAL_API_KEY?.length || 0,
        CAL_EVENT_TYPE_ID: process.env.CAL_EVENT_TYPE_ID || 'NOT SET'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
