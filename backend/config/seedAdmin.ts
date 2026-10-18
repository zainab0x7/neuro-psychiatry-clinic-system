import User from "../../models/User";
import { logger } from "../utils/logger";

/**
 * Seeds initial staff accounts for all 4 roles if the database contains no users.
 */
export const seedDefaultAdmin = async (): Promise<void> => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return;
    }

    const isProd = process.env.NODE_ENV === "production";

    if (isProd) {
      const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
      const adminPass = process.env.INITIAL_ADMIN_PASSWORD;

      if (adminEmail && adminPass) {
        const prodAdmin = new User({
          userId: "USR-001",
          name: "Clinic Administrator",
          email: adminEmail,
          passwordHash: adminPass,
          role: "ADMIN",
          title: "System Administrator",
          department: "Administration",
          permissions: {
            canWriteClinicalNotes: true,
            canPrescribe: true,
            canManagePatients: true,
            canManageAppointments: true,
            canManageUsers: true,
            canViewReports: true,
          },
          isActive: true,
          lastActive: new Date().toISOString(),
        });
        await prodAdmin.save();
        logger.info(`Production initial admin account created for '${adminEmail}'.`);
      } else {
        logger.warn(
          "NOTICE: Production database contains zero staff accounts. Provide INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in environment variables to bootstrap an admin account."
        );
      }
      return;
    }

    const defaultStaff = [
      {
        userId: "USR-001",
        name: "Clinic Administrator",
        email: process.env.INITIAL_ADMIN_EMAIL || "admin@clinic.com",
        passwordHash: process.env.INITIAL_ADMIN_PASSWORD || "Admin@123456",
        role: "ADMIN" as const,
        title: "System Administrator",
        department: "Administration",
        permissions: {
          canWriteClinicalNotes: true,
          canPrescribe: true,
          canManagePatients: true,
          canManageAppointments: true,
          canManageUsers: true,
          canViewReports: true,
        },
        isActive: true,
      },
      {
        userId: "USR-002",
        name: "Marcus Sterling",
        email: "m.sterling@vancepsychiatry.com",
        passwordHash: "Vance2026!",
        role: "ADMIN" as const,
        title: "Practice Director",
        department: "Administration",
        permissions: {
          canWriteClinicalNotes: true,
          canPrescribe: true,
          canManagePatients: true,
          canManageAppointments: true,
          canManageUsers: true,
          canViewReports: true,
        },
        isActive: true,
      },
      {
        userId: "USR-003",
        name: "DR SHAHAB MUHAMMAD",
        email: "dr.vance@vancepsychiatry.com",
        passwordHash: "Vance2026!",
        role: "DOCTOR" as const,
        title: "HOD & Consultant Psychiatrist",
        department: "Psychiatry",
        permissions: {
          canWriteClinicalNotes: true,
          canPrescribe: true,
          canManagePatients: true,
          canManageAppointments: true,
          canManageUsers: false,
          canViewReports: true,
        },
        isActive: true,
      },
      {
        userId: "USR-004",
        name: "Sarah Jenkins",
        email: "s.jenkins@vancepsychiatry.com",
        passwordHash: "Vance2026!",
        role: "RECEPTION" as const,
        title: "Clinical Coordinator",
        department: "Reception",
        permissions: {
          canWriteClinicalNotes: false,
          canPrescribe: false,
          canManagePatients: true,
          canManageAppointments: true,
          canManageUsers: false,
          canViewReports: false,
        },
        isActive: true,
      },
      {
        userId: "USR-005",
        name: "Dr. Emily Watson, PsyD",
        email: "e.watson@vancepsychiatry.com",
        passwordHash: "Vance2026!",
        role: "THERAPIST" as const,
        title: "Senior Clinical Psychologist",
        department: "Psychotherapy",
        permissions: {
          canWriteClinicalNotes: true,
          canPrescribe: false,
          canManagePatients: true,
          canManageAppointments: true,
          canManageUsers: false,
          canViewReports: false,
        },
        isActive: true,
      },
    ];

    for (const staff of defaultStaff) {
      const u = new User({
        ...staff,
        lastActive: new Date().toISOString(),
      });
      await u.save();
    }

    logger.info("Default staff accounts bootstrapped successfully for ADMIN, DOCTOR, RECEPTION, and THERAPIST.");
  } catch (error: any) {
    logger.error("Error seeding default staff accounts:", error.message || error);
  }
};
