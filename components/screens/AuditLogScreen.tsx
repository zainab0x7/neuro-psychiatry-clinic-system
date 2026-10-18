'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { History, Search, Filter, ShieldCheck, User, Calendar, FileText } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const AuditLogScreen: React.FC = () => {
  const { auditLogs, users } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.patientRef && log.patientRef.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesModule = moduleFilter === 'all' || log.module.toLowerCase() === moduleFilter.toLowerCase();
    const matchesAction = actionFilter === 'all' || log.action.toLowerCase() === actionFilter.toLowerCase();

    return matchesSearch && matchesModule && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            Audit & System Change Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Screen 20: Tamper-evident trail of all clinical, patient chart, prescription, billing, and user actions.
          </p>
        </div>

        <span className="text-xs font-mono font-bold bg-purple-50 text-purple-800 px-3 py-1.5 rounded-full border border-purple-200 self-start sm:self-auto">
          {auditLogs.length} Total Audit Records Recorded
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action description, staff user, patient ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
          >
            <option value="all">All Modules</option>
            <option value="PATIENTS">Patients Module</option>
            <option value="CONSULTATION">Consultations</option>
            <option value="PRESCRIPTION">Prescriptions</option>
            <option value="APPOINTMENTS">Appointments</option>
            <option value="THERAPY">Therapy Sessions</option>
            <option value="BILLING">Billing & Payments</option>
            <option value="AUTH">Authentication</option>
            <option value="SETTINGS">Settings</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
          >
            <option value="all">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="BACKUP">BACKUP</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Module</th>
              <th className="py-3 px-4">Patient Ref</th>
              <th className="py-3 px-4">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-600 font-semibold">{log.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.userName}</td>
                  <td className="py-3 px-4"><StatusBadge status={log.userRole} size="sm" /></td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{log.action}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{log.module}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{log.patientRef || '-'}</td>
                  <td className="py-3 px-4 text-slate-800">{log.description}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No matching audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
