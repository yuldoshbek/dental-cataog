function readNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value).replace(/\s+/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(value) {
  return Math.round(value).toLocaleString('ru-RU');
}

export function extractPriceBounds(product) {
  const min = readNumber(product.priceGradation?.min);
  const avg = readNumber(product.priceGradation?.avg);
  const max = readNumber(product.priceGradation?.max);

  return {
    min: min ?? avg ?? max,
    max: max ?? avg ?? min,
  };
}

export function formatPriceRange(min, max) {
  if (min && max) {
    if (min === max) {
      return `${formatMoney(min)} ₽`;
    }
    return `${formatMoney(min)} - ${formatMoney(max)} ₽`;
  }

  if (min) {
    return `от ${formatMoney(min)} ₽`;
  }

  if (max) {
    return `до ${formatMoney(max)} ₽`;
  }

  return 'Цена по запросу';
}

function buildSummaryDescription(products) {
  if (!products.length) {
    return 'Позиции для этой группы пока не опубликованы.';
  }

  const brands = [...new Set(products.map((product) => product.brand).filter(Boolean))];
  if (brands.length === 0) {
    return `${products.length} позиций в активном каталоге.`;
  }

  if (brands.length === 1) {
    return `${products.length} позиций бренда ${brands[0]}.`;
  }

  if (brands.length === 2) {
    return `${products.length} позиции: ${brands[0]} и ${brands[1]}.`;
  }

  return `${products.length} позиций: ${brands.slice(0, 2).join(', ')} и др.`;
}

export function buildCategorySummaries(products, categoryId) {
  const scopedProducts = products.filter(
    (product) => product.categoryId === categoryId && product.isActive !== false,
  );
  const groups = new Map();

  for (const product of scopedProducts) {
    const country = product.country?.trim() || 'Не указано';
    const currentGroup = groups.get(country) ?? {
      country,
      min: null,
      max: null,
      products: [],
    };

    const bounds = extractPriceBounds(product);
    if (bounds.min !== null) {
      currentGroup.min = currentGroup.min === null ? bounds.min : Math.min(currentGroup.min, bounds.min);
    }
    if (bounds.max !== null) {
      currentGroup.max = currentGroup.max === null ? bounds.max : Math.max(currentGroup.max, bounds.max);
    }

    currentGroup.products.push(product);
    groups.set(country, currentGroup);
  }

  return [...groups.values()]
    .sort((left, right) => {
      const leftMin = left.min ?? Number.MAX_SAFE_INTEGER;
      const rightMin = right.min ?? Number.MAX_SAFE_INTEGER;
      return leftMin - rightMin || left.country.localeCompare(right.country, 'ru');
    })
    .map((group) => ({
      country: group.country,
      range: formatPriceRange(group.min, group.max),
      desc: buildSummaryDescription(group.products),
    }));
}
