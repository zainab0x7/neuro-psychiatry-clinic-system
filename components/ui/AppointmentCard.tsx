import React from 'react';
import { Appointment } from '@/types';
import { Badge } from './Badge';
import { Clock, Calendar, User } from 'lucide-react';

export interface AppointmentCardProps {
  appointment: Appointment;
  onViewClick: () => void;
  onStartConsult?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onViewClick,
  onStartConsult,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-blue-600 text-white font-mono font-bold text-xs rounded">
            {appointment.time}
          </span>
          <span className="text-xs text-slate-500 font-semibold">{appointment.durationMinutes} min</span>
        </div>

        <Badge variant={appointment.status === 'Completed' ? 'emerald' : appointment.status === 'In Progress' ? 'sky' : 'amber'} size="sm">
          {appointment.status}
        </Badge>
      </div>

      <div>
        <h4 onClick={onViewClick} className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer">
          {appointment.patientName}
        </h4>
        <p className="text-xs text-slate-600 mt-0.5">{appointment.type}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span className="text-slate-400 font-mono">{appointment.patientId}</span>
        <div className="flex items-center gap-2">
          <button onClick={onViewClick} className="text-xs font-semibold text-slate-700 hover:underline">
            Chart
          </button>
          {onStartConsult && appointment.status !== 'Completed' && (
            <button
              onClick={onStartConsult}
              className="px-2.5 py-1 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700 transition-colors"
            >
              Consult
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
