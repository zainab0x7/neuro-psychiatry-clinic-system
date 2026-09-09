'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { Clock, Search, Filter, Phone, CheckCircle2, Calendar, AlertCircle } from 'lucide-react';
import { FollowUpStatus } from '../../types';

export const FollowUpScreen: React.FC = () => {
  const { 
    followUps, 
    updateFollowUpStatus, 
    navigateToPatientProfile,
    navigateToBookAppointment
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFollowups = followUps.filter(flp => {
    const matchesSearch = 
      flp.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flp.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flp.reason.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === 'Due Today') return matchesSearch && (flp.status === 'Due' || flp.dueDate === '2026-09-08');
    if (activeFilter === 'Overdue') return matchesSearch && flp.status === 'Overdue';
    if (activeFilter === 'Upcoming') return matchesSearch && flp.status === 'Upcoming';
    if (activeFilter === 'Completed') return matchesSearch && flp.status === 'Completed';

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Follow-up Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track lab results, medication titration checks, and overdue clinical outreach.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
            {followUps.filter(f => f.status === 'Due' || f.status === 'Overdue').length} Pending Action
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {['All', 'Due Today', 'Overdue', 'Upcoming', 'Completed'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search follow-up tasks..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Follow-ups Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Last Consult</th>
                <th className="py-3.5 px-4">Follow-up Due Date</th>
                <th className="py-3.5 px-4">Clinical Objective / Reason</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredFollowups.length > 0 ? (
                filteredFollowups.map(flp => (
                  <tr key={flp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => navigateToPatientProfile(flp.patientId, 'followups')}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left"
                      >
                        {flp.patientName}
                      </button>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" /> {flp.phone}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {flp.lastConsultationDate}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {flp.dueDate}
                    </td>

                    <td className="py-3.5 px-4 text-slate-800 font-medium max-w-xs">
                      {flp.reason}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={flp.priority} size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={flp.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigateToBookAppointment(flp.patientId)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Book
                        </button>

                        {flp.status !== 'Completed' && (
                          <button
                            onClick={() => updateFollowUpStatus(flp.id, 'Completed')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No follow-ups found for the selected filter.
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
