import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTION' | 'RECEPTIONIST' | 'THERAPIST';

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
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['ADMIN', 'DOCTOR', 'RECEPTION', 'RECEPTIONIST', 'THERAPIST'], 
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
  { 
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).passwordHash;
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

// Pre-save hook to hash password before saving if modified
UserSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('passwordHash')) {
    return;
  }
  if (this.passwordHash.startsWith('$2a$') || this.passwordHash.startsWith('$2b$')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Compare provided password with stored password hash
UserSchema.methods.comparePassword = async function (this: IUser, candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

