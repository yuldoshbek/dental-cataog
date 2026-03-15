/**
 * src/pages/SharePage.jsx
 * Публичная страница для клиента — Фаза 3 редизайн.
 * - TouchGallery (swipe, fade, lightbox)
 * - Валидация телефона в реальном времени
 * - Обе CTA кнопки solid
 * - primary-* цвета вместо emerald/green
 * - OpenGraph meta (React 19 native hoisting)
 * Маршрут: /share/:id
 */

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    CheckCircle, MessageCircle, Send, X,
    Loader, AlertCircle, CheckCircle2, Phone
} from 'lucide-react';
import { useSharedProduct } from '../hooks/useProducts.js';
import { inquiriesApi, buildWhatsAppUrl, getImageUrl } from '../api/index.js';
import TouchGallery from '../components/TouchGallery.jsx';
import Tabs from '../components/ui/Tabs.jsx';

const MANAGER_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? '';

/* ─── Утилита: проверка телефона ────────────────────────────────── */
function isValidPhone(phone) {
    return phone.replace(/\D/g, '').length >= 10;
}

/* ─── Форматирование телефона при вводе ─────────────────────────── */
function formatPhoneInput(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 1) return '+' + digits;
    if (digits.length <= 4) return `+${digits[0]} (${digits.slice(1)}`;
    if (digits.length <= 7) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`;
}

/* ─── Главный компонент ─────────────────────────────────────────── */
export default function SharePage() {
    const { id }  = useParams();
    const { product, loading, error } = useSharedProduct(id);

    const [activeTab, setActiveTab]   = useState('info');
    const [modalType, setModalType]   = useState(null);
    const [formData, setFormData]     = useState({ name: '', phone: '', message: '' });
    const [phoneError, setPhoneError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted]   = useState(false);

    if (loading) return <LoadingScreen />;
    if (error || !product) return <ErrorScreen message={error} />;

    /* ── Данные ── */
    const images = (product.images ?? []).map(img => ({
        url: img.url ?? getImageUrl(img.filename),
        alt: `${product.brand} ${product.model}`,
    }));
    const price             = product.price ?? product.price_label;
    const hasPriceGradation = product.priceGradation?.min || product.priceGradation?.avg || product.priceGradation?.max;
    const ogDesc            = product.short_description ?? product.description ?? `${product.brand} ${product.model}`;
    const ogImage           = images[0]?.url ?? '';

    const TAB_LIST = [
        { id: 'info',  label: 'Описание'       },
        { id: 'specs', label: 'Характеристики' },
    ];

    /* ── Handlers ── */
    function openWhatsApp(type) {
        const name = `${product.brand} ${product.model}`;
        const msg = type === 'approve'
            ? `Здравствуйте! Ознакомился с предложением по "${name}" и готов обсудить условия. Цена: ${price ?? '—'}.`
            : `Здравствуйте! Есть вопрос по оборудованию "${name}". `;
        window.open(buildWhatsAppUrl(MANAGER_PHONE, msg), '_blank');
    }

    function handlePhoneChange(e) {
        const formatted = formatPhoneInput(e.target.value);
        setFormData(p => ({ ...p, phone: formatted }));
        if (phoneError && isValidPhone(formatted)) setPhoneError('');
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        if (!isValidPhone(formData.phone)) {
            setPhoneError('Введите корректный номер телефона');
            return;
        }
        setPhoneError('');
        setSubmitting(true);

        try {
            await inquiriesApi.submit({
                productId:   product.id,
                type:        modalType,
                clientName:  formData.name,
                clientPhone: formData.phone,
                message:     formData.message,
            });
            setSubmitted(true);
            openWhatsApp(modalType);
        } catch {
            openWhatsApp(modalType);
            setModalType(null);
        } finally {
            setSubmitting(false);
        }
    }

    function closeModal() {
        setModalType(null);
        setPhoneError('');
        setFormData({ name: '', phone: '', message: '' });
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-28">

            {/* ── OpenGraph meta ── */}
            <title>{`${product.brand} ${product.model}`}</title>
            <meta name="description"          content={ogDesc} />
            <meta property="og:title"         content={`${product.brand} ${product.model}`} />
            <meta property="og:description"   content={ogDesc} />
            <meta property="og:image"         content={ogImage} />
            <meta property="og:type"          content="product" />
            <meta name="twitter:card"         content="summary_large_image" />
            <meta name="twitter:title"        content={`${product.brand} ${product.model}`} />
            <meta name="twitter:image"        content={ogImage} />

            {/* ── ГАЛЕРЕЯ ─────────────────────────────────────── */}
            <TouchGallery
                images={images}
                brand={product.brand}
                model={product.model}
                showThumbs={false}
                aspectRatio="aspect-[4/3] sm:aspect-[16/7]"
                enableZoom
            />

            {/* ── ЗАГОЛОВОК ────────────────────────────────────── */}
            <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">

                <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-1">
                    {product.brand}
                </p>
                <h1 className="text-xl font-bold text-gray-900 leading-tight mb-1">
                    {product.model}
                </h1>
                <p className="text-sm text-gray-400">
                    Производство:{' '}
                    <span className="font-medium text-gray-600">{product.country}</span>
                </p>

                {/* Цена */}
                <div className="mt-4">
                    {hasPriceGradation ? (
                        <div className="grid grid-cols-3 gap-2 text-center">
                            {[
                                { label: 'Мин.',    val: product.priceGradation?.min, accent: false },
                                { label: 'Средняя', val: product.priceGradation?.avg, accent: true  },
                                { label: 'Макс.',   val: product.priceGradation?.max, accent: false },
                            ].map(({ label, val, accent }) => (
                                <div
                                    key={label}
                                    className={`rounded-xl p-3 ${accent ? 'bg-primary-50 ring-1 ring-primary-200' : 'bg-gray-50'}`}
                                >
                                    <p className={`text-[10px] uppercase font-semibold mb-1 ${accent ? 'text-primary-600' : 'text-gray-400'}`}>
                                        {label}
                                    </p>
                                    <p className={`text-sm font-bold ${accent ? 'text-primary-700' : 'text-gray-700'}`}>
                                        {val ? Number(val).toLocaleString('ru-RU') + ' ₽' : '—'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : price ? (
                        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl px-4 py-3 border border-primary-100">
                            <p className="text-xs text-primary-600 font-semibold uppercase tracking-wider mb-0.5">Цена</p>
                            <p className="text-2xl font-bold text-primary-700">{price}</p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* ── ТАБЫ (sticky) ────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 pt-2">
                <Tabs
                    tabs={TAB_LIST}
                    active={activeTab}
                    onChange={setActiveTab}
                    variant="underline"
                    fullWidth
                />
            </div>

            {/* ── КОНТЕНТ ─────────────────────────────────────── */}
            <div className="px-4 py-5 animate-fade-in" key={activeTab}>
                {activeTab === 'info' && (
                    <div className="space-y-4">
                        {product.description && (
                            <p className="text-[15px] text-gray-700 leading-relaxed">
                                {product.description}
                            </p>
                        )}

                        {Array.isArray(product.advantages) && product.advantages.length > 0 && (
                            <div className="space-y-2 pt-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Преимущества</p>
                                {product.advantages.map((adv, i) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <CheckCircle2 size={15} className="text-primary-500 mt-0.5 shrink-0" />
                                        <span className="text-sm text-gray-700 leading-snug">{adv}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {product.colors      && <InfoRow label="Цвета"        value={product.colors} />}
                        {product.upholstery  && <InfoRow label="Обивка"       value={product.upholstery} />}
                        {product.base_config && <InfoRow label="Комплектация" value={product.base_config} />}
                        {product.options     && <InfoRow label="Доп. опции"   value={product.options} accent />}
                    </div>
                )}

                {activeTab === 'specs' && (
                    <div className="space-y-2">
                        {Array.isArray(product.specs) && product.specs.length > 0 ? (
                            product.specs.map((group, gi) => (
                                <div key={gi} className="mb-4">
                                    {group.group && (
                                        <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">
                                            {group.group}
                                        </p>
                                    )}
                                    <SpecsTable rows={group.rows} />
                                </div>
                            ))
                        ) : (
                            <SpecsTable rows={[
                                product.specs      && { key: 'Технические характеристики', value: product.specs },
                                product.type       && { key: 'Тип',                        value: product.type },
                                product.for_units  && { key: 'Для установок',              value: product.for_units },
                                product.dryer      && { key: 'Осушитель',                  value: product.dryer },
                                product.cover      && { key: 'Кожух',                      value: product.cover },
                                product.cylinders  && { key: 'Цилиндров',                  value: product.cylinders },
                                product.dimensions && { key: 'Габариты',                   value: product.dimensions },
                            ].filter(Boolean)} />
                        )}

                        {!product.specs && !product.type && !product.dimensions && (
                            <p className="text-sm text-gray-400 py-6 text-center">Характеристики не указаны.</p>
                        )}
                    </div>
                )}
            </div>

            {/* ── STICKY CTA ──────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="max-w-lg mx-auto flex gap-2.5">
                    <button
                        onClick={() => setModalType('question')}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl py-3.5 font-bold text-sm active:scale-[0.98] transition-all shadow-sm"
                    >
                        <MessageCircle size={17} />
                        Задать вопрос
                    </button>
                    <button
                        onClick={() => openWhatsApp('approve')}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-3.5 font-bold text-sm active:scale-[0.98] transition-all shadow-sm shadow-emerald-200"
                    >
                        <CheckCircle size={17} />
                        Устраивает!
                    </button>
                </div>
            </div>

            {/* ── ФОРМА ВОПРОСА ────────────────────────────────── */}
            {modalType && !submitted && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center animate-fade-in"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-modal animate-slide-up sm:animate-scale-in"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag handle */}
                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-gray-200" />
                        </div>

                        <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 text-base">
                                {modalType === 'approve' ? '✅ Одобрить предложение' : '💬 Задать вопрос'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                            {/* Имя */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-700">Ваше имя</label>
                                <input
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-gray-50 focus:bg-white transition-colors"
                                    placeholder="Иван Иванов"
                                    value={formData.name}
                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>

                            {/* Телефон с валидацией */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-700">
                                    Телефон <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        className={[
                                            'w-full pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-colors bg-gray-50 focus:bg-white',
                                            phoneError
                                                ? 'border-2 border-red-400 focus:ring-2 focus:ring-red-400/30'
                                                : 'border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400',
                                        ].join(' ')}
                                        placeholder="+7 (___) ___-__-__"
                                        value={formData.phone}
                                        onChange={handlePhoneChange}
                                    />
                                </div>
                                {phoneError && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <span>⚠</span> {phoneError}
                                    </p>
                                )}
                            </div>

                            {/* Вопрос */}
                            {modalType === 'question' && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-700">Ваш вопрос</label>
                                    <textarea
                                        rows={3}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-gray-50 focus:bg-white resize-none transition-colors"
                                        placeholder="Напишите ваш вопрос..."
                                        value={formData.message}
                                        onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                                    />
                                </div>
                            )}

                            {/* Кнопки */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => openWhatsApp(modalType)}
                                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    <MessageCircle size={16} className="text-[#25D366]" />
                                    WhatsApp
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-3 text-sm font-bold disabled:opacity-60 transition-colors"
                                >
                                    {submitting
                                        ? <Loader size={16} className="animate-spin" />
                                        : <Send size={16} />
                                    }
                                    Отправить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── УСПЕХ ────────────────────────────────────────── */}
            {submitted && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-modal animate-scale-in">
                        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <CheckCircle size={40} className="text-primary-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Отправлено!</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Менеджер свяжется с вами в ближайшее время.
                        </p>
                        <button
                            onClick={() => { setSubmitted(false); closeModal(); }}
                            className="mt-6 w-full bg-primary-500 hover:bg-primary-600 text-white rounded-2xl py-3.5 font-bold transition-colors"
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Вспомогательные компоненты ────────────────────────────────── */
function InfoRow({ label, value, accent }) {
    return (
        <div className={`rounded-xl p-3.5 ${accent ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${accent ? 'text-amber-600' : 'text-gray-400'}`}>
                {label}
            </p>
            <p className="text-sm text-gray-700 leading-snug">{value}</p>
        </div>
    );
}

function SpecsTable({ rows }) {
    if (!rows?.length) return null;
    return (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
            {rows.map((row, ri) => (
                <div
                    key={ri}
                    className={`flex text-sm border-b border-gray-50 last:border-0 hover:bg-primary-50/20 transition-colors ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}
                >
                    <div className="w-2/5 px-3 py-2.5 text-gray-500 font-medium shrink-0 text-[13px]">{row.key}</div>
                    <div className="flex-1 px-3 py-2.5 text-gray-900 font-semibold text-[13px]">{row.value}</div>
                </div>
            ))}
        </div>
    );
}

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="text-5xl mb-4">🦷</div>
                <Loader size={24} className="animate-spin text-primary-400 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Загрузка...</p>
            </div>
        </div>
    );
}

function ErrorScreen({ message }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="text-center">
                <AlertCircle size={48} className="text-red-300 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-gray-800 mb-2">Товар не найден</h2>
                <p className="text-sm text-gray-400">{message ?? 'Ссылка устарела или товар был удалён.'}</p>
            </div>
        </div>
    );
}
