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
  Pill,
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Phone,
  Stethoscope,
  DollarSign,
  Receipt,
  FileText
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { 
    currentUser, 
    patients, 
    appointments, 
    followUps, 
    consultations,
    payments,
    clinicSettings,
    setActiveScreen, 
    navigateToPatientProfile,
    navigateToNewConsultation,
    navigateToBookAppointment,
    navigateToPrescriptions,
    navigateToBilling,
    updateAppointmentStatus
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayStr || a.date === '2026-09-08');
  const dueFollowups = followUps.filter(f => f.status === 'Due' || f.status === 'Overdue');
  const todayPayments = payments.filter(p => p.date === todayStr || p.date === '2026-09-08');
  const todayCollectionsAmount = todayPayments.filter(p => p.paymentStatus === 'Paid').reduce((acc, p) => acc + p.amount, 0);

  const recentPatients = patients.slice(0, 5);
  const recentConsultations = consultations.slice(0, 4);
  const recentPayments = payments.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {clinicSettings.clinicName || 'Neuro Psychiatry Clinic'} • {clinicSettings.department || 'Psychiatry'} Department
          </p>
        </div>

        {/* Quick Actions Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveScreen('add-patient')}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Add Patient
          </button>

          <button
            onClick={() => navigateToBookAppointment()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-teal-400" />
            Book Appointment
          </button>

          {currentUser.role === 'DOCTOR' && (
            <>
              <button
                onClick={() => navigateToNewConsultation()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                New Consultation
              </button>

              <button
                onClick={() => navigateToPrescriptions()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Pill className="w-3.5 h-3.5" />
                New Prescription
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Patients"
          value={todayAppointments.length}
          subtitle="Registered for consultation"
          icon={Users}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-700"
          onClick={() => setActiveScreen('patients')}
        />

        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          subtitle={`${todayAppointments.filter(a => a.status === 'Completed').length} completed`}
          icon={Calendar}
          iconBgColor="bg-teal-50"
          iconColor="text-teal-700"
          onClick={() => setActiveScreen('appointments')}
        />

        <StatCard
          title="Follow-ups Due"
          value={dueFollowups.length}
          subtitle={`${dueFollowups.filter(f => f.status === 'Overdue').length} overdue contact`}
          icon={AlertCircle}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-700"
          onClick={() => setActiveScreen('follow-ups')}
        />

        <StatCard
          title="Today's Collections"
          value={`$${todayCollectionsAmount}`}
          subtitle={`${todayPayments.length} transactions processed`}
          icon={DollarSign}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-700"
          onClick={() => navigateToBilling()}
        />
      </div>

      {/* Main Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Today's Schedule + Recent Consultations */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section: Today's Appointment Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Today's Appointment Schedule
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Chronological timeline of consultations for today</p>
              </div>

              <button
                onClick={() => setActiveScreen('appointments')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Full Schedule <ArrowRight className="w-3.5 h-3.5" />
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
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => navigateToPatientProfile(appt.patientId)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        View Profile
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
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No appointments scheduled for today.
                </div>
              )}
            </div>
          </div>

          {/* Section: Recent Consultations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Recent Clinical Consultations
              </h3>
              <button
                onClick={() => setActiveScreen('consultations')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                View History
              </button>
            </div>

            <div className="space-y-3">
              {recentConsultations.map(c => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{c.patientName}</span>
                    <span className="text-[11px] font-mono text-slate-400">{c.date}</span>
                  </div>
                  <p className="text-slate-600"><strong>ICD:</strong> {c.diagnosis.primaryICD} - {c.diagnosis.primaryTitle}</p>
                  <p className="text-slate-500 italic line-clamp-1">"{c.presentingComplaint}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Recent Patients, Pending Follow-ups, Recent Payments */}
        <div className="lg:col-span-4 space-y-6">
          {/* Section: Pending Follow-ups */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Pending Follow-ups
              </h3>
              <button onClick={() => setActiveScreen('follow-ups')} className="text-xs text-blue-600 font-semibold hover:underline">
                View All
              </button>
            </div>

            <div className="space-y-2">
              {dueFollowups.slice(0, 4).map(flp => (
                <div key={flp.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span onClick={() => navigateToPatientProfile(flp.patientId)} className="font-bold text-slate-900 cursor-pointer hover:text-blue-600">
                      {flp.patientName}
                    </span>
                    <StatusBadge status={flp.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1">{flp.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Recent Payments */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                Recent Payments
              </h3>
              <button onClick={() => navigateToBilling()} className="text-xs text-blue-600 font-semibold hover:underline">
                Ledger
              </button>
            </div>

            <div className="space-y-2">
              {recentPayments.map(p => (
                <div key={p.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900">{p.patientName}</span>
                    <p className="text-[11px] text-slate-500">{p.service}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-700">${p.amount}</span>
                    <span className="block text-[10px] text-slate-400">{p.paymentMethod}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Recent Patients */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Recent Registered Patients
              </h3>
              <button onClick={() => setActiveScreen('patients')} className="text-xs text-blue-600 font-semibold hover:underline">
                Roster
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {recentPatients.map(p => (
                <div key={p.id} onClick={() => navigateToPatientProfile(p.id)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900">{p.fullName}</span>
                    <p className="text-[11px] text-slate-500">{p.gender}, {p.age}y • {p.phone}</p>
                  </div>
                  <StatusBadge status={p.status} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

