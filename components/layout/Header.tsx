'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Bell, 
  Plus, 
  Menu, 
  UserPlus, 
  CalendarPlus, 
  FilePlus2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ScreenId } from '../../types';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { 
    activeScreen, 
    setActiveScreen, 
    setIsGlobalSearchOpen, 
    setIsMobileSidebarOpen, 
    currentUser,
    followUps,
    appointments,
    navigateToBookAppointment,
    navigateToNewConsultation
  } = useApp();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const getPageMeta = (screen: ScreenId): { title: string; category: string } => {
    switch (screen) {
      case 'dashboard':
        return { title: 'Practice Overview', category: 'Dashboard' };
      case 'patients':
        return { title: 'Patient Records', category: 'Clinical Database' };
      case 'add-patient':
        return { title: 'Register New Patient', category: 'Patient Database' };
      case 'patient-profile':
        return { title: 'Patient Clinical Chart', category: 'Medical Record' };
      case 'new-consultation':
        return { title: 'Clinical Intake & Consultation', category: 'Consultation Suite' };
      case 'appointments':
        return { title: 'Appointment Roster', category: 'Schedule' };
      case 'book-appointment':
        return { title: 'Book New Appointment', category: 'Schedule' };
      case 'appointment-calendar':
        return { title: 'Interactive Calendar', category: 'Schedule' };
      case 'prescriptions':
        return { title: 'Prescription & Treatment Records', category: 'Pharmacotherapy' };
      case 'follow-ups':
        return { title: 'Follow-up Management', category: 'Continuity of Care' };
      case 'reports':
        return { title: 'Practice Analytics & Reports', category: 'Management' };
      case 'settings':
        return { title: 'System & Clinic Settings', category: 'Administration' };
      case 'user-management':
        return { title: 'User & Role Access Management', category: 'Administration' };
      default:
        return { title: 'Neuro Psychiatry Clinic System', category: 'Clinical SaaS' };
    }
  };

  const meta = getPageMeta(activeScreen);

  const dueFollowups = followUps.filter(f => f.status === 'Due' || f.status === 'Overdue');
  const todayAppointments = appointments.filter(a => a.date === '2026-09-08' && a.status === 'Confirmed');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu + Title & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{meta.category}</span>
              <span>/</span>
              <span className="font-medium text-slate-700 truncate">{title || meta.title}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight truncate leading-tight mt-0.5">
              {title || meta.title}
            </h2>
          </div>
        </div>

        {/* Center/Right Side: Global Search + Notifications + Quick Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Global Search trigger */}
          <button
            onClick={() => setIsGlobalSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 rounded-lg text-xs text-slate-500 transition-all w-36 sm:w-64 justify-between"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">Search patients...</span>
            </span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-400 font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Quick Contextual Action Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => navigateToBookAppointment()}
              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-teal-400" />
              Book Appointment
            </button>

            {currentUser.role === 'DOCTOR' && (
              <button
                onClick={() => navigateToNewConsultation()}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                New Consult
              </button>
            )}

            <button
              onClick={() => setActiveScreen('add-patient')}
              className="px-3 py-1.5 bg-teal-700 text-white text-xs font-semibold rounded-lg hover:bg-teal-800 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Patient
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 relative transition-colors"
            >
              <Bell className="w-4 h-4" />
              {dueFollowups.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-3 text-slate-900 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Clinical Alerts</h4>
                  <span className="text-[11px] text-blue-600 font-semibold">{dueFollowups.length} Action Needed</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {dueFollowups.length > 0 ? (
                    dueFollowups.map(f => (
                      <div 
                        key={f.id} 
                        onClick={() => {
                          setActiveScreen('follow-ups');
                          setIsNotificationsOpen(false);
                        }}
                        className="p-2.5 rounded-lg bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200/80 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900">{f.patientName}</span>
                          <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                            {f.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1 line-clamp-1">{f.reason}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-500">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      All follow-ups up to date.
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 mt-2 text-center">
                  <button
                    onClick={() => {
                      setActiveScreen('follow-ups');
                      setIsNotificationsOpen(false);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View All Follow-ups →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
