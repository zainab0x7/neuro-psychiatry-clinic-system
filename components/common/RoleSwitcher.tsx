'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ShieldCheck, UserCheck, Stethoscope } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { activeRole, switchRole, currentUser } = useApp();

  return (
    <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold text-[11px] uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          Role Demo Bar
        </span>
        <span className="hidden sm:inline text-slate-400">
          Currently viewing app as: <strong className="text-white font-medium">{currentUser.name}</strong> ({currentUser.designation || currentUser.title}){currentUser.education ? ` • ${currentUser.education}` : ''}
        </span>
      </div>

      <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
        <button
          onClick={() => switchRole('DOCTOR')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
            activeRole === 'DOCTOR'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Stethoscope className="w-3 h-3" />
          Doctor
        </button>

        <button
          onClick={() => switchRole('RECEPTIONIST')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
            activeRole === 'RECEPTIONIST'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <UserCheck className="w-3 h-3" />
          Receptionist
        </button>

        <button
          onClick={() => switchRole('ADMIN')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
            activeRole === 'ADMIN'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <ShieldCheck className="w-3 h-3" />
          Admin
        </button>
      </div>
    </div>
  );
};
