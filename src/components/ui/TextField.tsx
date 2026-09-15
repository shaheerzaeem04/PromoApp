import { type ReactNode, type Ref, type HTMLAttributes } from 'react';
import {
  TextField as AriaTextField,
  Input as AriaInput,
  Label,
  FieldError,
  Text,
  type TextFieldProps as AriaTextFieldProps,
  type ValidationResult,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

export interface TextFieldProps extends Omit<AriaTextFieldProps, 'className' | 'children'> {
  label?: ReactNode;
  placeholder?: string;
  description?: ReactNode;
  errorMessage?: string | ((validation: ValidationResult) => string);
  className?: string;
  inputClassName?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  min?: string | number;
  max?: string | number;
  step?: string | number;
  maxLength?: number;
  'data-testid'?: string;
}

export function TextField({
  label,
  placeholder,
  description,
  errorMessage,
  className,
  inputClassName,
  icon,
  suffix,
  inputRef,
  autoComplete,
  inputMode,
  min,
  max,
  step,
  maxLength,
  isDisabled,
  isInvalid,
  'data-testid': testId,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      {...props}
      isDisabled={isDisabled}
      isInvalid={isInvalid || Boolean(typeof errorMessage === 'string' && errorMessage)}
      className={cn('ui-text-field', className)}
    >
      {label ? <Label className="label">{label}</Label> : null}
      <div className="ui-text-field-wrap">
        {icon ? <span className="ui-text-field-icon">{icon}</span> : null}
        <AriaInput
          ref={inputRef}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
          data-testid={testId}
          className={cn('input', icon && 'pl-11', suffix && 'pr-11', inputClassName)}
        />
        {suffix ? <span className="ui-text-field-suffix">{suffix}</span> : null}
      </div>
      {description ? (
        <Text slot="description" className="text-sm text-zinc-500">
          {description}
        </Text>
      ) : null}
      <FieldError className="text-sm text-red-400">{errorMessage}</FieldError>
    </AriaTextField>
  );
}
