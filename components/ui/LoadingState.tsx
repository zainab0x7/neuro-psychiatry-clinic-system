import React from 'react';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading clinical data...',
}) => {
  return (
    <div className="py-16 px-6 text-center space-y-3">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-semibold text-slate-500">{message}</p>
    </div>
  );
};
