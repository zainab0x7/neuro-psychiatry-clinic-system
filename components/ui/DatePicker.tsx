import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const dateId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={dateId} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}

      <div className="relative">
        <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        <input
          type="date"
          id={dateId}
          className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:bg-white transition-all ${
            error ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500'
          } ${className}`}
          {...props}
        />
      </div>

      {error && <p className="text-[11px] font-medium text-rose-600 mt-0.5">{error}</p>}
    </div>
  );
};
