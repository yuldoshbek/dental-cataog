/**
 * routes/auth.js — JWT Аутентификация
 * POST /api/auth/login — принимает логин/пароль, возвращает JWT-токен.
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Хэш пароля генерируется при первом запуске если переменная не хэш.
// В .env можно сохранить уже хэшированный пароль для безопасности.
let cachedHash = null;

function getPasswordHash() {
    if (cachedHash) return cachedHash;

    const raw = process.env.ADMIN_PASSWORD;
    if (!raw) throw new Error('ADMIN_PASSWORD не задан в .env');

    // Если это уже bcrypt-хэш ($2...) — используем напрямую
    if (raw.startsWith('$2')) {
        cachedHash = raw;
    } else {
        // Генерируем хэш из открытого пароля (только при dev-старте)
        cachedHash = bcrypt.hashSync(raw, 12);
        console.warn(
            '⚠️  ADMIN_PASSWORD задан открытым текстом. Используйте хэш для безопасности:\n' +
            `   Хэш: ${cachedHash}`
        );
    }
    return cachedHash;
}

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { token, expiresIn }
 */
router.post('/login', (req, res) => {
    const { username, password } = req.body ?? {};

    if (!username || !password) {
        return res.status(400).json({ error: 'Необходимо указать логин и пароль.' });
    }

    const validUser = username === process.env.ADMIN_USERNAME;
    let validPass = false;

    try {
        validPass = bcrypt.compareSync(password, getPasswordHash());
    } catch {
        return res.status(500).json({ error: 'Ошибка конфигурации сервера.' });
    }

    if (!validUser || !validPass) {
        // Намеренно единое сообщение во избежание утечки данных
        return res.status(401).json({ error: 'Неверный логин или пароль.' });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN ?? '8h';
    const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn }
    );

    res.json({ token, expiresIn });
});

export default router;
