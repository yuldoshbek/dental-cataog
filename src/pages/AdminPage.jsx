/**
 * src/pages/AdminPage.jsx
 * Полноценная административная панель с защитой JWT.
 * Функции: список товаров, добавление/редактирование/удаление, загрузка фото.
 */

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
    Plus, Pencil, Trash2, X, Loader, UploadCloud,
    LogOut, CheckCircle, AlertCircle, Star, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { productsApi, categoriesApi, uploadApi, inquiriesApi, getImageUrl } from '../api/index.js';
import { useProducts } from '../hooks/useProducts.js';

// ─── Константа пустой формы ────────────────────────────────────────────────
const EMPTY_FORM = {
    categoryId: 'units', brand: '', model: '', country: '', priceLabel: '',
    priceMin: '', priceAvg: '', priceMax: '', description: '', specs: '',
    colors: '', upholstery: '', baseConfig: '', options: '',
    forUnits: '', dryer: '', cover: '', type: '', cylinders: '', dimensions: '',
    isActive: true,
};

export default function AdminPage() {
    const { isAuthenticated, logout } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    const [categories, setCategories] = useState([]);
    const [filterCat, setFilterCat] = useState('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null); // null = create
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null); // { type, msg }
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [uploadingFor, setUploadingFor] = useState(null);
    const [inquiries, setInquiries] = useState([]);
    const [tab, setTab] = useState('products'); // 'products' | 'inquiries'

    const { products, loading, refetch } = useProducts(
        filterCat === 'all' ? { active: 'all' } : { category: filterCat, active: 'all' }
    );

    useEffect(() => {
        categoriesApi.getAll().then(setCategories).catch(() => { });
        inquiriesApi.getAll().then(setInquiries).catch(() => { });
    }, []);

    function showToast(type, msg) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    }

    function openCreate() {
        setEditProduct(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
    }

    function openEdit(product) {
        setEditProduct(product);
        setForm({
            categoryId: product.categoryId,
            brand: product.brand,
            model: product.model,
            country: product.country,
            priceLabel: product.price,
            priceMin: product.priceGradation?.min ?? '',
            priceAvg: product.priceGradation?.avg ?? '',
            priceMax: product.priceGradation?.max ?? '',
            description: product.description,
            specs: product.specs ?? '',
            colors: product.colors ?? '',
            upholstery: product.upholstery ?? '',
            baseConfig: product.baseConfig ?? '',
            options: product.options ?? '',
            forUnits: product.forUnits ?? '',
            dryer: product.dryer ?? '',
            cover: product.cover ?? '',
            type: product.type ?? '',
            cylinders: product.cylinders ?? '',
            dimensions: product.dimensions ?? '',
            isActive: product.isActive,
        });
        setFormOpen(true);
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                priceMin: form.priceMin ? Number(form.priceMin) : null,
                priceAvg: form.priceAvg ? Number(form.priceAvg) : null,
                priceMax: form.priceMax ? Number(form.priceMax) : null,
            };
            if (editProduct) {
                await productsApi.update(editProduct.id, payload);
                showToast('success', 'Товар обновлён!');
            } else {
                await productsApi.create(payload);
                showToast('success', 'Товар добавлен!');
            }
            setFormOpen(false);
            refetch();
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        try {
            await productsApi.delete(id);
            setDeleteConfirm(null);
            showToast('success', 'Товар удалён.');
            refetch();
        } catch (err) {
            showToast('error', err.message);
        }
    }

    async function handleUpload(e, productId) {
        const files = e.target.files;
        if (!files?.length) return;
        setUploadingFor(productId);
        try {
            const result = await uploadApi.upload(productId, files);
            if (result.uploaded > 0) {
                showToast('success', `Загружено ${result.uploaded} фото`);
                refetch();
            } else {
                showToast('error', 'Не удалось загрузить фото');
            }
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setUploadingFor(null);
            e.target.value = '';
        }
    }

    async function handleDeleteImage(imageId) {
        try {
            await uploadApi.delete(imageId);
            refetch();
        } catch (err) {
            showToast('error', err.message);
        }
    }

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm(p => ({ ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })),
    });

    const Input = ({ label, name, required, type = 'text', placeholder, className = '' }) => (
        <div className={className}>
            <label className="text-xs font-medium text-gray-500 block mb-1">{label}{required && ' *'}</label>
            <input
                type={type}
                required={required}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...field(name)}
            />
        </div>
    );

    const Textarea = ({ label, name, placeholder, className = '' }) => (
        <div className={className}>
            <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
            <textarea
                rows={2}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                {...field(name)}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="text-lg">🦷</span>
                    <span className="font-bold text-gray-800">База Знаний</span>
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">ADMIN</span>
                </div>
                <div className="flex items-center gap-3">
                    <a href="/" className="text-sm text-gray-500 hover:text-blue-600">← Каталог</a>
                    <button
                        onClick={logout}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
                    >
                        <LogOut size={15} /> Выйти
                    </button>
                </div>
            </nav>

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Табы */}
                <div className="flex gap-1 bg-gray-200 p-1 rounded-xl w-fit mb-6">
                    {[['products', 'Товары'], ['inquiries', 'Запросы клиентов']].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {label}
                            {key === 'inquiries' && inquiries.length > 0 && (
                                <span className="ml-1.5 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {inquiries.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Таб ТОВАРЫ ── */}
                {tab === 'products' && (
                    <>
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-600">Категория:</span>
                                <select
                                    value={filterCat}
                                    onChange={e => setFilterCat(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Все</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={openCreate}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-colors"
                            >
                                <Plus size={16} /> Добавить товар
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-16"><Loader size={32} className="animate-spin text-blue-500" /></div>
                        ) : (
                            <div className="space-y-3">
                                {products.map(product => {
                                    const primaryImg = product.images?.find(i => i.is_primary) ?? product.images?.[0];
                                    return (
                                        <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                                            {/* Превью фото */}
                                            <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                                                {primaryImg
                                                    ? <img src={getImageUrl(primaryImg.filename)} alt="" className="w-full h-full object-cover" />
                                                    : <ImageIcon size={24} className="text-gray-300" />
                                                }
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-gray-900">{product.brand} {product.model}</p>
                                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{product.country}</span>
                                                    {!product.isActive && (
                                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Скрыт</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-green-600 font-medium mt-0.5">{product.price}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 truncate">{product.description}</p>
                                                {/* Миниатюры фото */}
                                                <div className="flex gap-1 mt-2 flex-wrap">
                                                    {product.images?.map(img => (
                                                        <div key={img.id} className="relative group">
                                                            <img
                                                                src={getImageUrl(img.filename)}
                                                                alt=""
                                                                className={`w-8 h-8 rounded object-cover border-2 ${img.is_primary ? 'border-blue-400' : 'border-transparent'}`}
                                                            />
                                                            <button
                                                                onClick={() => handleDeleteImage(img.id)}
                                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:flex"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {/* Загрузить фото */}
                                                    <label className="w-8 h-8 rounded border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                                        {uploadingFor === product.id
                                                            ? <Loader size={12} className="animate-spin text-blue-500" />
                                                            : <Plus size={12} className="text-gray-400" />
                                                        }
                                                        <input type="file" multiple accept="image/*" hidden onChange={e => handleUpload(e, product.id)} />
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => openEdit(product)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Редактировать"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(product.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Удалить"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {products.length === 0 && !loading && (
                                    <div className="text-center py-16 text-gray-400">
                                        <p>Нет товаров. Нажмите «Добавить товар».</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ── Таб ЗАПРОСЫ ── */}
                {tab === 'inquiries' && (
                    <div className="space-y-3">
                        {inquiries.length === 0 ? (
                            <p className="text-gray-400 text-center py-12">Запросов от клиентов пока нет.</p>
                        ) : inquiries.map(inq => (
                            <div key={inq.id} className="bg-white rounded-xl border p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${inq.type === 'approve' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {inq.type === 'approve' ? '✅ Одобрение' : '💬 Вопрос'}
                                    </span>
                                    <span className="text-xs text-gray-400">{new Date(inq.created_at).toLocaleString('ru-RU')}</span>
                                </div>
                                <p className="font-medium text-sm text-gray-800">{inq.brand} {inq.model}</p>
                                {inq.client_name && <p className="text-sm text-gray-600">Клиент: {inq.client_name}</p>}
                                {inq.client_phone && <p className="text-sm text-gray-600">Тел: {inq.client_phone}</p>}
                                {inq.message && <p className="text-sm text-gray-500 italic mt-1">"{inq.message}"</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Модал формы товара ── */}
            {formOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
                    <form
                        onSubmit={handleSave}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl"
                    >
                        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-gray-900 text-lg">
                                {editProduct ? 'Редактировать товар' : 'Новый товар'}
                            </h3>
                            <button type="button" onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={22} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* Категория */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 block mb-1">Категория *</label>
                                <select
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    {...field('categoryId')}
                                >
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Бренд" name="brand" required placeholder="Ajax" />
                                <Input label="Модель" name="model" required placeholder="AJ15" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input label="Страна производства" name="country" required placeholder="Китай" />
                                <Input label="Цена (ярлык)" name="priceLabel" required placeholder="~ 250 000 - 300 000 ₽" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <Input label="Цена мин. (₽)" name="priceMin" type="number" placeholder="230000" />
                                <Input label="Цена средняя (₽)" name="priceAvg" type="number" placeholder="260000" />
                                <Input label="Цена макс. (₽)" name="priceMax" type="number" placeholder="320000" />
                            </div>
                            <Textarea label="Описание (шпаргалка для менеджера) *" name="description" placeholder="Краткое описание для диалога с клиентом..." />
                            <Textarea label="Тех. характеристики" name="specs" placeholder="Мощность, производительность..." />

                            {/* Установки */}
                            {(form.categoryId === 'units') && (
                                <>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider pt-1">Поля для Установок</p>
                                    <Textarea label="Цветовые решения" name="colors" placeholder="Синий, Зеленый (более 15 цветов)" />
                                    <Input label="Материал обивки" name="upholstery" placeholder="Полиуретановая экокожа" />
                                    <Textarea label="Базовая комплектация" name="baseConfig" placeholder="Стул врача, LED светильник..." />
                                    <Textarea label="Доп. опции" name="options" placeholder="Фиброоптика, скайлер, монитор..." />
                                </>
                            )}

                            {/* Компрессоры */}
                            {form.categoryId === 'compressors' && (
                                <>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider pt-1">Поля для Компрессоров</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input label="Для скольки установок" name="forUnits" placeholder="На 2-3 установки" />
                                        <Input label="Тип компрессора" name="type" placeholder="Безмасляный" />
                                        <Input label="Осушитель" name="dryer" placeholder="Встроенный / без осушителя" />
                                        <Input label="Шумозащитный кожух" name="cover" placeholder="Есть / Нет" />
                                        <Input label="Кол-во цилиндров" name="cylinders" placeholder="2 цилиндра" />
                                        <Input label="Габариты и вес" name="dimensions" placeholder="Вес 47 кг, 620x460x720 мм" />
                                    </div>
                                </>
                            )}

                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="isActive" {...field('isActive')} className="w-4 h-4 rounded" />
                                <label htmlFor="isActive" className="text-sm text-gray-700">Показывать в каталоге</label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setFormOpen(false)}
                                    className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader size={16} className="animate-spin" /> : null}
                                    {editProduct ? 'Сохранить' : 'Создать товар'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Подтверждение удаления ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
                        <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-900 mb-2">Удалить товар?</h3>
                        <p className="text-sm text-gray-500 mb-5">Это действие нельзя отменить. Все фото также будут удалены.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
