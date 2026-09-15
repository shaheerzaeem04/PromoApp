import { forwardRef, type MouseEvent, type MouseEventHandler } from 'react';
import {
  Button as AriaButton,
  composeRenderProps,
  type ButtonProps as AriaButtonProps,
  type PressEvent,
} from 'react-aria-components';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  icon: 'btn-ghost px-0 w-10',
} as const;

const SIZES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
} as const;

export interface ButtonProps extends Omit<AriaButtonProps, 'className' | 'onClick'> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
  /**
   * Alias for isPending so existing call sites keep working.
   * The spinner only renders while the action is pending.
   */
  loading?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    isPending,
    isDisabled,
    disabled,
    onPress,
    onClick,
    children,
    ...props
  },
  ref
) {
  const pending = Boolean(isPending || loading);
  const handlePress =
    onPress || onClick
      ? (event: PressEvent) => {
          onPress?.(event);
          onClick?.(event as unknown as MouseEvent<HTMLButtonElement>);
        }
      : undefined;

  return (
    <AriaButton
      ref={ref}
      {...props}
      isPending={pending}
      isDisabled={Boolean(isDisabled || disabled)}
      onPress={handlePress}
      className={cn('btn', VARIANTS[variant], SIZES[size], className)}
    >
      {composeRenderProps(children, (label, { isPending: busy }) => (
        <>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
          {label}
        </>
      ))}
    </AriaButton>
  );
});

Button.displayName = 'Button';
