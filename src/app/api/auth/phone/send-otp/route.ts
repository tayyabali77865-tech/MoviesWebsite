import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// In production, integrate Twilio/Firebase to send real SMS. Here we simulate.
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 });
    }
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.otpVerification.create({
      data: { phone, code, expiresAt },
    });
    // TODO: Send SMS via Twilio/Firebase. For dev, log code.
    if (process.env.NODE_ENV === 'development') {
      console.log('OTP for', phone, ':', code);
    }
    return NextResponse.json({ success: true, message: 'OTP sent' });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
