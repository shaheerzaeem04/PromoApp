import { Check, Minus } from 'lucide-react';
import {
  Checkbox as AriaCheckbox,
  composeRenderProps,
  type CheckboxProps as AriaCheckboxProps,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

export type CheckboxTone = 'app' | 'giveaway';

export interface CheckboxProps extends Omit<AriaCheckboxProps, 'className'> {
  className?: string;
  tone?: CheckboxTone;
  indicator?: 'start' | 'end';
  align?: 'start' | 'center';
  disabled?: boolean;
  checked?: boolean;
}

export function Checkbox({
  className,
  tone = 'app',
  indicator = 'start',
  align = 'start',
  disabled,
  checked,
  isDisabled,
  isSelected,
  children,
  ...props
}: CheckboxProps) {
  return (
    <AriaCheckbox
      {...props}
      isDisabled={Boolean(isDisabled || disabled)}
      isSelected={isSelected ?? checked}
      className={cn(
        'ui-checkbox',
        tone === 'giveaway' && 'ui-checkbox--giveaway',
        indicator === 'end' && 'ui-checkbox--end',
        align === 'center' && 'ui-checkbox--center',
        className
      )}
    >
      {composeRenderProps(children, (label, { isSelected: selected, isIndeterminate }) => (
        <>
          <span className="ui-checkbox-box" aria-hidden>
            {isIndeterminate ? (
              <Minus className="ui-checkbox-tick ui-checkbox-tick--minus h-3 w-3" />
            ) : selected ? (
              <Check className="ui-checkbox-tick h-3 w-3" strokeWidth={3} />
            ) : null}
          </span>
          {label ? <span className="ui-checkbox-label">{label}</span> : null}
        </>
      ))}
    </AriaCheckbox>
  );
}
