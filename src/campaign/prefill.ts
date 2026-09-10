export function applyQueryPrefill(input: {
  allowPrefill?: boolean;
  hasSession: boolean;
  searchParams: URLSearchParams;
  customFields?: Array<{ id?: string; label?: string }>;
}): { email?: string; name?: string; phone?: string; customFields: Record<string, string> } {
  if (input.hasSession || input.allowPrefill === false) {
    return { customFields: {} };
  }

  const get = (key: string) => {
    const value = input.searchParams.get(key);
    return value && value.trim() ? value.trim().slice(0, 500) : undefined;
  };

  const customFields: Record<string, string> = {};
  for (const field of input.customFields || []) {
    const keys = [field.id, field.label, field.label?.replace(/\s+/g, '_').toLowerCase()].filter(Boolean) as string[];
    for (const key of keys) {
      const value = get(key);
      if (value && field.id) {
        customFields[field.id] = value;
        break;
      }
    }
  }

  return {
    email: get('email'),
    name: get('name'),
    phone: get('phone'),
    customFields,
  };
}
