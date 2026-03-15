function appendFormValue(formData, key, value) {
  if (value === undefined) {
    return;
  }

  if (value === null) {
    formData.append(key, '');
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendFormValue(formData, `${key}[${index}]`, item);
    });
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([nestedKey, nestedValue]) => {
      appendFormValue(formData, `${key}[${nestedKey}]`, nestedValue);
    });
    return;
  }

  formData.append(key, String(value));
}

function toFormData(params = {}) {
  const formData = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => appendFormValue(formData, key, value));
  return formData;
}

export class BitrixClient {
  constructor({ webhookUrl }) {
    this.baseUrl = webhookUrl.replace(/\/+$/, '');
  }

  buildUrl(method) {
    return `${this.baseUrl}/${method}.json`;
  }

  async call(method, params = {}) {
    const response = await fetch(this.buildUrl(method), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: toFormData(params),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload.error_description ?? payload.error ?? `Bitrix HTTP ${response.status}`;
      throw Object.assign(new Error(message), { status: 502 });
    }

    if (payload.error) {
      throw Object.assign(
        new Error(payload.error_description ?? payload.error),
        { status: 502 },
      );
    }

    return payload;
  }

  async listAll(method, params = {}) {
    let start = 0;
    let hasMore = true;
    const items = [];

    while (hasMore) {
      const payload = await this.call(method, start ? { ...params, start } : params);
      const result = payload.result ?? {};
      const pageItems = Array.isArray(result.items)
        ? result.items
        : Array.isArray(result)
          ? result
          : [];

      items.push(...pageItems);

      const next = payload.next ?? result.next;
      const total = payload.total ?? result.total;

      if (next !== undefined && next !== null) {
        const nextValue = Number(next);
        if (!Number.isFinite(nextValue)) {
          hasMore = false;
        } else {
          start = nextValue;
        }
        continue;
      }

      if (typeof total === 'number' && pageItems.length > 0 && items.length < total) {
        start = items.length;
        continue;
      }

      hasMore = false;
    }

    return items;
  }
}
