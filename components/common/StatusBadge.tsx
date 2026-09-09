import React from 'react';

export type StatusType = 
  | 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show'
  | 'Active' | 'In Treatment' | 'Discharged' | 'Pending Intake'
  | 'Due' | 'Upcoming' | 'Overdue'
  | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN'
  | 'Low' | 'Moderate' | 'High' | 'Urgent';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = (s: string) => {
    switch (s) {
      // Appointment & Follow-up statuses
      case 'Confirmed':
      case 'Completed':
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium';
      case 'In Progress':
      case 'In Treatment':
      case 'High':
      case 'Urgent':
        return 'bg-sky-50 text-sky-700 border-sky-200/80 font-medium';
      case 'Scheduled':
      case 'Upcoming':
      case 'Due':
        return 'bg-amber-50 text-amber-700 border-amber-200/80 font-medium';
      case 'Overdue':
      case 'Cancelled':
      case 'No Show':
        return 'bg-rose-50 text-rose-700 border-rose-200/80 font-medium';
      case 'Pending Intake':
        return 'bg-purple-50 text-purple-700 border-purple-200/80 font-medium';
      case 'Discharged':
        return 'bg-slate-100 text-slate-600 border-slate-200 font-medium';
      
      // Roles
      case 'DOCTOR':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
      case 'RECEPTIONIST':
        return 'bg-teal-50 text-teal-700 border-teal-200 font-semibold';
      case 'ADMIN':
        return 'bg-slate-900 text-white border-slate-900 font-semibold';

      // Risk levels
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
        
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full border ${sizeClass} ${getBadgeStyle(status)} shadow-2xs`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 mr-1.5 shrink-0" />
      {status === 'DOCTOR' ? 'Consultant Doctor' : status === 'RECEPTIONIST' ? 'Clinical Assistant' : status}
    </span>
  );
};
