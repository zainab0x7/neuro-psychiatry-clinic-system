import { Request, Response, NextFunction } from 'express';
import User, { IUserPermissions, UserRole } from '../../models/User';
import { recordAuditEvent } from '../utils/auditLogger';

const getDefaultPermissionsForRole = (role: UserRole): IUserPermissions => {
  switch (role) {
    case 'ADMIN':
      return {
        canWriteClinicalNotes: true,
        canPrescribe: true,
        canManagePatients: true,
        canManageAppointments: true,
        canManageUsers: true,
        canViewReports: true,
      };
    case 'DOCTOR':
      return {
        canWriteClinicalNotes: true,
        canPrescribe: true,
        canManagePatients: true,
        canManageAppointments: true,
        canManageUsers: false,
        canViewReports: true,
      };
    case 'THERAPIST':
      return {
        canWriteClinicalNotes: true,
        canPrescribe: false,
        canManagePatients: true,
        canManageAppointments: true,
        canManageUsers: false,
        canViewReports: false,
      };
    case 'RECEPTION':
    case 'RECEPTIONIST':
      return {
        canWriteClinicalNotes: false,
        canPrescribe: false,
        canManagePatients: true,
        canManageAppointments: true,
        canManageUsers: false,
        canViewReports: false,
      };
    default:
      return {
        canWriteClinicalNotes: false,
        canPrescribe: false,
        canManagePatients: true,
        canManageAppointments: true,
        canManageUsers: false,
        canViewReports: false,
      };
  }
};

/**
 * GET /api/users
 * Admin-only listing of all staff user accounts.
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt((req.query.page || '1').toString(), 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit || '50').toString(), 10)));
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    const users = await User.find()
      .select('-passwordHash -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        total,
      },
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 * Admin-only user creation for staff members (ADMIN, DOCTOR, RECEPTION, THERAPIST).
 */
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role, phone, title, department } = req.body;
    const adminUser = req.user;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'A user account with this email already exists.',
      });
      return;
    }

    const count = await User.countDocuments();
    const userId = `USR-${String(count + 1).padStart(3, '0')}`;
    const permissions = getDefaultPermissionsForRole(role as UserRole);

    const newUser = new User({
      userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password, // Pre-save hook hashes password using bcryptjs
      role,
      phone: phone || '',
      title: title || '',
      department: department || '',
      permissions,
      isActive: true,
      lastActive: 'Never',
    });

    await newUser.save();

    // Log server-side audit event for user creation
    await recordAuditEvent({
      userId: adminUser?.userId || 'USR-ADMIN',
      userName: adminUser?.name || 'Administrator',
      userRole: adminUser?.role || 'ADMIN',
      action: 'CREATE',
      module: 'USERS',
      resourceId: userId,
      description: `Created new ${role} staff user account for ${name} (${email})`,
    });

    res.status(201).json({
      success: true,
      message: `User account created successfully for ${name} (${role}).`,
      user: newUser.toJSON(),
      data: newUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id
 * Admin-only updating of staff user details, status, or role.
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const adminUser = req.user;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const targetUser = await User.findOne({
      $or: [{ userId: id }, { _id: isValidObjectId ? id : null }],
    });

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: `User account not found for ID: ${id}`,
      });
      return;
    }

    const { name, role, phone, title, department, isActive, permissions } = req.body;

    if (name) targetUser.name = name.trim();
    if (phone !== undefined) targetUser.phone = phone.trim();
    if (title !== undefined) targetUser.title = title.trim();
    if (department !== undefined) targetUser.department = department.trim();
    if (isActive !== undefined) targetUser.isActive = Boolean(isActive);

    if (role && ['ADMIN', 'DOCTOR', 'RECEPTION', 'RECEPTIONIST', 'THERAPIST'].includes(role)) {
      targetUser.role = role as UserRole;
      targetUser.permissions = permissions || getDefaultPermissionsForRole(role as UserRole);
    } else if (permissions) {
      targetUser.permissions = { ...targetUser.permissions, ...permissions };
    }

    await targetUser.save();

    // Log server-side audit event for user update
    await recordAuditEvent({
      userId: adminUser?.userId || 'USR-ADMIN',
      userName: adminUser?.name || 'Administrator',
      userRole: adminUser?.role || 'ADMIN',
      action: 'UPDATE',
      module: 'USERS',
      resourceId: targetUser.userId,
      description: `Updated staff user account ${targetUser.userId} (${targetUser.name}, role: ${targetUser.role})`,
    });

    res.status(200).json({
      success: true,
      message: `User account ${targetUser.userId} updated successfully.`,
      user: targetUser.toJSON(),
      data: targetUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 * Admin-only deactivation of staff user account.
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const adminUser = req.user;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    const targetUser = await User.findOne({
      $or: [{ userId: id }, { _id: isValidObjectId ? id : null }],
    });

    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: `User account not found for ID: ${id}`,
      });
      return;
    }

    if (targetUser.userId === adminUser?.userId) {
      res.status(400).json({
        success: false,
        error: 'Administrators cannot deactivate their own active account.',
      });
      return;
    }

    targetUser.isActive = false;
    await targetUser.save();

    // Log server-side audit event for user deactivation
    await recordAuditEvent({
      userId: adminUser?.userId || 'USR-ADMIN',
      userName: adminUser?.name || 'Administrator',
      userRole: adminUser?.role || 'ADMIN',
      action: 'DELETE',
      module: 'USERS',
      resourceId: targetUser.userId,
      description: `Deactivated staff user account ${targetUser.userId} (${targetUser.name})`,
    });

    res.status(200).json({
      success: true,
      message: `User account ${targetUser.userId} deactivated successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
