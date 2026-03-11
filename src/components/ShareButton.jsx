/**
 * src/components/ShareButton.jsx
 * Кнопка "Поделиться" — генерирует ссылку и копирует в буфер.
 * Показывает краткий тост-подтверждение.
 */

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { buildShareUrl } from '../api/index.js';

export default function ShareButton({ productId, shareSlug, className = '' }) {
    const [copied, setCopied] = useState(false);

    async function handleShare() {
        const url = buildShareUrl(shareSlug ?? productId);

        // Используем нативный Share API если доступен (мобильные)
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Предложение по оборудованию', url });
                return;
            } catch {
                // Пользователь закрыл шторку — fallback на clipboard
            }
        }

        // Fallback: копирование в буфер обмена
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    }

    return (
        <button
            onClick={handleShare}
            title="Поделиться ссылкой на товар"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${copied
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                } ${className}`}
        >
            {copied ? (
                <><Check size={16} /> Ссылка скопирована!</>
            ) : (
                <><Share2 size={16} /> Поделиться</>
            )}
        </button>
    );
}
