import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BackupLog from '@/models/BackupLog';

export async function GET() {
  try {
    await dbConnect();
    const backups = await BackupLog.find({}).sort({ createdAt: -1 }).lean();
    const formatted = backups.map(b => ({
      ...b,
      id: b.backupId,
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
    const count = await BackupLog.countDocuments();
    const backupId = body.id || `BKP-${Math.floor(100 + count + 1)}`;
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const fileName = body.fileName || `clinic-backup-${dateStr}-${(body.type || 'full').toLowerCase().replace(/\s+/g, '')}.json`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newBackup = new BackupLog({
      backupId,
      timestamp,
      fileName,
      fileSize: body.fileSize || '4.5 MB',
      type: body.type || 'Full System',
      status: 'Completed',
      createdByName: body.createdByName || 'Practice Director',
    });
    await newBackup.save();

    return NextResponse.json({
      success: true,
      data: { ...newBackup.toObject(), id: newBackup.backupId },
      message: 'System backup archive generated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
