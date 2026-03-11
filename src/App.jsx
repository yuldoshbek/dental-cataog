/**
 * src/App.jsx — Корневой компонент с React Router
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';

import CatalogPage from './pages/CatalogPage.jsx';
import SharePage from './pages/SharePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProductPage from './pages/ProductPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Каталог менеджера */}
          <Route path="/" element={<CatalogPage />} />

          {/* Полная карточка товара */}
          <Route path="/product/:slug" element={<ProductPage />} />

          {/* Публичная страница для клиента */}
          <Route path="/share/:id" element={<SharePage />} />

          {/* Административная зона */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
