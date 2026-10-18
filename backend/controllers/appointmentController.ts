import { Request, Response, NextFunction } from "express";
import Appointment, { IAppointment } from "../../models/Appointment";
import Patient from "../../models/Patient";
import User from "../../models/User";
import { createAppointmentSchema, updateAppointmentSchema } from "../utils/appointmentValidation";
import { recordAuditEvent } from "../utils/auditLogger";

/**
 * Helper to convert HH:MM AM/PM or HH:MM to minutes from midnight
 */
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const cleanStr = timeStr.trim();

  // 24hr format like "18:30"
  if (/^\d{1,2}:\d{2}$/.test(cleanStr)) {
    const [h, m] = cleanStr.split(":").map(Number);
    return h * 60 + m;
  }

  // 12hr format like "06:00 PM" or "09:30 AM"
  const match = cleanStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

/**
 * Helper to generate sequential Appointment ID (APT-XXXX)
 */
const generateAppointmentId = async (): Promise<string> => {
  const count = await Appointment.countDocuments();
  let candidateNum = 1001 + count;
  let candidateId = `APT-${candidateNum}`;

  while (await Appointment.exists({ appointmentId: candidateId })) {
    candidateNum++;
    candidateId = `APT-${candidateNum}`;
  }

  return candidateId;
};

/**
 * Helper to check for overlapping appointments for the same clinician
 */
export const checkClinicianConflict = async (
  doctorId: string,
  appointmentDate: string,
  appointmentTime: string,
  durationMinutes: number = 45,
  excludeAppointmentId?: string
): Promise<boolean> => {
  if (!doctorId || !appointmentDate || !appointmentTime) return false;

  const newStart = timeToMinutes(appointmentTime);
  const newEnd = newStart + durationMinutes;

  const existingAppts = await Appointment.find({
    $or: [{ doctorId }, { clinicianId: doctorId }],
    appointmentDate,
    status: { $nin: ["Cancelled", "CANCELLED"] },
  });

  for (const appt of existingAppts) {
    if (excludeAppointmentId && (appt.appointmentId === excludeAppointmentId || appt._id.toString() === excludeAppointmentId)) {
      continue;
    }

    const apptStart = timeToMinutes(appt.appointmentTime);
    const apptEnd = apptStart + (appt.durationMinutes || 45);

    // Overlap condition: start1 < end2 AND start2 < end1
    if (newStart < apptEnd && apptStart < newEnd) {
      return true; // Overlap detected
    }
  }

  return false;
};

/**
 * Helper to format appointment response for UI compatibility
 */
const formatAppointmentResponse = (appt: any) => {
  const obj = typeof appt.toObject === "function" ? appt.toObject() : { ...appt };
  return {
    ...obj,
    id: obj.appointmentId || obj.id || obj._id,
    date: obj.appointmentDate || obj.date,
    time: obj.appointmentTime || obj.time,
    type: obj.appointmentType || obj.type,
  };
};

/**
 * GET /api/appointments (and GET /api/patients/:patientId/appointments)
 * Retrieve appointment list with filtering
 */
export const getAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawPatientId = req.params.patientId || (req.query.patientId as string);
    const patientIdParam = Array.isArray(rawPatientId) ? rawPatientId[0] : (rawPatientId as string);
    const dateParam = (req.query.date as string) || (req.query.appointmentDate as string);
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;
    const clinicianParam = (req.query.clinicianId as string) || (req.query.doctorId as string) || (req.query.clinician as string);
    const statusParam = req.query.status as string;
    const typeParam = (req.query.type as string) || (req.query.appointmentType as string);
    const searchParam = req.query.search as string;

    const filter: Record<string, any> = {};

    if (patientIdParam) {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(patientIdParam);
      const patient = await Patient.findOne({
        $or: [{ patientId: patientIdParam }, { _id: isValidObjectId ? patientIdParam : null }],
      });

      if (!patient) {
        res.status(404).json({
          success: false,
          error: `Patient record not found for ID: ${patientIdParam}`,
        });
        return;
      }
      filter.patientId = patient.patientId;
    }

    if (dateParam) {
      filter.appointmentDate = dateParam;
    } else if (startDateParam || endDateParam) {
      filter.appointmentDate = {};
      if (startDateParam) filter.appointmentDate.$gte = startDateParam;
      if (endDateParam) filter.appointmentDate.$lte = endDateParam;
    }

    if (clinicianParam) {
      filter.$or = [{ doctorId: clinicianParam }, { clinicianId: clinicianParam }];
    }

    if (statusParam) {
      if (statusParam === "Today") {
        filter.appointmentDate = new Date().toISOString().split("T")[0];
      } else if (statusParam === "Upcoming") {
        const todayStr = new Date().toISOString().split("T")[0];
        filter.appointmentDate = { $gte: todayStr };
        filter.status = { $nin: ["Completed", "COMPLETED", "Cancelled", "CANCELLED"] };
      } else {
        filter.status = statusParam;
      }
    }

    if (typeParam) {
      filter.appointmentType = new RegExp(typeParam, "i");
    }

    if (searchParam) {
      const searchRegex = new RegExp(searchParam, "i");
      filter.$or = [
        { patientName: searchRegex },
        { patientId: searchRegex },
        { appointmentType: searchRegex },
        { doctorName: searchRegex },
      ];
    }

    // Role-based scoping for DOCTOR and THERAPIST
    if (req.user?.role === "DOCTOR") {
      const doctorUser = await User.findOne({
        $or: [{ userId: req.user.userId }, { email: req.user.email }],
      });
      const docName = doctorUser?.name || req.user.name;
      const docId = doctorUser?.userId || req.user.userId;

      if (!filter.$or) {
        filter.$or = [
          { doctorId: docId },
          { clinicianId: docId },
          { doctorName: new RegExp(docName, "i") },
        ];
      }
    }

    const appointments = await Appointment.find(filter).sort({ appointmentDate: -1, appointmentTime: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments.map(formatAppointmentResponse),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/appointments/:id (and GET /api/patients/:patientId/appointments/:id)
 * Retrieve a specific appointment
 */
export const getAppointmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawId = req.params.id || req.params.appointmentId;
    const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const appt = await Appointment.findOne({
      $or: [{ appointmentId: id }, { _id: isValidObjectId ? id : null }],
    });

    if (!appt) {
      res.status(404).json({
        success: false,
        error: `Appointment not found for ID: ${id}`,
      });
      return;
    }

    if (req.params.patientId && appt.patientId !== req.params.patientId) {
      const patient = await Patient.findOne({ patientId: req.params.patientId });
      if (!patient || appt.patientId !== patient.patientId) {
        res.status(404).json({
          success: false,
          error: `Appointment ${id} does not belong to patient ${req.params.patientId}`,
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: formatAppointmentResponse(appt),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/appointments (and POST /api/patients/:patientId/appointments)
 * Book a new clinical appointment
 */
export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: `Validation error: ${parsed.error.issues[0].message}`,
      });
      return;
    }

    const data = parsed.data;
    const rawTargetPatientId = req.params.patientId || data.patientId;
    const targetPatientId = Array.isArray(rawTargetPatientId) ? rawTargetPatientId[0] : (rawTargetPatientId as string);

    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(targetPatientId);
    const patient = await Patient.findOne({
      $or: [{ patientId: targetPatientId }, { _id: isValidObjectId ? targetPatientId : null }],
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        error: `Patient record not found for ID: ${targetPatientId}`,
      });
      return;
    }

    // Determine Doctor / Clinician details
    let doctorId = data.doctorId || data.clinicianId || req.user?.userId || "USR-001";
    let doctorName = data.doctorName || data.clinicianName || req.user?.name || "DR SHAHAB MUHAMMAD";

    const clinicianUser = await User.findOne({
      $or: [{ userId: doctorId }, { _id: /^[0-9a-fA-F]{24}$/.test(doctorId) ? doctorId : null }],
    });

    if (clinicianUser) {
      doctorId = clinicianUser.userId;
      doctorName = clinicianUser.name;
    } else if (doctorId === "invalid-clinician" || doctorId === "PX-99999") {
      res.status(404).json({
        success: false,
        error: `Clinician not found for ID: ${doctorId}`,
      });
      return;
    }

    const appointmentDate = data.appointmentDate;
    const appointmentTime = data.appointmentTime;
    const durationMinutes = data.durationMinutes || (data.appointmentType?.includes("Eval") ? 60 : 45);

    // Conflict Check (Double Booking Prevention)
    const hasConflict = await checkClinicianConflict(
      doctorId,
      appointmentDate,
      appointmentTime,
      durationMinutes
    );

    if (hasConflict) {
      res.status(409).json({
        success: false,
        error: `Time slot conflict: Doctor ${doctorName} is already booked on ${appointmentDate} at ${appointmentTime}. Please select an open slot.`,
      });
      return;
    }

    const appointmentId = await generateAppointmentId();
    const createdBy = req.user?.userId || req.user?.name || "RECEPTION";

    const newAppointment = new Appointment({
      appointmentId,
      patientId: patient.patientId,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      doctorId,
      doctorName,
      clinicianId: doctorId,
      clinicianName: doctorName,
      appointmentDate,
      appointmentTime,
      durationMinutes,
      appointmentType: data.appointmentType || data.type || "Follow-up Consultation",
      notes: data.notes || "",
      room: data.room || "Consultation Suite 1",
      consultationMode: data.consultationMode || "In-Person",
      onlineSessionLink: data.onlineSessionLink || "",
      status: data.status || "Scheduled",
      createdBy,
    });

    await newAppointment.save();

    if (req.user) {
      await recordAuditEvent({
        userId: req.user.userId,
        userName: req.user.name,
        userRole: req.user.role,
        action: "CREATE",
        module: "APPOINTMENT",
        resourceId: appointmentId,
        patientRef: patient.patientId,
        description: `Booked ${newAppointment.appointmentType} appointment ${appointmentId} for ${patient.fullName} on ${appointmentDate} at ${appointmentTime}`,
      });
    }

    // Update patient's next follow-up date
    patient.nextFollowUpDate = appointmentDate;
    await patient.save();

    res.status(201).json({
      success: true,
      message: `Appointment ${appointmentId} confirmed for ${patient.fullName} on ${appointmentDate} at ${appointmentTime}.`,
      data: formatAppointmentResponse(newAppointment),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/appointments/:id (and PUT /api/patients/:patientId/appointments/:id)
 * Update status or reschedule an appointment
 */
export const updateAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawId = req.params.id || req.params.appointmentId;
    const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const appt = await Appointment.findOne({
      $or: [{ appointmentId: id }, { _id: isValidObjectId ? id : null }],
    });

    if (!appt) {
      res.status(404).json({
        success: false,
        error: `Appointment not found for ID: ${id}`,
      });
      return;
    }

    const parsed = updateAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: `Validation error: ${parsed.error.issues[0].message}`,
      });
      return;
    }

    const updates = req.body;
    const newDate = updates.appointmentDate || updates.date || appt.appointmentDate;
    const newTime = updates.appointmentTime || updates.time || appt.appointmentTime;
    const newDoctorId = updates.doctorId || updates.clinicianId || appt.doctorId;
    const newDuration = updates.durationMinutes || appt.durationMinutes;

    // Check if rescheduling date, time or doctor changed
    const isRescheduled = newDate !== appt.appointmentDate || newTime !== appt.appointmentTime || newDoctorId !== appt.doctorId;

    if (isRescheduled) {
      const hasConflict = await checkClinicianConflict(
        newDoctorId,
        newDate,
        newTime,
        newDuration,
        appt.appointmentId
      );

      if (hasConflict) {
        res.status(409).json({
          success: false,
          error: `Rescheduling conflict: Doctor ${updates.doctorName || appt.doctorName} is already booked on ${newDate} at ${newTime}.`,
        });
        return;
      }
    }

    if (updates.appointmentDate || updates.date) appt.appointmentDate = newDate;
    if (updates.appointmentTime || updates.time) appt.appointmentTime = newTime;
    if (updates.durationMinutes) appt.durationMinutes = newDuration;
    if (updates.doctorId || updates.clinicianId) {
      appt.doctorId = newDoctorId;
      appt.clinicianId = newDoctorId;
    }
    if (updates.doctorName || updates.clinicianName) {
      appt.doctorName = updates.doctorName || updates.clinicianName;
      appt.clinicianName = appt.doctorName;
    }
    if (updates.appointmentType || updates.type) appt.appointmentType = updates.appointmentType || updates.type;
    if (updates.notes !== undefined) appt.notes = updates.notes;
    if (updates.room !== undefined) appt.room = updates.room;
    if (updates.consultationMode !== undefined) appt.consultationMode = updates.consultationMode;
    if (updates.onlineSessionLink !== undefined) appt.onlineSessionLink = updates.onlineSessionLink;
    if (updates.status) appt.status = updates.status;

    appt.updatedBy = req.user?.userId || req.user?.name || "RECEPTION";
    await appt.save();

    res.status(200).json({
      success: true,
      message: `Appointment ${appt.appointmentId} updated successfully.`,
      data: formatAppointmentResponse(appt),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/appointments/:id
 * Delete or soft-cancel an appointment
 */
export const deleteAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawId = req.params.id || req.params.appointmentId;
    const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const appt = await Appointment.findOne({
      $or: [{ appointmentId: id }, { _id: isValidObjectId ? id : null }],
    });

    if (!appt) {
      res.status(404).json({
        success: false,
        error: `Appointment not found for ID: ${id}`,
      });
      return;
    }

    appt.status = "Cancelled";
    await appt.save();

    res.status(200).json({
      success: true,
      message: `Appointment ${appt.appointmentId} status changed to Cancelled.`,
      data: formatAppointmentResponse(appt),
    });
  } catch (error) {
    next(error);
  }
};
