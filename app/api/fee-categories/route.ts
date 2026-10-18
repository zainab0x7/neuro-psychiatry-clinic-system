import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FeeCategory from '@/models/FeeCategory';

export async function GET() {
  try {
    await dbConnect();
    const categories = await FeeCategory.find({}).sort({ name: 1 }).lean();
    const formatted = categories.map(c => ({
      ...c,
      id: c.categoryId,
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
    const count = await FeeCategory.countDocuments();
    const categoryId = body.id || `FEE-${Math.floor(100 + count + 1)}`;

    const newCategory = new FeeCategory({
      ...body,
      categoryId,
    });
    await newCategory.save();

    return NextResponse.json({
      success: true,
      data: { ...newCategory.toObject(), id: newCategory.categoryId },
      message: 'Fee category added.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, ...updates } = body;

    const updated = await FeeCategory.findOneAndUpdate(
      { categoryId: id },
      { $set: updates },
      { new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      data: updated ? { ...updated, id: updated.categoryId } : null,
      message: 'Fee category updated.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
