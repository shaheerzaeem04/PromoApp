import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && <label className="label" htmlFor={inputId}>{label}</label>}
        <textarea
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={cn(
            'input h-auto min-h-[6rem] py-2.5',
            error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
