import { Request, Response, NextFunction } from "express";
import FeeCategory, { IFeeCategoryDoc } from "../../models/FeeCategory";
import Payment, { IPaymentDoc } from "../../models/Payment";
import Patient from "../../models/Patient";
import { logger } from "../utils/logger";
import { recordAuditEvent } from "../utils/auditLogger";

/**
 * Helper to format FeeCategory document for API responses.
 */
const formatFeeCategory = (doc: IFeeCategoryDoc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const formatted: Record<string, any> = {
    ...obj,
    id: obj.categoryId || obj.id || obj._id,
  };
  delete formatted._id;
  delete formatted.__v;
  return formatted;
};

/**
 * Helper to format Payment document for API responses.
 */
const formatPayment = (doc: IPaymentDoc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const formatted: Record<string, any> = {
    ...obj,
    id: obj.paymentId || obj.id || obj._id,
  };
  delete formatted._id;
  delete formatted.__v;
  return formatted;
};

// ==========================================
// FEE CATEGORY CONTROLLERS
// ==========================================

/**
 * GET /api/fee-categories
 */
export const getFeeCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await FeeCategory.find().sort({ createdAt: 1 }).lean();
    const formatted = categories.map((c: any) => ({
      ...c,
      id: c.categoryId || c.id || c._id,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    logger.error("Error fetching fee categories:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while fetching fee categories.",
    });
  }
};

/**
 * POST /api/fee-categories
 */
export const createFeeCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId || req.user?.id;

    if (userRole !== "ADMIN") {
      res.status(403).json({
        success: false,
        error: "Access denied. Only system Administrators can configure fee categories.",
      });
      return;
    }

    const { name, defaultFee, amount, description, isActive } = req.body;
    const feeValue = Number(amount || defaultFee);

    if (isNaN(feeValue) || feeValue <= 0) {
      res.status(400).json({
        success: false,
        error: "Default fee amount must be a positive monetary value (> 0).",
      });
      return;
    }

    const count = await FeeCategory.countDocuments();
    const categoryId = req.body.categoryId || req.body.id || `FEE-${100 + count + 1}`;

    const newCategory = new FeeCategory({
      categoryId,
      name,
      defaultFee: feeValue,
      amount: feeValue,
      description: description || "",
      isActive: isActive !== false,
      createdBy: userId,
      updatedBy: userId,
    });

    await newCategory.save();
    logger.info(`Created fee category '${name}' (${categoryId}) by admin ${userId}`);

    res.status(201).json({
      success: true,
      message: `Fee category '${name}' created successfully.`,
      data: formatFeeCategory(newCategory),
    });
  } catch (error: any) {
    logger.error("Error creating fee category:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while creating fee category.",
    });
  }
};

/**
 * PUT /api/fee-categories/:id
 */
export const updateFeeCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId || req.user?.id;

    if (userRole !== "ADMIN") {
      res.status(403).json({
        success: false,
        error: "Access denied. Only system Administrators can modify fee categories.",
      });
      return;
    }

    const rawId = req.params.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(targetId);

    const category = await FeeCategory.findOne({
      $or: [{ categoryId: targetId }, { _id: isValidObjectId ? targetId : null }],
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: `Fee category '${targetId}' not found.`,
      });
      return;
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;
    delete updates.categoryId;

    if (updates.defaultFee !== undefined || updates.amount !== undefined) {
      const feeVal = Number(updates.amount || updates.defaultFee);
      if (isNaN(feeVal) || feeVal <= 0) {
        res.status(400).json({
          success: false,
          error: "Fee amount must be a positive monetary value (> 0).",
        });
        return;
      }
      updates.defaultFee = feeVal;
      updates.amount = feeVal;
    }

    Object.assign(category, updates, { updatedBy: userId });
    await category.save();

    logger.info(`Updated fee category '${category.name}' (${category.categoryId})`);

    res.status(200).json({
      success: true,
      message: `Fee category '${category.name}' updated successfully.`,
      data: formatFeeCategory(category),
    });
  } catch (error: any) {
    logger.error("Error updating fee category:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while updating fee category.",
    });
  }
};

// ==========================================
// PAYMENT CONTROLLERS
// ==========================================

/**
 * GET /api/payments
 */
export const getPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, date, month, status } = req.query;
    const userRole = req.user?.role;

    // THERAPIST restriction
    if (userRole === "THERAPIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Therapists do not have access to financial administration records.",
      });
      return;
    }

    const filter: any = {};
    if (patientId) filter.patientId = patientId;
    if (date) filter.date = date;
    if (status) filter.paymentStatus = new RegExp(`^${status}$`, "i");

    if (month && typeof month === "string") {
      filter.date = new RegExp(`^${month}`);
    }

    const payments = await Payment.find(filter).sort({ createdAt: -1 }).lean();
    const formatted = payments.map((p: any) => ({
      ...p,
      id: p.paymentId || p.id || p._id,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    logger.error("Error fetching payments:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while fetching payment records.",
    });
  }
};

/**
 * GET /api/payments/:id
 */
export const getPaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;

    if (userRole === "THERAPIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Therapists do not have access to financial records.",
      });
      return;
    }

    const rawId = req.params.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(targetId);

    const payment = await Payment.findOne({
      $or: [{ paymentId: targetId }, { receiptNumber: targetId }, { _id: isValidObjectId ? targetId : null }],
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: `Payment record '${targetId}' not found.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatPayment(payment),
    });
  } catch (error: any) {
    logger.error("Error fetching payment by ID:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while retrieving payment details.",
    });
  }
};

/**
 * GET /api/patients/:patientId/payments
 */
export const getPatientPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const userRole = req.user?.role;

    if (userRole === "THERAPIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Therapists do not have access to financial records.",
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

    const payments = await Payment.find({ patientId }).sort({ createdAt: -1 }).lean();
    const formatted = payments.map((p: any) => ({
      ...p,
      id: p.paymentId || p.id || p._id,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    logger.error("Error fetching patient payments:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while fetching patient payment history.",
    });
  }
};

/**
 * POST /api/payments
 */
export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId || req.user?.id;
    const userName = req.user?.name || "Staff";

    // Only ADMIN and RECEPTION can process payments
    if (userRole !== "ADMIN" && userRole !== "RECEPTION" && userRole !== "RECEPTIONIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Only Reception and Admin staff can process payments.",
      });
      return;
    }

    const { patientId, amount, service, feeCategory, feeCategoryId, paymentMethod, paymentStatus, notes, date } = req.body;

    if (!patientId) {
      res.status(400).json({
        success: false,
        error: "Patient ID is required to process a payment.",
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

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      res.status(400).json({
        success: false,
        error: "Payment amount must be a valid positive monetary value (> 0).",
      });
      return;
    }

    const totalCount = await Payment.countDocuments();
    const generatedPaymentId = req.body.paymentId || req.body.id || `PY-${400 + totalCount + 1}`;
    
    // BACKEND RECEIPT NUMBER GENERATION LOGIC
    const currentYear = new Date().getFullYear();
    const receiptSeq = String(totalCount + 101).padStart(4, "0");
    const generatedReceiptNumber = req.body.receiptNumber && req.body.receiptNumber.startsWith("RCP-") 
      ? req.body.receiptNumber 
      : `RCP-${currentYear}-${receiptSeq}`;

    const paymentDate = date || req.body.paymentDate || new Date().toISOString().split("T")[0];

    const newPayment = new Payment({
      paymentId: generatedPaymentId,
      receiptNumber: generatedReceiptNumber,
      patientId: patient.patientId,
      patientName: req.body.patientName || patient.fullName,
      appointmentId: req.body.appointmentId || "",
      consultationId: req.body.consultationId || "",
      feeCategoryId: feeCategoryId || "",
      service: service || "Consultation Service",
      feeCategory: feeCategory || "Consultation",
      amount: paymentAmount,
      paymentMethod: paymentMethod || "Cash",
      paymentStatus: paymentStatus || "Paid",
      date: paymentDate,
      paymentDate,
      notes: notes || "",
      receivedBy: userName,
      createdBy: userId,
      updatedBy: userId,
    });

    await newPayment.save();

    if (req.user) {
      await recordAuditEvent({
        userId: req.user.userId,
        userName: req.user.name,
        userRole: req.user.role,
        action: "CREATE",
        module: "BILLING",
        resourceId: newPayment.paymentId,
        patientRef: patient.patientId,
        description: `Processed payment ${newPayment.paymentId} ($${paymentAmount}, Receipt ${newPayment.receiptNumber}) for ${patient.fullName}`,
      });
    }

    logger.info(`Processed payment ${newPayment.paymentId} (Receipt ${newPayment.receiptNumber}) for $${paymentAmount} by ${userName}`);

    res.status(201).json({
      success: true,
      message: `Payment of $${paymentAmount} processed. Receipt #${newPayment.receiptNumber} generated.`,
      data: formatPayment(newPayment),
    });
  } catch (error: any) {
    logger.error("Error processing payment:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while processing payment record.",
    });
  }
};

/**
 * PUT /api/payments/:id
 */
export const updatePayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId || req.user?.id;

    if (userRole !== "ADMIN" && userRole !== "RECEPTION" && userRole !== "RECEPTIONIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Only Reception and Admin staff can update payment records.",
      });
      return;
    }

    const rawId = req.params.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(targetId);

    const payment = await Payment.findOne({
      $or: [{ paymentId: targetId }, { receiptNumber: targetId }, { _id: isValidObjectId ? targetId : null }],
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: `Payment record '${targetId}' not found.`,
      });
      return;
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;
    delete updates.paymentId;
    delete updates.receiptNumber; // Receipt number is strictly immutable!

    if (updates.amount !== undefined) {
      const amtVal = Number(updates.amount);
      if (isNaN(amtVal) || amtVal <= 0) {
        res.status(400).json({
          success: false,
          error: "Payment amount must be a positive monetary value (> 0).",
        });
        return;
      }
      updates.amount = amtVal;
    }

    Object.assign(payment, updates, { updatedBy: userId });
    await payment.save();

    logger.info(`Updated payment record ${payment.paymentId} (Receipt ${payment.receiptNumber})`);

    res.status(200).json({
      success: true,
      message: `Payment record '${payment.paymentId}' updated.`,
      data: formatPayment(payment),
    });
  } catch (error: any) {
    logger.error("Error updating payment record:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while updating payment status.",
    });
  }
};

/**
 * GET /api/payments/:id/receipt
 */
export const getPaymentReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawId = req.params.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : (rawId as string);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(targetId);

    const payment = await Payment.findOne({
      $or: [{ paymentId: targetId }, { receiptNumber: targetId }, { _id: isValidObjectId ? targetId : null }],
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: `Receipt record for ID '${targetId}' not found.`,
      });
      return;
    }

    const receiptPayload = {
      receiptNumber: payment.receiptNumber,
      paymentId: payment.paymentId,
      date: payment.date,
      clinic: {
        name: "Neuro Psychiatry Clinic",
        address: "680 Fifth Avenue, Suite 1800, New York, NY 10019",
        phone: "+1 (555) 800-VANCE",
        email: "billing@vancepsychiatry.com",
      },
      patient: {
        patientId: payment.patientId,
        patientName: payment.patientName,
      },
      service: payment.service,
      feeCategory: payment.feeCategory,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      receivedBy: payment.receivedBy || "Clinic Coordinator",
      notes: payment.notes || "",
    };

    res.status(200).json({
      success: true,
      data: receiptPayload,
    });
  } catch (error: any) {
    logger.error("Error generating receipt payload:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while generating receipt document.",
    });
  }
};

// ==========================================
// COLLECTION REPORTS CONTROLLERS
// ==========================================

/**
 * GET /api/reports/collections/daily
 */
export const getDailyCollectionReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    if (userRole === "THERAPIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Therapists do not have access to financial collection reports.",
      });
      return;
    }

    const targetDate = (req.query.date as string) || new Date().toISOString().split("T")[0];

    const payments = await Payment.find({
      date: targetDate,
      paymentStatus: { $in: ["Paid", "PAID"] },
    }).lean();

    const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

    const methodBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};

    payments.forEach((p) => {
      const method = p.paymentMethod || "Other";
      const cat = p.feeCategory || "Consultation";
      methodBreakdown[method] = (methodBreakdown[method] || 0) + p.amount;
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + p.amount;
    });

    res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        totalCollected,
        paymentCount: payments.length,
        methodBreakdown,
        categoryBreakdown,
        payments: payments.map((p: any) => formatPayment(p)),
      },
    });
  } catch (error: any) {
    logger.error("Error calculating daily collection report:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while calculating daily collections.",
    });
  }
};

/**
 * GET /api/reports/collections/monthly
 */
export const getMonthlyCollectionReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    if (userRole === "THERAPIST") {
      res.status(403).json({
        success: false,
        error: "Access denied. Therapists do not have access to financial collection reports.",
      });
      return;
    }

    const current = new Date();
    const year = (req.query.year as string) || String(current.getFullYear());
    let month = (req.query.month as string) || String(current.getMonth() + 1).padStart(2, "0");

    if (month.length === 1) month = `0${month}`;

    const monthPrefix = `${year}-${month}`;

    const payments = await Payment.find({
      date: new RegExp(`^${monthPrefix}`),
      paymentStatus: { $in: ["Paid", "PAID"] },
    }).lean();

    const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

    const dailyTotals: Record<string, { total: number; count: number }> = {};

    payments.forEach((p) => {
      const d = p.date;
      if (!dailyTotals[d]) {
        dailyTotals[d] = { total: 0, count: 0 };
      }
      dailyTotals[d].total += p.amount;
      dailyTotals[d].count += 1;
    });

    res.status(200).json({
      success: true,
      data: {
        year,
        month,
        period: monthPrefix,
        totalCollected,
        paymentCount: payments.length,
        dailyTotals,
      },
    });
  } catch (error: any) {
    logger.error("Error calculating monthly collection report:", error.message || error);
    res.status(500).json({
      success: false,
      error: "Internal server error while calculating monthly collection metrics.",
    });
  }
};
