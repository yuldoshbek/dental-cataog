/**
 * src/pages/AdminPage.jsx
 * Административная панель — Фаза 4 редизайн.
 * - Тёмный header (slate-900)
 * - Tabs + Badge из ui/
 * - Статус-индикатор с dot
 * - Улучшенные карточки товаров (primary цвета)
 * - Сгруппированная форма с секциями
 * - Прогресс загрузки фото
 */

import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
    Plus, Pencil, Trash2, X, Loader, UploadCloud,
    LogOut, CheckCircle, AlertCircle, Image as ImageIcon,
    Eye, ArrowLeft, Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { productsApi, categoriesApi, uploadApi, inquiriesApi, getImageUrl } from '../api/index.js';
import { useProducts } from '../hooks/useProducts.js';
import Tabs from '../components/ui/Tabs.jsx';
import Badge from '../components/ui/Badge.jsx';

const EMPTY_FORM = {
    categoryId: 'units', brand: '', model: '', country: '', priceLabel: '',
    priceMin: '', priceAvg: '', priceMax: '', description: '', specs: '',
    colors: '', upholstery: '', baseConfig: '', options: '',
    forUnits: '', dryer: '', cover: '', type: '', cylinders: '', dimensions: '',
    isActive: true,
};

const ADMIN_TABS = [
    { id: 'products',  label: 'Товары'   },
    { id: 'inquiries', label: 'Запросы'  },
];

export default function AdminPage() {
    const { isAuthenticated, logout } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    const [categories, setCategories]     = useState([]);
    const [filterCat, setFilterCat]       = useState('all');
    const [formOpen, setFormOpen]         = useState(false);
    const [editProduct, setEditProduct]   = useState(null);
    const [form, setForm]                 = useState(EMPTY_FORM);
    const [saving, setSaving]             = useState(false);
    const [toast, setToast]               = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [uploadingFor, setUploadingFor] = useState(null);
    const [inquiries, setInquiries]       = useState([]);
    const [activeTab, setActiveTab]       = useState('products');

    const { products, loading, refetch } = useProducts(
        filterCat === 'all' ? { active: 'all' } : { category: filterCat, active: 'all' }
    );

    useEffect(() => {
        categoriesApi.getAll().then(setCategories).catch(() => {});
        inquiriesApi.getAll().then(setInquiries).catch(() => {});
    }, []);

    /* ── Toast ── */
    function showToast(type, msg) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    }

    /* ── Форма ── */
    function openCreate() {
        setEditProduct(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
    }

    function openEdit(product) {
        setEditProduct(product);
        setForm({
            categoryId:  product.categoryId,
            brand:       product.brand,
            model:       product.model,
            country:     product.country,
            priceLabel:  product.price,
            priceMin:    product.priceGradation?.min ?? '',
            priceAvg:    product.priceGradation?.avg ?? '',
            priceMax:    product.priceGradation?.max ?? '',
            description: product.description,
            specs:       product.specs ?? '',
            colors:      product.colors ?? '',
            upholstery:  product.upholstery ?? '',
            baseConfig:  product.baseConfig ?? '',
            options:     product.options ?? '',
            forUnits:    product.forUnits ?? '',
            dryer:       product.dryer ?? '',
            cover:       product.cover ?? '',
            type:        product.type ?? '',
            cylinders:   product.cylinders ?? '',
            dimensions:  product.dimensions ?? '',
            isActive:    product.isActive,
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

    /* Хелпер поля формы */
    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm(p => ({
            ...p,
            [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
        })),
    });

    /* Встроенные компоненты формы (styled) */
    const FInput = ({ label, name, required, type = 'text', placeholder, half }) => (
        <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            <input
                type={type}
                required={required}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-gray-50 focus:bg-white transition-colors"
                {...field(name)}
            />
        </div>
    );

    const FTextarea = ({ label, name, placeholder, rows = 2 }) => (
        <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
            <textarea
                rows={rows}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-gray-50 focus:bg-white resize-none transition-colors"
                {...field(name)}
            />
        </div>
    );

    const FormSection = ({ title, children }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-primary-500 rounded-full block shrink-0" />
                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">{title}</p>
            </div>
            {children}
        </div>
    );

    /* Tabs с бейджем для запросов */
    const tabList = ADMIN_TABS.map(t => ({
        ...t,
        count: t.id === 'inquiries' && inquiries.length > 0 ? inquiries.length : undefined,
    }));

    return (
        <div className="min-h-screen bg-dental-bg">

            {/* ── Toast ─────────────────────────────────────────── */}
            {toast && (
                <div className={[
                    'fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-modal text-sm font-semibold animate-slide-down',
                    toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white',
                ].join(' ')}>
                    {toast.type === 'success'
                        ? <CheckCircle size={16} />
                        : <AlertCircle size={16} />
                    }
                    {toast.msg}
                </div>
            )}

            {/* ── NAVBAR (тёмный) ──────────────────────────────── */}
            <nav className="bg-slate-900 text-white px-4 sm:px-6 py-0 flex items-center justify-between sticky top-0 z-30 h-14 shadow-lg">
                <div className="flex items-center gap-3">
                    <span className="text-lg">🦷</span>
                    <span className="font-bold text-white text-sm">База Знаний</span>
                    <Badge variant="primary" size="xs" className="bg-primary-500 text-white border-0">
                        ADMIN
                    </Badge>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/"
                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={14} />
                        <span className="hidden sm:inline">Каталог</span>
                    </Link>
                    <button
                        onClick={logout}
                        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors"
                    >
                        <LogOut size={15} />
                        <span className="hidden sm:inline">Выйти</span>
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

                {/* ── Tabs ─────────────────────────────────────── */}
                <div className="mb-6">
                    <Tabs
                        tabs={tabList}
                        active={activeTab}
                        onChange={setActiveTab}
                        variant="capsule"
                    />
                </div>

                {/* ── ТАБ: ТОВАРЫ ──────────────────────────────── */}
                {activeTab === 'products' && (
                    <>
                        {/* Панель управления */}
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-600">Категория:</span>
                                <select
                                    value={filterCat}
                                    onChange={e => setFilterCat(e.target.value)}
                                    className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-white"
                                >
                                    <option value="all">Все категории</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {!loading && (
                                    <span className="text-xs text-gray-400 font-medium">
                                        {products.length} товаров
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={openCreate}
                                className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors"
                            >
                                <Plus size={16} />
                                Добавить товар
                            </button>
                        </div>

                        {/* Список товаров */}
                        {loading ? (
                            <div className="flex justify-center py-16">
                                <Loader size={28} className="animate-spin text-primary-400" />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                                <Package size={36} className="text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">Нет товаров</p>
                                <p className="text-sm text-gray-400 mt-1">Нажмите «Добавить товар»</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5 animate-fade-in">
                                {products.map(product => {
                                    const primaryImg = product.images?.find(i => i.is_primary) ?? product.images?.[0];
                                    return (
                                        <div
                                            key={product.id}
                                            className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-primary-200 hover:shadow-card transition-all duration-200"
                                        >
                                            {/* Превью */}
                                            <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                                                {primaryImg
                                                    ? <img src={getImageUrl(primaryImg.filename)} alt="" className="w-full h-full object-cover" loading="lazy" />
                                                    : <ImageIcon size={20} className="text-gray-300" />
                                                }
                                            </div>

                                            {/* Контент */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                    <p className="font-semibold text-gray-900 text-sm">
                                                        {product.brand} {product.model}
                                                    </p>
                                                    <Badge variant="default" size="xs">{product.country}</Badge>
                                                    {product.isActive
                                                        ? <Badge variant="green"  size="xs" dot>Активен</Badge>
                                                        : <Badge variant="amber"  size="xs" dot>Скрыт</Badge>
                                                    }
                                                </div>
                                                <p className="text-xs font-semibold text-primary-600">{product.price}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 truncate">{product.description}</p>

                                                {/* Миниатюры фото */}
                                                <div className="flex gap-1.5 mt-2 flex-wrap items-center">
                                                    {product.images?.map(img => (
                                                        <div key={img.id} className="relative group">
                                                            <img
                                                                src={getImageUrl(img.filename)}
                                                                alt=""
                                                                loading="lazy"
                                                                className={`w-9 h-9 rounded-lg object-cover border-2 transition-all ${img.is_primary ? 'border-primary-400' : 'border-transparent'}`}
                                                            />
                                                            <button
                                                                onClick={() => handleDeleteImage(img.id)}
                                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {/* Кнопка загрузки */}
                                                    <label className="w-9 h-9 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                                                        {uploadingFor === product.id
                                                            ? <Loader size={12} className="animate-spin text-primary-500" />
                                                            : <Plus size={12} className="text-gray-400" />
                                                        }
                                                        <input
                                                            type="file" multiple accept="image/*" hidden
                                                            onChange={e => handleUpload(e, product.id)}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col sm:flex-row items-center gap-1 shrink-0">
                                                <Link
                                                    to={`/product/${product.slug ?? product.id}`}
                                                    target="_blank"
                                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    title="Просмотр"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => openEdit(product)}
                                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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
                            </div>
                        )}
                    </>
                )}

                {/* ── ТАБ: ЗАПРОСЫ ─────────────────────────────── */}
                {activeTab === 'inquiries' && (
                    <div className="space-y-3 animate-fade-in">
                        {inquiries.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-400">Запросов от клиентов пока нет.</p>
                            </div>
                        ) : inquiries.map(inq => (
                            <div key={inq.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-primary-200 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    {inq.type === 'approve'
                                        ? <Badge variant="green"   size="sm" dot>✅ Одобрение</Badge>
                                        : <Badge variant="primary" size="sm" dot>💬 Вопрос</Badge>
                                    }
                                    <span className="text-xs text-gray-400">
                                        {new Date(inq.created_at).toLocaleString('ru-RU')}
                                    </span>
                                </div>
                                <p className="font-semibold text-sm text-gray-800">{inq.brand} {inq.model}</p>
                                {inq.client_name  && <p className="text-sm text-gray-600 mt-1">Клиент: <span className="font-medium">{inq.client_name}</span></p>}
                                {inq.client_phone && <p className="text-sm text-gray-600">Тел: <span className="font-medium">{inq.client_phone}</span></p>}
                                {inq.message      && <p className="text-sm text-gray-400 italic mt-1.5">"{inq.message}"</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── ФОРМА ТОВАРА ─────────────────────────────────── */}
            {formOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 animate-fade-in"
                    onClick={e => { if (e.target === e.currentTarget) setFormOpen(false); }}
                >
                    <form
                        onSubmit={handleSave}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-modal animate-scale-in"
                    >
                        {/* Заголовок */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-gray-900 text-base">
                                {editProduct ? '✏️ Редактировать товар' : '➕ Новый товар'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setFormOpen(false)}
                                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* Секция: Основное */}
                            <FormSection title="Основная информация">
                                {/* Категория */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-600 block mb-1">
                                        Категория <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        required
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 bg-gray-50 focus:bg-white transition-colors"
                                        {...field('categoryId')}
                                    >
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <FInput label="Бренд"   name="brand"  required placeholder="Ajax" />
                                    <FInput label="Модель"  name="model"  required placeholder="AJ15" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <FInput label="Страна производства" name="country"    required placeholder="Китай" />
                                    <FInput label="Цена (ярлык)"        name="priceLabel" required placeholder="~ 250 000 ₽" />
                                </div>
                            </FormSection>

                            {/* Секция: Цены */}
                            <FormSection title="Ценовой диапазон">
                                <div className="grid grid-cols-3 gap-3">
                                    <FInput label="Мин. (₽)"     name="priceMin" type="number" placeholder="230000" />
                                    <FInput label="Средняя (₽)"  name="priceAvg" type="number" placeholder="260000" />
                                    <FInput label="Макс. (₽)"    name="priceMax" type="number" placeholder="320000" />
                                </div>
                            </FormSection>

                            {/* Секция: Описание */}
                            <FormSection title="Описание">
                                <FTextarea
                                    label="Описание для менеджера *"
                                    name="description"
                                    placeholder="Краткое описание для диалога с клиентом..."
                                    rows={3}
                                />
                                <FTextarea
                                    label="Тех. характеристики"
                                    name="specs"
                                    placeholder="Мощность, производительность, размеры..."
                                />
                            </FormSection>

                            {/* Секция: Установки */}
                            {form.categoryId === 'units' && (
                                <FormSection title="Поля для Установок">
                                    <FTextarea label="Цветовые решения"    name="colors"     placeholder="Синий, Зелёный (более 15 цветов)" />
                                    <FInput    label="Материал обивки"     name="upholstery" placeholder="Полиуретановая экокожа" />
                                    <FTextarea label="Базовая комплектация" name="baseConfig" placeholder="Стул врача, LED светильник..." />
                                    <FTextarea label="Дополнительные опции" name="options"    placeholder="Фиброоптика, скайлер, монитор..." />
                                </FormSection>
                            )}

                            {/* Секция: Компрессоры */}
                            {form.categoryId === 'compressors' && (
                                <FormSection title="Поля для Компрессоров">
                                    <div className="grid grid-cols-2 gap-3">
                                        <FInput label="Для скольки установок" name="forUnits"   placeholder="На 2-3 установки" />
                                        <FInput label="Тип компрессора"       name="type"       placeholder="Безмасляный" />
                                        <FInput label="Осушитель"             name="dryer"      placeholder="Встроенный / без" />
                                        <FInput label="Шумозащитный кожух"    name="cover"      placeholder="Есть / Нет" />
                                        <FInput label="Кол-во цилиндров"      name="cylinders"  placeholder="2 цилиндра" />
                                        <FInput label="Габариты и вес"        name="dimensions" placeholder="47 кг, 620x460 мм" />
                                    </div>
                                </FormSection>
                            )}

                            {/* Статус */}
                            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="w-4 h-4 rounded accent-primary-500"
                                    {...field('isActive')}
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Показывать в каталоге
                                </label>
                                {form.isActive
                                    ? <Badge variant="green"  size="xs" dot className="ml-auto">Активен</Badge>
                                    : <Badge variant="amber"  size="xs" dot className="ml-auto">Скрыт</Badge>
                                }
                            </div>

                            {/* Кнопки */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setFormOpen(false)}
                                    className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                                >
                                    {saving && <Loader size={15} className="animate-spin" />}
                                    {editProduct ? 'Сохранить' : 'Создать товар'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Подтверждение удаления ────────────────────────── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-modal text-center animate-scale-in">
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={28} className="text-red-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">Удалить товар?</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            Это действие нельзя отменить. Все фото также будут удалены.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
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
