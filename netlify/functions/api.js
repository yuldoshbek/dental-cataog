/**
 * netlify/functions/api.js
 * РћР±С‹С‡РЅР°СЏ Netlify Function (Node.js runtime).
 * РћР±СЂР°Р±Р°С‚С‹РІР°РµС‚ РІСЃРµ /api/* Р·Р°РїСЂРѕСЃС‹. In-memory С…СЂР°РЅРёР»РёС‰Рµ СЃ РґРµРјРѕ-РґР°РЅРЅС‹РјРё.
 *
 * Р’РђР–РќРћ: РСЃРїРѕР»СЊР·СѓРµС‚ process.env (РЅРµ Netlify.env.get вЂ” СЌС‚Рѕ С‚РѕР»СЊРєРѕ РґР»СЏ Edge Functions).
 */

import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { createBitrixCatalogRepository } from '../../catalog/bitrixCatalogRepository.js';
import { getCatalogProviderFromEnv } from '../../catalog/bitrixConfig.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'demo-secret-key-change-in-production';
const ADMIN_USER = process.env.ADMIN_USERNAME ?? 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? 'admin123';
const CATALOG_PROVIDER = getCatalogProviderFromEnv();

// в”Ђв”Ђв”Ђ CORS headers в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

// в”Ђв”Ђв”Ђ In-Memory Store в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
// (СЃР±СЂР°СЃС‹РІР°РµС‚СЃСЏ РїСЂРё cold start вЂ” РЅРѕСЂРјР° РґР»СЏ РґРµРјРѕ-СЂРµР¶РёРјР°)
const store = {
    categories: [
        { id: 'units',       name: 'РЈСЃС‚Р°РЅРѕРІРєРё',               icon_name: 'Stethoscope', sort_order: 1 },
        { id: 'compressors', name: 'РљРѕРјРїСЂРµСЃСЃРѕСЂС‹',              icon_name: 'Wind',        sort_order: 2 },
        { id: 'autoclaves',  name: 'РђРІС‚РѕРєР»Р°РІС‹',                icon_name: 'Thermometer', sort_order: 3 },
        { id: 'physio',      name: 'Р¤РёР·РёРѕРґРёСЃРїРµРЅСЃРµСЂС‹',          icon_name: 'Activity',    sort_order: 4 },
        { id: 'scanners',    name: 'РРЅС‚СЂР°РѕСЂР°Р»СЊРЅС‹Рµ СЃРєР°РЅРµСЂС‹',    icon_name: 'ScanFace',    sort_order: 5 },
        { id: 'xray',        name: 'Р РµРЅС‚РіРµРЅС‹ РїРѕСЂС‚Р°С‚РёРІРЅС‹Рµ',     icon_name: 'Camera',      sort_order: 6 },
        { id: 'visiographs', name: 'Р’РёР·РёРѕРіСЂР°С„С‹',               icon_name: 'Monitor',     sort_order: 7 },
        { id: 'handpieces',  name: 'РќР°РєРѕРЅРµС‡РЅРёРєРё',              icon_name: 'Zap',         sort_order: 8 },
    ],

    summaries: [
        { id: 1, category_id: 'units',       country: 'РљРёС‚Р°Р№',    price_range: '150 000 вЂ“ 800 000 в‚Ѕ',       description: 'Р‘СЋРґР¶РµС‚РЅС‹Р№ СЃРµРіРјРµРЅС‚, Р±С‹СЃС‚СЂР°СЏ РѕРєСѓРїР°РµРјРѕСЃС‚СЊ. РЁРёСЂРѕРєРёР№ РІС‹Р±РѕСЂ РјРѕРґРµР»РµР№.',     sort_order: 1 },
        { id: 2, category_id: 'units',       country: 'Р РѕСЃСЃРёСЏ',   price_range: '200 000 вЂ“ 1 000 000 в‚Ѕ',     description: 'РҐРѕСЂРѕС€Р°СЏ СЂРµРјРѕРЅС‚РѕРїСЂРёРіРѕРґРЅРѕСЃС‚СЊ, РґРѕСЃС‚СѓРїРЅС‹Рµ Р·Р°РїС‡Р°СЃС‚Рё РЅР° СЃРєР»Р°РґРµ.',         sort_order: 2 },
        { id: 3, category_id: 'units',       country: 'РС‚Р°Р»РёСЏ',   price_range: '800 000 вЂ“ 1 500 000 в‚Ѕ',     description: 'Р•РІСЂРѕРїРµР№СЃРєРёР№ РґРёР·Р°Р№РЅ, РІС‹СЃРѕРєР°СЏ РЅР°РґС‘Р¶РЅРѕСЃС‚СЊ. РџРѕРїСѓР»СЏСЂРµРЅ Сѓ С‡Р°СЃС‚РЅС‹С… РєР»РёРЅРёРє.', sort_order: 3 },
        { id: 4, category_id: 'units',       country: 'Р“РµСЂРјР°РЅРёСЏ', price_range: '1 500 000 вЂ“ 3 500 000 в‚Ѕ',   description: 'РџСЂРµРјРёСѓРј СЃРµРіРјРµРЅС‚, РјР°РєСЃРёРјР°Р»СЊРЅР°СЏ СЌСЂРіРѕРЅРѕРјРёРєР° Рё СЃС‚Р°С‚СѓСЃ.',                 sort_order: 4 },
        { id: 5, category_id: 'compressors', country: 'РљРёС‚Р°Р№',    price_range: '30 000 вЂ“ 120 000 в‚Ѕ',        description: 'Р‘СЋРґР¶РµС‚РЅС‹Рµ СЂРµС€РµРЅРёСЏ РґР»СЏ 1вЂ“2 СѓСЃС‚Р°РЅРѕРІРѕРє.',                              sort_order: 1 },
        { id: 6, category_id: 'compressors', country: 'Р•РІСЂРѕРїР°',   price_range: '150 000 вЂ“ 400 000 в‚Ѕ',       description: 'Р•РІСЂРѕРїРµР№СЃРєРѕРµ РєР°С‡РµСЃС‚РІРѕ, С‚РёС…Р°СЏ СЂР°Р±РѕС‚Р°, РґРѕР»РіРёР№ СЂРµСЃСѓСЂСЃ.',                sort_order: 2 },
        { id: 7, category_id: 'autoclaves',  country: 'Р•РІСЂРѕРїР°',   price_range: '150 000 вЂ“ 600 000 в‚Ѕ',       description: 'РљР»Р°СЃСЃ B вЂ” СЃС‚РµСЂРёР»РёР·Р°С†РёСЏ РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ, РЅР°РєРѕРЅРµС‡РЅРёРєРѕРІ, РєР°СЃСЃРµС‚.',        sort_order: 1 },
        { id: 8, category_id: 'physio',      country: 'РС‚Р°Р»РёСЏ',   price_range: '80 000 вЂ“ 250 000 в‚Ѕ',        description: 'РРјРїР»Р°РЅС‚РѕР»РѕРіРёС‡РµСЃРєРёРµ С„РёР·РёРѕРґРёСЃРїРµРЅСЃРµСЂС‹ СЃ С€РёСЂРѕРєРёРј РґРёР°РїР°Р·РѕРЅРѕРј РѕР±РѕСЂРѕС‚РѕРІ.', sort_order: 1 },
        { id: 9, category_id: 'scanners',    country: 'Р•РІСЂРѕРїР°/РЎРЁРђ', price_range: '600 000 вЂ“ 2 500 000 в‚Ѕ',   description: 'Р¦РёС„СЂРѕРІРѕР№ СЃР»РµРїРѕРє РІРјРµСЃС‚Рѕ Р°Р»СЊРіРёРЅР°С‚РЅРѕРіРѕ. РўРѕС‡РЅРѕСЃС‚СЊ 5вЂ“20 РјРєРј.',           sort_order: 1 },
    ],

    products: [
        // в”Ђв”Ђ РЈСЃС‚Р°РЅРѕРІРєРё в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        {
            id: 'unit-1',
            category_id: 'units',
            brand: 'Ajax',
            model: 'AJ-15 Premium',
            country: 'РљРёС‚Р°Р№',
            price_label: '~ 350 000 вЂ“ 450 000 в‚Ѕ',
            price_min: 350000, price_avg: 400000, price_max: 450000,
            description: 'РќР°РґС‘Р¶РЅР°СЏ В«СЂР°Р±РѕС‡Р°СЏ Р»РѕС€Р°РґРєР°В» Р±СЋРґР¶РµС‚РЅРѕРіРѕ СЃРµРіРјРµРЅС‚Р°. РРґРµР°Р»СЊРЅР° РґР»СЏ РєР»РёРЅРёРє, РѕС‚РєСЂС‹РІР°СЋС‰РёС…СЃСЏ СЃ РЅСѓР»СЏ. РџСЂРѕСЃС‚РѕС‚Р° РѕР±СЃР»СѓР¶РёРІР°РЅРёСЏ, Р·Р°РїС‡Р°СЃС‚Рё РІСЃРµРіРґР° РІ РЅР°Р»РёС‡РёРё.',
            specs: 'Р”Р°РІР»РµРЅРёРµ РІРѕРґС‹: 2вЂ“5 Р±Р°СЂ. Р”Р°РІР»РµРЅРёРµ РІРѕР·РґСѓС…Р°: 5вЂ“7 Р±Р°СЂ. РќР°РїСЂСЏР¶РµРЅРёРµ: 220V/50Hz. Р“СЂСѓР·РѕРїРѕРґСЉС‘РјРЅРѕСЃС‚СЊ РєСЂРµСЃР»Р°: РґРѕ 135 РєРі.',
            colors: 'Р‘РµР»С‹Р№, Р‘РµР¶РµРІС‹Р№, РЎРёРЅРёР№, РЎРµСЂС‹Р№, Р—РµР»С‘РЅС‹Р№ (Р±РѕР»РµРµ 12 С†РІРµС‚РѕРІ)',
            upholstery: 'РџРѕР»РёСѓСЂРµС‚Р°РЅРѕРІР°СЏ СЌРєРѕРєРѕР¶Р° (СЃС‚Р°РЅРґР°СЂС‚) / РЅР°С‚СѓСЂР°Р»СЊРЅР°СЏ РєРѕР¶Р° (РґРѕРї.)',
            base_config: 'РљСЂРµСЃР»Рѕ РїР°С†РёРµРЅС‚Р°, СЃС‚СѓР» РІСЂР°С‡Р°, LED-СЃРІРµС‚РёР»СЊРЅРёРє, 3 С€Р»Р°РЅРіР°, РїР»РµРІР°С‚РµР»СЊРЅРёС†Р° РёР· СЃС‚РµРєР»Р°',
            options: 'Р¤РёР±СЂРѕРѕРїС‚РёРєР° РЅР° РЅР°РєРѕРЅРµС‡РЅРёРєРё (+15 000 в‚Ѕ), СѓР»СЊС‚СЂР°Р·РІСѓРєРѕРІРѕР№ СЃРєР°Р»РµСЂ (+20 000 в‚Ѕ), РјРѕРЅРёС‚РѕСЂ 15" (+25 000 в‚Ѕ)',
            for_units: null, dryer: null, cover: null, type: null, cylinders: null, dimensions: null,
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        {
            id: 'unit-2',
            category_id: 'units',
            brand: 'Stern Weber',
            model: 'S200 Trinity',
            country: 'РС‚Р°Р»РёСЏ',
            price_label: '~ 1 200 000 вЂ“ 1 500 000 в‚Ѕ',
            price_min: 1200000, price_avg: 1350000, price_max: 1500000,
            description: 'РС‚Р°Р»СЊСЏРЅСЃРєР°СЏ СѓСЃС‚Р°РЅРѕРІРєР° СЃСЂРµРґРЅРµРіРѕ+ РєР»Р°СЃСЃР°. Р’СЃС‚СЂРѕРµРЅРЅС‹Р№ СЃРєР°Р»РµСЂ Рё С„РёР±СЂРѕРѕРїС‚РёРєР° РІ СЃС‚Р°РЅРґР°СЂС‚Рµ. РџРѕРїСѓР»СЏСЂРЅР° РІ С‡Р°СЃС‚РЅС‹С… РєР»РёРЅРёРєР°С… СЃСЂРµРґРЅРµРіРѕ Рё РІС‹СЃРѕРєРѕРіРѕ СЃРµРіРјРµРЅС‚Р°.',
            specs: 'РЎРєРѕСЂРѕСЃС‚СЊ С‚СѓСЂР±РёРЅС‹: РґРѕ 350 000 РѕР±/РјРёРЅ. LED-РїРѕРґСЃРІРµС‚РєР°. РЎРµРЅСЃРѕСЂРЅРѕРµ СѓРїСЂР°РІР»РµРЅРёРµ. РЎРµСЂС‚РёС„РёРєР°С‚ CE.',
            colors: 'Р‘РµР»С‹Р№, РђРЅС‚СЂР°С†РёС‚, РЎР»РѕРЅРѕРІР°СЏ РєРѕСЃС‚СЊ',
            upholstery: 'РќР°С‚СѓСЂР°Р»СЊРЅР°СЏ РєРѕР¶Р° (РІ СЃС‚Р°РЅРґР°СЂС‚Рµ)',
            base_config: 'РљСЂРµСЃР»Рѕ СЃ РјР°СЃСЃР°Р¶РµРј, СЃС‚СѓР» РІСЂР°С‡Р° + Р°СЃСЃРёСЃС‚РµРЅС‚Р°, С„РёР±СЂРѕРѕРїС‚РёРєР°, РІСЃС‚СЂРѕРµРЅРЅС‹Р№ СЃРєР°Р»РµСЂ',
            options: 'РРЅС‚СЂР°РѕСЂР°Р»СЊРЅР°СЏ РєР°РјРµСЂР° (+35 000 в‚Ѕ), РјРѕРЅРёС‚РѕСЂ РЅР° РєСЂРѕРЅС€С‚РµР№РЅРµ (+40 000 в‚Ѕ)',
            for_units: null, dryer: null, cover: null, type: null, cylinders: null, dimensions: null,
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        {
            id: 'unit-3',
            category_id: 'units',
            brand: 'KaVo',
            model: 'Estetica E70 Vision',
            country: 'Р“РµСЂРјР°РЅРёСЏ',
            price_label: '~ 2 800 000 вЂ“ 3 200 000 в‚Ѕ',
            price_min: 2800000, price_avg: 3000000, price_max: 3200000,
            description: 'Р¤Р»Р°РіРјР°РЅ РЅРµРјРµС†РєРѕРіРѕ РїСЂРѕРёР·РІРѕРґСЃС‚РІР°. РњР°РєСЃРёРјР°Р»СЊРЅР°СЏ СЌСЂРіРѕРЅРѕРјРёРєР°, РёРЅС‚РµРіСЂР°С†РёСЏ СЃ С†РёС„СЂРѕРІС‹Рј СЂР°Р±РѕС‡РёРј РїРѕС‚РѕРєРѕРј, РІСЃС‚СЂРѕРµРЅРЅС‹Р№ РјРѕРЅРёС‚РѕСЂ, Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ РґРµР·РёРЅС„РµРєС†РёСЏ. РЎС‚Р°С‚СѓСЃРЅС‹Р№ РІС‹Р±РѕСЂ РґР»СЏ VIP-РєР»РёРЅРёРє.',
            specs: 'Touch-РїР°РЅРµР»СЊ СѓРїСЂР°РІР»РµРЅРёСЏ, РІСЃС‚СЂРѕРµРЅРЅР°СЏ РєР°РјРµСЂР°, Bluetooth, Wi-Fi. РЎРµСЂС‚РёС„РёРєР°С‚ CE. РќРµРјРµС†РєР°СЏ СЃР±РѕСЂРєР°.',
            colors: 'Р‘РµР»С‹Р№, РђРЅС‚СЂР°С†РёС‚',
            upholstery: 'РљРѕР¶Р° РїСЂРµРјРёСѓРј-РєР»Р°СЃСЃР° СЃ РїР°РјСЏС‚СЊСЋ С„РѕСЂРјС‹',
            base_config: 'РџРѕР»РЅР°СЏ РєРѕРјРїР»РµРєС‚Р°С†РёСЏ: С„РёР±СЂРѕРѕРїС‚РёРєР°, СЃРєР°Р»РµСЂ, РјРѕРЅРёС‚РѕСЂ, РєР°РјРµСЂР°, С„СѓРЅРєС†РёСЏ РјР°СЃСЃР°Р¶Р°',
            options: 'CEREC-РёРЅС‚РµРіСЂР°С†РёСЏ (+350 000 в‚Ѕ), РёРЅС‚СЂР°РѕСЂР°Р»СЊРЅС‹Р№ СЃРєР°РЅРµСЂ (+400 000 в‚Ѕ)',
            for_units: null, dryer: null, cover: null, type: null, cylinders: null, dimensions: null,
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // в”Ђв”Ђ РљРѕРјРїСЂРµСЃСЃРѕСЂС‹ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        {
            id: 'comp-1',
            category_id: 'compressors',
            brand: 'Durr Dental',
            model: 'Tornado 1',
            country: 'Р“РµСЂРјР°РЅРёСЏ',
            price_label: '~ 180 000 вЂ“ 220 000 в‚Ѕ',
            price_min: 180000, price_avg: 200000, price_max: 220000,
            description: 'Р‘РµР·РјР°СЃР»СЏРЅС‹Р№ РєРѕРјРїСЂРµСЃСЃРѕСЂ РЅРµРјРµС†РєРѕРіРѕ РїСЂРѕРёР·РІРѕРґСЃС‚РІР°. РўРёС…Р°СЏ СЂР°Р±РѕС‚Р° (55 dB), РІСЃС‚СЂРѕРµРЅРЅС‹Р№ РјРµРјР±СЂР°РЅРЅС‹Р№ РѕСЃСѓС€РёС‚РµР»СЊ. Р РµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ РґР»СЏ 1вЂ“2 СѓСЃС‚Р°РЅРѕРІРѕРє.',
            specs: 'РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ: 100 Р»/РјРёРЅ. Р Р°Р±РѕС‡РµРµ РґР°РІР»РµРЅРёРµ: 8 Р±Р°СЂ. РћР±СЉС‘Рј СЂРµСЃРёРІРµСЂР°: 45 Р». РЈСЂРѕРІРµРЅСЊ С€СѓРјР°: 55 dB.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: 'РќР° 1вЂ“2 СѓСЃС‚Р°РЅРѕРІРєРё',
            type: 'Р‘РµР·РјР°СЃР»СЏРЅС‹Р№ РїРѕСЂС€РЅРµРІРѕР№',
            dryer: 'Р’СЃС‚СЂРѕРµРЅРЅС‹Р№ РјРµРјР±СЂР°РЅРЅС‹Р№ РѕСЃСѓС€РёС‚РµР»СЊ',
            cover: 'РЁСѓРјРѕР·Р°С‰РёС‚РЅС‹Р№ РєРѕР¶СѓС… (РІ РєРѕРјРїР»РµРєС‚Рµ)',
            cylinders: '2 С†РёР»РёРЅРґСЂР°',
            dimensions: 'Р’РµСЃ: 47 РєРі. Р“Р°Р±Р°СЂРёС‚С‹: 620Г—460Г—720 РјРј',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        {
            id: 'comp-2',
            category_id: 'compressors',
            brand: 'Ekom',
            model: 'DUO 2V/50',
            country: 'Р§РµС…РёСЏ',
            price_label: '~ 90 000 вЂ“ 120 000 в‚Ѕ',
            price_min: 90000, price_avg: 105000, price_max: 120000,
            description: 'Р§РµС€СЃРєРёР№ Р±РµР·РјР°СЃР»СЏРЅС‹Р№ РєРѕРјРїСЂРµСЃСЃРѕСЂ. РҐРѕСЂРѕС€РµРµ СЃРѕРѕС‚РЅРѕС€РµРЅРёРµ С†РµРЅР°/РєР°С‡РµСЃС‚РІРѕ РґР»СЏ 2вЂ“3 СѓСЃС‚Р°РЅРѕРІРѕРє. Р”РѕСЃС‚СѓРїРЅС‹Р№ СЃРµСЂРІРёСЃ Рё Р·Р°РїС‡Р°СЃС‚Рё РІ Р РѕСЃСЃРёРё.',
            specs: 'РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ: 2Г—100 Р»/РјРёРЅ. Р”Р°РІР»РµРЅРёРµ: 8 Р±Р°СЂ. РћР±СЉС‘Рј СЂРµСЃРёРІРµСЂР°: 50 Р».',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: 'РќР° 2вЂ“3 СѓСЃС‚Р°РЅРѕРІРєРё',
            type: 'Р‘РµР·РјР°СЃР»СЏРЅС‹Р№',
            dryer: 'Р‘РµР· РѕСЃСѓС€РёС‚РµР»СЏ (СЂРµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ РґРѕРєСѓРїРёС‚СЊ РѕС‚РґРµР»СЊРЅРѕ)',
            cover: 'Р‘РµР· РєРѕР¶СѓС…Р°',
            cylinders: '4 С†РёР»РёРЅРґСЂР°',
            dimensions: 'Р’РµСЃ: 62 РєРі. Р“Р°Р±Р°СЂРёС‚С‹: 700Г—480Г—800 РјРј',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // в”Ђв”Ђ РђРІС‚РѕРєР»Р°РІ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        {
            id: 'auto-1',
            category_id: 'autoclaves',
            brand: 'Euronda',
            model: 'E9 Next',
            country: 'РС‚Р°Р»РёСЏ',
            price_label: '~ 220 000 вЂ“ 280 000 в‚Ѕ',
            price_min: 220000, price_avg: 250000, price_max: 280000,
            description: 'РС‚Р°Р»СЊСЏРЅСЃРєРёР№ РїР°СЂРѕРІРѕР№ Р°РІС‚РѕРєР»Р°РІ РєР»Р°СЃСЃР° B. РЎС‚РµСЂРёР»РёР·СѓРµС‚ РёРЅСЃС‚СЂСѓРјРµРЅС‚С‹, РЅР°РєРѕРЅРµС‡РЅРёРєРё, Р±РѕСЂРјР°С€РёРЅС‹ Рё РїРѕСЂРёСЃС‚С‹Рµ РјР°С‚РµСЂРёР°Р»С‹. Р’СЃС‚СЂРѕРµРЅРЅС‹Р№ РїСЂРёРЅС‚РµСЂ Рё SD-РєР°СЂС‚Р° РґР»СЏ РґРѕРєСѓРјРµРЅС‚Р°С†РёРё.',
            specs: 'РћР±СЉС‘Рј РєР°РјРµСЂС‹: 17 Р». Р Р°Р±РѕС‡Р°СЏ С‚РµРјРїРµСЂР°С‚СѓСЂР°: 121вЂ“134В°C. РљР»Р°СЃСЃ B (EN 13060). Р’СЃС‚СЂРѕРµРЅРЅС‹Р№ РїСЂРёРЅС‚РµСЂ РїСЂРѕС‚РѕРєРѕР»РѕРІ.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: null, dryer: null, cover: null, type: null, cylinders: null,
            dimensions: 'Р’РµСЃ: 38 РєРі. Р“Р°Р±Р°СЂРёС‚С‹: 530Г—440Г—380 РјРј',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // в”Ђв”Ђ Р¤РёР·РёРѕРґРёСЃРїРµРЅСЃРµСЂ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        {
            id: 'physio-1',
            category_id: 'physio',
            brand: 'W&H',
            model: 'Elcomed SA-310',
            country: 'РђРІСЃС‚СЂРёСЏ',
            price_label: '~ 130 000 вЂ“ 160 000 в‚Ѕ',
            price_min: 130000, price_avg: 145000, price_max: 160000,
            description: 'РђРІСЃС‚СЂРёР№СЃРєРёР№ С„РёР·РёРѕРґРёСЃРїРµРЅСЃРµСЂ РґР»СЏ РёРјРїР»Р°РЅС‚РѕР»РѕРіРёРё. РўРѕС‡РЅС‹Р№ РєРѕРЅС‚СЂРѕР»СЊ РєСЂСѓС‚СЏС‰РµРіРѕ РјРѕРјРµРЅС‚Р° Рё СЃРєРѕСЂРѕСЃС‚Рё, Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ СЂРµРІРµСЂСЃ. РРЅС‚СѓРёС‚РёРІРЅРѕРµ СѓРїСЂР°РІР»РµРЅРёРµ С‡РµСЂРµР· РїРµРґР°Р»СЊ.',
            specs: 'РЎРєРѕСЂРѕСЃС‚СЊ: 150вЂ“40 000 РѕР±/РјРёРЅ. РљСЂСѓС‚СЏС‰РёР№ РјРѕРјРµРЅС‚: РґРѕ 3,5 РќСЃРј. РџРѕРґСЃРІРµС‚РєР° LED. РџСЂРѕС‚РёРІРѕСѓРіРѕРЅРЅР°СЏ РїРµРґР°Р»СЊ.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: null, dryer: null, cover: null, type: null, cylinders: null,
            dimensions: 'Р’РµСЃ: 2,1 РєРі. Р“Р°Р±Р°СЂРёС‚С‹ Р±Р»РѕРєР°: 220Г—170Г—115 РјРј',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // в”Ђв”Ђ РРЅС‚СЂР°РѕСЂР°Р»СЊРЅС‹Р№ СЃРєР°РЅРµСЂ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        {
            id: 'scan-1',
            category_id: 'scanners',
            brand: 'Medit',
            model: 'i700',
            country: 'Р®Р¶РЅР°СЏ РљРѕСЂРµСЏ',
            price_label: '~ 900 000 вЂ“ 1 100 000 в‚Ѕ',
            price_min: 900000, price_avg: 1000000, price_max: 1100000,
            description: 'РћРґРёРЅ РёР· Р»СѓС‡С€РёС… СЃРєР°РЅРµСЂРѕРІ РїРѕ СЃРѕРѕС‚РЅРѕС€РµРЅРёСЋ С†РµРЅР°/С‚РѕС‡РЅРѕСЃС‚СЊ. РћС‚РєСЂС‹С‚С‹Р№ С„РѕСЂРјР°С‚ STL, СЃРѕРІРјРµСЃС‚РёРј СЃ Р»СЋР±С‹Рј CAD/CAM-РїСЂРѕРіСЂР°РјРјРЅС‹Рј РѕР±РµСЃРїРµС‡РµРЅРёРµРј. Р‘С‹СЃС‚СЂРѕРµ СЃРєР°РЅРёСЂРѕРІР°РЅРёРµ вЂ” РїРѕР»РЅР°СЏ РґСѓРіР° Р·Р° 60 СЃРµРє.',
            specs: 'РўРѕС‡РЅРѕСЃС‚СЊ: <7 РјРєРј. Р¤РѕСЂРјР°С‚: STL, OBJ, PLY. USB-СЃРѕРµРґРёРЅРµРЅРёРµ. Р’РµСЃ РЅР°РєРѕРЅРµС‡РЅРёРєР°: 330 Рі. Р“Р°СЂР°РЅС‚РёСЏ 3 РіРѕРґР°.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: null, dryer: null, cover: null, type: null, cylinders: null,
            dimensions: 'Р’РµСЃ РЅР°РєРѕРЅРµС‡РЅРёРєР°: 330 Рі. Р”Р»РёРЅР°: 310 РјРј',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // в”Ђв”Ђ Р РµРЅС‚РіРµРЅ РїРѕСЂС‚Р°С‚РёРІРЅС‹Р№ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        {
            id: 'xray-1',
            category_id: 'xray',
            brand: 'Vatech',
            model: 'EzRay Air W',
            country: 'Р®Р¶РЅР°СЏ РљРѕСЂРµСЏ',
            price_label: '~ 85 000 вЂ“ 110 000 в‚Ѕ',
            price_min: 85000, price_avg: 97000, price_max: 110000,
            description: 'Р‘РµСЃРїСЂРѕРІРѕРґРЅРѕР№ РїРѕСЂС‚Р°С‚РёРІРЅС‹Р№ СЂРµРЅС‚РіРµРЅ. РђРєРєСѓРјСѓР»СЏС‚РѕСЂ РЅР° 200 СЃРЅРёРјРєРѕРІ. Р›С‘РіРєРёР№ (1,5 РєРі), СѓРґРѕР±РµРЅ РїСЂРё СЂР°Р±РѕС‚Рµ РІ РѕРїРµСЂР°С†РёРѕРЅРЅРѕР№ РёР»Рё РїСЂРё РІС‹РµР·РґР°С…. DC-С‚РµС…РЅРѕР»РѕРіРёСЏ СЃРЅРёР¶Р°РµС‚ РґРѕР·Сѓ РѕР±Р»СѓС‡РµРЅРёСЏ.',
            specs: 'РќР°РїСЂСЏР¶РµРЅРёРµ: 60вЂ“70 РєР’. РўРѕРє: 2 РјРђ. Р’РµСЃ: 1,5 РєРі. Р‘Р°С‚Р°СЂРµСЏ: РґРѕ 200 СЃРЅРёРјРєРѕРІ. РЎС‚Р°РЅРґР°СЂС‚: RoHS/CE/FDA.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: null, dryer: null, cover: null, type: 'Р‘РµСЃРїСЂРѕРІРѕРґРЅРѕР№ DC', cylinders: null,
            dimensions: 'Р’РµСЃ: 1,5 РєРі. Р Р°Р·РјРµСЂ: 290Г—90Г—55 РјРј',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // в”Ђв”Ђ Р’РёР·РёРѕРіСЂР°С„ в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        {
            id: 'visio-1',
            category_id: 'visiographs',
            brand: 'Dentsply Sirona',
            model: 'Schick 33',
            country: 'РЎРЁРђ',
            price_label: '~ 180 000 вЂ“ 240 000 в‚Ѕ',
            price_min: 180000, price_avg: 210000, price_max: 240000,
            description: 'РђРјРµСЂРёРєР°РЅСЃРєРёР№ РІРёР·РёРѕРіСЂР°С„ СЃ РјР°РєСЃРёРјР°Р»СЊРЅС‹Рј СЂР°Р·СЂРµС€РµРЅРёРµРј СЃРµРЅСЃРѕСЂР°. РўРѕРЅРєРёР№ Рё РіРёР±РєРёР№ РґР°С‚С‡РёРє, РјРёРЅРёРјР°Р»СЊРЅС‹Р№ РґРёСЃРєРѕРјС„РѕСЂС‚ РґР»СЏ РїР°С†РёРµРЅС‚Р°. РЎРѕРІРјРµСЃС‚РёРј СЃРѕ РІСЃРµРјРё СЂРµРЅС‚РіРµРЅРѕРІСЃРєРёРјРё Р°РїРїР°СЂР°С‚Р°РјРё.',
            specs: 'РЎРµРЅСЃРѕСЂ: 1500Г—1000 РїРёРєСЃ. Р Р°Р·РјРµСЂ: 33Г—26 РјРј. РљР°Р±РµР»СЊ: 2,7 Рј. РРЅС‚РµСЂС„РµР№СЃ: USB 2.0. Р Р°Р·СЂРµС€РµРЅРёРµ: 25 LP/mm.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: null, dryer: null, cover: null, type: null, cylinders: null,
            dimensions: 'Р Р°Р·РјРµСЂ РґР°С‚С‡РёРєР°: 33Г—26 РјРј. РўРѕР»С‰РёРЅР°: 5 РјРј',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
        // в”Ђв”Ђ РќР°РєРѕРЅРµС‡РЅРёРєРё в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        {
            id: 'hand-1',
            category_id: 'handpieces',
            brand: 'NSK',
            model: 'Ti-Max X600L',
            country: 'РЇРїРѕРЅРёСЏ',
            price_label: '~ 35 000 вЂ“ 50 000 в‚Ѕ',
            price_min: 35000, price_avg: 42000, price_max: 50000,
            description: 'РЇРїРѕРЅСЃРєР°СЏ С‚СѓСЂР±РёРЅР° СЃ С„РёР±СЂРѕРѕРїС‚РёРєРѕР№. Р’С‹СЃРѕРєР°СЏ СЃРєРѕСЂРѕСЃС‚СЊ, С‚РёС…Р°СЏ СЂР°Р±РѕС‚Р°, СЃР±Р°Р»Р°РЅСЃРёСЂРѕРІР°РЅРЅС‹Р№ СЂРѕС‚РѕСЂ. РЁРёСЂРѕРєРѕ РїСЂРёРјРµРЅСЏРµС‚СЃСЏ РІ РёРјРїР»Р°РЅС‚РѕР»РѕРіРёРё Рё РѕСЂС‚РѕРїРµРґРёРё.',
            specs: 'РЎРєРѕСЂРѕСЃС‚СЊ: РґРѕ 450 000 РѕР±/РјРёРЅ. Р¤РёР±СЂРѕРѕРїС‚РёРєР°: 3 LED-С‚РѕС‡РєРё. РџР°С‚СЂРѕРЅ: Borden/Midwest. Р”Р°РІР»РµРЅРёРµ РІРѕР·РґСѓС…Р°: 2вЂ“3 РєРі/СЃРјВІ.',
            colors: null, upholstery: null, base_config: null, options: null,
            for_units: null, dryer: null, cover: null, type: 'РўСѓСЂР±РёРЅРЅС‹Р№ СЃ С„РёР±СЂРѕРѕРїС‚РёРєРѕР№', cylinders: null,
            dimensions: 'Р”Р»РёРЅР°: 90 РјРј. Р’РµСЃ: 65 Рі',
            is_active: 1, created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-01T10:00:00Z', images: [],
        },
    ],

    inquiries: [],
};

const bitrixInquiries = [];
const bitrixCatalog = CATALOG_PROVIDER === 'bitrix'
    ? createBitrixCatalogRepository({
        inquiryStore: {
            createExternalInquiry({ product, type, clientName, clientPhone, message, ipAddress, source }) {
                const inquiry = {
                    id: uuidv4(),
                    product_id: product.id,
                    type,
                    client_name: clientName ?? null,
                    client_phone: clientPhone ?? null,
                    message: message ?? null,
                    ip_address: ipAddress ?? null,
                    created_at: new Date().toISOString(),
                    brand: product.brand ?? null,
                    model: product.model ?? null,
                    source,
                };
                bitrixInquiries.unshift(inquiry);
                return { success: true, id: inquiry.id };
            },
            listAll() {
                return [...bitrixInquiries, ...store.inquiries].slice(0, 200);
            },
        },
    })
    : null;

// в”Ђв”Ђв”Ђ Helpers в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

function respond(data, statusCode = 200) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json', ...CORS },
        body: JSON.stringify(data),
    };
}

function mapProduct(p) {
    return {
        id: p.id,
        categoryId: p.category_id,
        brand: p.brand,
        model: p.model,
        country: p.country,
        price: p.price_label,
        priceGradation: (p.price_min || p.price_avg || p.price_max)
            ? { min: p.price_min, avg: p.price_avg, max: p.price_max }
            : null,
        description: p.description,
        clientDescription: p.client_description ?? p.description,
        specs: p.specs ?? null,
        colors: p.colors ?? null,
        upholstery: p.upholstery ?? null,
        baseConfig: p.base_config ?? null,
        options: p.options ?? null,
        forUnits: p.for_units ?? null,
        dryer: p.dryer ?? null,
        cover: p.cover ?? null,
        type: p.type ?? null,
        cylinders: p.cylinders ?? null,
        dimensions: p.dimensions ?? null,
        isActive: Boolean(p.is_active),
        images: p.images ?? [],
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        shareSlug: p.share_slug ?? p.id,
        publishWeb: p.publish_web ?? Boolean(p.is_active),
        publishShare: p.publish_share ?? Boolean(p.is_active),
        publishTelegram: p.publish_telegram ?? Boolean(p.is_active),
        status: p.status ?? (p.is_active ? 'published' : 'draft'),
        source: p.source ?? 'netlify-demo',
    };
}

function findLocalSharedProduct(identifier) {
    return store.products.find((product) => [
        product.id,
        product.share_slug,
        product.external_code,
    ].filter(Boolean).includes(identifier));
}

function verifyToken(event) {
    const auth = (event.headers.authorization ?? event.headers.Authorization ?? '');
    if (!auth.startsWith('Bearer ')) return null;
    try {
        return jwt.verify(auth.slice(7), JWT_SECRET);
    } catch {
        return null;
    }
}

function requireAdmin(event) {
    const user = verifyToken(event);
    if (!user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    return user;
}

// в”Ђв”Ђв”Ђ Handler в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

export const handler = async (event) => {
    const method = event.httpMethod.toUpperCase();

    // CORS preflight
    if (method === 'OPTIONS') {
        return { statusCode: 204, headers: CORS, body: '' };
    }

    // РџСѓС‚СЊ: event.path = "/api/products" РёР»Рё "/.netlify/functions/api"
    // РќРѕСЂРјР°Р»РёР·СѓРµРј РґРѕ С‡Р°СЃС‚Рё РїРѕСЃР»Рµ /api/
    const rawPath = event.path ?? '';
    const path = rawPath.replace(/^\/(\.netlify\/functions\/api|api)\/?/, '');
    const segments = path.split('/').filter(Boolean);
    const qs = event.queryStringParameters ?? {};

    // Netlify Functions РёРЅРѕРіРґР° РєРѕРґРёСЂСѓСЋС‚ С‚РµР»Рѕ РІ base64 (isBase64Encoded)
    let body = {};
    if (event.body) {
        try {
            const raw = event.isBase64Encoded
                ? Buffer.from(event.body, 'base64').toString('utf-8')
                : event.body;
            body = JSON.parse(raw);
        } catch { /* ignore */ }
    }

    try {
        // в”Ђв”Ђ POST /api/auth/login в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        if (method === 'POST' && segments[0] === 'auth' && segments[1] === 'login') {
            const { username, password } = body;
            if (!username || !password || username !== ADMIN_USER || password !== ADMIN_PASS) {
                return respond({ error: 'РќРµРІРµСЂРЅС‹Р№ Р»РѕРіРёРЅ РёР»Рё РїР°СЂРѕР»СЊ.' }, 401);
            }
            const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
            return respond({ token, expiresIn: '8h' });
        }
        if (CATALOG_PROVIDER === 'bitrix') {
            const ipAddress = event.headers['x-forwarded-for'] ?? null;

            if (method === 'GET' && segments[0] === 'categories' && !segments[1]) {
                return respond(await bitrixCatalog.listCategories());
            }

            if (method === 'GET' && segments[0] === 'categories' && segments[2] === 'summary') {
                return respond(await bitrixCatalog.getCategorySummary(segments[1]));
            }

            if (method === 'GET' && segments[0] === 'products' && !segments[1]) {
                return respond(await bitrixCatalog.listProducts(qs));
            }

            if (method === 'GET' && segments[0] === 'products' && segments[1]) {
                return respond(await bitrixCatalog.getProduct(segments[1]));
            }

            if (method === 'GET' && segments[0] === 'share' && segments[1]) {
                return respond(await bitrixCatalog.getSharedProduct(segments[1]));
            }

            if (method === 'POST' && segments[0] === 'products' && !segments[1]) {
                requireAdmin(event);
                return respond(await bitrixCatalog.createProduct(body), 201);
            }

            if (method === 'PUT' && segments[0] === 'products' && segments[1]) {
                requireAdmin(event);
                return respond(await bitrixCatalog.updateProduct(segments[1], body));
            }

            if (method === 'DELETE' && segments[0] === 'products' && segments[1]) {
                requireAdmin(event);
                return respond(await bitrixCatalog.deleteProduct(segments[1]));
            }

            if (method === 'POST' && segments[0] === 'inquiries') {
                return respond(await bitrixCatalog.submitInquiry(body, { ipAddress }), 201);
            }

            if (method === 'GET' && segments[0] === 'inquiries') {
                requireAdmin(event);
                return respond(await bitrixCatalog.listInquiries());
            }

            if (!segments[0] || segments[0] === 'health') {
                return respond({ status: 'ok', mode: 'netlify', catalog: bitrixCatalog.getProviderInfo() });
            }

            return respond({ error: 'Маршрут не найден.' }, 404);
        }

        // в”Ђв”Ђ GET /api/categories в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        if (method === 'GET' && segments[0] === 'categories' && !segments[1]) {
            return respond(store.categories);
        }

        // в”Ђв”Ђ GET /api/categories/:id/summary в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        if (method === 'GET' && segments[0] === 'categories' && segments[2] === 'summary') {
            const catId = segments[1];
            const rows = store.summaries
                .filter(s => s.category_id === catId)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(({ country, price_range, description }) => ({ country, range: price_range, desc: description }));
            return respond(rows);
        }

        // в”Ђв”Ђ GET /api/products в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        if (method === 'GET' && segments[0] === 'products' && !segments[1]) {
            let list = [...store.products];
            const active = qs.active ?? '1';
            const category = qs.category;
            const search = qs.search;

            if (active !== 'all') list = list.filter(p => p.is_active === (active === '1' ? 1 : 0));
            if (category) list = list.filter(p => p.category_id === category);
            if (search) {
                const s = search.toLowerCase();
                list = list.filter(p =>
                    p.brand.toLowerCase().includes(s) ||
                    p.model.toLowerCase().includes(s) ||
                    p.country.toLowerCase().includes(s)
                );
            }
            return respond(list.map(mapProduct));
        }

        // в”Ђв”Ђ GET /api/products/:id в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        if (method === 'GET' && segments[0] === 'products' && segments[1]) {
            const p = store.products.find(p => p.id === segments[1]);
            if (!p) return respond({ error: 'РўРѕРІР°СЂ РЅРµ РЅР°Р№РґРµРЅ.' }, 404);
            return respond(mapProduct(p));
        }
        // -- GET /api/share/:slug ---------------------------------------
        if (method === 'GET' && segments[0] === 'share' && segments[1]) {
            const product = findLocalSharedProduct(segments[1]);
            if (!product || !product.is_active) {
                return respond({ error: 'Карточка не опубликована.' }, 404);
            }
            return respond(mapProduct(product));
        }

        // в”Ђв”Ђ POST /api/products в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        if (method === 'POST' && segments[0] === 'products' && !segments[1]) {
            requireAdmin(event);
            if (!body.categoryId || !body.brand || !body.model || !body.country || !body.priceLabel || !body.description) {
                return respond({ error: 'Р—Р°РїРѕР»РЅРёС‚Рµ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ (РєР°С‚РµРіРѕСЂРёСЏ, Р±СЂРµРЅРґ, РјРѕРґРµР»СЊ, СЃС‚СЂР°РЅР°, С†РµРЅР°, РѕРїРёСЃР°РЅРёРµ).' }, 400);
            }
            const newProduct = {
                id: uuidv4(),
                category_id: body.categoryId,
                brand: body.brand,
                model: body.model,
                country: body.country,
                price_label: body.priceLabel,
                price_min: body.priceMin ?? null,
                price_avg: body.priceAvg ?? null,
                price_max: body.priceMax ?? null,
                description: body.description,
                specs: body.specs ?? null,
                colors: body.colors ?? null,
                upholstery: body.upholstery ?? null,
                base_config: body.baseConfig ?? null,
                options: body.options ?? null,
                for_units: body.forUnits ?? null,
                dryer: body.dryer ?? null,
                cover: body.cover ?? null,
                type: body.type ?? null,
                cylinders: body.cylinders ?? null,
                dimensions: body.dimensions ?? null,
                is_active: body.isActive !== false ? 1 : 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                images: [],
            };
            store.products.push(newProduct);
            return respond(mapProduct(newProduct), 201);
        }

        // в”Ђв”Ђ PUT /api/products/:id в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        if (method === 'PUT' && segments[0] === 'products' && segments[1]) {
            requireAdmin(event);
            const idx = store.products.findIndex(p => p.id === segments[1]);
            if (idx === -1) return respond({ error: 'РўРѕРІР°СЂ РЅРµ РЅР°Р№РґРµРЅ.' }, 404);
            const p = store.products[idx];
            store.products[idx] = {
                ...p,
                category_id: body.categoryId ?? p.category_id,
                brand: body.brand ?? p.brand,
                model: body.model ?? p.model,
                country: body.country ?? p.country,
                price_label: body.priceLabel ?? p.price_label,
                price_min: body.priceMin !== undefined ? body.priceMin : p.price_min,
                price_avg: body.priceAvg !== undefined ? body.priceAvg : p.price_avg,
                price_max: body.priceMax !== undefined ? body.priceMax : p.price_max,
                description: body.description ?? p.description,
                specs: body.specs !== undefined ? body.specs : p.specs,
                colors: body.colors !== undefined ? body.colors : p.colors,
                upholstery: body.upholstery !== undefined ? body.upholstery : p.upholstery,
                base_config: body.baseConfig !== undefined ? body.baseConfig : p.base_config,
                options: body.options !== undefined ? body.options : p.options,
                for_units: body.forUnits !== undefined ? body.forUnits : p.for_units,
                dryer: body.dryer !== undefined ? body.dryer : p.dryer,
                cover: body.cover !== undefined ? body.cover : p.cover,
                type: body.type !== undefined ? body.type : p.type,
                cylinders: body.cylinders !== undefined ? body.cylinders : p.cylinders,
                dimensions: body.dimensions !== undefined ? body.dimensions : p.dimensions,
                is_active: body.isActive !== undefined ? (body.isActive ? 1 : 0) : p.is_active,
                updated_at: new Date().toISOString(),
            };
            return respond(mapProduct(store.products[idx]));
        }

        // в”Ђв”Ђ DELETE /api/products/:id в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        if (method === 'DELETE' && segments[0] === 'products' && segments[1]) {
            requireAdmin(event);
            const idx = store.products.findIndex(p => p.id === segments[1]);
            if (idx === -1) return respond({ error: 'РўРѕРІР°СЂ РЅРµ РЅР°Р№РґРµРЅ.' }, 404);
            store.products.splice(idx, 1);
            return respond({ success: true });
        }

        // в”Ђв”Ђ POST /api/inquiries в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        if (method === 'POST' && segments[0] === 'inquiries') {
            if (!body.productId || !body.type) {
                return respond({ error: 'РЈРєР°Р¶РёС‚Рµ productId Рё type.' }, 400);
            }
            const inq = {
                id: uuidv4(),
                product_id: body.productId,
                type: body.type,
                client_name: body.clientName ?? null,
                client_phone: body.clientPhone ?? null,
                message: body.message ?? null,
                created_at: new Date().toISOString(),
            };
            // РќР°Р№РґС‘Рј С‚РѕРІР°СЂ РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ РІ admin
            const prod = store.products.find(p => p.id === body.productId);
            if (prod) { inq.brand = prod.brand; inq.model = prod.model; }
            store.inquiries.unshift(inq);
            return respond({ success: true, id: inq.id }, 201);
        }

        // в”Ђв”Ђ GET /api/inquiries в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        if (method === 'GET' && segments[0] === 'inquiries') {
            requireAdmin(event);
            return respond(store.inquiries.slice(0, 200));
        }

        // в”Ђв”Ђ Health в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
        if (!segments[0] || segments[0] === 'health') {
            return respond({ status: 'ok', mode: 'netlify-demo', products: store.products.length, catalog: { provider: 'local', source: 'netlify-demo', readOnly: false } });
        }

        return respond({ error: 'РњР°СЂС€СЂСѓС‚ РЅРµ РЅР°Р№РґРµРЅ.' }, 404);

    } catch (err) {
        if (err.status === 401) return respond({ error: 'РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ.' }, 401);
        console.error('[api]', err.message);
        return respond({ error: 'Р’РЅСѓС‚СЂРµРЅРЅСЏСЏ РѕС€РёР±РєР° СЃРµСЂРІРµСЂР°.' }, 500);
    }
};

