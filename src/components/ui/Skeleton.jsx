/**
 * src/components/ui/Skeleton.jsx
 * Skeleton-заглушки при загрузке данных
 */

import React from 'react';

/* Базовый блок */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`skeleton rounded-xl ${className}`}
      {...props}
    />
  );
}

/* Скелетон карточки товара */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-4 flex flex-col gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex flex-col gap-1.5 mt-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <div className="flex gap-2 pt-2 border-t border-gray-50">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* Скелетон страницы каталога */
export function CatalogSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* Скелетон страницы товара */
export function ProductPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Галерея */}
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-[4/3] rounded-2xl" />
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="w-20 h-16 rounded-xl shrink-0" />
            ))}
          </div>
        </div>

        {/* Инфо */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-xl mt-2" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
