'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertCircle, 
  UserPlus, 
  CalendarPlus, 
  FilePlus2, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Phone,
  Stethoscope
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { 
    currentUser, 
    patients, 
    appointments, 
    followUps, 
    clinicSettings,
    setActiveScreen, 
    navigateToPatientProfile,
    navigateToNewConsultation,
    navigateToBookAppointment,
    updateAppointmentStatus
  } = useApp();

  const todayStr = '2026-09-08';
  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const upcomingAppointments = appointments.filter(a => a.date > todayStr);
  const dueFollowups = followUps.filter(f => f.status === 'Due' || f.status === 'Overdue');

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Good morning, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {clinicSettings.clinicName || 'Neuro Psychiatry Clinic'} • {clinicSettings.department || 'Psychiatry'} Department ({currentUser.designation || clinicSettings.doctorDesignation || 'HOD & Consultant Psychiatrist'})
          </p>
        </div>

        {/* Quick Actions Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveScreen('add-patient')}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Patient
          </button>

          <button
            onClick={() => navigateToBookAppointment()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-teal-400" />
            Book Appointment
          </button>

          {currentUser.role === 'DOCTOR' && (
            <button
              onClick={() => navigateToNewConsultation()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              New Consult
            </button>
          )}
        </div>
      </div>

      {/* Top 4 Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Patients"
          value={patients.length}
          subtitle="Registered in clinic database"
          icon={Users}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-700"
          trend={{ value: '+4 new this week', isPositive: true }}
          onClick={() => setActiveScreen('patients')}
        />

        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          subtitle={`${todayAppointments.filter(a => a.status === 'Completed').length} completed so far`}
          icon={Calendar}
          iconBgColor="bg-teal-50"
          iconColor="text-teal-700"
          onClick={() => setActiveScreen('appointments')}
        />

        <StatCard
          title="Upcoming Appointments"
          value={upcomingAppointments.length}
          subtitle="Scheduled over next 14 days"
          icon={Clock}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-700"
          onClick={() => setActiveScreen('appointments')}
        />

        <StatCard
          title="Follow-ups Due"
          value={dueFollowups.length}
          subtitle={`${dueFollowups.filter(f => f.status === 'Overdue').length} overdue requires contact`}
          icon={AlertCircle}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-700"
          onClick={() => setActiveScreen('follow-ups')}
        />
      </div>

      {/* Main Grid: Today's Schedule (Left) + Follow-ups & Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Schedule */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Today's Schedule & Consult Roster
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Chronological timeline of consultations for today</p>
            </div>

            <button
              onClick={() => setActiveScreen('appointments')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Full Roster <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-3 transition-colors -mx-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="px-2.5 py-1.5 bg-slate-100 rounded-lg text-slate-800 font-mono font-bold text-xs shrink-0 text-center border border-slate-200">
                      {appt.time}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigateToPatientProfile(appt.patientId)}
                          className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors text-left"
                        >
                          {appt.patientName}
                        </button>
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {appt.patientId}
                        </span>
                        <StatusBadge status={appt.status} size="sm" />
                      </div>

                      <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-2">
                        <span className="font-medium text-slate-700">{appt.type}</span>
                        <span>•</span>
                        <span className="text-slate-400">{appt.durationMinutes} min</span>
                      </p>

                      {appt.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic line-clamp-1">
                          "{appt.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => navigateToPatientProfile(appt.patientId)}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      View Chart
                    </button>

                    {currentUser.role === 'DOCTOR' && appt.status !== 'Completed' && (
                      <button
                        onClick={() => {
                          updateAppointmentStatus(appt.id, 'In Progress');
                          navigateToNewConsultation(appt.patientId);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        Start Consult
                      </button>
                    )}

                    {appt.status !== 'Completed' && (
                      <button
                        onClick={() => updateAppointmentStatus(appt.id, 'Completed')}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Mark Completed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-500">
                <p className="text-sm font-medium">No appointments scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Follow-ups Due + Quick Patient Search Widget */}
        <div className="lg:col-span-4 space-y-6">
          {/* Follow-ups Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Follow-ups Due
              </h3>

              <button
                onClick={() => setActiveScreen('follow-ups')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                View All ({followUps.length})
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {dueFollowups.length > 0 ? (
                dueFollowups.map((flp) => (
                  <div
                    key={flp.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 
                          onClick={() => navigateToPatientProfile(flp.patientId, 'followups')}
                          className="font-bold text-xs text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          {flp.patientName}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {flp.phone}
                        </p>
                      </div>

                      <StatusBadge status={flp.status} size="sm" />
                    </div>

                    <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200/60 font-mono text-[11px]">
                      {flp.reason}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Due: {flp.dueDate}
                      </span>

                      <button
                        onClick={() => navigateToPatientProfile(flp.patientId, 'followups')}
                        className="text-xs text-blue-600 font-semibold hover:underline flex items-center"
                      >
                        Action <ExternalLink className="w-3 h-3 ml-1" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  All follow-up tasks completed.
                </div>
              )}
            </div>
          </div>

          {/* Practice Info Summary Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-teal-400">Clinic Hours & Status</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Operating days: <strong>Monday, Wednesday, Friday</strong><br />
              Hours: <strong>6:00 PM – 8:00 PM</strong> (18:00 – 20:00).
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>{clinicSettings.clinicName || 'Neuro Psychiatry Clinic'}</span>
              <span className="font-mono text-teal-400 font-bold">{clinicSettings.phone || '+1 (555) 800-VANCE'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
