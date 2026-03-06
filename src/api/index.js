/**
 * src/api/index.js — Централизованный API-клиент
 *
 * Все запросы проходят через одну точку.
 * При появлении нового бэкенда URL меняется только здесь.
 */

// На Netlify — пустая строка = тот же домен (relative URL).
// Для локальной разработки Vite проксирует /api → localhost:3001
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

async function request(path, options = {}) {
    const token = localStorage.getItem('admin_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const err = new Error(data.error ?? `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }

    return res.status === 204 ? null : res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
    login: (username, password) =>
        request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const productsApi = {
    getAll: (params = {}) => {
        const qs = new URLSearchParams(
            Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
        ).toString();
        return request(`/api/products${qs ? `?${qs}` : ''}`);
    },

    getById: (id) => request(`/api/products/${id}`),

    create: (data) =>
        request('/api/products', { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
        request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id) =>
        request(`/api/products/${id}`, { method: 'DELETE' }),
};

// ─── Categories ──────────────────────────────────────────────────────────────

export const categoriesApi = {
    getAll: () => request('/api/categories'),
    getSummary: (categoryId) => request(`/api/categories/${categoryId}/summary`),
};

// ─── Upload ──────────────────────────────────────────────────────────────────

export const uploadApi = {
    upload: (productId, files) => {
        const formData = new FormData();
        Array.from(files).forEach((f) => formData.append('images', f));
        const token = localStorage.getItem('admin_token');
        return fetch(`${BASE_URL}/api/upload/${productId}`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        }).then((r) => r.json());
    },

    delete: (imageId) =>
        request(`/api/upload/${imageId}`, { method: 'DELETE' }),

    setPrimary: (imageId) =>
        request(`/api/upload/${imageId}/primary`, { method: 'PUT' }),
};

// ─── Inquiries ───────────────────────────────────────────────────────────────

export const inquiriesApi = {
    submit: (data) =>
        request('/api/inquiries', { method: 'POST', body: JSON.stringify(data) }),

    getAll: () => request('/api/inquiries'),
};

// ─── Utility ─────────────────────────────────────────────────────────────────

export function getImageUrl(filename) {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    return `${BASE_URL}/uploads/${filename}`;
}

export function buildShareUrl(productId) {
    return `${window.location.origin}/share/${productId}`;
}

export function buildWhatsAppUrl(phone, message) {
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
