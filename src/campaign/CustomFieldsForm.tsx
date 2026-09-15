import { Checkbox, CheckboxGroup } from '../components/ui';

interface CustomFieldsFormProps {
  fields: any[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function CustomFieldsForm({ fields, values, onChange, errors = {}, disabled }: CustomFieldsFormProps) {
  if (!fields?.length) return null;

  const setValue = (id: string, value: unknown) => onChange({ ...values, [id]: value });

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const error = errors[field.id];
        const inputId = `custom-field-${field.id}`;
        const options = Array.isArray(field.options) ? field.options.map(String) : [];
        const common = 'giveaway-field';
        return (
          <div key={field.id}>
            <label className="block text-sm mb-1" htmlFor={inputId}>
              {field.label}
              {field.required ? ' *' : ' (optional)'}
            </label>
            {field.helpText && (
              <p className="text-xs mb-1" style={{ color: 'var(--c-muted)' }}>{field.helpText}</p>
            )}
            {field.fieldType === 'TEXTAREA' || field.fieldType === 'ADDRESS' ? (
              <textarea
                id={inputId}
                className={`${common} min-h-[80px]`}
                placeholder={field.placeholder || ''}
                value={values[field.id] || ''}
                disabled={disabled}
                required={field.required}
                onChange={(e) => setValue(field.id, e.target.value)}
              />
            ) : field.fieldType === 'SELECT' ? (
              <select id={inputId} className={common} value={values[field.id] || ''} disabled={disabled} required={field.required} onChange={(e) => setValue(field.id, e.target.value)}>
                <option value="">{field.placeholder || 'Select'}</option>
                {options.map((option: string) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : field.fieldType === 'RADIO' ? (
              <div className="space-y-1">
                {options.map((option: string) => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input type="radio" name={field.id} value={option} disabled={disabled} checked={values[field.id] === option} onChange={() => setValue(field.id, option)} />
                    {option}
                  </label>
                ))}
              </div>
            ) : field.fieldType === 'CHECKBOX' ? (
              options.length ? (
                <CheckboxGroup
                  tone="giveaway"
                  aria-label={field.label}
                  isDisabled={disabled}
                  isRequired={field.required}
                  value={Array.isArray(values[field.id]) ? values[field.id] : []}
                  onChange={(next) => setValue(field.id, next)}
                >
                  {options.map((option: string) => (
                    <Checkbox key={option} value={option} tone="giveaway">
                      {option}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              ) : (
                <Checkbox
                  tone="giveaway"
                  isDisabled={disabled}
                  isRequired={field.required}
                  isSelected={Boolean(values[field.id])}
                  onChange={(checked) => setValue(field.id, checked)}
                >
                  {field.placeholder || field.label}
                </Checkbox>
              )
            ) : (
              <input
                id={inputId}
                className={common}
                type={field.fieldType === 'NUMBER' ? 'number' : field.fieldType === 'DATE' ? 'date' : field.fieldType === 'EMAIL' ? 'email' : field.fieldType === 'URL' ? 'url' : field.fieldType === 'PHONE' ? 'tel' : 'text'}
                inputMode={field.fieldType === 'PHONE' ? 'tel' : undefined}
                autoComplete={field.fieldType === 'PHONE' ? 'tel' : field.fieldType === 'EMAIL' ? 'email' : undefined}
                placeholder={field.placeholder || ''}
                value={values[field.id] || ''}
                disabled={disabled}
                required={field.required}
                onChange={(e) => setValue(field.id, e.target.value)}
              />
            )}
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}
