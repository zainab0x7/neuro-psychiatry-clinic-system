import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';

export interface IUserPermissions {
  canWriteClinicalNotes: boolean;
  canPrescribe: boolean;
  canManagePatients: boolean;
  canManageAppointments: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
}

export interface IUser extends Document {
  id: string;
  userId: string; // e.g. USR-001
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  title?: string;
  department?: string;
  permissions: IUserPermissions;
  isActive: boolean;
  lastActive: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['DOCTOR', 'RECEPTIONIST', 'ADMIN'], 
      required: true 
    },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    title: { type: String, default: '' },
    department: { type: String, default: '' },
    permissions: {
      canWriteClinicalNotes: { type: Boolean, default: false },
      canPrescribe: { type: Boolean, default: false },
      canManagePatients: { type: Boolean, default: true },
      canManageAppointments: { type: Boolean, default: true },
      canManageUsers: { type: Boolean, default: false },
      canViewReports: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
    lastActive: { type: String, default: 'Never' },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
