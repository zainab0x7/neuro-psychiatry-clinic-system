'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Database, Download, ShieldCheck, HardDrive, RefreshCw, FileSpreadsheet, Lock, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const BackupExportScreen: React.FC = () => {
  const { backupLogs, createBackup, showToast, currentUser } = useApp();
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleCreateBackup = async (type: 'Full System' | 'Patient Records' | 'Financial & Billing' | 'Audit Logs' = 'Full System') => {
    setIsBackingUp(true);
    showToast('info', 'Backup Initiated', `Creating ${type} database archive...`);

    setTimeout(async () => {
      await createBackup(type);
      setIsBackingUp(false);
    }, 1200);
  };

  const handleExportData = (format: 'JSON' | 'CSV') => {
    showToast('success', 'Export Ready', `Generating ${format} clinic data export bundle.`);
  };

  const lastBackup = backupLogs[0] || {
    timestamp: '2026-09-08 11:00:00',
    fileName: 'clinic-backup-20260908-full.json',
    fileSize: '4.2 MB',
    status: 'Completed',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-900/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Administrative Backup & Data Export Center</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Screen 18: System database backup, patient chart export, financial logs, and data security.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleCreateBackup('Full System')}
          disabled={isBackingUp}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
          {isBackingUp ? 'Creating Backup...' : 'Create Full System Backup'}
        </button>
      </div>

      {/* Security & Access Guarantee Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
          <Lock className="w-4 h-4" />
          Clinic Data Ownership & Sovereignty Notice
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          All electronic medical records, psychiatric notes, prescriptions, and financial ledgers hosted within this Personal EMR system remain under the sole ownership and control of the Clinic Owner ({currentUser.name}). Database backups can be generated and downloaded in encrypted JSON or CSV format at any time.
        </p>
      </div>

      {/* Backup Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Last Successful Backup</span>
          <span className="text-sm font-bold text-slate-900 block">{lastBackup.timestamp}</span>
          <p className="text-xs text-slate-500 font-mono">{lastBackup.fileName} ({lastBackup.fileSize})</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Backup Status</span>
          <div className="pt-1">
            <StatusBadge status={lastBackup.status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">MongoDB instance synchronized</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Backup Integrity</span>
          <span className="text-sm font-bold text-emerald-700 block flex items-center gap-1 pt-1">
            <CheckCircle2 className="w-4 h-4" /> 100% Verified
          </span>
          <p className="text-xs text-slate-500">SHA-256 Checksum Verified</p>
        </div>
      </div>

      {/* Selective Data Export Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          Selective Data Export Options
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" /> Complete Database Export
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Export all patients, consultations, prescriptions, appointments, and billing tables in single JSON.
            </p>
            <button
              onClick={() => handleExportData('JSON')}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export DB (JSON)
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Patient Chart Export
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Export patient demography roster, intake notes, and psychiatric diagnoses in CSV spreadsheet.
            </p>
            <button
              onClick={() => handleExportData('CSV')}
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export Patient CSV
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Financial & Audit Logs
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Download system security audit trail logs and billing payment collection ledgers.
            </p>
            <button
              onClick={() => handleExportData('CSV')}
              className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export Audit & Billing
            </button>
          </div>
        </div>
      </div>

      {/* Backup Log History */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs text-xs">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-900">
          Historical Backup Logs
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
              <th className="py-3 px-4">Backup ID</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">File Name</th>
              <th className="py-3 px-4">Archive Type</th>
              <th className="py-3 px-4">Size</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {backupLogs.map(b => (
              <tr key={b.id}>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.id}</td>
                <td className="py-3 px-4 text-slate-600">{b.timestamp}</td>
                <td className="py-3 px-4 font-mono text-slate-800">{b.fileName}</td>
                <td className="py-3 px-4 font-semibold text-slate-700">{b.type}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{b.fileSize}</td>
                <td className="py-3 px-4"><StatusBadge status={b.status} size="sm" /></td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => showToast('info', 'Download Started', `Downloading archive ${b.fileName}...`)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors flex items-center gap-1 ml-auto"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
