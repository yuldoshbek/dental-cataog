# Структура Данных (Модель)

## Категории (Category)
- `id`: string (уникальный идентификатор, например 'units')
- `name`: string (название категории)
- `icon`: React Component (иконка lucide-react)

## Сводки категорий (CategorySummary)
Используется для шпаргалки менеджера по общей ситуации на рынке определенной категории.
- `country`: string (Страна)
- `range`: string (Диапазон цен)
- `desc`: string (Краткое описание/шпаргалка для позиционирования)

## Оборудование (Product) - Базовые поля
- `id`: number/string
- `categoryId`: string (ссылка на category.id)
- `brand`: string (Бренд)
- `model`: string (Модель)
- `country`: string (Страна производства)
- `price`: string (Примерная цена строкой)
- `desc`: string (Краткое описание для диалога)
- `specs`: string (Тех. характеристики)
- `imageIcon`: React Component (Временная заглушка вместо img)

### Специфичные поля для 'units' (Установки)
- `priceGradation`: object { min, avg, max } (Детализация цены)
- `colors`: string (Варианты обивки/цвета)
- `upholstery`: string (Материал)
- `baseConfig`: string (Базовая комплектация)
- `options`: string (Доп. опции)

### Специфичные поля для 'compressors' (Компрессоры)
- `forUnits`: string (Для скольки установок)
- `dryer`: string (Наличие осушителя)
- `cover`: string (Шумозащитный кожух)
- `type`: string (Тип компрессорной головы)
- `cylinders`: string (Кол-во цилиндров)
- `dims`: string (Габариты)
