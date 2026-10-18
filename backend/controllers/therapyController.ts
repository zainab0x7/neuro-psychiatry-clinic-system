import { Request, Response, NextFunction } from "express";
import TherapySession, { ITherapySessionDoc } from "../../models/TherapySession";
import Patient from "../../models/Patient";
import { logger } from "../utils/logger";
import { recordAuditEvent } from "../utils/auditLogger";

/**
 * Format therapy session document for API responses.
 */
const formatTherapySession = (doc: ITherapySessionDoc, isReception = false) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const sId = doc.sessionId || obj.sessionId || (obj._id ? obj._id.toString() : '');
  
  const formatted: Record<string, any> = {
    ...obj,
    id: sId,
    sessionId: sId,
  };

  delete formatted._id;
  delete formatted.__v;

  // Redact sensitive clinical notes for Reception staff
  if (isReception) {
    formatted.assessment = "[REDACTED — Sensitive Therapy Note]";
    formatted.counselling = "[REDACTED — Sensitive Therapy Note]";
    formatted.intervention = "[REDACTED — Sensitive Therapy Note]";
    formatted.progressNotes = "[REDACTED — Sensitive Therapy Note]";
    formatted.psychometrics = "[REDACTED — Sensitive Therapy Note]";
    formatted.lifestyleInterventions = "[REDACTED — Sensitive Therapy Note]";
    formatted.followUpPlan = "[REDACTED — Sensitive Therapy Note]";
  }

  return formatted;
};

/**
 * GET /api/patients/:patientId/therapy-sessions
 * GET /api/therapy-sessions (optional query ?patientId=...)
 */
export const getPatientTherapySessions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const patientId = req.params.patientId || (req.query.patientId as string);
    const userRole = req.user?.role;
    const userId = req.user?.userId || req.user?.id;

    if (patientId) {
      const patientExists = await Patient.findOne({ patientId, isActive: true });
      if (!patientExists) {
        res.status(404).json({
          success: false,
          error: `Patient with ID '${patientId}' not found.`,
        });
        return;
      }
    }

    const filter: any = {};
    if (patientId) filter.patientId = patientId;

    // THERAPIST restriction check
    if (userRole === "THERAPIST") {
      // Allow if session belongs to therapist or if patient is assigned
      filter.$or = [
        { therapistId: userId },
        { responsibleClinicianId: userId },
        { createdBy: userId },
        { patientId: patientId } // Accessible patients
      ];
    }

    const sessions = await TherapySession.find(filter)
      .sort({ sessionDate: -1, createdAt: -1 })
      .lean();

    const isReception = userRole === "RECEPTION" || userRole === "RECEPTIONIST";

    const formattedSessions = sessions.map((s: any) => {
      const formatted: Record<string, any> = {
        ...s,
        id: s.sessionId || s.id || s._id,
      };
      delete formatted._id;
      delete formatted.__v;

      if (isReception) {
        formatted.assessment = "[REDACTED — Sensitive Therapy Note]";
        formatted.counselling = "[REDACTED — Sensitive Therapy Note]";
        formatted.intervention = "[REDACTED — Sensitive Therapy Note]";
        formatted.progressNotes = "[REDACTED — Sensitive Therapy Note]";
        formatted.psychometrics = "[REDACTED — Sensitive Therapy Note]";
        formatted.lifestyleInterventions = "[REDACTED — Sensitive Therapy Note]";
        formatted.followUpPlan = "[REDACTED — Sensitive Therapy Note]";
      }

      return formatted;
    });

    res.status(200).json({
      success: true,
      count: formattedSessions.length,
      data: formattedSessions,
    });
  } catch (error: any) {
    logger.error("Error fetching therapy sessions:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while fetching therapy session history.",
    });
  }
};

/**
 * GET /api/patients/:patientId/therapy-sessions/:sessionId
 * GET /api/therapy-sessions/:sessionId
 */
export const getTherapySessionById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, sessionId } = req.params;
    const targetSessionId = sessionId || req.params.id;
    const userRole = req.user?.role;
    const userId = req.user?.userId || req.user?.id;

    if (patientId) {
      const patientExists = await Patient.findOne({ patientId, isActive: true });
      if (!patientExists) {
        res.status(404).json({
          success: false,
          error: `Patient with ID '${patientId}' not found.`,
        });
        return;
      }
    }

    const targetSessionIdStr = Array.isArray(targetSessionId) ? targetSessionId[0] : (targetSessionId as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(targetSessionIdStr);

    const session = await TherapySession.findOne({
      $or: [{ sessionId: targetSessionIdStr }, { _id: isValidObjectId ? targetSessionIdStr : null }],
      ...(patientId ? { patientId } : {}),
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: `Therapy session record '${targetSessionId}' not found.`,
      });
      return;
    }

    // THERAPIST access check
    if (userRole === "THERAPIST") {
      const isOwner =
        session.therapistId === userId ||
        session.createdBy === userId ||
        session.responsibleClinicianId === userId;
      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: "Access denied. You can only view therapy session notes for patients assigned to you.",
        });
        return;
      }
    }

    const isReception = userRole === "RECEPTION" || userRole === "RECEPTIONIST";
    res.status(200).json({
      success: true,
      data: formatTherapySession(session, isReception),
    });
  } catch (error: any) {
    logger.error("Error fetching therapy session by ID:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while retrieving therapy session record.",
    });
  }
};

/**
 * POST /api/patients/:patientId/therapy-sessions
 * POST /api/therapy-sessions
 */
export const createTherapySession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId || req.user?.id;
    const userName = req.user?.name || "Clinician";

    // RECEPTION staff are prohibited from creating therapy notes
    if (userRole === "RECEPTION" || userRole === "RECEPTIONIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Reception staff cannot create or modify psychotherapy notes.",
      });
      return;
    }

    const rawPatientId = req.params.patientId || req.body.patientId;
    const patientId = Array.isArray(rawPatientId) ? rawPatientId[0] : (rawPatientId as string);
    if (!patientId) {
      res.status(400).json({
        success: false,
        error: "Patient ID is required to create a therapy session.",
      });
      return;
    }

    const patient = await Patient.findOne({ patientId, isActive: true });
    if (!patient) {
      res.status(404).json({
        success: false,
        error: `Patient with ID '${patientId}' not found.`,
      });
      return;
    }

    // THERAPIST assignment check
    if (userRole === "THERAPIST") {
      const bodyTherapist = req.body.therapistId;
      if (bodyTherapist && bodyTherapist !== userId) {
        res.status(403).json({
          success: false,
          error: "Access denied. Therapists can only create sessions assigned to themselves.",
        });
        return;
      }
    }

    const totalCount = await TherapySession.countDocuments();
    const generatedSessionId = req.body.sessionId || req.body.id || `TS-${700 + totalCount + 1}`;

    const newSession = new TherapySession({
      ...req.body,
      sessionId: generatedSessionId,
      patientId: patient.patientId,
      patientName: req.body.patientName || patient.fullName,
      therapistId: req.body.therapistId || userId,
      therapistName: req.body.therapistName || userName,
      responsibleClinician: req.body.responsibleClinician || userName,
      responsibleClinicianId: req.body.responsibleClinicianId || userId,
      createdBy: userId,
      updatedBy: userId,
      status: req.body.status || 'Completed',
    });

    await newSession.save();

    if (req.user) {
      await recordAuditEvent({
        userId: req.user.userId,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'CREATE',
        module: 'THERAPY',
        resourceId: newSession.sessionId,
        patientRef: patient.patientId,
        description: `Logged ${newSession.sessionType} psychotherapy session ${newSession.sessionId} for ${patient.fullName}`,
      });
    }

    logger.info(`Psychotherapy session ${newSession.sessionId} logged for patient ${patient.patientId} by ${userName}`);

    res.status(201).json({
      success: true,
      message: `Therapy session ${newSession.sessionId} recorded successfully.`,
      data: formatTherapySession(newSession, false),
    });
  } catch (error: any) {
    logger.error("Error creating therapy session:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while saving therapy session record.",
    });
  }
};

/**
 * PUT /api/patients/:patientId/therapy-sessions/:sessionId
 * PUT /api/therapy-sessions/:sessionId
 */
export const updateTherapySession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId || req.user?.id;

    // RECEPTION restriction
    if (userRole === "RECEPTION" || userRole === "RECEPTIONIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Reception staff cannot create or modify psychotherapy notes.",
      });
      return;
    }

    const { patientId, sessionId } = req.params;
    const targetSessionId = sessionId || req.params.id;

    if (patientId) {
      const patientExists = await Patient.findOne({ patientId, isActive: true });
      if (!patientExists) {
        res.status(404).json({
          success: false,
          error: `Patient with ID '${patientId}' not found.`,
        });
        return;
      }
    }

    const targetSessionIdStr = Array.isArray(targetSessionId) ? targetSessionId[0] : (targetSessionId as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(targetSessionIdStr);

    const existingSession = await TherapySession.findOne({
      $or: [{ sessionId: targetSessionIdStr }, { _id: isValidObjectId ? targetSessionIdStr : null }],
      ...(patientId ? { patientId } : {}),
    });

    if (!existingSession) {
      res.status(404).json({
        success: false,
        error: `Therapy session record '${targetSessionId}' not found.`,
      });
      return;
    }

    // THERAPIST authorization check
    if (userRole === "THERAPIST") {
      const isOwner =
        existingSession.therapistId === userId ||
        existingSession.createdBy === userId ||
        existingSession.responsibleClinicianId === userId;

      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: "Access denied. You can only modify therapy sessions assigned to you.",
        });
        return;
      }
    }

    const allowedUpdates = { ...req.body };
    delete allowedUpdates._id;
    delete allowedUpdates.id;
    delete allowedUpdates.sessionId;

    Object.assign(existingSession, allowedUpdates, { updatedBy: userId });
    await existingSession.save();

    logger.info(`Therapy session ${existingSession.sessionId} updated by user ${userId}`);

    res.status(200).json({
      success: true,
      message: `Therapy session ${existingSession.sessionId} updated successfully.`,
      data: formatTherapySession(existingSession, false),
    });
  } catch (error: any) {
    logger.error("Error updating therapy session:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while updating therapy session record.",
    });
  }
};
