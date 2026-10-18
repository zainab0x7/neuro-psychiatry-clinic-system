'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { UserRole } from '../../types';
import { ShieldCheck, UserPlus, Check, X, Shield, Lock, Stethoscope, UserCheck } from 'lucide-react';

export const UserManagementScreen: React.FC = () => {
  const { users, addUser, updateUserRole, currentUser } = useApp();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('RECEPTIONIST');
  const [title, setTitle] = useState('Assistant Clinical Coordinator');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    addUser({
      name,
      email,
      role,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title,
      department: role === 'DOCTOR' ? 'Clinical Neuropsychiatry' : role === 'THERAPIST' ? 'Clinical Psychology' : 'Practice Administration',
      status: 'ACTIVE',
      permissions: {
        canWriteClinicalNotes: role === 'DOCTOR' || role === 'THERAPIST',
        canPrescribe: role === 'DOCTOR',
        canManagePatients: true,
        canManageAppointments: true,
        canManageUsers: role === 'ADMIN',
        canViewReports: role !== 'RECEPTIONIST',
      },
    });

    setName('');
    setEmail('');
    setIsAddUserOpen(false);
  };

  const permissionsMatrix = [
    { feature: 'Search & View Patient Roster', doctor: true, therapist: true, receptionist: true, admin: true },
    { feature: 'Register New Patient Records', doctor: true, therapist: false, receptionist: true, admin: true },
    { feature: 'Book & Reschedule Appointments', doctor: true, therapist: true, receptionist: true, admin: true },
    { feature: 'Write Medical Intake & Consult Notes', doctor: true, therapist: false, receptionist: false, admin: false },
    { feature: 'Conduct Therapy Sessions & Modality Notes', doctor: true, therapist: true, receptionist: false, admin: false },
    { feature: 'Issue Pharmacotherapy Prescriptions', doctor: true, therapist: false, receptionist: false, admin: false },
    { feature: 'Access Practice Analytics & Billing', doctor: true, therapist: false, receptionist: false, admin: true },
    { feature: 'Manage System Backups & Audit Logs', doctor: false, therapist: false, receptionist: false, admin: true },
    { feature: 'Manage Staff Accounts & System Roles', doctor: false, therapist: false, receptionist: false, admin: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Screen 19: User Access & Role Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure Role-Based Access Control (RBAC) across Doctor, Therapist, Receptionist, and Admin tiers.
          </p>
        </div>

        <button
          onClick={() => setIsAddUserOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-teal-400" />
          + Add Staff Account
        </button>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Practice Staff Accounts ({users.length})
          </h3>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role Tier</th>
              <th className="py-3 px-4">Department / Title</th>
              <th className="py-3 px-4">Last Active</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                    <div>
                      <span className="font-bold text-slate-900 block">{u.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{u.email}</span>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <StatusBadge status={u.role} size="sm" />
                </td>

                <td className="py-3.5 px-4 text-slate-600 font-medium">
                  {u.title}
                </td>

                <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                  {u.lastActive}
                </td>

                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <select
                    value={u.role}
                    onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700"
                  >
                    <option value="DOCTOR">Doctor</option>
                    <option value="THERAPIST">Therapist</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            Role Permissions Matrix (4-Tier RBAC Control)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Summary of clinical and administrative capabilities per role</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-4">Feature / Action Permission</th>
                <th className="py-2.5 px-4 text-center">Doctor</th>
                <th className="py-2.5 px-4 text-center">Therapist</th>
                <th className="py-2.5 px-4 text-center">Receptionist</th>
                <th className="py-2.5 px-4 text-center">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {row.doctor ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.therapist ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.receptionist ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.admin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-900 text-sm">Add New Staff Account</h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Emily Watson"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="emily@vancepsychiatry.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Tier</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                >
                  <option value="RECEPTIONIST">Receptionist / Coordinator</option>
                  <option value="THERAPIST">Clinical Therapist</option>
                  <option value="DOCTOR">Consultant Psychiatrist</option>
                  <option value="ADMIN">Practice Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
