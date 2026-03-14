/**
 * src/App.jsx — Корневой компонент с React Router
 * Фаза 4: React.lazy code splitting — каждая страница грузится отдельным чанком.
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { Loader } from 'lucide-react';

/* Lazy-импорт страниц — каждая в отдельном chunk'е */
const CatalogPage  = lazy(() => import('./pages/CatalogPage.jsx'));
const ProductPage  = lazy(() => import('./pages/ProductPage.jsx'));
const SharePage    = lazy(() => import('./pages/SharePage.jsx'));
const LoginPage    = lazy(() => import('./pages/LoginPage.jsx'));
const AdminPage    = lazy(() => import('./pages/AdminPage.jsx'));

/* Fallback при загрузке chunk'а */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dental-bg">
      <Loader size={28} className="animate-spin text-primary-400" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"             element={<CatalogPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/share/:id"    element={<SharePage />} />
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/admin"        element={<AdminPage />} />
            <Route path="*"             element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
