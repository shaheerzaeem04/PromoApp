import { Search, X } from 'lucide-react';
import {
  SearchField as AriaSearchField,
  Input as AriaInput,
  Button as AriaButton,
  Group,
  Label,
  type SearchFieldProps as AriaSearchFieldProps,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

export interface SearchFieldProps extends Omit<AriaSearchFieldProps, 'className'> {
  label?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

const SIZE_CLASS = {
  sm: 'ui-search-field--sm',
  md: 'ui-search-field--md',
  lg: 'ui-search-field--lg',
} as const;

export function SearchField({
  label,
  placeholder,
  className,
  inputClassName,
  size = 'md',
  'data-testid': testId,
  ...props
}: SearchFieldProps) {
  return (
    <AriaSearchField {...props} className={cn('ui-search-field', SIZE_CLASS[size], className)}>
      {label ? <Label className="label">{label}</Label> : null}
      <Group className="ui-search-field-group">
        <Search className="ui-search-field-icon" aria-hidden />
        <AriaInput
          placeholder={placeholder}
          data-testid={testId}
          className={cn('ui-search-field-input', inputClassName)}
        />
        <AriaButton className="ui-search-clear" aria-label="Clear search">
          <X className="h-3.5 w-3.5" strokeWidth={2.4} />
        </AriaButton>
      </Group>
    </AriaSearchField>
  );
}
