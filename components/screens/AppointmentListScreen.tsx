'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { AppointmentStatus, AppointmentType } from '../../types';
import { 
  Calendar, 
  CalendarPlus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Stethoscope,
  ChevronRight
} from 'lucide-react';

export const AppointmentListScreen: React.FC = () => {
  const { 
    appointments, 
    updateAppointmentStatus, 
    navigateToPatientProfile,
    navigateToBookAppointment,
    navigateToNewConsultation,
    currentUser
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const todayStr = '2026-09-08';

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = 
      a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'Today') return matchesSearch && a.date === todayStr;
    if (filterStatus === 'Upcoming') return matchesSearch && a.date >= todayStr && a.status !== 'Completed' && a.status !== 'Cancelled';
    if (filterStatus === 'Completed') return matchesSearch && a.status === 'Completed';
    if (filterStatus === 'Cancelled') return matchesSearch && (a.status === 'Cancelled' || a.status === 'No Show');

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Appointment Roster</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage practice consultation slots, check-ins, and schedule statuses.
          </p>
        </div>

        <button
          onClick={() => navigateToBookAppointment()}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <CalendarPlus className="w-4 h-4 text-teal-400" />
          + Book Appointment
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['All', 'Today', 'Upcoming', 'Completed', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'Today' ? "Today's Visits" : status}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient or type..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Appointment Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Patient Name & ID</th>
                <th className="py-3.5 px-4">Appointment Type</th>
                <th className="py-3.5 px-4">Practitioner</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{appt.date}</div>
                      <div className="text-[11px] font-semibold text-blue-700 mt-0.5">{appt.time} ({appt.durationMinutes}m)</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => navigateToPatientProfile(appt.patientId)}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left"
                      >
                        {appt.patientName}
                      </button>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{appt.patientId}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {appt.type}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {appt.doctorName}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={appt.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">
                      {appt.notes || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigateToPatientProfile(appt.patientId)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          Chart
                        </button>

                        {currentUser.role === 'DOCTOR' && appt.status !== 'Completed' && (
                          <button
                            onClick={() => {
                              updateAppointmentStatus(appt.id, 'In Progress');
                              navigateToNewConsultation(appt.patientId);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-1"
                          >
                            <Stethoscope className="w-3 h-3" /> Consult
                          </button>
                        )}

                        {appt.status !== 'Completed' && (
                          <button
                            onClick={() => updateAppointmentStatus(appt.id, 'Completed')}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {appt.status !== 'Cancelled' && (
                          <button
                            onClick={() => updateAppointmentStatus(appt.id, 'Cancelled')}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Cancel Appointment"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No appointments match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
