'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { ScreenId } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Pill, 
  Clock, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  BrainCircuit,
  X
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ElementType;
  rolesAllowed?: string[];
  badgeCount?: number;
}

export const Sidebar: React.FC = () => {
  const { 
    activeScreen, 
    setActiveScreen, 
    currentUser, 
    logout, 
    followUps, 
    appointments,
    isMobileSidebarOpen, 
    setIsMobileSidebarOpen 
  } = useApp();

  const dueFollowupsCount = followUps.filter(f => f.status === 'Due' || f.status === 'Overdue').length;
  const todayApptsCount = appointments.filter(a => a.date === '2026-09-08' && a.status !== 'Cancelled').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar, badgeCount: todayApptsCount },
    { id: 'appointment-calendar', label: 'Calendar View', icon: Calendar },
    { id: 'consultations', label: 'Consultations', icon: FileText },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'follow-ups', label: 'Follow-ups', icon: Clock, badgeCount: dueFollowupsCount },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    ...(currentUser.role === 'ADMIN' || currentUser.role === 'DOCTOR' ? [{ id: 'user-management' as ScreenId, label: 'Users & Roles', icon: ShieldCheck }] : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo & Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30 shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm tracking-tight leading-none">Neuro Psychiatry Clinic</h1>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Psychiatry Department</p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Clinical Modules
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${
                      isActive ? 'bg-white text-blue-700' : 'bg-slate-800 text-blue-400 border border-slate-700'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile & Logout at Bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{currentUser.name}</h4>
              <div className="mt-0.5">
                <StatusBadge status={currentUser.role} size="sm" />
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
