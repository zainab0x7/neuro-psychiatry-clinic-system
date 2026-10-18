'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Video, Copy, ExternalLink, CheckCircle2, Calendar, User, Clock, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const OnlineConsultationScreen: React.FC = () => {
  const { appointments, updateAppointmentStatus, showToast, navigateToPatientProfile } = useApp();

  // Filter online / scheduled appointments
  const onlineAppts = appointments.filter(a => a.type.includes('Consultation') || a.type.includes('Review') || a.type.includes('Eval') || a.type.includes('Psychotherapy'));

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getLink = (id: string) => `https://meet.vancepsychiatry.com/room/session-${id.toLowerCase()}`;

  const handleCopyLink = (id: string) => {
    const link = getLink(id);
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    showToast('success', 'Link Copied', 'Secure session link copied to clipboard.');
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            Online Consultation & Tele-Psychiatry Links
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage encrypted tele-health session links, copy URLs for patients, and trigger virtual consults.
          </p>
        </div>

        <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-3 py-1.5 rounded-full border border-blue-200 self-start sm:self-auto">
          {onlineAppts.length} Tele-Health Sessions Scheduled
        </span>
      </div>

      {/* Session Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {onlineAppts.map((appt) => {
          const roomUrl = getLink(appt.id);
          const isCopied = copiedId === appt.id;

          return (
            <div key={appt.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {appt.id}
                    </span>
                    <StatusBadge status={appt.status} size="sm" />
                  </div>
                  <h3 
                    onClick={() => navigateToPatientProfile(appt.patientId)}
                    className="font-bold text-slate-900 text-sm mt-1 hover:text-blue-600 cursor-pointer flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {appt.patientName}
                  </h3>
                </div>

                <div className="text-right text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1 justify-end">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {appt.date}
                  </span>
                  <span className="text-slate-500 font-mono flex items-center gap-1 justify-end mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {appt.time} ({appt.durationMinutes}m)
                  </span>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <p><strong>Service Type:</strong> {appt.type}</p>
                <p><strong>Specialist:</strong> {appt.doctorName}</p>
                <p className="text-slate-600 italic">"{appt.notes || 'Routine online follow-up evaluation.'}"</p>
              </div>

              {/* Secure Room Link */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Encrypted Video Room URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={roomUrl}
                    className="flex-1 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 select-all"
                  />
                  <button
                    onClick={() => handleCopyLink(appt.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <a
                  href={roomUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Launch Consultation Room
                </a>

                {appt.status !== 'Completed' && (
                  <button
                    onClick={() => updateAppointmentStatus(appt.id, 'Completed')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold rounded-lg transition-colors"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
