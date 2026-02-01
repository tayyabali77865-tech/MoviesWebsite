import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const TOKEN_EXPIRY_MINUTES = 5;

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });
    }
    const otp = await prisma.otpVerification.findFirst({
      where: { phone, code, verified: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
    await prisma.otpVerification.update({
      where: { id: otp.id },
      data: { verified: true },
    });
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone, role: 'user' },
      });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
    await prisma.phoneLoginToken.create({
      data: { token, userId: user.id, expiresAt },
    });
    return NextResponse.json({
      token,
      id: user.id,
      phone: user.phone,
      role: user.role,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
