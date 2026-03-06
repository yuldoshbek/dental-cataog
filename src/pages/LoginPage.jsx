/**
 * src/pages/LoginPage.jsx
 * Страница входа в административную панель.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
    const { login, isAuthenticated, loading, error } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });

    useEffect(() => {
        if (isAuthenticated) navigate('/admin', { replace: true });
    }, [isAuthenticated, navigate]);

    async function handleSubmit(e) {
        e.preventDefault();
        const ok = await login(form.username, form.password);
        if (ok) navigate('/admin', { replace: true });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
                        <span className="text-3xl">🦷</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">База Знаний</h1>
                    <p className="text-blue-300 text-sm mt-1">Административная панель</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Логин</label>
                        <input
                            type="text"
                            required
                            autoComplete="username"
                            value={form.username}
                            onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="admin"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль</label>
                        <input
                            type="password"
                            required
                            autoComplete="current-password"
                            value={form.password}
                            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? <Loader size={18} className="animate-spin" /> : <LogIn size={18} />}
                        Войти
                    </button>
                </form>
            </div>
        </div>
    );
}
