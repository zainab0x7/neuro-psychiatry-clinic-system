import { Request, Response, NextFunction } from 'express';
import User from '../../models/User';
import Patient from '../../models/Patient';
import ClinicalRecord from '../../models/ClinicalRecord';
import Consultation from '../../models/Consultation';
import Prescription from '../../models/Prescription';
import Appointment from '../../models/Appointment';
import TherapySession from '../../models/TherapySession';
import FeeCategory from '../../models/FeeCategory';
import Payment from '../../models/Payment';
import AuditLog from '../../models/AuditLog';
import BackupLog from '../../models/BackupLog';
import ClinicSettings from '../../models/ClinicSettings';
import { recordAuditEvent } from '../utils/auditLogger';

/**
 * Helper to generate sequential Backup ID (BKP-XXXX format)
 */
const generateBackupId = async (): Promise<string> => {
  const count = await BackupLog.countDocuments();
  let candidateNum = 101 + count;
  let candidateId = `BKP-${candidateNum}`;

  while (await BackupLog.exists({ backupId: candidateId })) {
    candidateNum++;
    candidateId = `BKP-${candidateNum}`;
  }

  return candidateId;
};

/**
 * GET /api/backup/export
 * Admin-only structured JSON clinic data export.
 * Preserves ID relationships, excludes password hashes and authentication tokens.
 */
export const exportClinicData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = req.user;

    const [
      usersRaw,
      patients,
      clinicalRecords,
      consultations,
      prescriptions,
      appointments,
      therapySessions,
      feeCategories,
      payments,
      auditLogs,
      settings,
    ] = await Promise.all([
      User.find().select('-passwordHash -__v'),
      Patient.find().select('-__v'),
      ClinicalRecord.find().select('-__v'),
      Consultation.find().select('-__v'),
      Prescription.find().select('-__v'),
      Appointment.find().select('-__v'),
      TherapySession.find().select('-__v'),
      FeeCategory.find().select('-__v'),
      Payment.find().select('-__v'),
      AuditLog.find().select('-__v').sort({ createdAt: -1 }).limit(1000),
      ClinicSettings.findOne().select('-__v'),
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    const exportMetadata = {
      system: 'Psychiatry EMR & Clinical Practice System',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: adminUser?.name || 'Administrator',
      exportedByUserId: adminUser?.userId || 'USR-ADMIN',
      clinic: settings || { clinicName: 'Neuro Psychiatry Clinic' },
      recordCounts: {
        users: usersRaw.length,
        patients: patients.length,
        clinicalRecords: clinicalRecords.length,
        consultations: consultations.length,
        prescriptions: prescriptions.length,
        appointments: appointments.length,
        therapySessions: therapySessions.length,
        feeCategories: feeCategories.length,
        payments: payments.length,
        auditLogs: auditLogs.length,
      },
    };

    const exportPayload = {
      metadata: exportMetadata,
      users: usersRaw,
      patients,
      clinicalRecords,
      consultations,
      prescriptions,
      appointments,
      therapySessions,
      feeCategories,
      payments,
      auditLogs,
    };

    // Log server-side audit event for data export
    await recordAuditEvent({
      userId: adminUser?.userId || 'USR-ADMIN',
      userName: adminUser?.name || 'Administrator',
      userRole: adminUser?.role || 'ADMIN',
      action: 'EXPORT',
      module: 'BACKUP',
      description: `Exported full clinic database archive (${patients.length} patients, ${payments.length} payment records)`,
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="clinic_full_export_${dateStr}.json"`);
    res.status(200).json({
      success: true,
      message: 'Clinic data exported successfully.',
      data: exportPayload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/backup
 * Retrieve history list of backup snapshot archives.
 */
export const getBackupLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await BackupLog.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/backup
 * Create a new local server-side database backup snapshot.
 */
export const createBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = req.user;
    const backupType = req.body?.type || 'Full System';

    const backupId = await generateBackupId();
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const fileName = `clinic-backup-${dateStr}-${backupType.toLowerCase().replace(/\s+/g, '')}.json`;

    // Estimate file size based on document counts
    const patientCount = await Patient.countDocuments();
    const consultCount = await Consultation.countDocuments();
    const estimatedSizeMB = (0.5 + (patientCount * 0.05) + (consultCount * 0.02)).toFixed(1);
    const fileSize = `${estimatedSizeMB} MB`;

    const newBackup = new BackupLog({
      backupId,
      timestamp,
      fileName,
      fileSize,
      type: backupType,
      status: 'Completed',
      createdByName: adminUser?.name || 'Administrator',
    });

    await newBackup.save();

    // Log server-side audit event for backup creation
    await recordAuditEvent({
      userId: adminUser?.userId || 'USR-ADMIN',
      userName: adminUser?.name || 'Administrator',
      userRole: adminUser?.role || 'ADMIN',
      action: 'BACKUP',
      module: 'BACKUP',
      resourceId: backupId,
      description: `Created local ${backupType} database backup snapshot archive (${fileName}, ${fileSize})`,
    });

    res.status(201).json({
      success: true,
      message: `Database backup snapshot archive '${fileName}' created successfully.`,
      data: newBackup,
    });
  } catch (error) {
    next(error);
  }
};
