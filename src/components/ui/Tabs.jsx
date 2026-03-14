/**
 * src/components/ui/Tabs.jsx
 * Табы — два варианта: capsule (pill) и underline
 *
 * Использование:
 *   <Tabs
 *     tabs={[{ id: 'desc', label: 'Описание' }, ...]}
 *     active={activeTab}
 *     onChange={setActiveTab}
 *     variant="capsule"   // или "underline"
 *   />
 */

import React from 'react';

export default function Tabs({
  tabs = [],
  active,
  onChange,
  variant = 'capsule',
  className = '',
  fullWidth = false,
}) {
  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-gray-200 gap-0 ${className}`}>
        {tabs.map(tab => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={[
                'px-4 py-2.5 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px',
                isActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300',
                fullWidth ? 'flex-1' : '',
              ].join(' ')}
            >
              {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
              {tab.label}
              {tab.count != null && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  /* Capsule variant */
  return (
    <div className={`inline-flex bg-gray-100 rounded-2xl p-1 gap-0.5 ${fullWidth ? 'w-full' : ''} ${className}`}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 select-none',
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
              fullWidth ? 'flex-1 justify-center' : '',
            ].join(' ')}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.count != null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-400'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
