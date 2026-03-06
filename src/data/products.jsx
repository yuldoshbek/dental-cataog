import React from 'react';
import { Stethoscope, Wind } from 'lucide-react';

export const mockProducts = [
    {
        id: 1,
        categoryId: 'units',
        brand: 'Ajax',
        model: 'AJ15',
        country: 'Китай',
        price: '~ 250 000 - 300 000 ₽',
        priceGradation: { min: '230 000 ₽', avg: '260 000 ₽', max: '320 000 ₽' },
        colors: 'Синий, Зеленый, Желтый (более 15 цветов на выбор)',
        upholstery: 'Бесшовная полиуретановая или мягкая экокожа',
        baseConfig: 'Стул врача, нижняя подача, LED светильник, плевательница из стекла',
        options: 'Стул ассистента, фиброоптика, встроенный скайлер Woodpecker, монитор',
        desc: 'Отличная и надежная "рабочая лошадка" для старта клиники. Запчасти всегда в наличии.',
        specs: 'Грузоподъемность кресла до 135 кг. Напряжение 220V/50Hz.',
        imageIcon: <Stethoscope size={64} className="text-blue-500" />
    },
    {
        id: 2,
        categoryId: 'units',
        brand: 'KaVo',
        model: 'Estetica E70 Vision',
        country: 'Германия',
        price: '~ 1 800 000 - 2 500 000 ₽',
        priceGradation: { min: '1 700 000 ₽', avg: '2 100 000 ₽', max: '2 800 000 ₽' },
        colors: 'Белый, Серый металлик, Карбон (премиум палитра)',
        upholstery: 'Анатомическая, премиальная мягкая экокожа Relaxline',
        baseConfig: 'Верхняя/Нижняя подача, сенсорный дисплей, микромотор KL 703 LED',
        options: 'Интегрированная эндодонтия, хирургический мотор, система дезинфекции',
        desc: 'Установка премиум-класса для статусных клиник. Высочайшая эргономика.',
        specs: 'Интегрированная система гигиены, автоматические программы кресла.',
        imageIcon: <Stethoscope size={64} className="text-purple-600" />
    },
    {
        id: 3,
        categoryId: 'compressors',
        brand: 'Cattani',
        model: 'AC 200',
        country: 'Италия',
        price: '~ 180 000 ₽',
        forUnits: 'На 2-3 установки',
        dryer: 'Без осушителя (есть версия с осушителем AC 200 Q)',
        cover: 'Без шумозащитного кожуха',
        type: 'Безмасляный',
        cylinders: '2 цилиндра',
        specs: 'Мощность: 1.2 кВт, Производительность: 160 л/мин при 5 бар. Объем ресивера: 30 л.',
        desc: 'Один из самых надежных компрессоров на рынке Европы. Долгий срок службы.',
        dims: 'Вес 47 кг, Габариты 620 x 460 x 720 мм',
        imageIcon: <Wind size={64} className="text-gray-500" />
    }
];
