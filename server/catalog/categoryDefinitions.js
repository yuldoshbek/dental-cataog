export const CATEGORY_DEFINITIONS = Object.freeze([
  { id: 'units', name: 'Установки', iconName: 'Stethoscope', sortOrder: 1 },
  { id: 'compressors', name: 'Компрессоры', iconName: 'Wind', sortOrder: 2 },
  { id: 'autoclaves', name: 'Автоклавы', iconName: 'Thermometer', sortOrder: 3 },
  { id: 'physio', name: 'Физиодиспенсеры', iconName: 'Activity', sortOrder: 4 },
  { id: 'scanners', name: 'Интраоральные сканеры', iconName: 'ScanFace', sortOrder: 5 },
  { id: 'xray', name: 'Рентгены портативные', iconName: 'Camera', sortOrder: 6 },
  { id: 'visiographs', name: 'Визиографы', iconName: 'Monitor', sortOrder: 7 },
  { id: 'handpieces', name: 'Наконечники', iconName: 'Zap', sortOrder: 8 },
]);

const CATEGORY_BY_ID = new Map(
  CATEGORY_DEFINITIONS.map((category) => [category.id, category]),
);

export function buildCategoryPayloads() {
  return CATEGORY_DEFINITIONS.map(({ id, name, iconName, sortOrder }) => ({
    id,
    name,
    icon_name: iconName,
    sort_order: sortOrder,
  }));
}

export function getCategoryDefinition(categoryId) {
  return CATEGORY_BY_ID.get(categoryId) ?? null;
}

export function resolveCategoryId(rawValue, aliasMap = {}) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return null;
  }

  const value = String(rawValue).trim();
  if (CATEGORY_BY_ID.has(value)) {
    return value;
  }

  const lowerValue = value.toLowerCase();
  const aliasEntry = Object.entries(aliasMap).find(
    ([alias]) => String(alias).trim().toLowerCase() === lowerValue,
  );
  if (aliasEntry && CATEGORY_BY_ID.has(aliasEntry[1])) {
    return aliasEntry[1];
  }

  const matchingCategory = CATEGORY_DEFINITIONS.find(
    (category) => category.name.toLowerCase() === lowerValue,
  );
  return matchingCategory?.id ?? null;
}
