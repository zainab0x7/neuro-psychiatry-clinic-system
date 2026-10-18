import { Request, Response, NextFunction } from "express";
import Patient from "../../models/Patient";
import ClinicalRecord from "../../models/ClinicalRecord";
import { recordAuditEvent } from "../utils/auditLogger";

/**
 * Helper to calculate age from date of birth (YYYY-MM-DD)
 */
const calculateAge = (dobString: string): number => {
  if (!dobString) return 30;
  const today = new Date();
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 ? age : 0;
};

/**
 * Safe sequential Patient ID generator (PX-XXXX format)
 */
const generatePatientId = async (): Promise<string> => {
  const count = await Patient.countDocuments();
  let candidateNum = 9401 + count;
  let candidateId = `PX-${candidateNum}`;

  while (await Patient.exists({ patientId: candidateId })) {
    candidateNum++;
    candidateId = `PX-${candidateNum}`;
  }

  return candidateId;
};

/**
 * GET /api/patients
 * Paginated list of active patients with search & filter support
 */
export const getPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = (req.query.search || req.query.q || "").toString().trim();
    const gender = (req.query.gender || "").toString().trim();
    const status = (req.query.status || "").toString().trim();
    const page = Math.max(1, parseInt((req.query.page || "1").toString(), 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit || "50").toString(), 10)));

    const filter: Record<string, any> = { isActive: { $ne: false } };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { patientId: searchRegex },
        { fullName: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ];
    }

    if (gender && gender !== "All") {
      filter.gender = gender;
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    const total = await Patient.countDocuments(filter);
    const skip = (page - 1) * limit;

    const patients = await Patient.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: patients.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        total,
      },
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patients/:id
 * Retrieve a single patient profile by patientId (e.g. PX-9401) or _id
 */
export const getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const patient = await Patient.findOne({
      $or: [{ patientId: id }, { _id: isValidObjectId ? id : null }],
      isActive: { $ne: false },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        error: `Patient record not found for ID: ${id}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patients
 * Register a new patient
 */
export const createPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      status,
      emergencyContact,
      clinicalIntake,
    } = req.body;

    // Check duplicate phone or CNIC
    if (phone || req.body.cnic) {
      const dupQuery: any[] = [];
      if (phone) dupQuery.push({ phone: phone.trim() });
      if (req.body.cnic) dupQuery.push({ cnic: req.body.cnic.trim() });
      const existingPatient = await Patient.findOne({ $or: dupQuery });
      if (existingPatient) {
        res.status(400).json({
          success: false,
          error: "A patient chart with this phone number or CNIC already exists.",
        });
        return;
      }
    }

    const patientId = await generatePatientId();
    const age = req.body.age !== undefined ? req.body.age : calculateAge(dateOfBirth);
    const registeredDate = new Date().toISOString().split("T")[0];
    const createdBy = req.user?.userId || req.user?.email || "SYSTEM";

    const newPatient = new Patient({
      patientId,
      fullName: fullName.trim(),
      dateOfBirth,
      age,
      gender,
      phone: phone.trim(),
      email: email ? email.trim() : "",
      address: address ? address.trim() : "",
      emergencyContact: emergencyContact || { name: "", relationship: "", phone: "" },
      clinicalIntake: clinicalIntake || {
        presentingComplaint: "Initial intake.",
        psychiatricHistory: "No prior documented admissions.",
        currentMedications: "None.",
        allergies: "NKDA.",
        familyHistory: "Non-contributory.",
        riskAssessment: "Low",
      },
      status: status || "Active",
      registeredDate,
      lastVisitDate: "Pending Intake",
      nextFollowUpDate: "Not Scheduled",
      isActive: true,
      createdBy,
    });

    await newPatient.save();

    if (req.user) {
      await recordAuditEvent({
        userId: req.user.userId,
        userName: req.user.name,
        userRole: req.user.role,
        action: "CREATE",
        module: "PATIENTS",
        resourceId: patientId,
        patientRef: patientId,
        description: `Registered new patient ${fullName} (${patientId})`,
      });
    }

    res.status(201).json({
      success: true,
      message: `Patient ${fullName} registered successfully with ID ${patientId}.`,
      data: newPatient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/patients/:id
 * Update an existing patient record
 */
export const updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const patient = await Patient.findOne({
      $or: [{ patientId: id }, { _id: isValidObjectId ? id : null }],
      isActive: { $ne: false },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        error: `Patient record not found for ID: ${id}`,
      });
      return;
    }

    const {
      fullName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      status,
      emergencyContact,
      clinicalIntake,
      lastVisitDate,
      nextFollowUpDate,
    } = req.body;

    if (fullName) patient.fullName = fullName.trim();
    if (dateOfBirth) {
      patient.dateOfBirth = dateOfBirth;
      patient.age = calculateAge(dateOfBirth);
    }
    if (gender) patient.gender = gender;
    if (phone) patient.phone = phone.trim();
    if (email !== undefined) patient.email = email.trim();
    if (address !== undefined) patient.address = address.trim();
    if (status) patient.status = status;
    if (emergencyContact) patient.emergencyContact = { ...patient.emergencyContact, ...emergencyContact };
    if (clinicalIntake) patient.clinicalIntake = { ...patient.clinicalIntake, ...clinicalIntake };
    if (lastVisitDate) patient.lastVisitDate = lastVisitDate;
    if (nextFollowUpDate) patient.nextFollowUpDate = nextFollowUpDate;

    patient.updatedBy = req.user?.userId || req.user?.email || "SYSTEM";

    await patient.save();

    if (req.user) {
      await recordAuditEvent({
        userId: req.user.userId,
        userName: req.user.name,
        userRole: req.user.role,
        action: "UPDATE",
        module: "PATIENTS",
        resourceId: patient.patientId,
        patientRef: patient.patientId,
        description: `Updated chart details for patient ${patient.fullName} (${patient.patientId})`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Patient record ${patient.patientId} updated successfully.`,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/patients/:id
 * Soft delete / deactivate patient record
 */
export const deletePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const patient = await Patient.findOne({
      $or: [{ patientId: id }, { _id: isValidObjectId ? id : null }],
      isActive: { $ne: false },
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        error: `Patient record not found for ID: ${id}`,
      });
      return;
    }

    patient.isActive = false;
    patient.status = "Discharged";
    patient.updatedBy = req.user?.userId || req.user?.email || "SYSTEM";

    await patient.save();

    if (req.user) {
      await recordAuditEvent({
        userId: req.user.userId,
        userName: req.user.name,
        userRole: req.user.role,
        action: "DELETE",
        module: "PATIENTS",
        resourceId: patient.patientId,
        patientRef: patient.patientId,
        description: `Deactivated patient record for ${patient.fullName} (${patient.patientId})`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Patient ${patient.patientId} record deactivated successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patients/:patientId/clinical-records
 */
export const getClinicalRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawPatientId = req.params.patientId || (req.query.patientId as string);
    const patientId = Array.isArray(rawPatientId) ? rawPatientId[0] : (rawPatientId as string);

    const records = await ClinicalRecord.find({ patientId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: records.length,
      data: records.map(r => r.toJSON ? r.toJSON() : r),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patients/:patientId/clinical-records
 */
export const createClinicalRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawPatientId = req.params.patientId || req.body.patientId;
    const patientId = Array.isArray(rawPatientId) ? rawPatientId[0] : (rawPatientId as string);

    const { recordType, details, author } = req.body;
    const newRecord = new ClinicalRecord({
      patientId,
      recordType: recordType || 'CLINICAL_RECORD',
      details: details || req.body,
      author: author || req.user?.name || 'System',
      createdBy: req.user?.userId || 'SYSTEM',
    });

    await newRecord.save();

    res.status(201).json({
      success: true,
      message: 'Clinical record documented successfully.',
      data: newRecord.toJSON ? newRecord.toJSON() : newRecord,
    });
  } catch (error) {
    next(error);
  }
};
