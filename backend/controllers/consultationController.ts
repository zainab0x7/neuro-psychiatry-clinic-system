import { Request, Response, NextFunction } from "express";
import Consultation, { IConsultation } from "../../models/Consultation";
import Patient from "../../models/Patient";
import { recordAuditEvent } from "../utils/auditLogger";

/**
 * Helper to generate sequential Consultation ID (CNS-XXXX)
 */
const generateConsultationId = async (): Promise<string> => {
  const count = await Consultation.countDocuments();
  let candidateNum = 5001 + count;
  let candidateId = `CNS-${candidateNum}`;

  while (await Consultation.exists({ consultationId: candidateId })) {
    candidateNum++;
    candidateId = `CNS-${candidateNum}`;
  }

  return candidateId;
};

/**
 * Helper to sanitize sensitive clinical note fields for restricted roles (e.g. RECEPTION)
 */
const sanitizeForReception = (consultation: any) => {
  const obj = typeof consultation.toObject === "function" ? consultation.toObject() : { ...consultation };
  return {
    ...obj,
    presentingComplaint: "[Restricted: Clinical Note Access Limited for Reception]",
    clinicalObservations: "[Restricted: Clinical Note Access Limited for Reception]",
    treatmentPlan: "[Restricted: Clinical Note Access Limited for Reception]",
    notes: "[Restricted: Clinical Note Access Limited for Reception]",
    followUpNotes: "[Restricted: Clinical Note Access Limited for Reception]",
    mentalStatusExam: {
      appearance: "[Restricted]",
      behavior: "[Restricted]",
      speech: "[Restricted]",
      moodAndAffect: "[Restricted]",
      thoughtProcess: "[Restricted]",
      thoughtContent: "[Restricted]",
      perception: "[Restricted]",
      cognition: "[Restricted]",
      insightAndJudgment: "[Restricted]",
    },
  };
};

/**
 * GET /api/patients/:patientId/consultations (and GET /api/consultations)
 * Retrieve chronological list of consultations for a patient
 */
export const getPatientConsultations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawPatientId = req.params.patientId || (req.query.patientId as string);
    const patientId = Array.isArray(rawPatientId) ? rawPatientId[0] : (rawPatientId as string);
    const filter: Record<string, any> = {};

    if (patientId) {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(patientId);
      const patient = await Patient.findOne({
        $or: [{ patientId }, { _id: isValidObjectId ? patientId : null }],
      });

      if (!patient) {
        res.status(404).json({
          success: false,
          error: `Patient record not found for ID: ${patientId}`,
        });
        return;
      }
      filter.patientId = patient.patientId;
    }

    const consultations = await Consultation.find(filter).sort({ consultationDate: -1, createdAt: -1 });

    const isReception = req.user?.role === "RECEPTION" || req.user?.role === "RECEPTIONIST";
    const data = isReception
      ? consultations.map(c => sanitizeForReception(c))
      : consultations.map(c => ({
          ...c.toObject(),
          id: c.consultationId,
          date: c.consultationDate,
        }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patients/:patientId/consultations/:consultationId (and GET /api/consultations/:id)
 * Retrieve a specific consultation record
 */
export const getConsultationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawConsultationId = req.params.consultationId || req.params.id;
    const consultationId = Array.isArray(rawConsultationId) ? rawConsultationId[0] : (rawConsultationId as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(consultationId);

    const consultation = await Consultation.findOne({
      $or: [{ consultationId }, { _id: isValidObjectId ? consultationId : null }],
    });

    if (!consultation) {
      res.status(404).json({
        success: false,
        error: `Consultation record not found for ID: ${consultationId}`,
      });
      return;
    }

    // Check optional patientId parameter mismatch
    if (req.params.patientId && consultation.patientId !== req.params.patientId) {
      const patient = await Patient.findOne({ patientId: req.params.patientId });
      if (!patient || consultation.patientId !== patient.patientId) {
        res.status(404).json({
          success: false,
          error: `Consultation ${consultationId} does not belong to patient ${req.params.patientId}`,
        });
        return;
      }
    }

    const isReception = req.user?.role === "RECEPTION" || req.user?.role === "RECEPTIONIST";
    const data = isReception
      ? sanitizeForReception(consultation)
      : {
          ...consultation.toObject(),
          id: consultation.consultationId,
          date: consultation.consultationDate,
        };

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patients/:patientId/consultations (and POST /api/consultations)
 * Create a new chronological consultation record (DOCTOR & ADMIN only)
 */
export const createConsultation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role === "RECEPTION" || req.user?.role === "RECEPTIONIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Reception staff are not authorized to create clinical consultations.",
      });
      return;
    }

    const targetPatientId = req.params.patientId || req.body.patientId;
    if (!targetPatientId) {
      res.status(400).json({
        success: false,
        error: "Patient ID reference is required to create a consultation.",
      });
      return;
    }

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

    const consultationId = await generateConsultationId();
    const doctorId = req.user?.userId || req.user?._id?.toString() || req.body.doctorId || "USR-001";
    const doctorName = req.user?.name || req.body.doctorName || "DR SHAHAB MUHAMMAD";
    const consultationDate = req.body.consultationDate || req.body.date || new Date().toISOString().split("T")[0];

    const newConsultation = new Consultation({
      consultationId,
      patientId: patient.patientId,
      patientName: patient.fullName,
      doctorId,
      doctorName,
      clinicianId: doctorId,
      clinicianName: doctorName,
      consultationDate,
      time: req.body.time || "10:00 AM",
      visitType: req.body.visitType || "Follow-up Consultation",
      presentingComplaint: req.body.presentingComplaint,
      clinicalObservations: req.body.clinicalObservations || req.body.presentingComplaint,
      mentalStatusExam: req.body.mentalStatusExam || {},
      assessment: req.body.assessment,
      diagnosis: {
        primaryICD: req.body.diagnosis?.primaryICD || "F90.2",
        primaryTitle: req.body.diagnosis?.primaryTitle || "Unspecified Diagnosis",
        secondaryICD: req.body.diagnosis?.secondaryICD || "",
        secondaryTitle: req.body.diagnosis?.secondaryTitle || "",
      },
      treatmentPlan: req.body.treatmentPlan,
      medications: req.body.medications || [],
      followUpDate: req.body.followUpDate || "",
      followUpNotes: req.body.followUpNotes || "",
      notes: req.body.notes || "",
    });

    await newConsultation.save();

    if (req.user) {
      await recordAuditEvent({
        userId: req.user.userId,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CREATE',
        module: 'CONSULTATION',
        resourceId: consultationId,
        patientRef: patient.patientId,
        description: `Documented clinical consultation ${consultationId} for ${patient.fullName}`,
      });
    }

    // Update patient metadata
    patient.lastVisitDate = consultationDate;
    if (req.body.followUpDate) {
      patient.nextFollowUpDate = req.body.followUpDate;
    }
    await patient.save();

    const formattedData = {
      ...newConsultation.toObject(),
      id: newConsultation.consultationId,
      date: newConsultation.consultationDate,
    };

    res.status(201).json({
      success: true,
      message: `Consultation record ${consultationId} saved for patient ${patient.fullName}`,
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/patients/:patientId/consultations/:consultationId (and PUT /api/consultations/:id)
 * Update an existing consultation record (DOCTOR & ADMIN only)
 */
export const updateConsultation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role === "RECEPTION" || req.user?.role === "RECEPTIONIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Reception staff are not authorized to update clinical consultations.",
      });
      return;
    }

    const rawConsultationId = req.params.consultationId || req.params.id;
    const consultationId = Array.isArray(rawConsultationId) ? rawConsultationId[0] : (rawConsultationId as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(consultationId);

    const consultation = await Consultation.findOne({
      $or: [{ consultationId }, { _id: isValidObjectId ? consultationId : null }],
    });

    if (!consultation) {
      res.status(404).json({
        success: false,
        error: `Consultation record not found for ID: ${consultationId}`,
      });
      return;
    }

    const allowedUpdates = [
      "presentingComplaint",
      "clinicalObservations",
      "mentalStatusExam",
      "assessment",
      "diagnosis",
      "treatmentPlan",
      "medications",
      "followUpDate",
      "followUpNotes",
      "notes",
      "visitType",
      "time",
      "consultationDate",
    ];

    allowedUpdates.forEach((key) => {
      if (req.body[key] !== undefined) {
        (consultation as any)[key] = req.body[key];
      }
    });

    await consultation.save();

    const formattedData = {
      ...consultation.toObject(),
      id: consultation.consultationId,
      date: consultation.consultationDate,
    };

    res.status(200).json({
      success: true,
      message: `Consultation record ${consultation.consultationId} updated successfully.`,
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};
