import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    // Add other environment checks as needed, but never expose actual values
  });
} 