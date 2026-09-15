import { forwardRef, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { TextField } from './TextField';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue' | 'min' | 'max' | 'step'> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
  value?: string | number;
  defaultValue?: string | number;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  'data-testid'?: string;
}

/** Compatibility wrapper: existing Input call sites render the shared React Aria TextField. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    error,
    disabled,
    required,
    onChange,
    onBlur,
    value,
    defaultValue,
    name,
    type,
    placeholder,
    label,
    icon,
    suffix,
    className,
    autoComplete,
    inputMode,
    min,
    max,
    step,
    maxLength,
    id,
    'data-testid': testId,
  },
  ref
) {
  return (
    <TextField
      id={id}
      name={name}
      type={type}
      label={label}
      placeholder={placeholder}
      icon={icon}
      suffix={suffix}
      className={className}
      autoComplete={autoComplete}
      inputMode={inputMode}
      min={min}
      max={max}
      step={step}
      maxLength={maxLength}
      inputRef={ref}
      value={value === undefined || value === null ? undefined : String(value)}
      defaultValue={defaultValue === undefined || defaultValue === null ? undefined : String(defaultValue)}
      isDisabled={disabled}
      isRequired={required}
      isInvalid={Boolean(error)}
      errorMessage={error}
      data-testid={testId}
      onBlur={onBlur}
      onChange={(next) => {
        if (!onChange) return;
        onChange({
          target: { value: next, name: name ?? '', type: type ?? 'text' },
          currentTarget: { value: next, name: name ?? '', type: type ?? 'text' },
        } as ChangeEvent<HTMLInputElement>);
      }}
    />
  );
});

Input.displayName = 'Input';
