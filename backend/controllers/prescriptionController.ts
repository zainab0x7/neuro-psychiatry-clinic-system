import { Request, Response, NextFunction } from "express";
import Prescription, { IPrescription } from "../../models/Prescription";
import Patient from "../../models/Patient";
import ClinicSettings from "../../models/ClinicSettings";
import { recordAuditEvent } from "../utils/auditLogger";

/**
 * Helper to generate sequential Prescription ID (RX-XXXX)
 */
const generatePrescriptionId = async (): Promise<string> => {
  const count = await Prescription.countDocuments();
  let candidateNum = 901 + count;
  let candidateId = `RX-${candidateNum}`;

  while (await Prescription.exists({ prescriptionId: candidateId })) {
    candidateNum++;
    candidateId = `RX-${candidateNum}`;
  }

  return candidateId;
};

/**
 * Helper to sanitize clinical prescription details for RECEPTION role
 */
const sanitizeForReception = (rx: any) => {
  const obj = typeof rx.toObject === "function" ? rx.toObject() : { ...rx };
  return {
    ...obj,
    treatmentNotes: "[Restricted: Clinical Note Access Limited for Reception]",
    treatmentPlan: "[Restricted: Clinical Note Access Limited for Reception]",
    instructions: "[Restricted: Clinical Note Access Limited for Reception]",
    medications: obj.medications?.map((m: any) => ({
      ...m,
      instructions: "[Restricted for Reception]",
    })),
  };
};

/**
 * GET /api/patients/:patientId/prescriptions (and GET /api/prescriptions)
 * Retrieve prescription history for a patient
 */
export const getPatientPrescriptions = async (
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

    const prescriptions = await Prescription.find(filter).sort({ prescriptionDate: -1, createdAt: -1 });

    const isReception = req.user?.role === "RECEPTION" || req.user?.role === "RECEPTIONIST";
    const data = isReception
      ? prescriptions.map(r => sanitizeForReception(r))
      : prescriptions.map(r => ({
          ...r.toObject(),
          id: r.prescriptionId,
          dateIssued: r.prescriptionDate || r.dateIssued,
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
 * GET /api/patients/:patientId/prescriptions/:prescriptionId (and GET /api/prescriptions/:id)
 * Retrieve a specific prescription record
 */
export const getPrescriptionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawParam = req.params.prescriptionId || req.params.id;
    const prescriptionId = Array.isArray(rawParam) ? rawParam[0] : (rawParam as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(prescriptionId);

    const rx = await Prescription.findOne({
      $or: [{ prescriptionId }, { _id: isValidObjectId ? prescriptionId : null }],
    });

    if (!rx) {
      res.status(404).json({
        success: false,
        error: `Prescription record not found for ID: ${prescriptionId}`,
      });
      return;
    }

    if (req.params.patientId && rx.patientId !== req.params.patientId) {
      const patient = await Patient.findOne({ patientId: req.params.patientId });
      if (!patient || rx.patientId !== patient.patientId) {
        res.status(404).json({
          success: false,
          error: `Prescription ${prescriptionId} does not belong to patient ${req.params.patientId}`,
        });
        return;
      }
    }

    const isReception = req.user?.role === "RECEPTION" || req.user?.role === "RECEPTIONIST";
    const data = isReception
      ? sanitizeForReception(rx)
      : {
          ...rx.toObject(),
          id: rx.prescriptionId,
          dateIssued: rx.prescriptionDate || rx.dateIssued,
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
 * POST /api/patients/:patientId/prescriptions (and POST /api/prescriptions)
 * Create a new digital prescription (DOCTOR & ADMIN only)
 */
export const createPrescription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role === "RECEPTION" || req.user?.role === "RECEPTIONIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Reception staff are not authorized to create digital prescriptions.",
      });
      return;
    }

    const targetPatientId = req.params.patientId || req.body.patientId;
    if (!targetPatientId) {
      res.status(400).json({
        success: false,
        error: "Patient ID reference is required to issue a prescription.",
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

    const settings = await ClinicSettings.findOne();
    const prescriptionId = await generatePrescriptionId();
    const doctorId = req.user?.userId || req.user?._id?.toString() || req.body.doctorId || "USR-001";
    const doctorName = req.user?.name || req.body.doctorName || "DR SHAHAB MUHAMMAD";
    const doctorLicense = req.body.doctorLicense || settings?.licenseNumber || "NY-MED-849201";
    const prescriptionDate = req.body.prescriptionDate || req.body.dateIssued || new Date().toISOString().split("T")[0];

    const newPrescription = new Prescription({
      prescriptionId,
      patientId: patient.patientId,
      patientName: patient.fullName,
      patientAge: patient.age,
      patientGender: patient.gender,
      doctorId,
      doctorName,
      clinicianId: doctorId,
      clinicianName: doctorName,
      doctorLicense,
      prescriptionDate,
      dateIssued: prescriptionDate,
      consultationId: req.body.consultationId || "",
      diagnosis: req.body.diagnosis,
      medications: req.body.medications,
      treatmentPlan: req.body.treatmentNotes || req.body.treatmentPlan || "",
      treatmentNotes: req.body.treatmentNotes || req.body.treatmentPlan || "",
      instructions: req.body.instructions || "",
      status: req.body.status || "Active",
    });

    await newPrescription.save();

    if (req.user) {
      await recordAuditEvent({
        userId: req.user.userId,
        userName: req.user.name,
        userRole: req.user.role,
        action: "CREATE",
        module: "PRESCRIPTION",
        resourceId: prescriptionId,
        patientRef: patient.patientId,
        description: `Issued digital prescription ${prescriptionId} for ${patient.fullName}`,
      });
    }

    const formattedData = {
      ...newPrescription.toObject(),
      id: newPrescription.prescriptionId,
      dateIssued: newPrescription.prescriptionDate,
    };

    res.status(201).json({
      success: true,
      message: `Prescription ${prescriptionId} issued successfully for patient ${patient.fullName}`,
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/patients/:patientId/prescriptions/:prescriptionId (and PUT /api/prescriptions/:id)
 * Update an existing prescription (DOCTOR & ADMIN only)
 */
export const updatePrescription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role === "RECEPTION" || req.user?.role === "RECEPTIONIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Reception staff are not authorized to update digital prescriptions.",
      });
      return;
    }

    const rawParam = req.params.prescriptionId || req.params.id;
    const prescriptionId = Array.isArray(rawParam) ? rawParam[0] : (rawParam as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(prescriptionId);

    const rx = await Prescription.findOne({
      $or: [{ prescriptionId }, { _id: isValidObjectId ? prescriptionId : null }],
    });

    if (!rx) {
      res.status(404).json({
        success: false,
        error: `Prescription record not found for ID: ${prescriptionId}`,
      });
      return;
    }

    const allowedUpdates = [
      "diagnosis",
      "medications",
      "treatmentNotes",
      "treatmentPlan",
      "instructions",
      "status",
      "prescriptionDate",
      "dateIssued",
    ];

    allowedUpdates.forEach((key) => {
      if (req.body[key] !== undefined) {
        (rx as any)[key] = req.body[key];
      }
    });

    await rx.save();

    const formattedData = {
      ...rx.toObject(),
      id: rx.prescriptionId,
      dateIssued: rx.prescriptionDate,
    };

    res.status(200).json({
      success: true,
      message: `Prescription ${rx.prescriptionId} updated successfully.`,
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patients/:patientId/prescriptions/:id/reuse (and POST /api/prescriptions/:id/reuse)
 * Reissues an existing prescription as a NEW prescription record
 */
export const reusePrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === "RECEPTION" || req.user?.role === "RECEPTIONIST" || req.user?.role === "THERAPIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Only licensed physicians are authorized to reissue prescriptions.",
      });
      return;
    }

    const rawId = req.params.prescriptionId || req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const originalRx = await Prescription.findOne({
      $or: [{ prescriptionId: id }, { _id: isValidObjectId ? id : null }],
    });

    if (!originalRx) {
      res.status(404).json({
        success: false,
        error: `Original prescription '${id}' not found for reuse.`,
      });
      return;
    }

    const newPrescriptionId = await generatePrescriptionId();
    const newRx = new Prescription({
      prescriptionId: newPrescriptionId,
      patientId: originalRx.patientId,
      patientName: originalRx.patientName,
      patientAge: originalRx.patientAge,
      patientGender: originalRx.patientGender,
      doctorId: req.user?.userId || originalRx.doctorId,
      doctorName: req.user?.name || originalRx.doctorName,
      doctorLicense: originalRx.doctorLicense,
      prescriptionDate: new Date().toISOString().split("T")[0],
      diagnosis: originalRx.diagnosis,
      medications: originalRx.medications,
      notes: `Reissued from ${originalRx.prescriptionId}. ${originalRx.notes || ''}`.trim(),
      status: "Active",
      createdBy: req.user?.userId || req.user?.name || "DOCTOR",
    });

    await newRx.save();

    if (req.user) {
      await recordAuditEvent({
        userId: req.user.userId,
        userName: req.user.name,
        userRole: req.user.role,
        action: "CREATE",
        module: "PRESCRIPTION",
        resourceId: newPrescriptionId,
        patientRef: originalRx.patientId,
        description: `Reissued digital prescription ${newPrescriptionId} (from ${originalRx.prescriptionId}) for ${originalRx.patientName}`,
      });
    }

    res.status(201).json({
      success: true,
      message: `Prescription reissued successfully as ${newPrescriptionId}.`,
      data: {
        ...newRx.toObject(),
        id: newRx.prescriptionId,
        dateIssued: newRx.prescriptionDate,
      },
    });
  } catch (error) {
    next(error);
  }
};
