import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Payment from '@/models/Payment';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');

    const filter: any = {};
    if (patientId) filter.patientId = patientId;

    const payments = await Payment.find(filter).sort({ createdAt: -1 }).lean();
    const formatted = payments.map(p => ({
      ...p,
      id: p.paymentId,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const count = await Payment.countDocuments();
    const paymentId = body.id || `PY-${Math.floor(400 + count + 1)}`;
    const receiptNumber = body.receiptNumber || `RCP-2026-${String(count + 89).padStart(3, '0')}`;

    const newPayment = new Payment({
      ...body,
      paymentId,
      receiptNumber,
    });
    await newPayment.save();

    return NextResponse.json({
      success: true,
      data: { ...newPayment.toObject(), id: newPayment.paymentId },
      message: 'Payment recorded successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
