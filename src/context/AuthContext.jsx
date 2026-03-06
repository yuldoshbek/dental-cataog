/**
 * src/context/AuthContext.jsx
 * Глобальный контекст авторизации для Admin-панели.
 * Хранит токен в localStorage. Предоставляет login/logout.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const isAuthenticated = Boolean(token);

    const login = useCallback(async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authApi.login(username, password);
            localStorage.setItem('admin_token', data.token);
            setToken(data.token);
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('admin_token');
        setToken(null);
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, error, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider');
    return ctx;
}
