/**
 * src/pages/SharePage.jsx
 * Публичная страница для клиента — открывается по ссылке /share/:id
 * Оптимизирована для мобильных телефонов.
 */

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    CheckCircle, MessageCircle, Send, X, Loader, AlertCircle,
    ChevronLeft, ChevronRight, CheckCircle2, Phone
} from 'lucide-react';
import { useSharedProduct } from '../hooks/useProducts.js';
import { inquiriesApi, buildWhatsAppUrl, getImageUrl } from '../api/index.js';

const MANAGER_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? '';

export default function SharePage() {
    const { id } = useParams();
    const { product, loading, error } = useSharedProduct(id);
    const [activeTab, setActiveTab]   = useState('info');
    const [modalType, setModalType]   = useState(null);
    const [formData, setFormData]     = useState({ name: '', phone: '', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted]   = useState(false);
    const [imgIndex, setImgIndex]     = useState(0);

    if (loading) return <LoadingScreen />;
    if (error || !product) return <ErrorScreen message={error} />;

    const images = (product.images ?? []).map(img => ({
        url: img.url ?? getImageUrl(img.filename),
        alt: `${product.brand} ${product.model}`,
    }));
    const hasImages = images.length > 0;

    const price     = product.price ?? product.price_label;
    const hasPriceGradation = product.price_min || product.price_avg || product.price_max;

    function openWhatsApp(type) {
        const name = product.brand + ' ' + product.model;
        const msg = type === 'approve'
            ? `Здравствуйте! Ознакомился с предложением по "${name}" и готов обсудить условия. Цена: ${price ?? '—'}.`
            : `Здравствуйте! Есть вопрос по оборудованию "${name}". `;
        window.open(buildWhatsAppUrl(MANAGER_PHONE, msg), '_blank');
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
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

    return (
        <div className="min-h-screen bg-slate-50 pb-28">

            {/* ── ГАЛЕРЕЯ ── */}
            <div className="relative bg-white">
                {hasImages ? (
                    <div className="relative aspect-[4/3] sm:aspect-[16/7] overflow-hidden bg-gray-100">
                        <img
                            src={images[imgIndex].url}
                            alt={images[imgIndex].alt}
                            className="w-full h-full object-cover"
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setImgIndex(i => Math.max(0, i - 1))}
                                    disabled={imgIndex === 0}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow disabled:opacity-30"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))}
                                    disabled={imgIndex === images.length - 1}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow disabled:opacity-30"
                                >
                                    <ChevronRight size={18} />
                                </button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {images.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setImgIndex(i)}
                                            className={`rounded-full transition-all duration-200 ${i === imgIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="aspect-[4/3] sm:aspect-[16/7] bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-7xl mb-3">🦷</div>
                            <p className="text-sm text-slate-400 font-medium">Стоматологическое оборудование</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── ЗАГОЛОВОК ── */}
            <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">

                <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-1">
                    {product.brand}
                </p>
                <h1 className="text-xl font-bold text-gray-900 leading-tight mb-1">
                    {product.model}
                </h1>
                <p className="text-sm text-gray-400">
                    Производство: <span className="font-medium text-gray-600">{product.country}</span>
                </p>

                {/* Цена */}
                <div className="mt-4">
                    {hasPriceGradation ? (
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-50 rounded-xl p-3">
                                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Мин.</p>
                                <p className="text-sm font-bold text-gray-700">
                                    {product.price_min ? Number(product.price_min).toLocaleString('ru-RU') + ' ₽' : '—'}
                                </p>
                            </div>
                            <div className="bg-emerald-50 rounded-xl p-3 ring-1 ring-emerald-200">
                                <p className="text-[10px] text-emerald-600 uppercase font-semibold mb-1">Средняя</p>
                                <p className="text-sm font-bold text-emerald-700">
                                    {product.price_avg ? Number(product.price_avg).toLocaleString('ru-RU') + ' ₽' : '—'}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3">
                                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Макс.</p>
                                <p className="text-sm font-bold text-gray-700">
                                    {product.price_max ? Number(product.price_max).toLocaleString('ru-RU') + ' ₽' : '—'}
                                </p>
                            </div>
                        </div>
                    ) : price ? (
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl px-4 py-3 border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-0.5">Цена</p>
                            <p className="text-2xl font-bold text-emerald-700">{price}</p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* ── ТАБЫ ── */}
            <div className="bg-white border-b border-gray-100 flex sticky top-0 z-10">
                {[['info', 'Описание'], ['specs', 'Характеристики']].map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex-1 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === key
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── КОНТЕНТ ── */}
            <div className="px-4 py-5">
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
                                        <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                                        <span className="text-sm text-gray-700 leading-snug">{adv}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {product.colors       && <InfoRow label="Цвета"        value={product.colors} />}
                        {product.upholstery   && <InfoRow label="Обивка"       value={product.upholstery} />}
                        {product.base_config  && <InfoRow label="Комплектация" value={product.base_config} />}
                        {product.options      && <InfoRow label="Доп. опции"   value={product.options} accent />}
                    </div>
                )}

                {activeTab === 'specs' && (
                    <div className="space-y-2">
                        {Array.isArray(product.specs) && product.specs.length > 0 ? (
                            product.specs.map((group, gi) => (
                                <div key={gi} className="mb-4">
                                    {group.group && (
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                            {group.group}
                                        </p>
                                    )}
                                    <SpecsTable rows={group.rows} />
                                </div>
                            ))
                        ) : (
                            <SpecsTable rows={[
                                product.specs       && { key: 'Технические характеристики', value: product.specs },
                                product.type        && { key: 'Тип', value: product.type },
                                product.for_units   && { key: 'Для установок', value: product.for_units },
                                product.dryer       && { key: 'Осушитель', value: product.dryer },
                                product.cover       && { key: 'Кожух', value: product.cover },
                                product.cylinders   && { key: 'Цилиндров', value: product.cylinders },
                                product.dimensions  && { key: 'Габариты', value: product.dimensions },
                            ].filter(Boolean)} />
                        )}

                        {!product.specs && !product.type && !product.dimensions && (
                            <p className="text-sm text-gray-400 py-6 text-center">Характеристики не указаны.</p>
                        )}
                    </div>
                )}
            </div>

            {/* ── STICKY CTA ── */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="max-w-lg mx-auto flex gap-2.5">
                    <button
                        onClick={() => setModalType('question')}
                        className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-500 text-blue-600 rounded-2xl py-3.5 font-bold text-sm hover:bg-blue-50 active:scale-[0.98] transition-all"
                    >
                        <MessageCircle size={17} />
                        Задать вопрос
                    </button>
                    <button
                        onClick={() => openWhatsApp('approve')}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-2xl py-3.5 font-bold text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-200"
                    >
                        <CheckCircle size={17} />
                        Устраивает!
                    </button>
                </div>
            </div>

            {/* ── ФОРМА ВОПРОСА ── */}
            {modalType && !submitted && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
                    onClick={() => setModalType(null)}
                >
                    <div
                        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 text-base">
                                {modalType === 'approve' ? '✅ Одобрить предложение' : '💬 Задать вопрос'}
                            </h3>
                            <button
                                onClick={() => setModalType(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Ваше имя</label>
                                <input
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                                    placeholder="Иван Иванов"
                                    value={formData.name}
                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Телефон</label>
                                <input
                                    type="tel"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                                    placeholder="+7 (___) ___-__-__"
                                    value={formData.phone}
                                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                            {modalType === 'question' && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Ваш вопрос</label>
                                    <textarea
                                        rows={3}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white resize-none transition-colors"
                                        placeholder="Напишите ваш вопрос..."
                                        value={formData.message}
                                        onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                                    />
                                </div>
                            )}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => openWhatsApp(modalType)}
                                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    <MessageCircle size={16} className="text-emerald-500" />
                                    WhatsApp
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors"
                                >
                                    {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                                    Отправить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── УСПЕХ ── */}
            {submitted && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                            <CheckCircle size={40} className="text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Отправлено!</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Менеджер свяжется с вами в ближайшее время.
                        </p>
                        <button
                            onClick={() => { setSubmitted(false); setModalType(null); }}
                            className="mt-6 w-full bg-blue-600 text-white rounded-2xl py-3.5 font-bold hover:bg-blue-700 transition-colors"
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value, accent }) {
    return (
        <div className={`rounded-xl p-3.5 ${accent ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50'}`}>
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
                    className={`flex text-sm border-b border-gray-50 last:border-0 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
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
                <Loader size={24} className="animate-spin text-blue-400 mx-auto mb-3" />
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
