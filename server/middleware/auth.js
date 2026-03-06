/**
 * middleware/auth.js — JWT Middleware
 * Защищает admin-маршруты. Читает Bearer-токен из заголовка Authorization.
 */

import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Требуется авторизация.' });
    }

    const token = authHeader.slice(7);
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = payload;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Сессия истекла. Войдите снова.' });
        }
        return res.status(401).json({ error: 'Неверный токен авторизации.' });
    }
}
