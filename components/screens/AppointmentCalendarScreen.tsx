'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Plus,
  Stethoscope
} from 'lucide-react';

export const AppointmentCalendarScreen: React.FC = () => {
  const { appointments, navigateToPatientProfile, navigateToBookAppointment, navigateToNewConsultation, currentUser } = useApp();
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Day');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-08');

  const todayStr = '2026-09-08';

  const dateAppointments = appointments.filter(a => a.date === selectedDate);

  const hours = [
    '09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', 
    '03:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Calendar</h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual schedule view • Clinic Timings: Mon, Wed, Fri (6:00 PM – 8:00 PM)
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['Day', 'Week', 'Month'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === mode
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigateToBookAppointment()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            Book Slot
          </button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedDate('2026-09-07')}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate('2026-09-09')}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-sm font-bold text-slate-900 ml-2">
            Tuesday, September 8, 2026
          </span>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Calendar Grid View */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="divide-y divide-slate-100">
          {hours.map(hour => {
            // Find appointments for this hour slot
            const hourAppts = dateAppointments.filter(a => {
              const apptHour = a.time.split(':')[0];
              const slotHour = hour.split(':')[0];
              const apptAmPm = a.time.includes('PM') ? 'PM' : 'AM';
              const slotAmPm = hour.includes('PM') ? 'PM' : 'AM';
              return apptHour === slotHour && apptAmPm === slotAmPm;
            });

            return (
              <div key={hour} className="py-4 grid grid-cols-12 gap-4 items-start min-h-[70px]">
                <div className="col-span-2 text-xs font-mono font-bold text-slate-400 pt-1">
                  {hour}
                </div>

                <div className="col-span-10 space-y-2">
                  {hourAppts.length > 0 ? (
                    hourAppts.map(appt => (
                      <div
                        key={appt.id}
                        className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="px-2.5 py-1 bg-blue-600 text-white font-mono font-bold text-xs rounded-lg shrink-0">
                            {appt.time}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 
                                onClick={() => navigateToPatientProfile(appt.patientId)}
                                className="font-bold text-slate-900 text-sm hover:text-blue-700 cursor-pointer"
                              >
                                {appt.patientName}
                              </h4>
                              <span className="text-[11px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {appt.patientId}
                              </span>
                              <StatusBadge status={appt.status} size="sm" />
                            </div>

                            <p className="text-xs text-slate-600 mt-1 font-medium">
                              {appt.type} ({appt.durationMinutes} min)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => navigateToPatientProfile(appt.patientId)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                          >
                            Chart
                          </button>

                          {currentUser.role === 'DOCTOR' && (
                            <button
                              onClick={() => navigateToNewConsultation(appt.patientId)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                            >
                              <Stethoscope className="w-3.5 h-3.5" /> Start Consult
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-6 border-b border-dashed border-slate-100 flex items-center text-[11px] text-slate-300">
                      Open slot
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
