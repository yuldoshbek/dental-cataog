import { X } from 'lucide-react'
import DetailRow from './DetailRow'

function formatProductForCopy(product) {
  return [
    `${product.brand} ${product.model}`,
    `Страна производства: ${product.country}`,
    `Цена: ${product.price}`,
    product.desc ? `Описание: ${product.desc}` : null,
    product.specs ? `Технические характеристики: ${product.specs}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

export default function ProductModal({ product, onClose }) {
  const handleCopy = async () => {
    const content = formatProductForCopy(product)
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      // Ignored: clipboard may be blocked in some browsers/settings.
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-gray-50 p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {product.brand} {product.model}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Страна производства: <span className="font-medium text-gray-700">{product.country}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white p-2 text-gray-500 shadow-sm transition-colors hover:bg-gray-200"
            aria-label="Закрыть карточку товара"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 rounded-lg border border-green-100 bg-green-50 p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-green-800">
              Ценовое позиционирование
            </h3>
            {product.priceGradation ? (
              <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3 sm:gap-4">
                <div className="rounded border border-green-100 bg-white p-2 shadow-sm">
                  <span className="block text-xs text-gray-500">Минимальная</span>
                  <span className="font-bold text-gray-800">{product.priceGradation.min}</span>
                </div>
                <div className="rounded border border-green-100 bg-white p-2 shadow-sm">
                  <span className="block text-xs text-gray-500">Средняя</span>
                  <span className="font-bold text-green-600">{product.priceGradation.avg}</span>
                </div>
                <div className="rounded border border-green-100 bg-white p-2 shadow-sm">
                  <span className="block text-xs text-gray-500">Максимальная</span>
                  <span className="font-bold text-gray-800">{product.priceGradation.max}</span>
                </div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-green-600">{product.price}</p>
            )}
          </div>

          <div className="space-y-4">
            {product.categoryId === 'units' && (
              <>
                <DetailRow label="Цветовые решения" value={product.colors} />
                <DetailRow label="Материал обивки" value={product.upholstery} />
                <DetailRow label="Базовая комплектация" value={product.baseConfig} />
                <DetailRow label="Доп. опции (за доплату)" value={product.options} highlight />
              </>
            )}

            {product.categoryId === 'compressors' && (
              <>
                <DetailRow label="Для скольких установок" value={product.forUnits} />
                <DetailRow label="Тип компрессора" value={product.type} />
                <DetailRow label="Осушитель" value={product.dryer} />
                <DetailRow label="Шумозащитный кожух" value={product.cover} />
                <DetailRow label="Количество цилиндров" value={product.cylinders} />
              </>
            )}

            <DetailRow label="Описание (шпаргалка)" value={product.desc} />
            <DetailRow label="Тех. характеристики" value={product.specs} />
            {product.dims && <DetailRow label="Габариты и вес" value={product.dims} />}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <div className="text-sm text-gray-400">ID: #{product.id}</div>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Скопировать данные для клиента
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
