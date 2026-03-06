import React from 'react';

export default function DetailRow({ label, value, highlight = false }) {
  if (!value) return null;
  return (
    <div className={`py-3 px-4 rounded-lg flex flex-col sm:flex-row sm:items-start gap-2 ${highlight ? 'bg-amber-50' : 'bg-gray-50'}`}>
      <span className="text-sm font-semibold text-gray-700 sm:w-1/3 shrink-0">{label}:</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}
