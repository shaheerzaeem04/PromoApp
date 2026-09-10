type FormField = { id?: string; fieldType?: string };

export function visibleCustomFields(fields: FormField[] | undefined, requirePhone?: boolean) {
  const list = Array.isArray(fields) ? fields : [];
  if (!requirePhone) return list;
  return list.filter((field) => field.fieldType !== 'PHONE');
}

export function mergePhoneIntoCustomFields(
  fields: FormField[] | undefined,
  values: Record<string, unknown> | undefined,
  phone?: string
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(values || {}) };
  const trimmed = phone?.trim();
  if (!trimmed) return next;
  for (const field of fields || []) {
    if (field.fieldType !== 'PHONE' || !field.id) continue;
    const current = next[field.id];
    if (current === undefined || current === null || String(current).trim() === '') {
      next[field.id] = trimmed;
    }
  }
  return next;
}
