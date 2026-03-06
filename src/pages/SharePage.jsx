/**
 * src/pages/SharePage.jsx
 * Публичная страница для клиента — открывается по ссылке /share/:id
 * Оптимизирована для мобильных телефонов.
 */

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    CheckCircle, MessageCircle, ChevronLeft, ChevronRight,
    Phone, Send, X, Loader, AlertCircle, Share2
} from 'lucide-react';
import { useProduct } from '../hooks/useProducts.js';
import { inquiriesApi, getImageUrl, buildWhatsAppUrl } from '../api/index.js';
import ImageGallery from '../components/ImageGallery.jsx';
import DetailRow from '../components/DetailRow.jsx';

const MANAGER_PHONE = import.meta.env.VITE_WHATSAPP_PHONE ?? '';

export default function SharePage() {
    const { id } = useParams();
    const { product, loading, error } = useProduct(id);
    const [activeTab, setActiveTab] = useState('info');
    const [modalType, setModalType] = useState(null); // 'approve' | 'question'
    const [formData, setFormData] = useState({ name: '', phone: '', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (loading) return <LoadingScreen />;
    if (error || !product) return <ErrorScreen message={error} />;

    const primaryImage = product.images?.find(i => i.is_primary) ?? product.images?.[0];

    function openWhatsApp(type) {
        const name = product.brand + ' ' + product.model;
        const msg = type === 'approve'
            ? `Здравствуйте! Я ознакомился с предложением по оборудованию "${name}" и готов обсудить условия приобретения. Цена: ${product.price}.`
            : `Здравствуйте! У меня есть вопрос по оборудованию "${name}". `;
        window.open(buildWhatsAppUrl(MANAGER_PHONE, msg), '_blank');
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await inquiriesApi.submit({
                productId: product.id,
                type: modalType,
                clientName: formData.name,
                clientPhone: formData.phone,
                message: formData.message,
            });
            setSubmitted(true);
            // Одновременно открываем WhatsApp
            openWhatsApp(modalType);
        } catch {
            // Если API недоступен — всё равно открываем WhatsApp
            openWhatsApp(modalType);
            setModalType(null);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero с галереей */}
            <div className="relative bg-white">
                <ImageGallery images={product.images} className="h-72 sm:h-96" />
                <div className="absolute top-4 right-4">
                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({ title: product.brand + ' ' + product.model, url: window.location.href });
                            } else {
                                navigator.clipboard.writeText(window.location.href);
                            }
                        }}
                        className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md text-gray-600"
                    >
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            {/* Заголовок товара */}
            <div className="bg-white px-4 pt-5 pb-3 border-b">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{product.brand} {product.model}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Страна: <span className="font-medium text-gray-700">{product.country}</span></p>
                    </div>
                    <span className="shrink-0 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {product.country}
                    </span>
                </div>

                {/* Ценовой блок */}
                {product.priceGradation ? (
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-xl p-2.5">
                            <p className="text-[10px] text-gray-400 uppercase font-medium">Мин.</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">
                                {Number(product.priceGradation.min).toLocaleString('ru-RU')} ₽
                            </p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-2.5 ring-1 ring-green-200">
                            <p className="text-[10px] text-green-600 uppercase font-medium">Среднее</p>
                            <p className="text-sm font-bold text-green-700 mt-0.5">
                                {Number(product.priceGradation.avg).toLocaleString('ru-RU')} ₽
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-2.5">
                            <p className="text-[10px] text-gray-400 uppercase font-medium">Макс.</p>
                            <p className="text-sm font-bold text-gray-800 mt-0.5">
                                {Number(product.priceGradation.max).toLocaleString('ru-RU')} ₽
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="mt-3 text-2xl font-bold text-green-600">{product.price}</p>
                )}
            </div>

            {/* Табы */}
            <div className="bg-white border-b flex">
                {[['info', 'Описание'], ['specs', 'Характеристики']].map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === key
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Контент таба */}
            <div className="px-4 py-5 space-y-3">
                {activeTab === 'info' && (
                    <>
                        <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
                        {product.colors && <DetailRow label="Цвета" value={product.colors} />}
                        {product.upholstery && <DetailRow label="Обивка" value={product.upholstery} />}
                        {product.baseConfig && <DetailRow label="Комплектация" value={product.baseConfig} />}
                        {product.options && <DetailRow label="Дополнительно" value={product.options} highlight />}
                    </>
                )}
                {activeTab === 'specs' && (
                    <>
                        {product.specs && <DetailRow label="Тех. характеристики" value={product.specs} />}
                        {product.forUnits && <DetailRow label="Для установок" value={product.forUnits} />}
                        {product.type && <DetailRow label="Тип" value={product.type} />}
                        {product.dryer && <DetailRow label="Осушитель" value={product.dryer} />}
                        {product.cover && <DetailRow label="Кожух" value={product.cover} />}
                        {product.cylinders && <DetailRow label="Цилиндров" value={product.cylinders} />}
                        {product.dimensions && <DetailRow label="Габариты" value={product.dimensions} />}
                    </>
                )}
            </div>

            {/* CTA кнопки — прилипают к низу */}
            <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <button
                    onClick={() => setModalType('question')}
                    className="flex-1 flex items-center justify-center gap-2 border border-blue-600 text-blue-600 rounded-xl py-3 font-semibold text-sm hover:bg-blue-50 transition-colors"
                >
                    <MessageCircle size={18} /> Задать вопрос
                </button>
                <button
                    onClick={() => setModalType('approve')}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-green-700 transition-colors shadow-sm"
                >
                    <CheckCircle size={18} /> Одобрить
                </button>
            </div>

            {/* Модальное окно формы */}
            {modalType && !submitted && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b">
                            <h3 className="font-bold text-gray-900">
                                {modalType === 'approve' ? '✅ Одобрить предложение' : '💬 Задать вопрос'}
                            </h3>
                            <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Ваше имя</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Иван Иванов"
                                    value={formData.name}
                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Телефон</label>
                                <input
                                    type="tel"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="+7 (___) ___-__-__"
                                    value={formData.phone}
                                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                            {modalType === 'question' && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Ваш вопрос</label>
                                    <textarea
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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
                                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50"
                                >
                                    <MessageCircle size={16} className="text-green-500" /> WhatsApp
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                                    Отправить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Успешная отправка */}
            {submitted && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={36} className="text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Отправлено!</h3>
                        <p className="text-sm text-gray-500">Менеджер свяжется с вами в ближайшее время.</p>
                        <button
                            onClick={() => { setSubmitted(false); setModalType(null); }}
                            className="mt-6 w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700"
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader size={40} className="animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-gray-500">Загрузка информации...</p>
            </div>
        </div>
    );
}

function ErrorScreen({ message }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="text-center">
                <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-gray-800 mb-1">Товар не найден</h2>
                <p className="text-sm text-gray-500">{message ?? 'Ссылка устарела или товар был удалён.'}</p>
            </div>
        </div>
    );
}
