/**
 * src/components/ui/Button.jsx
 * Универсальная кнопка с вариантами: primary, outline, ghost, danger
 */

import React from 'react';

const variants = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm hover:shadow',
  outline:
    'border border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100',
  ghost:
    'text-gray-600 hover:bg-gray-100 active:bg-gray-200',
  danger:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
  'outline-gray':
    'border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
  success:
    'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-sm',
};

const sizes = {
  xs:  'px-2.5 py-1 text-xs rounded-lg gap-1',
  sm:  'px-3 py-1.5 text-sm rounded-xl gap-1.5',
  md:  'px-4 py-2 text-sm rounded-xl gap-2',
  lg:  'px-5 py-2.5 text-base rounded-2xl gap-2',
  xl:  'px-6 py-3 text-base rounded-2xl gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 select-none',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        (disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="shrink-0">{iconRight}</span>
      )}
    </button>
  );
}
