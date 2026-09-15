import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export function SettingsSection({
  title,
  description,
  children,
  actions,
  danger,
  className,
  ...rest
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  danger?: boolean;
  className?: string;
  'data-testid'?: string;
}) {
  return (
    <section className={cn('settings-section', className)} {...rest}>
      <div className={cn('flex flex-wrap items-start justify-between gap-3', children ? 'mb-5' : undefined)}>
        <div className="min-w-0">
          <h2 className={cn('section-title', danger && 'text-red-400')}>{title}</h2>
          {description ? <p className="meta mt-1 max-w-2xl leading-relaxed">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children ? <div className="space-y-4">{children}</div> : null}
    </section>
  );
}
