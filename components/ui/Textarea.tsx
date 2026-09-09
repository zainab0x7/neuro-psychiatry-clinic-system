import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  rows = 3,
  id,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
          error ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500'
        } ${className}`}
        {...props}
      />

      {error && <p className="text-[11px] font-medium text-rose-600 mt-0.5">{error}</p>}
      {!error && helperText && <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>}
    </div>
  );
};
