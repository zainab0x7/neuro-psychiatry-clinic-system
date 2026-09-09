import React from 'react';
import { Patient } from '@/types';
import { Badge } from './Badge';
import { Phone, Calendar, ArrowRight } from 'lucide-react';

export interface PatientCardProps {
  patient: Patient;
  onViewClick: () => void;
  onBookClick?: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onViewClick,
  onBookClick,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs shrink-0">
            {patient.fullName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h4 onClick={onViewClick} className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer">
              {patient.fullName}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{patient.id}</span>
              <span>{patient.age} yrs • {patient.gender}</span>
            </div>
          </div>
        </div>

        <Badge variant={patient.status === 'Active' ? 'emerald' : patient.status === 'In Treatment' ? 'sky' : 'slate'} size="sm">
          {patient.status}
        </Badge>
      </div>

      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-xs text-slate-700 line-clamp-2">
        "{patient.clinicalIntake.presentingComplaint}"
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
        <span className="text-slate-500 flex items-center gap-1 font-mono">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          {patient.phone}
        </span>

        <div className="flex items-center gap-2">
          {onBookClick && (
            <button
              onClick={onBookClick}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Book
            </button>
          )}
          <button
            onClick={onViewClick}
            className="px-2.5 py-1 bg-slate-900 text-white font-semibold rounded-lg text-xs hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            Chart <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
