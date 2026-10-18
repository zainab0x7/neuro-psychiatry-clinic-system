import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLogDoc extends Document {
  logId: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  resourceType?: string;
  resourceId?: string;
  patientRef?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema: Schema<IAuditLogDoc> = new Schema(
  {
    logId: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    module: { type: String, required: true, index: true },
    resourceType: { type: String, default: '' },
    resourceId: { type: String, default: '' },
    patientRef: { type: String, default: '' },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Indexes for high performance filtering & reporting
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ module: 1, createdAt: -1 });

const AuditLog: Model<IAuditLogDoc> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDoc>('AuditLog', AuditLogSchema);

export default AuditLog;
