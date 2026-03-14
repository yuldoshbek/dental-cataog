/**
 * src/components/ui/Input.jsx
 * Поле ввода с иконкой, лейблом, ошибкой
 */

import React from 'react';

export default function Input({
  label,
  error,
  hint,
  icon,
  iconRight,
  size = 'md',
  className = '',
  wrapperClassName = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'py-1.5 text-sm',
    md: 'py-2 text-sm',
    lg: 'py-2.5 text-base',
  }[size] ?? 'py-2 text-sm';

  const paddingLeft  = icon ? 'pl-9'  : 'pl-3';
  const paddingRight = iconRight ? 'pr-9' : 'pr-3';

  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      {label && (
        <label className="text-xs font-semibold text-gray-700 select-none">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </span>
        )}

        <input
          className={[
            'w-full rounded-xl border bg-white transition-all duration-200',
            'placeholder:text-gray-400 text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
            error
              ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400'
              : 'border-gray-200 hover:border-gray-300',
            sizeClasses,
            paddingLeft,
            paddingRight,
            className,
          ].join(' ')}
          {...props}
        />

        {iconRight && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            {iconRight}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0V5zm.75 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}

/* Textarea вариант */
export function Textarea({
  label,
  error,
  hint,
  className = '',
  wrapperClassName = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1 ${wrapperClassName}`}>
      {label && (
        <label className="text-xs font-semibold text-gray-700 select-none">
          {label}
        </label>
      )}

      <textarea
        className={[
          'w-full rounded-xl border bg-white transition-all duration-200 resize-none',
          'placeholder:text-gray-400 text-sm text-gray-900 px-3 py-2',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
          error
            ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400'
            : 'border-gray-200 hover:border-gray-300',
          className,
        ].join(' ')}
        {...props}
      />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}
