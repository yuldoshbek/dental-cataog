/**
 * src/components/ui/Badge.jsx
 * Бейдж для статусов, стран, категорий
 */

import React from 'react';

const variants = {
  default:  'bg-gray-100 text-gray-700',
  primary:  'bg-primary-50 text-primary-600',
  blue:     'bg-blue-50 text-blue-700',
  green:    'bg-emerald-50 text-emerald-700',
  amber:    'bg-amber-50 text-amber-700',
  red:      'bg-red-50 text-red-700',
  purple:   'bg-purple-50 text-purple-700',
  outline:  'border border-gray-200 text-gray-600 bg-white',
};

const sizes = {
  xs: 'text-[10px] px-1.5 py-0.5 rounded-md',
  sm: 'text-xs px-2 py-0.5 rounded-lg',
  md: 'text-xs px-2.5 py-1 rounded-lg font-semibold',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
  ...props
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-medium leading-none',
        variants[variant] ?? variants.default,
        sizes[size] ?? sizes.sm,
        className,
      ].join(' ')}
      {...props}
    >
      {dot && (
        <span className={[
          'w-1.5 h-1.5 rounded-full shrink-0',
          variant === 'green'  ? 'bg-emerald-500' :
          variant === 'amber'  ? 'bg-amber-500'   :
          variant === 'red'    ? 'bg-red-500'      :
          variant === 'primary'? 'bg-primary-500'  :
          'bg-gray-400',
        ].join(' ')} />
      )}
      {children}
    </span>
  );
}
