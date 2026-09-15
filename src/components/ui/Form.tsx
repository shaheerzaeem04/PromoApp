import type { ReactNode } from 'react';
import { Form as AriaForm, type FormProps as AriaFormProps } from 'react-aria-components';
import { cn } from '../../utils/cn';

export interface FormProps extends AriaFormProps {
  className?: string;
  children?: ReactNode;
}

export function Form({ className, children, ...props }: FormProps) {
  return (
    <AriaForm {...props} className={cn('ui-form', className)}>
      {children}
    </AriaForm>
  );
}
