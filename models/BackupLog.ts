import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBackupLogDoc extends Document {
  backupId: string;
  timestamp: string;
  fileName: string;
  fileSize: string;
  type: 'Full System' | 'Patient Records' | 'Financial & Billing' | 'Audit Logs';
  status: 'Completed' | 'In Progress' | 'Failed';
  createdByName: string;
  createdAt: Date;
}

const BackupLogSchema: Schema<IBackupLogDoc> = new Schema(
  {
    backupId: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: String, required: true },
    type: { type: String, enum: ['Full System', 'Patient Records', 'Financial & Billing', 'Audit Logs'], default: 'Full System' },
    status: { type: String, enum: ['Completed', 'In Progress', 'Failed'], default: 'Completed' },
    createdByName: { type: String, required: true },
  },
  { timestamps: true }
);

BackupLogSchema.index({ createdAt: -1 });

const BackupLog: Model<IBackupLogDoc> =
  mongoose.models.BackupLog || mongoose.model<IBackupLogDoc>('BackupLog', BackupLogSchema);

export default BackupLog;
