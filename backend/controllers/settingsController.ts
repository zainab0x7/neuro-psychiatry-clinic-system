import { Request, Response, NextFunction } from 'express';
import ClinicSettings, { IClinicSettings } from '../../models/ClinicSettings';
import { recordAuditEvent } from '../utils/auditLogger';

/**
 * Get or initialize default clinic settings document
 */
const getOrCreateSettings = async (): Promise<IClinicSettings> => {
  let settings = await ClinicSettings.findOne();
  if (!settings) {
    settings = new ClinicSettings({
      clinicName: 'Neuro Psychiatry Clinic',
      department: 'Psychiatry',
      doctorDesignation: 'HOD & Consultant Psychiatrist',
      education: 'MBBS, MCPS, FCPS, CHPE',
      practiceName: 'Neuro Psychiatry Clinic',
      tagline: 'Psychiatry Department • HOD & Consultant Psychiatrist',
      doctorName: 'DR SHAHAB MUHAMMAD',
      licenseNumber: 'NY-MED-849201',
      phone: '+1 (555) 800-VANCE',
      email: 'appointments@vancepsychiatry.com',
      address: '680 Fifth Avenue, Suite 1800, New York, NY 10019',
      workingDays: ['Monday', 'Wednesday', 'Friday'],
      clinicStartTime: '18:00',
      clinicEndTime: '20:00',
      appointmentDuration: 45,
      breakStartTime: '',
      breakEndTime: '',
      notifyEmail: true,
      notifySMS: true,
      autoRemind24h: true,
    });
    await settings.save();
  }
  return settings;
};

/**
 * GET /api/settings
 * Retrieve clinic profile & operating configuration.
 * Accessible to all authenticated staff members.
 */
export const getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/settings
 * Admin-only update of clinic profile configuration.
 */
export const updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    const adminUser = req.user;

    const {
      clinicName,
      department,
      doctorDesignation,
      education,
      practiceName,
      tagline,
      doctorName,
      licenseNumber,
      phone,
      email,
      address,
      workingDays,
      clinicStartTime,
      clinicStart,
      clinicEndTime,
      clinicEnd,
      appointmentDuration,
      slotDurationMinutes,
      breakStartTime,
      breakStart,
      breakEndTime,
      breakEnd,
      notifyEmail,
      notifySMS,
      autoRemind24h,
    } = req.body;

    if (clinicName !== undefined) settings.clinicName = clinicName.trim();
    if (department !== undefined) settings.department = department.trim();
    if (doctorDesignation !== undefined) settings.doctorDesignation = doctorDesignation.trim();
    if (education !== undefined) settings.education = education.trim();
    if (practiceName !== undefined) settings.practiceName = practiceName.trim();
    if (tagline !== undefined) settings.tagline = tagline.trim();
    if (doctorName !== undefined) settings.doctorName = doctorName.trim();
    if (licenseNumber !== undefined) settings.licenseNumber = licenseNumber.trim();
    if (phone !== undefined) settings.phone = phone.trim();
    if (email !== undefined) settings.email = email.trim();
    if (address !== undefined) settings.address = address.trim();
    if (workingDays !== undefined && Array.isArray(workingDays)) settings.workingDays = workingDays;

    if (clinicStartTime || clinicStart) settings.clinicStartTime = (clinicStartTime || clinicStart).trim();
    if (clinicEndTime || clinicEnd) settings.clinicEndTime = (clinicEndTime || clinicEnd).trim();

    if (appointmentDuration !== undefined || slotDurationMinutes !== undefined) {
      settings.appointmentDuration = Number(appointmentDuration ?? slotDurationMinutes);
    }

    if (breakStartTime !== undefined || breakStart !== undefined) settings.breakStartTime = (breakStartTime ?? breakStart ?? '').trim();
    if (breakEndTime !== undefined || breakEnd !== undefined) settings.breakEndTime = (breakEndTime ?? breakEnd ?? '').trim();

    if (notifyEmail !== undefined) settings.notifyEmail = Boolean(notifyEmail);
    if (notifySMS !== undefined) settings.notifySMS = Boolean(notifySMS);
    if (autoRemind24h !== undefined) settings.autoRemind24h = Boolean(autoRemind24h);

    await settings.save();

    // Log server-side audit event for settings update
    await recordAuditEvent({
      userId: adminUser?.userId || 'USR-ADMIN',
      userName: adminUser?.name || 'Administrator',
      userRole: adminUser?.role || 'ADMIN',
      action: 'UPDATE',
      module: 'SETTINGS',
      description: `Updated clinic profile configuration for '${settings.clinicName}'`,
    });

    res.status(200).json({
      success: true,
      message: 'Clinic configuration updated successfully.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
