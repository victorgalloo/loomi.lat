import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    USE_LANGGRAPH: process.env.USE_LANGGRAPH ?? 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV,
  });
}
