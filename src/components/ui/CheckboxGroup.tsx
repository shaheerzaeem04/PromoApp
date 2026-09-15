import type { ReactNode } from 'react';
import {
  CheckboxGroup as AriaCheckboxGroup,
  Label,
  composeRenderProps,
  type CheckboxGroupProps as AriaCheckboxGroupProps,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import type { CheckboxTone } from './Checkbox';

export interface CheckboxGroupProps extends Omit<AriaCheckboxGroupProps, 'className'> {
  label?: ReactNode;
  className?: string;
  tone?: CheckboxTone;
}

export function CheckboxGroup({ label, className, tone = 'app', children, ...props }: CheckboxGroupProps) {
  return (
    <AriaCheckboxGroup
      {...props}
      data-tone={tone}
      className={cn('ui-checkbox-group', className)}
    >
      {composeRenderProps(children, (items) => (
        <>
          {label ? <Label className="ui-checkbox-group-label">{label}</Label> : null}
          {items}
        </>
      ))}
    </AriaCheckboxGroup>
  );
}
