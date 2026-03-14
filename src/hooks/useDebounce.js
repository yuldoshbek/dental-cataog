/**
 * src/hooks/useDebounce.js
 * Задержка обновления значения (debounce).
 * Используется для поиска: не делаем API-запрос при каждом нажатии клавиши.
 */

import { useState, useEffect } from 'react';

export default function useDebounce(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
