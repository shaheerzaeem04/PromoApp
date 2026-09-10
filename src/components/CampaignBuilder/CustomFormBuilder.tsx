import { Input } from '../ui';

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Text' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' },
  { value: 'SELECT', label: 'Select' },
  { value: 'RADIO', label: 'Radio' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'TEXTAREA', label: 'Long text' },
  { value: 'URL', label: 'URL' },
  { value: 'ADDRESS', label: 'Address' },
];

const OPTION_TYPES = new Set(['SELECT', 'RADIO', 'CHECKBOX']);

export interface CustomFormFieldDraft {
  id: string;
  fieldType: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  order: number;
  persisted?: boolean;
}

interface CustomFormBuilderProps {
  fields: CustomFormFieldDraft[];
  onChange: (fields: CustomFormFieldDraft[]) => void;
}

export function CustomFormBuilder({ fields, onChange }: CustomFormBuilderProps) {
  const addField = (fieldType: string) => {
    onChange([
      ...fields,
      {
        id: `temp-${Date.now()}`,
        fieldType,
        label: FIELD_TYPES.find((item) => item.value === fieldType)?.label || 'Field',
        placeholder: '',
        helpText: '',
        required: false,
        options: OPTION_TYPES.has(fieldType) ? ['Option 1'] : undefined,
        order: fields.length,
      },
    ]);
  };

  const updateField = (id: string, patch: Partial<CustomFormFieldDraft>) => {
    onChange(fields.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= fields.length) return;
    const next = [...fields];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next.map((field, order) => ({ ...field, order })));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Entry form fields</h3>
        <p className="text-sm text-zinc-400">
          Email and name are core participant fields. These extra fields are collected at enter time and validated on the server.
          If you already turned on “Require phone”, do not add another Phone field here — Pakistani numbers like 0303… are accepted.
          File uploads belong on post-entry actions, not this form.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {FIELD_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => addField(type.value)}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 hover:bg-zinc-700"
          >
            + {type.label}
          </button>
        ))}
      </div>
      {fields.length === 0 && (
        <p className="text-sm text-zinc-500">No extra fields yet. Add a phone, select, or required checkbox for lead capture.</p>
      )}
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wide text-zinc-500">{field.fieldType}</p>
              <div className="flex gap-1">
                <button type="button" className="px-2 py-1 text-xs bg-zinc-800 rounded" onClick={() => move(index, -1)}>Up</button>
                <button type="button" className="px-2 py-1 text-xs bg-zinc-800 rounded" onClick={() => move(index, 1)}>Down</button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-red-500/10 text-red-400 rounded"
                  onClick={() => onChange(fields.filter((item) => item.id !== field.id).map((item, order) => ({ ...item, order })))}
                >
                  Delete
                </button>
              </div>
            </div>
            <Input label="Label" value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} />
            <Input label="Placeholder" value={field.placeholder || ''} onChange={(e) => updateField(field.id, { placeholder: e.target.value })} />
            <Input label="Help text" value={field.helpText || ''} onChange={(e) => updateField(field.id, { helpText: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(field.id, { required: e.target.checked })}
              />
              Required
            </label>
            {OPTION_TYPES.has(field.fieldType) && (
              <label className="block text-sm text-zinc-400">
                Options (one per line)
                <textarea
                  className="input min-h-[80px] mt-1"
                  value={(field.options || []).join('\n')}
                  onChange={(e) => updateField(field.id, { options: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })}
                />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
